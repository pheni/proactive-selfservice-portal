# ServiceNow TSM Dashboard Data Specification & Architectural Blueprint
**Application**: Tata B2B Customer Care Self-Service Portal  
**Target Environment**: ServiceNow TSM (Telecommunications Service Management) / CSM  
**Scope**: Complete Data Model & REST API Specification for the Overview Dashboard

---

## 1. Does This Data Come From ServiceNow TSM Module?

### **Yes, absolutely.**
In enterprise telecommunications carrier environments, standard ServiceNow CSM (`sn_customerservice_case`, `customer_account`) is designed for basic customer inquiry management. 

To power an enterprise telecom self-service portal, ServiceNow delivers the **Telecommunications Service Management (TSM)** and **Technology, Media, and Telecommunications (TMT)** data model based on **TM Forum (TMF) Open Digital Architecture (ODA)**:

| Portal Functional Domain | Standard ServiceNow Table | ServiceNow TSM / TMT Specialized Table | Real-World Enterprise Role |
| :--- | :--- | :--- | :--- |
| **Circuit & WAN Health** | `cmdb_ci_service` | `cmdb_ci_telecom_service`, `cmdb_ci_optical_circuit`, `cmdb_ci_sdwan_edge` | Models dedicated MPLS, SD-WAN, Cloud Interconnects, Fiber lines, and Bandwidth allocations. |
| **Proactive Telemetry & Alarms** | `incident` / `em_alert` | `sn_csm_case` + Event Management (`em_event`) | Ingests optical signal attenuation (-24.8 dBm), BGP flaps, packet loss from carrier OSS/NMS. |
| **Committed SLAs & MTTR** | `task_sla` | `task_sla` + `sn_tmt_sla` | Enforces 4.0h MTTR on P1 Outages, calculating SLA penalty credit vouchers ($4,210). |
| **B2B Project Orders** | `customer_order` | `sn_ind_tmt_orm_order`, `sn_ind_tmt_orm_order_line_item` | Telecommunications Order Management for circuit provisioning, site upgrades, and MACD workflows. |
| **Corporate Billing Ledger** | Custom / ERP feed | `u_billing_invoice` / Integration Hub data stream | Direct feed from billing engines (Amdocs / SAP BRIM / Netcracker) with itemized circuit breakdown. |
| **Multi-Site Hierarchy** | `customer_account` | `customer_account` (parent-child relationship) | Models parent enterprise (`Tata B2B Enterprise Services`) and child facility sites (`PUN-01`, `MUM-HQ`, etc.). |

---

## 2. Review of Scripts from Conversation `442675d7-2e1a-4d8d-9418-747352005c70`

We located the scripts previously developed in that session:

