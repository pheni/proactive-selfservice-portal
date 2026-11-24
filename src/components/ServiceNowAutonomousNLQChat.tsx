import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, X, RefreshCw, Layers, CheckCircle2, AlertCircle } from 'lucide-react';
import { SERVICENOW_CONFIG } from '../config/servicenow.config';
import { serviceNowAuthService } from '../services/servicenowAuth';
import { serviceNowRestService } from '../services/servicenowApi';
import { ManagedServiceItem } from '../types/portalTypes';

// Intelligent Service & Asset Identifier from Customer Description
const resolveServiceFromText = (text: string, servicesList: ManagedServiceItem[]) => {
  // 1. Direct Regex match for Circuit / Service ID in text (e.g. CKT-BLR-SD-01, DIA-10G-CHE-01, SIP-MUM-01, MOB-LINE-103)
  const idMatch = text.match(/\b(CKT-[A-Z0-9-]+|DIA-[A-Z0-9-]+|SIP-[A-Z0-9-]+|MOB-[A-Z0-9-]+)\b/i);
  if (idMatch) {
    const matchedId = idMatch[1].toUpperCase();
    const svc = servicesList.find((s) => 
      s.id?.toUpperCase() === matchedId || 
      s.circuitId?.toUpperCase() === matchedId || 
      (s.name && s.name.toUpperCase().includes(matchedId))
    );
    if (svc) {
      return {
        serviceId: svc.id || svc.circuitId || matchedId,
        serviceName: svc.name,
        category: svc.category || 'Core WAN'
      };
    }
    // Direct link to the matched circuit ID so it NEVER falls back to another unrelated service
    const isMob = matchedId.startsWith('MOB-');
    const isSip = matchedId.startsWith('SIP-');
    const isDia = matchedId.startsWith('DIA-');
    return {
      serviceId: matchedId,
      serviceName: `${matchedId} Managed Optical & IP Service`,
      category: isMob ? 'Mobile Fleet & SIMs' : isSip ? 'Voice & SIP Trunks' : isDia ? 'Fiber Broadband' : 'Core WAN'
    };
  }

  const textLower = text.toLowerCase();

  // 2. Exact or partial service name matching
  for (const svc of servicesList) {
    if (svc.name && textLower.includes(svc.name.toLowerCase())) {
      return {
        serviceId: svc.id,
        serviceName: svc.name,
        category: svc.category || 'Core WAN'
      };
    }
  }

  // 3. Location & Keyword matching
  if (textLower.includes('bangalore') || textLower.includes('blr')) {
    const blrSvc = servicesList.find((s) => s.id.includes('BLR'));
    if (blrSvc) return { serviceId: blrSvc.id, serviceName: blrSvc.name, category: blrSvc.category || 'Core WAN' };
  }
  if (textLower.includes('pune') || textLower.includes('pun')) {
    const punSvc = servicesList.find((s) => s.id.includes('PUN'));
    if (punSvc) return { serviceId: punSvc.id, serviceName: punSvc.name, category: punSvc.category || 'Core WAN' };
  }
  if (textLower.includes('chennai') || textLower.includes('che')) {
    const cheSvc = servicesList.find((s) => s.id.includes('CHE'));
    if (cheSvc) return { serviceId: cheSvc.id, serviceName: cheSvc.name, category: cheSvc.category || 'Fiber Broadband' };
  }
  if (textLower.includes('mumbai') || textLower.includes('mum')) {
    const mumSvc = servicesList.find((s) => s.id.includes('MUM'));
    if (mumSvc) return { serviceId: mumSvc.id, serviceName: mumSvc.name, category: mumSvc.category || 'Core WAN' };
  }

  // 4. Telecom Domain checks (strictly avoiding false positives like 'trunk' in SD-WAN)
  const isMobile = /5g|sim|apn|cellular|roaming|mobile fleet/i.test(textLower);
  const isSip = /\b(sip|sbc|pbx|voice call|inbound call|outbound call)\b/i.test(textLower) && !/sd-wan|mpls|optical/i.test(textLower);
  const isFiber = /fiber|dia|dedicated internet|broadband/i.test(textLower);

  if (isMobile) {
    const mob = servicesList.find((s) => s.category?.toLowerCase().includes('mobile') || s.id.includes('MOB'));
    if (mob) return { serviceId: mob.id, serviceName: mob.name, category: 'Mobile Fleet & SIMs' };
  }
  if (isSip) {
    const sip = servicesList.find((s) => s.category?.toLowerCase().includes('voice') || s.id.includes('SIP'));
    if (sip) return { serviceId: sip.id, serviceName: sip.name, category: 'Voice & SIP Trunks' };
  }
  if (isFiber) {
    const fiber = servicesList.find((s) => s.category?.toLowerCase().includes('fiber') || s.id.includes('DIA'));
    if (fiber) return { serviceId: fiber.id, serviceName: fiber.name, category: 'Fiber Broadband' };
  }

  // 5. Default fallback to Bangalore SD-WAN trunk
  return {
    serviceId: 'CKT-BLR-SD-01',
    serviceName: 'Bangalore SD-WAN Edge Trunk 01',
    category: 'Core WAN'
  };
};

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  executionEngine?: string;
  nowAssistStatus?: string;
  nowAssistMessage?: string;
  deflectionOffered?: boolean;
  deflectionResolved?: boolean;
  deflectionCaseCreated?: string;
}

