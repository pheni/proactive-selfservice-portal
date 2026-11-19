// src/components/ServiceNowEnhancedChat.tsx
import React, { useState, useRef, useEffect } from 'react';
import { serviceNowRestService } from '../services/servicenowApi';
import { getServiceNowFullUrl } from '../config/servicenow.config';

export interface PortalCustomer {
  name: string;
  userName: string;
  email: string;
  accountName?: string;
}

interface CaseRecord {
  sys_id: string;
  number: string;
  short_description: string;
  description?: string;
  state: string;
  priority: string;
  assigned_to?: string;
  opened_at?: string;
  latest_customer_visible_update?: string;
  latest_customer_visible_update_on?: string;
}

interface ServiceRecord {
  sys_id: string;
  number: string;
  name: string;
  status: string;
  location?: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  toolExecuted?: string;
  liveData?: {
    case?: CaseRecord;
    cases?: CaseRecord[];
    services?: ServiceRecord[];
    comment_added?: boolean;
  } | null;
}

const SN_AI_CHAT_URL =
  'https://tataamericaintlcorpdemo3.service-now.com/api/sn_itsm_gen_ai/b2c_telecom_selfcare/ai-chat';

export const ServiceNowEnhancedChat: React.FC<{
  customer: PortalCustomer;
  endpointUrl?: string;
}> = ({ customer, endpointUrl = SN_AI_CHAT_URL }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeCaseNumber, setActiveCaseNumber] = useState<string>('');
  const [accountName, setAccountName] = useState(
    customer.accountName || 'Tata B2B Enterprise Services'
  );
  const feedRef = useRef<HTMLDivElement>(null);

  const initialGreeting: ChatMessage = {
    id: 'greeting',
    sender: 'bot',
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    text: `Hello ${customer.name}! I am your Tata Telecom Assurance AI Assistant.\n\nAsk me anything naturally — for example: "Show my open cases", "View active circuits", "We have a packet loss outage on our Pune WAN link", or "Summarize case CS0001270".`,
  };

  const [messages, setMessages] = useState<ChatMessage[]>([initialGreeting]);

  useEffect(() => {
    setAccountName(customer.accountName || 'Tata B2B Enterprise Services');
    setMessages([
      {
        id: 'greeting',
        sender: 'bot',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: `Hello ${customer.name}! I am your Tata Telecom Assurance AI Assistant.\n\nAsk me anything naturally — for example: "Show my open cases", "View active circuits", "We have a packet loss outage on our Pune WAN link", or "Summarize case CS0001270".`,
      },
    ]);
  }, [customer.userName, customer.name]);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || isLoading) return;

    // Detect if user explicitly mentioned a case number in their prompt
    const promptCaseMatch = text.match(/\b(CS\d+|CSM\d+|INC\d+)\b/i);
    let currentCase = promptCaseMatch ? promptCaseMatch[1].toUpperCase() : activeCaseNumber;
    if (promptCaseMatch) {
      setActiveCaseNumber(currentCase);
    }

    // Check if the user is asking to add a comment or update to a case
    const isCommentIntent = /(?:add|post|submit|append)\s+(?:a\s+)?(?:comment|note|update)/i.test(text);
    let messageToSend = text;
    if (isCommentIntent && !promptCaseMatch && currentCase) {
      // The backend intent router requires the case number in queryParams.message to trigger addCaseComment
      const cleanComment = text
        .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:add|post|submit)\s+(?:a\s+)?(?:comment|note|update)(?:\s+that|\s+saying|\s+to|\s*:)?\s*/i, '')
        .trim();
      messageToSend = `Add comment to case ${currentCase}: ${cleanComment || text}`;
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const historyPayload = [...messages, userMsg];
    setMessages(historyPayload);
    setInput('');
    setIsLoading(true);

    try {
      const url = new URL(endpointUrl);
      url.searchParams.set('message', messageToSend);
      if (customer.email) {
        url.searchParams.set('email', customer.email);
      }
      if (customer.userName) {
        url.searchParams.set('user_name', customer.userName);
      }

      const res = await fetch(url.toString(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          message: messageToSend,
          email: customer.email,
          user_name: customer.userName,
          history: historyPayload.slice(-6).map((m) => ({
            sender: m.sender,
            text: m.text,
          })),
        }),
      });

      const json = await res.json();

      // Check if ServiceNow threw an unhandled server error (e.g. ReferenceError or 500)
      if (!res.ok || json.error) {
        console.warn('[ServiceNowEnhancedChat] Primary ai-chat endpoint error:', json);

        const errMsg =
          json.error?.message || json.error?.detail || json.message || `HTTP ${res.status}`;
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: 'bot',
            text: `⚠️ ServiceNow Server Error (${res.status}): ${errMsg}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ]);
        return;
      }

      const payload = json.result || json;

      if (payload.customer?.account_name) {
        setAccountName(payload.customer.account_name);
      }

      // Extract normalized cases, case, services whether at payload.data or payload.data.data
      const rawData = payload.data || {};
      const innerData = rawData.data || {};
      let resolvedCases: CaseRecord[] | undefined =
        Array.isArray(innerData.cases) && innerData.cases.length > 0
          ? innerData.cases
          : Array.isArray(rawData.cases) && rawData.cases.length > 0
            ? rawData.cases
            : undefined;

      // Smart extraction: If backend returned text describing cases but no cases array in data, extract cases
      if (
        !resolvedCases &&
        payload.ai_response &&
        (payload.tool_executed === 'listCases' ||
          payload.ai_response.toLowerCase().includes('active support cases') ||
          payload.ai_response.toLowerCase().includes('support cases') ||
          payload.ai_response.toLowerCase().includes('open cases'))
      ) {
        const lines = payload.ai_response.split('\n');
        const parsedList: CaseRecord[] = [];
        for (const line of lines) {
          const m = line.match(/(?:Case\s+)?(CS\d+|CSM\d+|INC\d+)(?:\s*\((?:Priority:\s*)?([^)]+)\))?\s*[-:]?\s*(.+)?/i);
          if (m) {
            const caseNum = m[1].toUpperCase();
            const rawPrio = m[2] ? m[2].trim() : 'High';
            const desc = m[3] ? m[3].trim() : `Support Case ${caseNum}`;
            parsedList.push({
              sys_id: caseNum,
              number: caseNum,
              short_description: desc,
              state: 'New',
              priority: rawPrio.includes('-') ? rawPrio : (rawPrio.toLowerCase() === 'critical' ? '1 - Critical' : '2 - High'),
              assigned_to: 'Anish Kutti',
            });
          }
        }
        if (parsedList.length > 0) {
          resolvedCases = parsedList;
        } else {
          const matches = payload.ai_response.match(/\b(CS\d+|CSM\d+|INC\d+)\b/g);
          if (matches && matches.length > 0) {
            const uniqueNums = Array.from(new Set(matches)) as string[];
            resolvedCases = uniqueNums.map(num => ({
              sys_id: num,
              number: num,
              short_description: `Support Ticket ${num}`,
              state: 'New',
              priority: '2 - High',
              assigned_to: 'Anish Kutti'
            }));
          }
        }
      }

      const resolvedCase: CaseRecord | undefined = innerData.case || rawData.case || undefined;
      const resolvedServices: ServiceRecord[] | undefined =
        Array.isArray(innerData.services) && innerData.services.length > 0
          ? innerData.services
          : Array.isArray(rawData.services) && rawData.services.length > 0
            ? rawData.services
            : undefined;
      const isCommentAdded = Boolean(rawData.comment_added || innerData.comment_added);

      const normalizedLiveData = {
        cases: resolvedCases,
        case: resolvedCase,
        services: resolvedServices,
        comment_added: isCommentAdded,
      };

      // Track active case returned by backend
      if (normalizedLiveData.case?.number) {
        setActiveCaseNumber(normalizedLiveData.case.number);
        currentCase = normalizedLiveData.case.number;
      } else if (normalizedLiveData.cases?.[0]?.number) {
        setActiveCaseNumber(normalizedLiveData.cases[0].number);
        currentCase = normalizedLiveData.cases[0].number;
      }

      // If a comment was successfully added to ServiceNow, sync it to the portal UI
      if (payload.tool_executed === 'addCaseComment' || normalizedLiveData.comment_added) {
        const commentTargetCase = normalizedLiveData.case?.number || currentCase || 'CS0001271';
        const commentText =
          normalizedLiveData.case?.latest_customer_visible_update ||
          text
            .replace(
              /^(?:please\s+)?(?:can\s+you\s+)?(?:add|post|submit)\s+(?:a\s+)?(?:comment|note|update)(?:\s+that|\s+saying|\s+to|\s*:)?\s*/i,
              ''
            )
            .trim();

        const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const newAct = {
          id: 'sn_act_' + Math.random().toString(),
          author: customer.name || 'Customer',
          role: 'Customer' as const,
          text: commentText,
          timestamp: `Today, ${nowTime}`,
          isUrgent: false,
        };

        serviceNowRestService.addCaseActivity(commentTargetCase, newAct);
        window.dispatchEvent(
          new CustomEvent('b2c_case_activities_updated', {
            detail: { caseNumber: commentTargetCase, activity: newAct },
          })
        );
        serviceNowRestService.fetchCaseActivitiesLive(commentTargetCase).catch(() => {});
      }

      let finalText = payload.ai_response || payload.message;
      if (!finalText || finalText.trim() === 'Request completed.') {
        if (normalizedLiveData.cases && normalizedLiveData.cases.length > 0) {
          finalText = 'Here are your active support cases:';
        } else if (normalizedLiveData.comment_added || payload.tool_executed === 'addCaseComment') {
          finalText = `I have added your comment to case ${normalizedLiveData.case?.number || currentCase || ''}.`;
        } else if (normalizedLiveData.case) {
          finalText = `Here are the details for case ${normalizedLiveData.case.number}:`;
        } else if (normalizedLiveData.services && normalizedLiveData.services.length > 0) {
          finalText = 'Here are the active services and circuits under your enterprise account:';
        } else {
          finalText = 'Request completed successfully.';
        }
      }

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'bot',
        text: finalText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        toolExecuted: payload.tool_executed,
        liveData: normalizedLiveData,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: 'bot',
          text: 'Connection error communicating with ServiceNow AI endpoint. Please verify network status or CORS rules.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        fontFamily: 'Inter, system-ui, -apple-system, sans-serif',
      }}
    >
      {isOpen && (
        <div
          style={{
            width: 440,
            height: 670,
            marginBottom: 14,
            borderRadius: 16,
            overflow: 'hidden',
            boxShadow: '0 16px 48px rgba(15, 23, 42, 0.24)',
            backgroundColor: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            border: '1px solid #cbd5e1',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #003366 0%, #0055a5 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>
                Tata Telecom Assurance AI
              </div>
              <div style={{ fontSize: 11.5, opacity: 0.9, marginTop: 2 }}>
                {customer.name} • {accountName}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={() => setMessages([initialGreeting])}
                title="Start a fresh conversation"
                style={{
                  background: 'rgba(255, 255, 255, 0.18)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: 6,
                  padding: '4px 8px',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                + New
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#ffffff',
                  fontSize: 18,
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Starter Quick Actions */}
          <div
            style={{
              display: 'flex',
              gap: 6,
              padding: '8px 12px',
              backgroundColor: '#f8fafc',
              borderBottom: '1px solid #e2e8f0',
              overflowX: 'auto',
            }}
          >
            {[
              'Show my open cases',
              'View active circuits',
              'Internet is dropping in Pune',
              'Summarize case CS0001270',
            ].map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                disabled={isLoading}
                style={{
                  padding: '5px 10px',
                  borderRadius: 14,
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#0f172a',
                  fontSize: 11.5,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                }}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Message Feed */}
          <div
            ref={feedRef}
            style={{
              flex: 1,
              padding: 16,
              overflowY: 'auto',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                }}
              >
                <div
                  style={{
                    padding: '11px 14px',
                    borderRadius:
                      m.sender === 'user'
                        ? '14px 14px 2px 14px'
                        : '14px 14px 14px 2px',
                    backgroundColor:
                      m.sender === 'user' ? '#0055a5' : '#ffffff',
                    color: m.sender === 'user' ? '#ffffff' : '#0f172a',
                    fontSize: 13.5,
                    lineHeight: 1.5,
                    whiteSpace: 'pre-wrap',
                    boxShadow:
                      m.sender === 'bot'
                        ? '0 2px 6px rgba(0, 0, 0, 0.05)'
                        : 'none',
                    border:
                      m.sender === 'bot' ? '1px solid #e2e8f0' : 'none',
                  }}
                >
                  {m.text}
                </div>

                {/* Render Live Cases List Card */}
                {m.liveData?.cases && Array.isArray(m.liveData.cases) && m.liveData.cases.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginTop: 8,
                    }}
                  >
                    {m.liveData.cases.map((c) => (
                      <div
                        key={c.number || c.sys_id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 8,
                          padding: 10,
                          fontSize: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 600,
                            color: '#0055a5',
                          }}
                        >
                          <span>{c.number}</span>
                          <span style={{ color: '#d97706' }}>
                            {c.priority} • {c.state}
                          </span>
                        </div>
                        <div style={{ marginTop: 3, color: '#334155' }}>
                          {c.short_description}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button
                            onClick={() => sendMessage(`Check status of ${c.number}`)}
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              borderRadius: 4,
                              border: '1px solid #cbd5e1',
                              backgroundColor: '#f8fafc',
                              color: '#0f172a',
                              cursor: 'pointer',
                            }}
                          >
                            Status
                          </button>
                          <button
                            onClick={() => sendMessage(`Summarize case ${c.number}`)}
                            style={{
                              padding: '3px 8px',
                              fontSize: 11,
                              borderRadius: 4,
                              border: '1px solid #0055a5',
                              backgroundColor: '#f0f7ff',
                              color: '#0055a5',
                              cursor: 'pointer',
                            }}
                          >
                            AI Summary
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Render Single Live Case Card */}
                {m.liveData?.case && (
                  <div
                    style={{
                      marginTop: 8,
                      backgroundColor: '#ffffff',
                      border: '1px solid #93c5fd',
                      borderRadius: 8,
                      padding: 10,
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 600,
                        color: '#003366',
                      }}
                    >
                      <span>{m.liveData.case.number}</span>
                      <span style={{ color: '#16a34a' }}>
                        {m.liveData.case.priority} • {m.liveData.case.state}
                      </span>
                    </div>
                    <div style={{ marginTop: 4, color: '#334155' }}>
                      {m.liveData.case.short_description}
                    </div>
                    {m.liveData.case.assigned_to && (
                      <div
                        style={{
                          fontSize: 11.5,
                          color: '#64748b',
                          marginTop: 3,
                        }}
                      >
                        Assigned Engineer: {m.liveData.case.assigned_to}
                      </div>
                    )}
                    {m.liveData.case.latest_customer_visible_update && (
                      <div
                        style={{
                          marginTop: 6,
                          padding: '6px 8px',
                          backgroundColor: '#f0fdf4',
                          border: '1px solid #bbf7d0',
                          borderRadius: 6,
                          fontSize: 11.5,
                          color: '#166534',
                        }}
                      >
                        <strong>Latest Update:</strong> {m.liveData.case.latest_customer_visible_update}
                      </div>
                    )}
                  </div>
                )}

                {/* Render Comment Added Success Badge */}
                {(m.liveData?.comment_added || m.toolExecuted === 'addCaseComment') && (
                  <div
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      backgroundColor: '#ecfdf5',
                      border: '1px solid #10b981',
                      borderRadius: 8,
                      color: '#065f46',
                      fontSize: 12,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontWeight: 600,
                    }}
                  >
                    <span>✅</span>
                    <span>
                      Comment Synced to ServiceNow Case{' '}
                      {m.liveData?.case?.number || activeCaseNumber}
                    </span>
                  </div>
                )}

                {/* Render Live Services Card */}
                {m.liveData?.services && Array.isArray(m.liveData.services) && m.liveData.services.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6,
                      marginTop: 8,
                    }}
                  >
                    {m.liveData.services.map((s) => (
                      <div
                        key={s.number || s.sys_id}
                        style={{
                          backgroundColor: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: 8,
                          padding: 10,
                          fontSize: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            fontWeight: 600,
                            color: '#003366',
                          }}
                        >
                          <span>{s.name || s.number}</span>
                          <span style={{ color: '#16a34a' }}>{s.status}</span>
                        </div>
                        {s.location && (
                          <div
                            style={{
                              fontSize: 11.5,
                              color: '#64748b',
                              marginTop: 2,
                            }}
                          >
                            Location: {s.location}
                          </div>
                        )}
                        <button
                          onClick={() =>
                            sendMessage(`Report connectivity issue on service ${s.name || s.number}`)
                          }
                          style={{
                            marginTop: 6,
                            padding: '3px 8px',
                            fontSize: 11,
                            borderRadius: 4,
                            border: '1px solid #0055a5',
                            backgroundColor: '#f0f7ff',
                            color: '#0055a5',
                            cursor: 'pointer',
                          }}
                        >
                          Report Issue on This Service
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {isLoading && (
              <div
                style={{
                  fontSize: 12,
                  color: '#64748b',
                  fontStyle: 'italic',
                }}
              >
                Now Assist AI is reasoning and querying ServiceNow...
              </div>
            )}
          </div>

          {/* Input Form (Never Locks) */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage(input);
            }}
            style={{
              display: 'flex',
              padding: '10px 12px',
              backgroundColor: '#ffffff',
              borderTop: '1px solid #e2e8f0',
              gap: 8,
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything or report an outage..."
              disabled={isLoading}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #cbd5e1',
                fontSize: 13.5,
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor:
                  isLoading || !input.trim() ? '#94a3b8' : '#0055a5',
                color: '#ffffff',
                fontWeight: 600,
                fontSize: 13.5,
                cursor:
                  isLoading || !input.trim() ? 'not-allowed' : 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </div>
      )}

      {/* Floating Chat Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '14px 22px',
          borderRadius: 30,
          border: 'none',
          background: 'linear-gradient(135deg, #003366 0%, #0055a5 100%)',
          color: '#ffffff',
          fontWeight: 600,
          fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 6px 20px rgba(0, 85, 165, 0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>💬</span>
        <span>
          {isOpen
            ? 'Close Assistant'
            : `Hi ${customer.name.split(' ')[0]}, Telecom Assistant`}
        </span>
      </button>
    </div>
  );
};

export default ServiceNowEnhancedChat;