1. **[`seed_b2b_portal_data.js`](file:///c:/Code/vscodeworkspace/proactive-selfservice-portal/servicenow-scripts/seed_b2b_portal_data.js)** (44 KB):
   * Seeds `sys_user` (`goutam.hazra`, `ankur.sarkar`), `customer_account` (`Tata B2B Enterprise Services`), 5 child sites (`PUN-01`, `MUM-HQ`, `CHE-02`, `BLR-01`, `SGP-01`), contract `#CONT-00283`, and 86 CI assets.
   * **Discrepancy Found**: Previously seeded 86 CI assets, but our upgraded estate now represents **163 Total Subscriptions** (4 Core WAN + 3 Dedicated Fiber Broadband + 156 Mobile Fleet SIMs).
2. **[`scripted_rest_api_definitions.js`](file:///c:/Code/vscodeworkspace/proactive-selfservice-portal/servicenow-scripts/scripted_rest_api_definitions.js)** (49 KB):
   * Powers the 11 Scripted REST API resources under namespace `/api/taair/b2b_auth_api/`.
   * **Root Cause Found in Resource 9 (`GET /outages`)**: Lines 828–830 hardcoded `service_id: 'CKT-PUN-001'` inside the loop for *all* P1/P2 outages, which caused multiple distinct cases to display duplicate circuit IDs (`CKT-PUN-MPLS-01` $\times 2$) in the frontend.
3. **[`root_cause_database_alignment.js`](file:///c:/Code/vscodeworkspace/proactive-selfservice-portal/servicenow-scripts/root_cause_database_alignment.js)** & **[`fix_order_and_services_root_cause.js`](file:///c:/Code/vscodeworkspace/proactive-selfservice-portal/servicenow-scripts/fix_order_and_services_root_cause.js)**:
   * Fixed relational links between `sn_customerservice_case`, `cmdb_ci_service`, and `customer_account`.

---

## 3. Full Dashboard Cross-Check: Required Data Elements & Schemas

Below is the complete mapping of every UI component on the Dashboard to its ServiceNow TSM backend source:

### Section 1: Customer Account & Global Header
* **Customer Name**: `Goutam Hazra` (`sys_user.name` where `user_name = "goutam.hazra"`).
* **Account Name**: `Tata B2B Enterprise Services` (`customer_account.name`).
* **SLA Tier**: `Tier-1 Platinum SLA` (`ast_contract.description` or `customer_account.u_sla_tier`).
* **API Resource**: `GET /api/taair/b2b_auth_api/account?user_name=goutam.hazra`

### Section 2: Top KPI Row (4 Metric Cards)
1. **KPI 1: Customer Account**
   * Value: `Tata B2B Enterprise Services`
   * Badge: `Tier-1 Platinum SLA` (Green tone)
   * Link: Navigates to *Account & Sites* (`onNavigate('account')`)
2. **KPI 2: Active Orders**
   * Value: `2 In Delivery`
   * Badge: `68% Project Progress` (Blue tone)
   * Source: `sn_ind_tmt_orm_order` where `account = parentAccountId` and `status = "In Delivery"`
   * Link: Navigates to *Orders Hub* (`onNavigate('orders')`)
3. **KPI 3: Support Center**
   * Value: `10 Open`
   * Badge: `10 In Assurance` (Amber tone)
   * Source: `sn_customerservice_case` active query count (`state != 3 && state != 4`)
   * Link: Navigates to *Support Center* (`onNavigate('cases')`)
4. **KPI 4: Services Hub**
   * Value: `163 Assets`
   * Breakdown Badges: `4 WAN` (Green), `3 Fibre` (Blue), `156 SIMs` (Purple)
   * Source: `cmdb_ci_service` / `cmdb_ci_telecom_service` count grouped by category
   * Link: Navigates to *Services Hub* (`onNavigate('services')`)

---

### Section 3: Active Service Degradations Banner (The Command Strip)
* **Banner Counters**: `3 Impaired Circuits · 10 Total Cases in Assurance`
* **3 Incident Rollup Tabs (Unique, Non-Duplicated)**:
  1. **Tab 1 (`🔴 Pune MPLS · CKT-PUN-001 | P1`)**:
     * Service: `1 Gbps Primary Optical MPLS Trunk`
     * Circuit ID: `CKT-PUN-001`
     * Location: `Pune Technical Center`
     * Priority: `P1` (Critical Outage)
     * Case Reference: `ALEONB0001007` (or `CS0001255`)
     * Target MTTR: `1.2 hrs remaining` (`task_sla.time_left`)
     * Telemetry: `Latency: 48ms`, `Packet Loss: 14.8%`, `Availability: 92.1%`, `Optical dBm: -24.8 dBm`
     * Impact: *"Elevated latency (48ms) and 14.8% packet attenuation on primary optical tail"*
  2. **Tab 2 (`🟡 Mumbai 10G · CKT-MUM-002 | P2`)**:
     * Service: `10G Redundant Secondary Optical Trunk`
     * Circuit ID: `CKT-MUM-002`
     * Location: `Mumbai Global HQ & Trading Floor`
     * Priority: `P2` (Degraded Performance)
     * Case Reference: `CSM001289`
     * Target MTTR: `2.8 hrs remaining`
     * Telemetry: `Latency: 32ms`, `Packet Loss: 3.2%`, `Availability: 97.4%`, `Optical dBm: -19.2 dBm`
     * Impact: *"BGP route flap causing brief failover cycles on secondary trading trunk (32ms latency, 3.2% loss)"*
  3. **Tab 3 (`🟡 Singapore Cloud · CKT-SIN-003 | P2`)**:
     * Service: `Cloud Connect Express (Singapore APAC Gateway)`
     * Circuit ID: `CKT-SIN-003`
     * Location: `Singapore APAC Regional Gateway`
     * Priority: `P2` (Degraded Performance)
     * Case Reference: `CSM001304`
     * Target MTTR: `3.4 hrs remaining`
     * Telemetry: `Latency: 64ms`, `Packet Loss: 1.8%`, `Availability: 98.6%`, `Optical dBm: -18.5 dBm`
     * Impact: *"DirectConnect 802.1Q VLAN subsea cross-connect re-indexing in progress (64ms latency, 1.8% loss)"*

---

### Section 4: Service Spotlight Console (Diagnostic Card)
* Directly binds to whichever circuit tab is selected:
  * **Title**: Dynamic service name
  * **Category**: `Core WAN` / `Cloud Connect`
  * **Bandwidth**: `1 Gbps` / `10 Gbps` / `500 Mbps`
  * **Status Badge**: `Critical` (Red) or `Degraded` (Amber)
  * **Stats Grid**:
    * Location: e.g. `Pune Technical Center`
    * Availability: `92.1%`
    * Latency / Loss: `48ms · 14.8%` (Synchronized with alert text)
    * Active Ticket: `ALEONB0001007` (Clickable button navigating to case details)

---

### Section 5: Incident & Health Telemetry Timeline Feed
Dynamic milestone events generated per circuit from ServiceNow `em_event` / case work notes:
* **For `CKT-PUN-001`**:
  * `10:18 AM` — **NOC Duty Lead Assigned** (Investigation): *"Assigned to duty manager for physical tail loopback & cross-connect verification on CKT-PUN-001."*
  * `10:04 AM` — **Optical Diagnostic Completed** (Diagnostics): *"Telemetry checked link attenuation at -24.8 dBm threshold. BGP hold-down timer refreshed to 90 seconds."*
  * `10:01 AM` — **Assurance Incident Opened** (Telemetry): *"Proactive incident ALEONB0001007 triggered: packet loss exceeded 5% carrier SLA threshold (measured 14.8%)."*
* **For `CKT-MUM-002`**:
  * `11:42 AM` — **BGP Route Damping Tuned** (SD-WAN Routing): *"BGP hold-down timer configured to 90s, stabilizing secondary trading tunnel."*
  * `11:35 AM` — **Jitter Variance Flagged** (Diagnostics): *"Automated telemetry detected 18ms jitter elevation across secondary 10G optical path."*
  * `11:30 AM` — **Assurance Case CSM001289 Opened** (Telemetry): *"Proactive incident CSM001289 registered in ServiceNow CSM. SLA remaining: 2.8 hrs."*
* **For `CKT-SIN-003`**:
  * `01:15 PM` — **AWS DirectConnect 802.1Q Sync** (Cloud Connect): *"VLAN 402 configuration synchronized with AWS Virtual Private Cloud gateway."*
  * `01:05 PM` — **Subsea Cable Path Optimization** (Routing): *"Carrier dynamic path steering rerouted non-critical transit around maintenance window."*
  * `01:00 PM` — **Assurance Case CSM001304 Opened** (Telemetry): *"Proactive DirectConnect health check logged temporary transit re-indexing."*

---

### Section 6: Infrastructure Portfolio & Telecom Estate Grid
* **Tab 1: Core WAN (4 Circuits · 3 Impaired)**:
  1. `CKT-PUN-001`: `1 Gbps Primary Optical MPLS Trunk` (Pune) $\rightarrow$ **`Critical`** (92.1% SLA · Case `ALEONB0001007`)
  2. `CKT-MUM-002`: `10G Redundant Secondary Optical Trunk` (Mumbai) $\rightarrow$ **`Degraded`** (97.4% SLA · Case `CSM001289`)
  3. `CKT-SIN-003`: `Cloud Connect Express` (Singapore) $\rightarrow$ **`Degraded`** (98.6% SLA · Case `CSM001304`)
  4. `CKT-MUM-001`: `10G Ultra-Low Latency Core Optical Ring` (Mumbai) $\rightarrow$ **`Operational`** (99.98% SLA)
* **Tab 2: Fiber Broadband (3 Links)**:
  1. `LON-CW-FIB-9002`: 1 Gbps symmetrical, Adtran SDX 6320 ONT, -18.2 dBm optical signal, /29 static IP block
  2. `MAN-TR-FIB-4011`: 500 Mbps / 100 Mbps, Nokia XS-010X ONT, -19.5 dBm optical signal
  3. `EDN-MQ-FIB-7701`: 2 Gbps symmetrical, Ciena 3903x switch, -17.8 dBm optical signal
* **Tab 3: Mobile Fleet (156 SIMs)**:
  * 156 Total cellular subscriptions (Zebra TC57 logistics scanners, Teltonika cellular gateways, executive handsets) with data quota usage and roaming passes.

---

### Section 7: Context Intelligence (Live Stream)
* **Item 1: APAC Logistics Fleet 5G Cap** (`95.8 / 100 GB`):
  * *"Field Telematics SIM +91 98200 90456 (Pune Dispatch) reached 95% threshold. Proactive data buffer extended."*
* **Item 2: Core Optical Margin Telemetry** (`Optimal`):
  * *"Circuit CKT-PUN-001 optical tail attenuation at -24.8 dBm (alert). Secondary ring CKT-MUM-001 optimal at -16.8 dBm."*
* **Item 3: Capacity Optimization Advisory** (`Proactive`):
  * *"Peak 90th percentile traffic on Pune-Mumbai SD-WAN mesh reached 88%. Automated recommendation: profile burst to 10G trunk."*
* **Carrier Node Health**: `Operational (99.99%)`

---

## 4. Next Steps: Roadmap to Master Seeder Script

As requested, we have:
1. Cross-checked all Dashboard requirements.
2. Saved the full schema and data dictionary in [`servicenow-scripts/dashboard_data_specification.json`](file:///c:/Code/vscodeworkspace/proactive-selfservice-portal/servicenow-scripts/dashboard_data_specification.json).
3. Staged the ServiceNow scripts locally in `c:\Code\vscodeworkspace\proactive-selfservice-portal\servicenow-scripts\`.

Once you are ready to check the remaining pages (*Services Hub*, *Orders*, *Support Center*, *Billing*, *Account & Sites*), we will generate the unified **Master Seeder Script** and **Updated Scripted REST API** that can be executed directly in your ServiceNow instance Background Scripts!
