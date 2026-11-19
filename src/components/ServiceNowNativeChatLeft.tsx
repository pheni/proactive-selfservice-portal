import React, { useState, useEffect, useRef } from 'react';
import { serviceNowAuthService } from '../services/servicenowAuth';
import { SERVICENOW_CONFIG } from '../config/servicenow.config';

export interface ChatOption {
  label: string;
  value: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  options?: ChatOption[] | null;
  uiType?: string;
  timestamp: string;
}

export const ServiceNowNativeChatLeft: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [clientSessionId, setClientSessionId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const sendPayloadToVA = async (userText?: string, optionValue?: string) => {
    const isInitial = !conversationId;
    const effectiveText = userText || (optionValue === 'true' ? 'Yes' : optionValue === 'false' ? 'No' : optionValue);

    if (effectiveText) {
      setMessages((prev) => [
        ...prev,
        {
          id: `user-${Date.now()}`,
          sender: 'user',
          text: effectiveText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    }

    setLoading(true);

    try {
      const payload: Record<string, any> = isInitial
        ? { message: userText || 'I want to create a repair case' }
        : {
            conversation_id: conversationId,
            client_session_id: clientSessionId,
            message: effectiveText,
            ...(optionValue ? { value: optionValue } : {})
          };

      const isServiceNowDomain = typeof window !== 'undefined' && window.location.origin.includes('service-now.com');
      const baseUrl = isServiceNowDomain ? window.location.origin : SERVICENOW_CONFIG.instanceUrl;
      const endpoint = `${baseUrl.replace(/\/$/, '')}/api/sn_itsm_gen_ai/b2c_telecom_selfcare/native_va_chat`;

      // 1. Inherit official auth headers from serviceNowAuthService (RFC 7617 Basic / OAuth Bearer)
      const baseAuthHeaders = serviceNowAuthService.getAuthHeaders();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...baseAuthHeaders
      };

      // 2. Attach Interactive Browser Session & CSRF Token (X-UserToken) if inside ServiceNow DOM
      if (typeof window !== 'undefined' && (window as any).g_ck) {
        headers['X-UserToken'] = (window as any).g_ck;
      }

      // 3. Fallback: Check local storage for any raw tokens
      const fallbackToken =
        (typeof window !== 'undefined'
          ? sessionStorage.getItem('sn_auth_token') ||
            localStorage.getItem('sn_auth_token') ||
            sessionStorage.getItem('servicenow_auth') ||
            localStorage.getItem('servicenow_auth')
          : null) || '';

      if (!headers['Authorization'] && fallbackToken) {
        headers['Authorization'] =
          fallbackToken.startsWith('Basic ') || fallbackToken.startsWith('Bearer ')
            ? fallbackToken
            : `Basic ${fallbackToken}`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: headers,
        credentials: isServiceNowDomain ? 'include' : 'omit',
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      const res = data.result || data;

      if (res.success) {
        if (isInitial && res.conversation_id) {
          setConversationId(res.conversation_id);
          setClientSessionId(res.client_session_id || res.session_id);
        }

        if (Array.isArray(res.messages)) {
          const newBotMsgs: ChatMessage[] = res.messages.map((m: any, idx: number) => ({
            id: `bot-${Date.now()}-${idx}`,
            sender: 'bot',
            text: m.text,
            options: m.options,
            uiType: m.uiType,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }));

          setMessages((prev) => [...prev, ...newBotMsgs]);

          const lastMsg = res.messages[res.messages.length - 1];
          if (lastMsg?.text && lastMsg.text.toLowerCase().includes('conversation has ended')) {
            setConversationId(null);
            setClientSessionId(null);
          }
        }
      } else {
        const errorText = res.error?.message || res.message || (res.status === 401 ? 'Authentication required by ServiceNow.' : 'Virtual Agent error.');
        setMessages((prev) => [
          ...prev,
          {
            id: `bot-err-${Date.now()}`,
            sender: 'bot',
            text: `⚠️ ${errorText}`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (err) {
      console.error('[ServiceNowNativeChatLeft] Error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: 'bot',
          text: 'Unable to communicate with Virtual Agent. Please verify network or ServiceNow endpoint status.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || loading) return;
    setInputValue('');
    sendPayloadToVA(trimmed);
  };

  const handleOptionClick = (option: ChatOption) => {
    if (loading) return;
    sendPayloadToVA(option.label, option.value);
  };

  return (
    <>
      {/* Floating Launcher (Bottom-Left) */}
      <div className="fixed bottom-6 left-6 z-50">
        {!isOpen && (
          <button
            onClick={() => {
              setIsOpen(true);
              if (messages.length === 0) {
                sendPayloadToVA('I want to create a repair case');
              }
            }}
            className="flex items-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-full shadow-lg transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
            aria-label="Open Left VA Assistant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span>Telecom Assistant (Native)</span>
          </button>
        )}
      </div>

      {/* Floating Chat Modal (Bottom-Left) */}
      {isOpen && (
        <div className="fixed bottom-6 left-6 z-50 w-96 sm:w-[420px] h-[580px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="bg-slate-900 px-4 py-3.5 flex items-center justify-between text-white shadow-sm">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse" />
              <div>
                <h3 className="font-semibold text-sm leading-tight">Telecom Selfcare Assistant</h3>
                <p className="text-[11px] text-slate-400 font-mono">
                  {conversationId ? `ID: ${conversationId.substring(0, 8)}...` : 'Synchronous Bot-to-Bot'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors focus:outline-none cursor-pointer"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/50">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Interactive Controls (Boolean, Choice, Picker) */}
                {msg.options && msg.options.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2 max-w-[85%]">
                    {msg.options.map((opt, i) => (
                      <button
                        key={`${opt.value}-${i}`}
                        disabled={loading}
                        onClick={() => handleOptionClick(opt)}
                        className="px-3 py-1.5 bg-white border border-indigo-200 hover:border-indigo-400 text-indigo-700 hover:bg-indigo-50/60 text-xs font-medium rounded-full shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}

                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200/80 rounded-2xl rounded-bl-xs w-fit shadow-2xs">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your reply..."
              disabled={loading}
              className="flex-1 px-3.5 py-2 bg-slate-100/80 hover:bg-slate-100 focus:bg-white border border-transparent focus:border-indigo-400 rounded-xl text-sm focus:outline-none transition-all placeholder:text-slate-400"
            />
            <button
              type="submit"
              disabled={loading || !inputValue.trim()}
              className="p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl shadow-xs transition-colors focus:outline-none cursor-pointer disabled:cursor-not-allowed"
              aria-label="Send"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};
