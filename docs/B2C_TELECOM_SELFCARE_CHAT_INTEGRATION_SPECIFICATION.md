# ServiceNow B2C Telecom Selfcare Assistant
## Comprehensive Session State & Integration Reference Blueprint
### Full State Snapshot: Now Assist GenAI Deployment, Context Profile Priority & Portal Integration Guide

---

**Document Control:**
- **Document Version:** 4.0.0 (Production Master Reference)
- **Date:** November 6, 2026 (01:21 IST)
- **Target Instance:** `https://tataamericaintlcorpdemo3.service-now.com`
- **Now Assist Deployment:** `B2C Telecom Selfcare Assistant` (`sys_now_assist_deployment`: `4ea367c92b989310c4d0f7d54391bf26`)
- **Context Profile:** `B2C Selfcare AI Assistant` (`sys_cs_context_profile`: `8aa367c92b989310c4d0f7d54391bf2e`)
  - **Priority Order:** `1` (Highest Evaluation Priority)
  - **Condition Mode:** `Advanced` (Evaluates `sysparm_agent`, `sysparm_portal`, `now_assist_in_va`)
- **Portal Record:** `sp_portal`: `72be85142bc81b1016f8f0aef291bfb9`
- **Engagement Messenger Module:** `sn_csm_ec_engmnt_center_module`: `72be85142bc81b1016f8f0aef291bfa5`
- **Chat Instance:** `sn_csm_ec_chat_instance`: `2fbe09142bc81b1016f8f0aef291bf6f`
- **Build Checkpoints:**
  - Topic Suite & NLU: `Build Agent Install 1`
  - Topic Activation: `Build Agent Install 2`
  - Channel Wiring: Checkpoint `571f4a7e2bd05b1416f8f0aef291bfd7`
  - Skills & Profile Exposure: Checkpoint `fdf01e3a2b545b1416f8f0aef291bfb3`
  - Profile Order 1 Priority Fix: Checkpoint `5e181e3e2b985b1416f8f0aef291bf3f`
- **Status:** 100% Configured & Locked for Tomorrow's Session

---

## 1. Verified Architecture & Component Map

```
+-----------------------------------------------------------------------------------------------------------------------+
| SERVICENOW COMPONENT               | SYS_ID                             | STATUS & DETAILS                            |
+------------------------------------+------------------------------------+---------------------------------------------+
| Now Assist Deployment              | 4ea367c92b989310c4d0f7d54391bf26   | B2C Telecom Selfcare Assistant (Active, nava)|
| Context Profile                    | 8aa367c92b989310c4d0f7d54391bf2e   | B2C Selfcare AI Assistant (Order 1, Advanced)|
| Portal ID (sp_portal)              | 72be85142bc81b1016f8f0aef291bfb9   | B2C Selfcare Engagement Messenger Portal    |
| Messenger Module                   | 72be85142bc81b1016f8f0aef291bfa5   | B2C Selfcare Engagement Center Module       |
| Chat Instance                      | 2fbe09142bc81b1016f8f0aef291bf6f   | Telecom Support Assistant (Visible: Users)  |
| Deployment Channel (Portal)        | Active Channel Mapping             | sp_portal -> 4ea367c92b989310c4d0f7d54391... |
| Deployment Channel (Chat Instance) | Active Channel Mapping             | sn_csm_ec_chat_instance -> 4ea367c92b989... |
+-----------------------------------------------------------------------------------------------------------------------+
```

---

## 2. Complete 6-Topic Generative AI Skillset

All 6 topics are deployed as `sys_gen_ai_skill` records and mapped as `sys_cs_context_profile_visible_discoverable_skill` with `visible = true` and `discoverable = true`:

```
+-------------------------------------+------------------------------------+--------------------------------------------+
| SKILL NAME                          | ASSOCIATED TOPIC                   | PURPOSE & TRIGGER PHRASES                  |
+-------------------------------------+------------------------------------+--------------------------------------------+
| 1. Greeting & Main Menu             | B2C Telecom - Greeting & Main Menu | Default start greeting & quick action menu |
| 2. Repair / Network Outage          | B2C Selfcare Repair                | "My internet is down", "Pune WAN is slow"  |
| 3. View Installed Services          | B2C Telecom - View My Services     | "View my services", "Show my circuits"     |
| 4. Real-Time Case Status            | B2C Telecom - Check Case Status    | "Check my case status", "Status of CS..."  |
| 5. Executive AI Synopsis            | B2C Telecom - Summarize Case       | "Summarize my case", "Ticket summary"      |
| 6. Active Ticket Queue              | B2C Telecom - List Open Cases      | "Show my open cases", "List my tickets"    |
+-------------------------------------+------------------------------------+--------------------------------------------+
```

