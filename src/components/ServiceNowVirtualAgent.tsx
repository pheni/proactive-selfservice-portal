import React, { useState, useEffect } from "react";
import { Sparkles, Maximize2, Minimize2, ExternalLink, X, PlusCircle, RotateCcw } from "lucide-react";

const SERVICE_NOW_URL = 
  (import.meta.env.VITE_SERVICENOW_URL as string) || 
  (import.meta.env.VITE_SERVICENOW_INSTANCE_URL as string) || 
  "https://tataamericaintlcorpdemo3.service-now.com";

const TELECOM_PORTAL_ID = "72be85142bc81b1016f8f0aef291bfb9";
const TELECOM_AGENT_ID  = "4ea367c92b989310c4d0f7d54391bf26";
const TELECOM_REPAIR_TOPIC_ID = "a4cb58692bdcdf5016f8f0aef291bf24";

export default function ServiceNowVirtualAgent() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [sessionNonce, setSessionNonce] = useState<number>(() => Date.now());

  const currentUsername = 
    (typeof window !== "undefined" 
      ? (sessionStorage.getItem("sn_username") || localStorage.getItem("sn_username")) 
      : null) || "goutam.hazra";

  const currentUserEmail = 
    (typeof window !== "undefined" 
      ? (sessionStorage.getItem("sn_email") || localStorage.getItem("sn_email")) 
      : null) || "goutam.hazra@tataglobal.com";

  const instance = SERVICE_NOW_URL.replace(/\/$/, "");

  // Build the clean, proven standalone web-client URL
  // Eliminates OEM proxy dependency & consumer sync 400 rejection
  const chatParams = new URLSearchParams({
    sysparm_nostack: "true",
    sysparm_stack: "no",
    sysparm_skip_load_history: "true",
    sysparm_load_active_only: "true",
    sysparm_portal: TELECOM_PORTAL_ID,
    sysparm_liveagent_portal: TELECOM_PORTAL_ID,
    sysparm_agent: TELECOM_AGENT_ID,
    sysparm_topic: TELECOM_REPAIR_TOPIC_ID,
    sysparm_user_name: currentUsername,
    sysparm_email: currentUserEmail,
    sysparm_first_name: "Goutam",
    sysparm_last_name: "Hazra",
    sysparm_liveagent_user_name: currentUsername,
    sysparm_liveagent_email: currentUserEmail,
    sysparm_account_name: "Tata B2B Enterprise Services",
    _t: sessionNonce.toString()
  });

  const chatUrl = `${instance}/$sn-va-web-client-app.do?${chatParams.toString()}`;

  const handleStartNewChat = () => {
    setIsLoading(true);
    setSessionNonce(Date.now());
  };

  useEffect(() => {
    if (isOpen) setIsLoading(true);
  }, [isOpen, sessionNonce]);

  return (
    <>
      {isOpen && (
        <div
          className={`fixed z-[9999] transition-all duration-300 ease-in-out flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden ${
            isExpanded
              ? "bottom-6 right-6 w-[92vw] max-w-[720px] h-[85vh] max-h-[820px]"
              : "bottom-6 right-6 w-[92vw] sm:w-[420px] h-[80vh] max-h-[660px]"
          }`}
          style={{
            boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)"
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white select-none border-b border-indigo-900/50">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shadow-sm shrink-0">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-semibold text-white tracking-tight truncate">
                    Telecom Selfcare Assistant
                  </h3>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" title="Connected" />
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  Tata B2B Enterprise · Live Support
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Prominent + New Chat button to bypass closed conversation locks */}
              <button
                type="button"
                onClick={handleStartNewChat}
                title="Start a new support conversation"
                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg transition-all shadow-xs cursor-pointer border border-indigo-400/30"
              >
                <PlusCircle className="w-3.5 h-3.5 text-cyan-200" />
                <span>New Chat</span>
              </button>

              <a
                href={chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new window"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse width" : "Expand width"}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:inline-flex cursor-pointer"
              >
                {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-300 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Helper Sub-bar */}
          <div className="px-3 py-1 bg-slate-100 border-b border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600 select-none">
            <span className="flex items-center space-x-1">
              <span>Customer:</span>
              <strong className="text-slate-800">Goutam Hazra</strong>
            </span>
            <button
              type="button"
              onClick={handleStartNewChat}
              className="text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer flex items-center space-x-1"
              title="Reset conversation"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Session</span>
            </button>
          </div>

          {/* Chat IFrame Container */}
          <div className="relative flex-1 w-full h-full bg-slate-50 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs text-slate-500">
                <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-2" />
                <span className="text-xs font-medium text-slate-600">Connecting to Telecom Assistant...</span>
              </div>
            )}
            <iframe
              key={sessionNonce}
              src={chatUrl}
              title="ServiceNow Virtual Agent"
              className="w-full h-full border-0"
              allow="microphone; camera; clipboard-write; autoplay"
              onLoad={() => setIsLoading(false)}
            />
          </div>
        </div>
      )}

      {/* Floating Launcher Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-[9990] group flex items-center space-x-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white pl-4 pr-5 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-indigo-400/30 cursor-pointer"
          style={{
            boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.2)"
          }}
          aria-label="Open Telecom AI Assistant"
        >
          <div className="relative">
            <Sparkles className="w-5 h-5 text-cyan-300 group-hover:rotate-12 transition-transform duration-200" />
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full border border-indigo-900 animate-pulse" />
          </div>
          <span className="text-sm font-semibold tracking-wide">
            Telecom AI Assistant
          </span>
        </button>
      )}
    </>
  );
}
