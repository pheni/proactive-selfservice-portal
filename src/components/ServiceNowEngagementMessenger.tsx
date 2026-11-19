import { useEffect } from "react";

declare global {
  interface Window {
    SN_CSM_EC?: {
      init: (config: { moduleID: string; loadFeature?: any }) => void;
      loadEMFeature?: () => any;
      [key: string]: any;
    };
  }
}

const SERVICE_NOW_URL = 
  (import.meta.env.VITE_SERVICENOW_URL as string) || 
  (import.meta.env.VITE_SERVICENOW_INSTANCE_URL as string) || 
  "https://tataamericaintlcorpdemo3.service-now.com";

const EM_MODULE_ID = 
  (import.meta.env.VITE_SERVICENOW_EM_MODULE_ID as string) || 
  "72be85142bc81b1016f8f0aef291bfa5";

// Dedicated Telecom Support & Repair Topic ID (B2C Selfcare Telecom Repair - proven public topic)
const TELECOM_REPAIR_TOPIC_ID = 
  (import.meta.env.VITE_SERVICENOW_TELECOM_TOPIC_ID as string) || 
  "a4cb58692bdcdf5016f8f0aef291bf24";

/**
 * ServiceNowEngagementMessenger Component
 * Injects ServiceNow Customer Service Engagement Messenger (CSM) on the bottom-left of the screen.
 * Configured in ServiceNow with Launch icon position: Left.
 * Passes authenticated customer session context (user_name, email, account_name) to support case actions.
 * Co-exists seamlessly with Otto AI Virtual Agent (which is positioned on the bottom-right).
 */
