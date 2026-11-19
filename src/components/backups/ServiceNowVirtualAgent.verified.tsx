/**
 * VERIFIED WORKING SNAPSHOT (DO NOT MODIFY DIRECTLY)
 * Date: November 7, 2026
 * Git Commit: 12f22e3
 * Proven Live Cases Created: CS0001268, CS0001269, CS0001270 (Priority P2)
 * Instance: https://tataamericaintlcorpdemo3.service-now.com
 * AWS Amplify App: https://main.d1iho4v9xh67w2.amplifyapp.com
 *
 * Description:
 * Native React 19 floating chat popover embedding ServiceNow's standalone Virtual Agent
 * web client ($sn-va-web-client-app.do). Bypasses sp_min.jsx, avoids window.parent.g_ambClient
 * SecurityErrors and AMB 403 Forbidden rejections, and connects clean WebSocket sessions.
 */

import React, { useState, useEffect } from "react";
import { MessageSquare, X, Sparkles, Maximize2, Minimize2, ExternalLink } from "lucide-react";

const SERVICE_NOW_URL = 
  (import.meta.env.VITE_SERVICENOW_URL as string) || 
  (import.meta.env.VITE_SERVICENOW_INSTANCE_URL as string) || 
  "https://tataamericaintlcorpdemo3.service-now.com";

const TELECOM_PORTAL_ID = 
  (import.meta.env.VITE_SERVICENOW_PORTAL_ID as string) || 
  "72be85142bc81b1016f8f0aef291bfb9";

const TELECOM_EM_MODULE_ID = 
  (import.meta.env.VITE_SERVICENOW_EM_MODULE_ID as string) || 
  "72be85142bc81b1016f8f0aef291bfa5";

const NOW_ASSIST_AGENT_ID = 
  (import.meta.env.VITE_SERVICENOW_AGENT_ID as string) || 
  "4ea367c92b989310c4d0f7d54391bf26";

const TELECOM_REPAIR_TOPIC_ID = 
  (import.meta.env.VITE_SERVICENOW_TELECOM_TOPIC_ID as string) || 
  "a4cb58692bdcdf5016f8f0aef291bf24";

export default function ServiceNowVirtualAgent() {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Retrieve active logged-in portal user to pass into chat URL parameters
  const currentUsername = 
    (typeof window !== "undefined" 
      ? (sessionStorage.getItem("sn_username") || localStorage.getItem("sn_username")) 
      : null) || "goutam.hazra";

  const currentUserEmail = 
    (typeof window !== "undefined" 
      ? (sessionStorage.getItem("sn_email") || localStorage.getItem("sn_email")) 
      : null) || (currentUsername.includes("@") 
        ? currentUsername 
        : `${currentUsername}@tataglobal.com`);

  const currentFirstName = "Goutam";
  const currentLastName = "Hazra";

  const instance = SERVICE_NOW_URL.replace(/\/$/, "");

  // Build the proven standalone web-client URL ($sn-va-web-client-app.do)
  // Strictly bypasses sp_min.jsx and window.parent.g_ambClient SecurityErrors as documented in architecture guide
  const chatParams = new URLSearchParams({
    sysparm_nostack: "true",
    sysparm_stack: "no",
    sysparm_nowassist: "true",
    sysparm_branding_key: "now_assist_in_va",
    sysparm_skip_load_history: "true",
    sysparm_load_active_only: "true",
    sysparm_portal: TELECOM_PORTAL_ID,
    sysparm_agent: NOW_ASSIST_AGENT_ID,
    sysparm_topic: TELECOM_REPAIR_TOPIC_ID,
    sysparm_user_name: currentUsername,
    sysparm_email: currentUserEmail,
    sysparm_first_name: currentFirstName,
    sysparm_last_name: currentLastName,
    sysparm_liveagent_user_name: currentUsername,
    sysparm_liveagent_email: currentUserEmail,
    sysparm_account_name: "Tata B2B Enterprise Services"
  });

  const chatUrl = `${instance}/$sn-va-web-client-app.do?${chatParams.toString()}`;

  useEffect(() => {
    // Reset loader when opening
    if (isOpen) {
      setIsLoading(true);
    }
  }, [isOpen]);

  return (
    <>
      {/* Floating Chat Container (Bottom-Right) */}
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
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white select-none border-b border-indigo-900/50">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/40 border border-indigo-400/40 flex items-center justify-center text-indigo-200 shadow-sm">
                <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5">
                  <h3 className="text-sm font-semibold text-white tracking-tight">
                    B2C Telecom Assistant
                  </h3>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Connected" />
                </div>
                <p className="text-[11px] text-slate-300">
                  Now Assist • Selfcare & Repair
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              <a
                href={chatUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new window"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                title={isExpanded ? "Collapse width" : "Expand width"}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors hidden sm:inline-flex"
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Close chat"
                className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-500/20 hover:text-rose-300 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chat IFrame Container */}
          <div className="relative flex-1 w-full h-full bg-slate-50 overflow-hidden">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-50/90 backdrop-blur-xs text-slate-500">
                <div className="w-8 h-8 border-3 border-indigo-600/30 border-t-indigo-600 rounded-full animate-spin mb-2" />
                <span className="text-xs font-medium text-slate-600">Connecting to B2C Telecom Assistant...</span>
              </div>
            )}
            <iframe
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
          className="fixed bottom-6 right-6 z-[9990] group flex items-center space-x-2.5 bg-gradient-to-r from-indigo-600 via-indigo-700 to-indigo-800 text-white pl-4 pr-5 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border border-indigo-400/30"
          style={{
            boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4), 0 8px 10px -6px rgba(79, 70, 229, 0.2)"
          }}
          aria-label="Open B2C Telecom AI Assistant"
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
