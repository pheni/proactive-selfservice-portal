import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  X, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  Activity, 
  Cpu, 
  ArrowRight, 
  RotateCcw, 
  PhoneCall, 
  FileText, 
  ThumbsUp, 
  ThumbsDown,
  PlusCircle 
} from 'lucide-react';
import { OttoContext, OttoChatMessage, PortalData, CaseActivityItem } from '../../types/portalTypes';
import { serviceNowOttoService } from '../../services/servicenowOtto';
import { serviceNowRestService } from '../../services/servicenowApi';

interface OttoAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: OttoContext | null;
  portalData: PortalData;
  onOpenCall?: () => void;
}

export const OttoAssistantModal: React.FC<OttoAssistantModalProps> = ({
  isOpen,
  onClose,
  context,
  portalData,
  onOpenCall
}) => {
  const [messages, setMessages] = useState<OttoChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [feedback, setFeedback] = useState<Record<string, 'up' | 'down'>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputFieldRef = useRef<HTMLInputElement>(null);

  const activeCaseNum = context?.caseNumber || portalData.caseNumber;
  const activeService = context?.serviceName || portalData.service;
  const activeStatus = context?.status || 'Monitoring';
  const [currentCaseNum, setCurrentCaseNum] = useState<string>(activeCaseNum);

  useEffect(() => {
    setCurrentCaseNum(activeCaseNum);
  }, [activeCaseNum]);

  const initWelcomeMessage = () => {
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setMessages([
      {
        id: 'welcome-init',
        sender: 'otto',
        isGenAi: true,
        text: `Hello ${portalData.customer.split(' ')[0]}! 👋 I am your **Digital Assistant**, here to assist with your personal services and subscriptions.\n\nI have loaded the live case details for **${activeCaseNum}** (${activeService}). How can I assist you right now?`,
        timestamp: now,
        actionPills: [
          { label: 'Case Summary', actionKey: 'summary' },
          { label: 'Escalate Priority', actionKey: 'escalate' },
          { label: 'Request Engineer Call', actionKey: 'call' },
          { label: 'Create New Case', actionKey: 'create_case' }
        ]
      }
    ]);
  };

  useEffect(() => {
    if (isOpen) {
      initWelcomeMessage();
    }
  }, [isOpen, activeCaseNum, activeService, portalData.customer, portalData.account]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string, actionKey?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text) return;

    // Interactive guidance for "Create New Case" pill click (prevents creating blank dummy tickets)
    if (actionKey === 'create_case' && (text === 'Create New Case' || text === 'Create Support Case')) {
      const promptTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'user',
          text: text,
          timestamp: promptTime
        },
        {
          id: Math.random().toString(),
          sender: 'otto',
          isGenAi: true,
          text: 'I can create a support case for you right away. 📝\n\nPlease enter a brief description of the issue you are experiencing (e.g. *"High packet loss on Chicago fiber link"* or *"Interface down on secondary router"*), and I will log it with the appropriate priority.',
          timestamp: promptTime
        }
      ]);
      setInputValue('Create case for: ');
      setTimeout(() => {
        inputFieldRef.current?.focus();
      }, 100);
      return;
    }

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: OttoChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: text,
      timestamp: time
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    if (actionKey === 'call' && onOpenCall) {
      setTimeout(() => {
        onOpenCall();
      }, 500);
    }

    // Extract case number if explicitly mentioned in the user's prompt (e.g. CS0001244)
    const promptCaseMatch = text.match(/\b(CS\d+|CSM\d+|INC\d+)\b/i);
    const targetCase = promptCaseMatch ? promptCaseMatch[1].toUpperCase() : currentCaseNum;
    if (promptCaseMatch && promptCaseMatch[1].toUpperCase() !== currentCaseNum) {
      setCurrentCaseNum(promptCaseMatch[1].toUpperCase());
    }

    const currentCtx: OttoContext = {
      caseNumber: targetCase,
      serviceName: activeService,
      status: activeStatus
    };

    // Enhance prompt clarity for one-click pill actions
    let queryPrompt = text;
    if (actionKey === 'summary') {
      queryPrompt = `Provide a comprehensive status summary for case ${targetCase}`;
    } else if (actionKey === 'escalate') {
      queryPrompt = `Please escalate case ${targetCase} to Priority 1 (Critical)`;
    } else if (actionKey === 'list_cases') {
      queryPrompt = `Can you list all my recorded support cases?`;
    }

    try {
      const res = await serviceNowOttoService.queryOtto(queryPrompt, currentCtx, actionKey);

      // If a new case was created or resolved, automatically update the active case context!
      const replyCaseMatch = res.reply?.match(/\b(CS\d+|CSM\d+|INC\d+)\b/i);
      const resolvedCaseNum = res.caseNumber || (replyCaseMatch ? replyCaseMatch[1].toUpperCase() : null);
      if (resolvedCaseNum && resolvedCaseNum !== currentCaseNum) {
        console.log(`[OttoAssistantModal] Switching active case context: ${currentCaseNum} -> ${resolvedCaseNum}`);
        setCurrentCaseNum(resolvedCaseNum);
      }

      // 1. If a comment was added, immediately add to case activity store and notify Case Details page
      if (
        res.actionTaken === 'COMMENT_ADDED' ||
        res.reply?.includes('Update Logged') ||
        res.reply?.includes('note has been attached') ||
        (queryPrompt.toLowerCase().includes('comment') && res.reply?.toLowerCase().includes('attached'))
      ) {
        const commentTargetCase = resolvedCaseNum || targetCase || currentCaseNum;
        if (commentTargetCase) {
          // Extract the clean comment text
          let commentText = res.commentText;
          if (!commentText) {
            const quoteMatch = res.reply?.match(/>\s*["']?(?:Customer \([^)]+\) Note via Portal:\s*)?([^"'\n]+)["']?/i);
            if (quoteMatch) {
              commentText = quoteMatch[1].trim();
            } else {
              commentText = text
                .replace(/^(?:please\s+)?(?:can\s+you\s+)?(?:add\s+(?:a\s+)?comment(?:\s+that|\s+saying|\s+to|\s*:)?)\s*/i, '')
                .replace(/^(?:note\s*:?\s*)/i, '')
                .trim();
            }
          }

          if (commentText) {
            const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const authorName = (typeof window !== 'undefined' ? (localStorage.getItem('sn_user_fullname') || localStorage.getItem('sn_username')) : null) || portalData.customer || 'Goutam Hazra';
            const newAct: CaseActivityItem = {
              id: Math.random().toString(),
              author: authorName,
              role: 'Customer',
              text: commentText,
              timestamp: `Today, ${nowTime}`,
              isUrgent: false
            };

            serviceNowRestService.addCaseActivity(commentTargetCase, newAct);
            window.dispatchEvent(new CustomEvent('b2c_case_activities_updated', {
              detail: { caseNumber: commentTargetCase, activity: newAct }
            }));

            // Sync with live ServiceNow backend in background
            serviceNowRestService.fetchCaseActivitiesLive(commentTargetCase).catch(() => {});
          }
        }
      }

      // 2. If a case was created or escalated/updated, sync active cases in background so portal reflects changes immediately
      if (
        res.actionTaken === 'CASE_CREATED' ||
        res.actionTaken === 'CASE_ESCALATED' ||
        res.actionTaken === 'PRIORITY_UPDATED' ||
        res.actionTaken === 'PRIORITY_DOWNGRADED' ||
        res.reply?.includes('Case Created') ||
        res.reply?.includes('Priority')
      ) {
        try {
          serviceNowRestService.fetchActiveCases(10, true).catch(() => {});
          const priTargetCase = resolvedCaseNum || targetCase || currentCaseNum;
          if (priTargetCase && (res.actionTaken === 'CASE_ESCALATED' || res.actionTaken === 'PRIORITY_DOWNGRADED')) {
            const isDowngrade = res.actionTaken === 'PRIORITY_DOWNGRADED' || res.reply?.includes('Downgraded');
            const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const authorName = (typeof window !== 'undefined' ? (localStorage.getItem('sn_user_fullname') || localStorage.getItem('sn_username')) : null) || portalData.customer || 'Goutam Hazra';
            const escAct: CaseActivityItem = {
              id: Math.random().toString(),
              author: authorName,
              role: 'Customer',
              text: isDowngrade
                ? `📉 Case priority downgraded via Digital Assistant. Severity adjusted.`
                : `⚡ Case priority escalated via Digital Assistant. Duty lead engineer alerted.`,
              timestamp: `Today, ${nowTime}`,
              isUrgent: !isDowngrade
            };
            serviceNowRestService.addCaseActivity(priTargetCase, escAct);
            window.dispatchEvent(new CustomEvent('b2c_case_activities_updated', {
              detail: { caseNumber: priTargetCase, activity: escAct }
            }));
          }
        } catch (syncErr) {
          console.warn('[OttoAssistantModal] Background sync warning:', syncErr);
        }
      }

      const assistantMsg: OttoChatMessage = {
        id: Math.random().toString(),
        sender: 'otto',
        isGenAi: res.isGenAi,
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actionPills: res.actionPills,
        telemetryReport: res.telemetryReport
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('[OttoAssistantModal] Error handling message:', err);
      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'otto',
          isGenAi: false,
          text: `I encountered an unexpected issue while processing your request. Please try again or request an engineer call.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const getPillIcon = (actionKey: string) => {
    switch (actionKey) {
      case 'create_case':
        return <PlusCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
      case 'diagnostic':
        return <Activity className="h-3.5 w-3.5 text-teal-600 shrink-0" />;
      case 'escalate':
        return <Zap className="h-3.5 w-3.5 text-amber-600 shrink-0" />;
      case 'call':
        return <PhoneCall className="h-3.5 w-3.5 text-blue-600 shrink-0" />;
      case 'summary':
        return <FileText className="h-3.5 w-3.5 text-purple-600 shrink-0" />;
      default:
        return <ArrowRight className="h-3.5 w-3.5 text-teal-600 shrink-0" />;
    }
  };

  /**
   * Enterprise Markdown Renderer:
   * Strips out raw asterisks (**bold**) and renders styled strong and list elements
   */
  const renderFormattedText = (rawText: string, isUser = false) => {
    // Clean up HTML tags frequently returned by ServiceNow LLM
    const normalizedText = rawText
      .replace(/<h[1-6]>(.*?)<\/h[1-6]>/gi, '**$1**\n')
      .replace(/<li>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<\/?(ul|ol|p|div)>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n');

    return normalizedText.split('\n').map((line, lIdx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={lIdx} className="h-1.5" />;

      const isBullet = trimmed.startsWith('• ') || trimmed.startsWith('- ');
      const isNumbered = /^\d+\.\s/.test(trimmed);

      const content = isBullet ? trimmed.substring(2) : isNumbered ? trimmed.replace(/^\d+\.\s/, '') : trimmed;

      // Split by **bold** or *italic*
      const segments = content.split(/(\*\*.*?\*\*|\*.*?\*)/g);

      const renderedSegments = segments.map((seg, sIdx) => {
        if (seg.startsWith('**') && seg.endsWith('**')) {
          return (
            <strong
              key={sIdx}
              className={isUser ? "font-extrabold text-white" : "font-extrabold text-slate-900"}
            >
              {seg.slice(2, -2)}
            </strong>
          );
        }
        if (seg.startsWith('*') && seg.endsWith('*')) {
          return (
            <em
              key={sIdx}
              className={isUser ? "italic text-cyan-200" : "italic text-slate-700"}
            >
              {seg.slice(1, -1)}
            </em>
          );
        }
        return seg;
      });

      if (isBullet) {
        return (
          <div key={lIdx} className={`flex items-start gap-2 my-1 pl-1 ${isUser ? 'text-white' : 'text-slate-800'}`}>
            <span className={`h-1.5 w-1.5 rounded-full mt-1.5 shrink-0 ${isUser ? 'bg-cyan-300' : 'bg-teal-500'}`} />
            <div className="leading-relaxed">{renderedSegments}</div>
          </div>
        );
      }

      if (isNumbered) {
        const numMatch = trimmed.match(/^(\d+)\.\s/);
        const num = numMatch ? numMatch[1] : '1';
        return (
          <div key={lIdx} className={`flex items-start gap-2 my-1 pl-1 ${isUser ? 'text-white' : 'text-slate-800'}`}>
            <span className={`text-[11px] font-bold font-mono shrink-0 ${isUser ? 'text-cyan-300' : 'text-teal-700'}`}>{num}.</span>
            <div className="leading-relaxed">{renderedSegments}</div>
          </div>
        );
      }

      return (
        <p
          key={lIdx}
          className={`${lIdx > 0 ? 'mt-1.5' : ''} leading-relaxed ${isUser ? 'text-white font-medium' : 'text-slate-800'}`}
        >
          {renderedSegments}
        </p>
      );
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs animate-in fade-in duration-200 font-sans">
      <div className="flex flex-col h-[650px] w-full max-w-xl rounded-3xl bg-white shadow-2xl border border-slate-200 overflow-hidden relative">
        
        {/* Enterprise Digital Assistant Header */}
        <div className="bg-[#092E4C] p-4 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-600 text-white shadow-lg">
              <Cpu className="h-6 w-6" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-400 border-2 border-[#092E4C]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm text-white tracking-tight">Digital Assistant</h3>
                <span className="flex items-center gap-1 rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-400/30">
                  <Sparkles className="h-3 w-3 text-cyan-300" />
                  <span>Enterprise AI</span>
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Active Case Context: <span className="font-mono text-cyan-300 font-bold">{currentCaseNum}</span> · {activeService}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={initWelcomeMessage}
              className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
              title="Reset Conversation"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-slate-300 hover:bg-white/10 hover:text-white transition"
              title="Close Assistant"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2.5 max-w-[90%]">
                {msg.sender === 'otto' && (
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-tr from-[#092E4C] to-teal-700 text-white text-xs font-bold shadow-md border border-teal-500/30">
                    <Cpu className="h-4 w-4 text-cyan-300" />
                  </div>
                )}
                
                <div
                  className={`rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#092E4C] text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  {msg.isGenAi && msg.sender === 'otto' && (
                    <div className="mb-2 flex items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200/60 w-fit">
                        <Sparkles className="h-3 w-3 text-teal-600" />
                        <span>Digital Assistant Verified</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">ServiceNow Live Grounded</span>
                    </div>
                  )}

                  {/* Formatted Markdown Content without raw asterisks */}
                  <div className="text-xs">
                    {renderFormattedText(msg.text, msg.sender === 'user')}
                  </div>

                  {/* Embedded Telemetry Report Card */}
                  {msg.telemetryReport && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900 text-white font-mono text-[11px] grid grid-cols-2 gap-2 border border-teal-500/40">
                      <div>Latency: <span className="text-teal-300 font-bold">{msg.telemetryReport.latency}</span></div>
                      <div>Packet Loss: <span className="text-emerald-300 font-bold">{msg.telemetryReport.packetLoss}</span></div>
                      <div>BGP State: <span className="text-cyan-300 font-bold">{msg.telemetryReport.bgpState}</span></div>
                      <div>Health Score: <span className="text-emerald-400 font-bold">{msg.telemetryReport.healthScore}</span></div>
                    </div>
                  )}

                  {/* Message Footer: Timestamp and CSAT Feedback */}
                  <div className="mt-2.5 pt-1.5 border-t border-slate-100/60 flex items-center justify-between text-[10px]">
                    {msg.sender === 'otto' ? (
                      <div className="flex items-center gap-1 text-slate-400">
                        <span className="mr-1">Helpful?</span>
                        <button
                          onClick={() => setFeedback(prev => ({ ...prev, [msg.id]: 'up' }))}
                          className={`p-1 rounded hover:bg-slate-100 transition ${feedback[msg.id] === 'up' ? 'text-teal-600 font-bold' : ''}`}
                          title="Thumbs up"
                        >
                          <ThumbsUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setFeedback(prev => ({ ...prev, [msg.id]: 'down' }))}
                          className={`p-1 rounded hover:bg-slate-100 transition ${feedback[msg.id] === 'down' ? 'text-rose-600 font-bold' : ''}`}
                          title="Thumbs down"
                        >
                          <ThumbsDown className="h-3 w-3" />
                        </button>
                      </div>
                    ) : <div />}

                    <span className={`font-mono ${msg.sender === 'user' ? 'text-teal-200' : 'text-slate-400'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Pills with Professional SVG Icons */}
              {msg.actionPills && msg.actionPills.length > 0 && (
                <div className="mt-2.5 ml-10 flex flex-wrap gap-1.5">
                  {msg.actionPills.map((pill) => (
                    <button
                      key={pill.actionKey}
                      onClick={() => handleSendMessage(pill.label, pill.actionKey)}
                      className="rounded-full bg-white border border-teal-500/40 px-3 py-1.5 text-[11px] font-bold text-teal-900 hover:bg-teal-50 hover:border-teal-600 transition shadow-xs flex items-center gap-1.5 group"
                    >
                      {getPillIcon(pill.actionKey)}
                      <span>{pill.label}</span>
                      <ArrowRight className="h-3 w-3 text-teal-500 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2.5 text-xs text-slate-500 font-medium ml-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-[#092E4C] text-cyan-300">
                <Cpu className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 px-4 py-2.5 flex items-center gap-2 shadow-xs">
                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce"></span>
                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-2 w-2 rounded-full bg-cyan-500 animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1 text-[11px] text-slate-500 font-mono font-medium">Digital Assistant analyzing case details...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3.5 bg-white border-t border-slate-200 shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={inputFieldRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask Digital Assistant about ${currentCaseNum} or request actions...`}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 p-2.5 text-white shadow-md transition flex items-center justify-center"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
            <span className="flex items-center gap-1.5 text-teal-800 font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-teal-600" />
              <span>ServiceNow Connected Support</span>
            </span>
            <span>v3.2</span>
          </div>
        </div>

      </div>
    </div>
  );
};