export default function ServiceNowEngagementMessenger() {
  useEffect(() => {
    // 1. Inject scoped desktop repositioning CSS strictly for Engagement Messenger
    const styleId = "sn-engagement-messenger-desktop-style";
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement("style");
      styleEl.id = styleId;
      styleEl.innerHTML = `
        sn-csm-ec,
        #sn-csm-ec-container,
        .sn-csm-ec-container,
        .sn-csm-ec-launcher,
        #sn-csm-ec-launcher,
        div[class*="sn-csm-ec"],
        div[id*="sn-csm-ec"],
        iframe[id*="sn_csm_ec"],
        iframe[name*="sn_csm_ec"],
        iframe[id*="sn-csm-ec"],
        button[class*="sn-csm-ec"],
        button[id*="sn-csm-ec"] {
          bottom: 24px !important;
          left: 24px !important;
          right: auto !important;
          z-index: 9999 !important;
        }
      `;
      document.head.appendChild(styleEl);
    }

    // 2. Active DOM & Shadow-DOM offset enforcer (strictly scoped to sn-csm-ec to avoid affecting VA)
    const enforcePosition = () => {
      if (typeof window === 'undefined') return;
      const targetBottom = '24px';
      const targetLeft = '24px';

      const targets = document.querySelectorAll(
        'sn-csm-ec, #sn-csm-ec-container, .sn-csm-ec-container, .sn-csm-ec-launcher, [id*="sn-csm-ec"], [class*="sn-csm-ec"], iframe[id*="sn_csm_ec"], iframe[name*="sn_csm_ec"]'
      );

      targets.forEach((el: any) => {
        if (el && el.style) {
          el.style.setProperty('bottom', targetBottom, 'important');
          el.style.setProperty('left', targetLeft, 'important');
          el.style.setProperty('right', 'auto', 'important');
          el.style.setProperty('z-index', '9999', 'important');
        }
        // Pierce Shadow DOM if custom element is used
        if (el && el.shadowRoot) {
          const shadowItems = el.shadowRoot.querySelectorAll(
            '.sn-csm-ec-launcher, #sn-csm-ec-launcher, [id*="sn-csm-ec"], [class*="sn-csm-ec"], div, iframe, button'
          );
          shadowItems.forEach((sEl: any) => {
            if (sEl && sEl.style) {
              sEl.style.setProperty('bottom', targetBottom, 'important');
              sEl.style.setProperty('left', targetLeft, 'important');
              sEl.style.setProperty('right', 'auto', 'important');
              sEl.style.setProperty('z-index', '9999', 'important');
            }
          });
        }
      });
    };

    // Run enforcement periodically during initial 8 seconds after initialization
    const intervalId = setInterval(enforcePosition, 400);
    const timeoutId = setTimeout(() => clearInterval(intervalId), 10000);
    window.addEventListener('resize', enforcePosition);

    if (!SERVICE_NOW_URL) {
      return () => {
        clearInterval(intervalId);
        clearTimeout(timeoutId);
        window.removeEventListener('resize', enforcePosition);
      };
    }

    // Retrieve active logged-in portal user to pass into chat context (ServiceNow sys_user data)
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

    const currentUserSysId = 
      (typeof window !== "undefined" 
        ? (sessionStorage.getItem("sn_user_sys_id") || localStorage.getItem("sn_user_sys_id")) 
        : null) || "";

    const currentFirstName = 
      (typeof window !== "undefined" 
        ? (sessionStorage.getItem("sn_first_name") || localStorage.getItem("sn_first_name")) 
        : null) || (currentUsername.split('.')[0] ? currentUsername.split('.')[0].charAt(0).toUpperCase() + currentUsername.split('.')[0].slice(1) : "Goutam");

    const currentLastName = 
      (typeof window !== "undefined" 
        ? (sessionStorage.getItem("sn_last_name") || localStorage.getItem("sn_last_name")) 
        : null) || (currentUsername.split('.')[1] ? currentUsername.split('.')[1].charAt(0).toUpperCase() + currentUsername.split('.')[1].slice(1) : "Hazra");

    const instance = SERVICE_NOW_URL.replace(/\/$/, "");
    const fullModuleID = `${instance}/#${EM_MODULE_ID}`;
    const scriptId = "sn-engagement-messenger-script";

    const initMessenger = () => {
      try {
        if (window.SN_CSM_EC && typeof window.SN_CSM_EC.init === "function") {
          // Direct feature context mapping: routes chat launcher directly to B2C Selfcare Repair topic with authenticated user credentials
          const chatFeatureContext = () => {
            return {
              feature: "CHAT",
              openOnLoad: false,
              params: {
                topic_id: TELECOM_REPAIR_TOPIC_ID,
                language: "en",
                user_name: currentUsername,
                email: currentUserEmail,
                first_name: currentFirstName,
                last_name: currentLastName,
                user_sys_id: currentUserSysId,
                userId: currentUsername,
                userSysId: currentUserSysId,
                liveagent_user_name: currentUsername,
                liveagent_email: currentUserEmail,
                liveagent_first_name: currentFirstName,
                liveagent_last_name: currentLastName,
                liveagent_user_sys_id: currentUserSysId,
                account_name: "Tata B2B Enterprise Services"
              }
            };
          };

          window.SN_CSM_EC.init({
            moduleID: fullModuleID,
            loadFeature: chatFeatureContext()
          });

          console.log("[ServiceNow EM] Customer Service Engagement Messenger initialized with Telecom Topic & User Context:", {
            topicId: TELECOM_REPAIR_TOPIC_ID,
            user: currentUsername,
            email: currentUserEmail
          });
          enforcePosition();
        }
      } catch (err) {
        console.error("[ServiceNow EM] Initialization error:", err);
      }
    };

    if (window.SN_CSM_EC && typeof window.SN_CSM_EC.init === "function") {
      initMessenger();
    } else {
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement("script");
        script.id = scriptId;
        script.src = `${instance}/scripts/sn_csm_ec.js?v=5.6`;
        script.async = true;
        script.onload = () => {
          initMessenger();
        };
        script.onerror = (e) => {
          console.error("[ServiceNow EM] Failed to load Engagement Messenger script:", e);
        };
        document.head.appendChild(script);
      } else {
        script.addEventListener("load", initMessenger);
      }
    }

    return () => {
      clearInterval(intervalId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', enforcePosition);
    };
  }, []);

  return null;
}