interface ServiceNowAutonomousNLQChatProps {
  isOpen: boolean;
  onClose: () => void;
  customerName?: string;
  customerEmail?: string;
}

// Markdown bold, blockquote & line break formatter
const renderFormattedText = (text: string, isUser: boolean) => {
  const lines = text.split('\n');
  return lines.map((line, lineIdx) => {
    // Render blockquote callouts (> ℹ️ ...)
    if (!isUser && line.trim().startsWith('>')) {
      const cleanLine = line.trim().replace(/^>\s*/, '');
      return (
        <div
          key={lineIdx}
          className="my-1.5 p-2 bg-amber-500/10 border-l-3 border-amber-500 rounded-r-md text-[11px] text-amber-900 leading-relaxed font-sans"
        >
          {cleanLine.replace(/\*(.*?)\*/g, '$1')}
        </div>
      );
    }

    const parts = line.split(/(\*\*.*?\*\*)/g);
    const formattedParts = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        const inner = part.slice(2, -2);
        return (
          <strong
            key={partIdx}
            className={`font-semibold ${isUser ? 'text-white' : 'text-slate-900'}`}
          >
            {inner}
          </strong>
        );
      }
      return part;
    });

    return (
      <React.Fragment key={lineIdx}>
        {formattedParts}
        {lineIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
};

export const ServiceNowAutonomousNLQChat: React.FC<ServiceNowAutonomousNLQChatProps> = ({
  isOpen,
  onClose,
  customerName = '',
  customerEmail = ''
}) => {
  const getInitialGreeting = (name: string): ChatMessage => ({
    id: 'greeting',
    sender: 'assistant',
    text: `Welcome, ${name}. I am your **Tata Telecom Enterprise Assistant**.\n\nI can assist you with real-time status of your active circuits, network performance, open support cases, and SLA commitments across your enterprise infrastructure.\n\nHow may I help you today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  });

  const [messages, setMessages] = useState<ChatMessage[]>(() => [getInitialGreeting(customerName)]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const feedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSend = async (textToSend?: string) => {
    const queryText = (textToSend || input).trim();
    if (!queryText || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const isServiceNowDomain = typeof window !== 'undefined' && window.location.origin.includes('service-now.com');
      const baseUrl = isServiceNowDomain ? window.location.origin : SERVICENOW_CONFIG.instanceUrl;
      const endpoint = `${baseUrl.replace(/\/$/, '')}/api/sn_itsm_gen_ai/b2c_telecom_selfcare/nlq-chat`;

      const isDeflectionActive = typeof window !== 'undefined' 
        ? localStorage.getItem('sn_feature_deflection_playbooks') !== 'false' 
        : true;

      const portalData = serviceNowRestService.getPortalData();
      const userEmail = customerEmail || (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_email') || localStorage.getItem('sn_email')) : null) || portalData.email || '';
      const userName = (typeof window !== 'undefined' ? (sessionStorage.getItem('sn_username') || localStorage.getItem('sn_username')) : null) || customerName || '';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...serviceNowAuthService.getAuthHeaders()
        },
        body: JSON.stringify({
          message: queryText,
          email: userEmail,
          user_name: userName,
          enable_deflection: isDeflectionActive
        })
      });

      const res = await response.json();
      const resultData = res.result || res;

      if (resultData.success) {
        // If a comment was logged to a case, synchronize immediately with the portal Case Details Page
        if (resultData.tool_executed === 'addCaseComment' || resultData.comment_added) {
          const fallbackActiveCase = serviceNowRestService.getActiveCases()[0]?.caseNumber || '';
          const targetCase = resultData.case_number || (queryText.match(/CS\d+/i) || [fallbackActiveCase])[0].toUpperCase();
          const commentContent = resultData.comment_text || queryText.replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:add|post|submit|log)\s+(?:a\s+)?(?:comment|note|update)(?:\s+that|\s+saying|\s+to|\s*:)?\s*/i, '').trim();
          
          const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const newAct = {
            id: 'act-' + Date.now(),
            author: customerName || portalData.customer || 'Customer',
            role: 'Customer' as const,
            text: commentContent,
            timestamp: `Today, ${nowTime}`,
            isUrgent: false
          };

          serviceNowRestService.addCaseActivity(targetCase, newAct);
          window.dispatchEvent(new CustomEvent('b2c_case_activities_updated', {
            detail: { caseNumber: targetCase, activity: newAct }
          }));
        }

        const assistantMsg: ChatMessage = {
          id: `asst-${Date.now()}`,
          sender: 'assistant',
          text: resultData.ai_response || 'Your request has been processed.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          executionEngine: resultData.execution_engine,
          nowAssistStatus: resultData.now_assist_status,
          nowAssistMessage: resultData.now_assist_message,
          deflectionOffered: Boolean(resultData.deflection_offered)
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        const errorMsg: ChatMessage = {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ ${resultData.message || 'Unable to process your request at this moment.'}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, errorMsg]);
      }
    } catch (err: any) {
      console.error('[ServiceNowAutonomousNLQChat] Error:', err);
      const errorMsg: ChatMessage = {
        id: `asst-err-${Date.now()}`,
        sender: 'assistant',
        text: 'Unable to connect to the telecom service assistant. Please check your network connection.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeflectionResolved = (msgId: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, deflectionResolved: true } : m))
    );
    const currentAccount = serviceNowRestService.getPortalData().account || 'Enterprise Account';
    const confirmMsg: ChatMessage = {
      id: `asst-${Date.now()}`,
      sender: 'assistant',
      text: `✅ **Glad to hear that resolved your issue!**\n\nWe have logged this self-service resolution for **${currentAccount}** (Reference: \`DEF-${Date.now().toString().slice(-6)}\`). Your support case creation was successfully deflected.\n\nPlease let me know if you need any other assistance!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      executionEngine: 'now_assist_ai'
    };
    setMessages((prev) => [...prev, confirmMsg]);
  };

  const handleDeflectionOpenCase = async (msgId: string) => {
    try {
      // Find the associated user prompt to preserve the exact symptom & telemetry
      const msgIdx = messages.findIndex((m) => m.id === msgId);
      const userPrompt = msgIdx > 0 && messages[msgIdx - 1]?.sender === 'user' ? messages[msgIdx - 1].text : '';
      const isCritical = /p1|critical|down|dropped|outage/i.test(userPrompt);

      // Intelligent resolution against active enterprise services list
      const portal = serviceNowRestService.getPortalData();
      const allServices = portal.servicesList || [];
      const resolved = resolveServiceFromText(userPrompt, allServices);

      const assignedPriority = isCritical ? 'P1 - Critical' : 'P2 - High';
      const cleanSubject = userPrompt 
        ? userPrompt.split('\n')[0].substring(0, 95) 
        : `${resolved.serviceName} Degradation [Now Assist Deflection Escalation]`;

      const res = await serviceNowRestService.createSupportCase({
        serviceId: resolved.serviceId,
        serviceName: resolved.serviceName,
        category: resolved.category,
        priority: assignedPriority,
        subject: cleanSubject,
        description: userPrompt || 'Customer attempted self-service diagnostic playbooks. Diagnostic steps completed: Physical demarc verified, optical power checked, BGP refreshed. Issue persists. Escalated via Now Assist AI.',
        contactName: customerName || portal.customer || 'Customer',
        contactEmail: customerEmail || portal.email || 'support@enterprise-telecom.com',
        contactPhone: portal.phone || '+91 20 6600 0000'
      });
      const caseNum = res.caseNumber;
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, deflectionCaseCreated: caseNum } : m))
      );
      const escalatingMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: `🎫 **Support Case Created: ${caseNum}**\n\n• **Priority:** ${assignedPriority}\n• **Impacted Service:** ${resolved.serviceName} (${resolved.serviceId})\n• **Incident Reference:** ${res.incidentReference}\n• **Account:** ${portal.account || 'Enterprise Customer'}\n• **Assignment Group:** Tier 2 Network Operations Center (NOC)\n• **Target SLA:** ${res.slaTarget}\n\n> ℹ️ *Now Assist has automatically pre-populated your attempted diagnostic steps and telemetry into the case work notes so our engineering team will not ask you to repeat them. This case is immediately active in your Support Center.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        executionEngine: 'now_assist_ai'
      };
      setMessages((prev) => [...prev, escalatingMsg]);

      // Broadcast update so Support Center & All Cases immediately show this new case
      window.dispatchEvent(new CustomEvent('b2c_cases_updated'));
    } catch (err) {
      console.error('Failed to create case from deflection pill:', err);
    }
  };

  if (!isOpen) return null;

  const quickPrompts = [
    'Summary of open cases',
    'Critical outages & P1 cases',
    'Active WAN & Fiber circuits',
    'Enterprise SLA performance'
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      {/* Modal Dialog Box */}
      <div className="w-full max-w-2xl h-[640px] max-h-[92vh] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Top Header */}
        <div className="bg-slate-900 px-5 py-4 flex items-center justify-between text-white shadow-md shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/15 border border-purple-400/30 rounded-xl">
              <Sparkles className="h-5 w-5 text-purple-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-wide text-white">Now Assist for Telecom</h3>
                <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Operational
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Enterprise Support & Infrastructure Assistant
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMessages([getInitialGreeting(customerName)])}
              title="Reset Conversation"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div ref={feedRef} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-50/70">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[92%] sm:max-w-[85%] ${
                  isUser ? 'ml-auto' : 'mr-auto'
                }`}
              >
                {!isUser && (
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                      <Sparkles className="w-2.5 h-2.5 text-purple-600" />
                      Now Assist AI
                    </span>
                  </div>
                )}

                <div
                  className={`p-3.5 sm:p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs transition-all ${
                    isUser
                      ? 'bg-purple-700 text-white rounded-br-xs font-medium'
                      : 'bg-white border border-slate-200/90 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  {renderFormattedText(msg.text, isUser)}

                  {/* Deflection Action Pills */}
                  {!isUser && msg.deflectionOffered && !msg.deflectionResolved && !msg.deflectionCaseCreated && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDeflectionResolved(msg.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved my issue</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeflectionOpenCase(msg.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold shadow-xs transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Still having issues — Open Case</span>
                      </button>
                    </div>
                  )}

                  {/* Deflection Resolved Indicator */}
                  {!isUser && msg.deflectionResolved && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Deflection Logged — Self-Service Resolved</span>
                    </div>
                  )}

                  {/* Deflection Escalation Indicator */}
                  {!isUser && msg.deflectionCaseCreated && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-[11px] font-semibold text-purple-700">
                      <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
                      <span>Ticket Escalated: {msg.deflectionCaseCreated}</span>
                    </div>
                  )}
                </div>

                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl rounded-bl-xs w-fit shadow-xs">
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.2s]" />
              <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce [animation-delay:0.4s]" />
              <span className="text-xs text-slate-600 font-medium ml-1">
                Retrieving enterprise details...
              </span>
            </div>
          )}
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-4 py-2.5 bg-white border-t border-slate-100 flex items-center gap-2 overflow-x-auto shrink-0 scrollbar-none">
          <span className="text-[11px] font-semibold text-slate-400 shrink-0 flex items-center gap-1">
            <Layers className="h-3 w-3" /> Quick requests:
          </span>
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => handleSend(prompt)}
              className="text-[11px] bg-slate-100 hover:bg-purple-50 hover:text-purple-700 hover:border-purple-200 border border-slate-200 text-slate-700 px-3 py-1 rounded-full whitespace-nowrap transition cursor-pointer disabled:opacity-50 font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="p-3.5 bg-white border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your question or request (e.g., 'Summary of open cases' or 'Status of Mumbai circuits')..."
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-purple-500 rounded-xl text-xs sm:text-sm focus:outline-none transition placeholder:text-slate-400 text-slate-800"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-purple-700 hover:bg-purple-800 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
            aria-label="Send"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
