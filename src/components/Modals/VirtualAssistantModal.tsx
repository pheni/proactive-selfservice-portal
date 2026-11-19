import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, X, Sparkles, AlertCircle, PhoneCall, CheckCircle2, ShieldCheck, Zap, FileText } from 'lucide-react';
import { VirtualAssistantContext, PortalData } from '../../types/portalTypes';
import { serviceNowRestService } from '../../services/servicenowApi';

interface VirtualAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  context: VirtualAssistantContext | null;
  portalData: PortalData;
  onOpenCall?: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  actionPills?: Array<{ label: string; actionKey: string }>;
}

export const VirtualAssistantModal: React.FC<VirtualAssistantModalProps> = ({
  isOpen,
  onClose,
  context,
  portalData,
  onOpenCall
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const activeCaseNum = context?.caseNumber || portalData.caseNumber;
  const activeService = context?.serviceName || portalData.service;
  const activeStatus = context?.status || 'Monitoring';

  useEffect(() => {
    if (isOpen) {
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages([
        {
          id: 'welcome-1',
          sender: 'bot',
          text: `Hello ${portalData.customer.split(' ')[0]}! 👋 I am the **ServiceNow Virtual Assistant**, connected directly to your personal services account.\n\nI have loaded the live context for **Case ${activeCaseNum}** (${activeService}). How can I assist you right now?`,
          timestamp: now,
          actionPills: [
            { label: '⚡ Check Status & Diagnostics', actionKey: 'status' },
            { label: '🚀 Escalate Priority', actionKey: 'escalate' },
            { label: '📞 Request Engineer Call', actionKey: 'call' },
            { label: '📄 Diagnostic Summary', actionKey: 'summary' }
          ]
        }
      ]);
    }
  }, [isOpen, activeCaseNum, activeService, portalData.customer, portalData.account]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  if (!isOpen) return null;

  const handleSendMessage = (textToSend?: string, actionKey?: string) => {
    const text = textToSend || inputValue;
    if (!text.trim()) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: text,
      timestamp: time
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsTyping(true);

    // Simulate ServiceNow Virtual Agent response delay
    setTimeout(() => {
      let botResponse = '';
      let nextPills: Array<{ label: string; actionKey: string }> | undefined = undefined;

      if (actionKey === 'status' || text.toLowerCase().includes('status') || text.toLowerCase().includes('diagnostics')) {
        botResponse = `🤖 **ServiceNow Diagnostic Bot**: Real-time Telemetry for **${activeCaseNum}**:\n\n` +
          `• **Service**: ${activeService}\n` +
          `• **Current State**: ${activeStatus}\n` +
          `• **Latency**: 14ms (Optimal)\n` +
          `• **Packet Loss**: 0.0%\n` +
          `• **Assigned Queue**: Service Assurance Support Queue\n\n` +
          `Automated recovery actions have been completed. Stability monitoring is active.`;
        nextPills = [
          { label: '🚀 Escalate Priority', actionKey: 'escalate' },
          { label: '📞 Request Engineer Call', actionKey: 'call' }
        ];
      } else if (actionKey === 'escalate' || text.toLowerCase().includes('escalat')) {
        botResponse = `⚡ **ServiceNow CSM Escalation Engine**:\n\n` +
          `Escalation trigger generated for **Case ${activeCaseNum}**!\n\n` +
          `• **Escalation Level**: High Priority / Duty Manager Alerted\n` +
          `• **Service Target**: SLA response re-prioritised to Tier-3 Senior Network Assurance Team.\n` +
          `• **Reference**: ESC-${Math.floor(100000 + Math.random() * 900000)}`;
      } else if (actionKey === 'call' || text.toLowerCase().includes('call') || text.toLowerCase().includes('phone')) {
        botResponse = `📞 **Genesys Click-to-Call Integration**:\n\n` +
          `I can connect you directly with the lead engineer assigned to **Case ${activeCaseNum}** over WebRTC. Click below to initiate instant audio connection.`;
        if (onOpenCall) {
          onOpenCall();
        }
      } else if (actionKey === 'summary' || text.toLowerCase().includes('summary') || text.toLowerCase().includes('report')) {
        botResponse = `📄 **Customer Diagnostic Summary for ${activeCaseNum}**:\n\n` +
          `1. **Trigger**: Proactive telemetry threshold notification.\n` +
          `2. **Root Cause**: BGP session synchronization drift.\n` +
          `3. **Action Taken**: Automated session refresh & optical path optimization.\n` +
          `4. **Verification**: 100% throughput achieved with zero packet loss.`;
      } else {
        botResponse = `Thank you for your inquiry regarding **Case ${activeCaseNum}**. I have recorded your message in the case records:\n\n` +
          `*"${text}"*\n\n` +
          `Our technical assurance team has been notified. You will receive an updated status notification as soon as the next telemetry check completes.`;
        nextPills = [
          { label: '⚡ Check Status & Diagnostics', actionKey: 'status' },
          { label: '📞 Connect with Engineer', actionKey: 'call' }
        ];
      }

      setMessages(prev => [
        ...prev,
        {
          id: Math.random().toString(),
          sender: 'bot',
          text: botResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actionPills: nextPills
        }
      ]);
      setIsTyping(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="flex flex-col h-[620px] w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="bg-[#092E4C] p-4 text-white flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-white shadow-md">
              <Bot className="h-6 w-6" />
              <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-[#092E4C]"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">ServiceNow Virtual Assistant</h3>
                <span className="rounded-full bg-teal-400/20 px-2 py-0.5 text-[10px] font-semibold text-teal-300 border border-teal-400/30">
                  AI Live
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Linked to <span className="font-mono text-teal-300 font-bold">{activeCaseNum}</span> · {activeService}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end gap-2 max-w-[85%]">
                {msg.sender === 'bot' && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-600 text-white text-xs font-bold shadow-xs">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                
                <div
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                    msg.sender === 'user'
                      ? 'bg-[#092E4C] text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.text.split('\n').map((line, i) => {
                      if (line.startsWith('• ') || line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ') || line.startsWith('4. ')) {
                        return <div key={i} className="my-0.5 font-medium">{line}</div>;
                      }
                      return <p key={i} className={i > 0 ? 'mt-1' : ''}>{line}</p>;
                    })}
                  </div>
                  <div className={`mt-1.5 text-[10px] text-right font-mono ${msg.sender === 'user' ? 'text-teal-200' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </div>
                </div>
              </div>

              {/* Action Pills */}
              {msg.actionPills && msg.actionPills.length > 0 && (
                <div className="mt-2.5 ml-9 flex flex-wrap gap-1.5">
                  {msg.actionPills.map((pill) => (
                    <button
                      key={pill.actionKey}
                      onClick={() => handleSendMessage(pill.label, pill.actionKey)}
                      className="rounded-full bg-white border border-teal-500/30 px-3 py-1 text-[11px] font-medium text-teal-700 hover:bg-teal-50 hover:border-teal-500 transition shadow-xs flex items-center gap-1"
                    >
                      <span>{pill.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-600 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div className="rounded-2xl bg-white border border-slate-200 px-3.5 py-2 flex items-center gap-1.5 shadow-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]"></span>
                <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]"></span>
                <span className="ml-1 text-[11px] text-slate-400 font-mono">Virtual Assistant is processing...</span>
              </div>
            </div>
          )}
          
          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask Virtual Assistant about ${activeCaseNum}...`}
              className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-100 transition"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isTyping}
              className="rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 p-2.5 text-white shadow-md transition"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
            <div className="flex items-center gap-1 text-teal-700 font-medium">
              <ShieldCheck className="h-3 w-3 text-teal-600" />
              <span>ServiceNow Scripted REST API Connected</span>
            </div>
            <span>SN-VA v2.4</span>
          </div>
        </div>

      </div>
    </div>
  );
};