### Deployed Context Profile Greeting:
> *"Hello! I am your Tata B2B Telecom Assurance Assistant. I can help you view services, report internet or connectivity issues, check ticket status, summarize a case, or list open cases. Please describe what you need or choose one of the telecom selfcare options."*

---

## 3. Verified Launch Targets

### 3.1 Direct Now Assist Web Client URL (Standalone Browser Testing)
```text
https://tataamericaintlcorpdemo3.service-now.com/$sn-va-web-client-app.do?sysparm_nostack=true&sysparm_stack=no&sysparm_nowassist=true&sysparm_branding_key=now_assist_in_va&sysparm_skip_load_history=true&sysparm_load_active_only=true&sysparm_portal=72be85142bc81b1016f8f0aef291bfb9&sysparm_agent=4ea367c92b989310c4d0f7d54391bf26
```

### 3.2 Engagement Messenger Web Embed (In-Portal Script)
```html
<script src="https://tataamericaintlcorpdemo3.service-now.com/scripts/sn_csm_ec.js?v=5.6"></script>
<script>
  SN_CSM_EC.init({
    moduleID: "https://tataamericaintlcorpdemo3.service-now.com/#72be85142bc81b1016f8f0aef291bfa5",
    loadFeature: SN_CSM_EC.loadEMFeature()
  });
</script>
```

### 3.3 Portable Web Component Integration (`src/components/ServiceNowVirtualAgent.tsx`)
```typescript
const instance = "https://tataamericaintlcorpdemo3.service-now.com";
const TELECOM_PORTAL_ID = "72be85142bc81b1016f8f0aef291bfb9";
const NOW_ASSIST_AGENT_ID = "4ea367c92b989310c4d0f7d54391bf26";

new ServiceNowChat({
  instance: instance,
  portal: TELECOM_PORTAL_ID,
  position: "right",
  offsetX: 24,
  offsetY: 24,
  navaEnabled: true,
  context: {
    portal: TELECOM_PORTAL_ID,
    sysparm_portal: TELECOM_PORTAL_ID,
    sysparm_nowassist: "true",
    sysparm_agent: NOW_ASSIST_AGENT_ID,
    sysparm_branding_key: "now_assist_in_va",
    ...userContext
  }
});
```

---

## 4. Priority Order & Fallback Suppression Architecture

```
User launches web client with sysparm_agent=4ea367c92b989310c4d0f7d54391bf26
       │
       ▼
ServiceNow evaluates Context Profiles in numerical order (Order 1, Order 2, ...)
       │
       ├─► Evaluates Order 1: "B2C Selfcare AI Assistant" (sys_id: 8aa367c92b989310c4d0f7d54391bf2e)
       │     Condition Script checks:
       │     vaContext.agent == '4ea367c92b989310c4d0f7d54391bf26' OR
       │     vaContext.portal == '72be85142bc81b1016f8f0aef291bfb9'
       │
       ▼ (Condition returns TRUE)
Context Profile MATCHED & LOCKED.
       │
       ├─► Loads B2C Telecom Assurance Assistant Greeting
       ├─► Activates the 6 Telecom Generative AI Skills
       └─► SUPPRESSES default ITSM "Digital Assistant" (No office keys, monitors, or software requests)
```

---

## 5. Tomorrow's Resumption Action Plan

1. **Step 1 (Quick Browser Smoke Test):**
   * Open the verified URL in a new tab / new conversation.
   * Verify the greeting: *"Hello! I am your Tata B2B Telecom Assurance Assistant..."*
   * Type: `view my services` &rarr; verify it shows telecom circuits.

2. **Step 2 (Portal Codebase Update):**
   * Apply the updated parameters to [`src/components/ServiceNowVirtualAgent.tsx`](file:///C:/Code/vscodeworkspace/proactive-selfservice-portal/src/components/ServiceNowVirtualAgent.tsx).
   * Verify with `cmd /c "npm run build"`.

3. **Step 3 (Portal UX Hookup):**
   * Connect the "Ask Assistant" buttons on the Overview Dashboard, Services Hub, and Case Details to launch / focus this assistant.
   * Test live in the portal.
