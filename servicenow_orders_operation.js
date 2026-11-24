function resolveUserContext(request) {
    var userName = request.queryParams.user_name || gs.getUserName();
    if (!userName || userName === 'guest' || userName === 'admin' || userName === 'system') {
        userName = 'goutam.hazra';
    }

    var userGr = new GlideRecord('sys_user');
    userGr.addQuery('user_name', userName);
    userGr.query();

    var ctx = {
        userName: userName,
        userSysId: '',
        fullName: 'Goutam Hazra',
        title: 'Head of Enterprise Infrastructure',
        accountId: '',
        accountName: 'Tata B2B Enterprise Services',
        contractTier: 'Tier-1 Platinum'
    };

    if (userGr.next()) {
        ctx.userSysId = userGr.getUniqueValue();
        ctx.fullName = userGr.getDisplayValue('name') || 'Goutam Hazra';
        ctx.title = userGr.getValue('title') || 'Head of Enterprise Infrastructure';
        if (userGr.company) {
            ctx.accountId = userGr.getValue('company');
            var compGr = new GlideRecord('core_company');
            if (compGr.get(ctx.accountId)) {
                ctx.accountName = compGr.getValue('name') || 'Tata B2B Enterprise Services';
            }
        }
    }

    if (!ctx.accountId) {
        var tataGr = new GlideRecord('customer_account');
        tataGr.addQuery('name', 'Tata B2B Enterprise Services');
        tataGr.query();
        if (tataGr.next()) {
            ctx.accountId = tataGr.getUniqueValue();
            ctx.accountName = tataGr.getValue('name') || 'Tata B2B Enterprise Services';
        } else {
            ctx.accountId = '66c0d2e02bc4935016f8f0aef291bf09';
        }
    }

    return ctx;
}

// Master 10 Enterprise Customer Project Orders (ServiceNow Order Management for Telecommunications - OMT)
function getMasterEnterpriseOrders() {
    return [
        {
            sys_id: 'ord-tmt-1001',
            order_number: 'ORD-2026-1001',
            product_name: 'Bangalore AI R&D Campus 10G MPLS Expansion',
            order_type: 'Bandwidth Upgrade',
            site_location: 'Bangalore Tech Park',
            site_code: 'BLR-01',
            stage: 'Provisioning',
            status: 'In Progress',
            progress_pct: 68,
            summary: 'Primary 10 Gbps Symmetrical Dark Fiber Pair with dual Cisco ASR 9904 Optical Aggregation Chassis for AI R&D Cluster',
            target_delivery_date: '2026-11-20',
            created_at: '2026-10-18 10:30:00',
            monthly_recurring_cost: 14200,
            items: [
                { category: 'Core WAN', description: '10 Gbps Symmetrical Dark Fiber Pair', quantity: 2, unit: 'Circuits', status: 'Provisioning' },
                { category: 'Hardware', description: 'Cisco ASR 9904 Optical Core Chassis', quantity: 1, unit: 'Unit', status: 'Dispatched' },
                { category: 'IP Transit', description: '10G Clean IP Transit Allocation', quantity: 1, unit: 'Allocation', status: 'Configured' }
            ],
            stages: [
                { name: 'Site Survey & Demarcation Inspection', status: 'complete', date: '2026-10-20' },
                { name: 'Optical Network Trenching & Dark Conduit Pull', status: 'current', date: 'In Progress' },
                { name: 'Cisco Core PE Router Hardware Dispatch', status: 'pending' },
                { name: 'RFC 2544 Throughput & Jitter Testing', status: 'pending' },
                { name: 'Customer Service Acceptance & Handover', status: 'pending' }
            ],
            _source: 'omt_catalog'
        },
        {
            sys_id: 'ord-tmt-1002',
            order_number: 'ORD-2026-1002',
            product_name: 'Pune Hinjawadi Phase-2 SD-WAN Secondary Redundancy',
            order_type: 'New Installation',
            site_location: 'Pune Technical Center',
            site_code: 'PUN-01',
            stage: 'Hardware Staging',
            status: 'In Progress',
            progress_pct: 45,
            summary: 'Dual-active SD-WAN Edge Appliance deployment with FortiGate 200F HA cluster and secondary 1 Gbps Metro Ethernet tail',
            target_delivery_date: '2026-11-28',
            created_at: '2026-10-22 09:15:00',
            monthly_recurring_cost: 6800,
            items: [
                { category: 'SD-WAN', description: 'FortiGate 200F Dual Active SD-WAN Gateway', quantity: 1, unit: 'Unit', status: 'Staged' },
                { category: 'Broadband', description: '1 Gbps Metro Ethernet Redundant Tail', quantity: 1, unit: 'Circuit', status: 'Provisioning' }
            ],
            stages: [
                { name: 'Carrier Demarcation Feasibility Study', status: 'complete', date: '2026-10-24' },
                { name: 'Secondary Metro Conduit Allocation', status: 'complete', date: '2026-10-29' },
                { name: 'FortiGate HA Cluster Staging', status: 'current', date: 'In Progress' },
                { name: 'Dynamic Failover & Simulation Testing', status: 'pending' },
                { name: 'BGP Peering Cutover & Go-Live', status: 'pending' }
            ],
            _source: 'omt_catalog'
        },
        {
            sys_id: 'ord-tmt-1003',
            order_number: 'ORD-2026-1003',
            product_name: 'Mumbai BKC Executive Headquarters SIP Trunk Migration',
            order_type: 'MACD Change',
            site_location: 'Mumbai Global HQ',
            site_code: 'MUM-HQ',
            stage: 'Acceptance Testing',
            status: 'Pending Acceptance',
            progress_pct: 85,
            summary: '500-channel redundant SIP trunk cutover to AudioCodes Mediant 1000B SBC with carrier-grade DID porting of 2,000 corporate numbers',
            target_delivery_date: '2026-11-14',
            created_at: '2026-10-05 14:00:00',
            monthly_recurring_cost: 8400,
            items: [
                { category: 'Voice & SIP', description: 'AudioCodes Mediant 1000B Enterprise SBC', quantity: 2, unit: 'Nodes', status: 'Complete' },
                { category: 'Voice & SIP', description: '500 Concurrent SIP Voice Channels', quantity: 500, unit: 'Channels', status: 'Configured' },
                { category: 'Voice & SIP', description: 'Direct Inward Dial Corporate Numbers', quantity: 2000, unit: 'DIDs', status: 'Ported' }
            ],
            stages: [
                { name: 'Telephony Dial Plan Architecture Design', status: 'complete', date: '2026-10-08' },
                { name: 'Dual SBC AudioCodes Rack & Power Verification', status: 'complete', date: '2026-10-15' },
                { name: 'Carrier DID Number Porting Validation', status: 'complete', date: '2026-10-25' },
                { name: 'End-to-End Voice MOS Score & Codec Testing', status: 'current', date: 'UAT Active' },
                { name: 'Operational Signoff & Service Handover', status: 'pending' }
            ],
            _source: 'omt_catalog'
        },
        {
            sys_id: 'ord-tmt-1004',
            order_number: 'ORD-2026-1004',
            product_name: 'Hyderabad HITEC City Campus Dedicated Internet Access (DIA)',
            order_type: 'New Installation',
            site_location: 'Hyderabad R&D Hub',
            site_code: 'HYD-01',
            stage: 'Civil Works',
            status: 'In Progress',
            progress_pct: 60,
            summary: '1 Gbps Clean Pipe DIA circuit with embedded upstream DDoS protection shield and /28 public IPv4 routed subnet block',
            target_delivery_date: '2026-11-25',
            created_at: '2026-10-15 11:20:00',
            monthly_recurring_cost: 5200,
            items: [
                { category: 'Broadband', description: '1 Gbps Clean Pipe DIA with DDoS Shield', quantity: 1, unit: 'Circuit', status: 'Provisioning' },
                { category: 'IP Transit', description: '/28 Public IPv4 Subnet Allocation', quantity: 16, unit: 'IPs', status: 'Assigned' }
            ],
            stages: [
                { name: 'MMR Cross-Connect Feasibility', status: 'complete', date: '2026-10-18' },
                { name: 'Single-Mode LC Fiber Patch Installation', status: 'complete', date: '2026-10-26' },
                { name: 'DDoS Scrubbing Center Route Configuration', status: 'current', date: 'In Progress' },
                { name: 'RFC 6349 TCP Throughput Benchmarking', status: 'pending' },
                { name: 'Final Handover Certificate & Billing Activation', status: 'pending' }
            ],
            _source: 'omt_catalog'
        },
        {
            sys_id: 'ord-tmt-1005',
            order_number: 'ORD-2026-1005',
            product_name: 'Chennai OMR Facility 5G Enterprise Mobile Fleet Rollout',
            order_type: 'Macro Rollout',
            site_location: 'Chennai OMR Tech Hub',
            site_code: 'CHE-01',
            stage: 'Provisioning',
            status: 'In Progress',
            progress_pct: 72,
            summary: 'Bulk deployment of 150 B2B Enterprise 5G Unlimited SIM profiles with corporate Private APN routing and Microsoft Intune MDM zero-touch setup',
            target_delivery_date: '2026-11-18',
            created_at: '2026-10-10 16:45:00',
            monthly_recurring_cost: 7500,
            items: [
                { category: 'Mobile Fleet', description: 'B2B Enterprise 5G Unlimited SIM Profiles', quantity: 150, unit: 'SIMs', status: 'Provisioned' },
                { category: 'Mobile Security', description: 'Private APN & Zero Trust Tunnel Bundle', quantity: 1, unit: 'Bundle', status: 'Configured' }
            ],
            stages: [
                { name: 'Corporate APN & Secure Gateway Topology Design', status: 'complete', date: '2026-10-14' },
                { name: 'Bulk eSIM Profile Generation in HLR/HSS', status: 'complete', date: '2026-10-22' },
                { name: 'Intune MDM Security Payload Push', status: 'current', date: 'In Progress' },
                { name: 'Field Validation & Speed Benchmark Testing', status: 'pending' },
                { name: 'Departmental Dispatch & Activation Signoff', status: 'pending' }
            ],
            _source: 'omt_catalog'
        },
        {
            sys_id: 'ord-tmt-1006',
            order_number: 'ORD-2026-1006',
            product_name: 'Singapore Subsea Landing Station 10G Cross-Connect',
            order_type: 'Bandwidth Upgrade',
            site_location: 'Singapore Subsea Landing',
            site_code: 'SGP-01',
            stage: 'Delivered',
            status: 'Completed',
            progress_pct: 100,
            summary: 'Equinix SG1 Colocation 10 Gbps low-latency optical cross-connect link connecting to Tata Communications TGN-IA subsea cable system',
            target_delivery_date: '2026-10-28',
            created_at: '2026-09-12 08:00:00',
            monthly_recurring_cost: 16800,
            items: [
                { category: 'Interconnect', description: '10G Optical Patch to TGN Subsea Cable', quantity: 1, unit: 'Link', status: 'Active' },
                { category: 'SLA Tier', description: '99.999% Ultra-Low Latency Financial SLA', quantity: 1, unit: 'Tier', status: 'Active' }
            ],
            stages: [
                { name: 'Equinix SG1 Colocation Cross-Connect Authorization', status: 'complete', date: '2026-09-15' },
                { name: 'Optical Fiber Demarcation & OTDR Loss Verification', status: 'complete', date: '2026-09-24' },
                { name: 'BGP 4323 Peering & Subsea Routing Optimization', status: 'complete', date: '2026-10-10' },
                { name: '72-Hour BER Stress Testing', status: 'complete', date: '2026-10-22' },
                { name: 'Final Production Cutover & Handover', status: 'complete', date: '2026-10-28' }
            ],
            _source: 'omt_catalog'
        },
        {
            sys_id: 'ord-tmt-1007',
            order_number: 'ORD-2026-1007',
            product_name: 'Delhi NCR Corporate Office Cloud DirectConnect Redundancy',
            order_type: 'New Installation',
            site_location: 'New Delhi Corporate',
            site_code: 'DEL-HQ',
            stage: 'Provisioning',
            status: 'In Progress',
            progress_pct: 50,
            summary: 'Redundant AWS Direct Connect 10G dedicated private interconnect with multi-account Transit Gateway BGP peering',
            target_delivery_date: '2026-12-05',
            created_at: '2026-10-25 15:10:00',
            monthly_recurring_cost: 9200,
            items: [
                { category: 'Cloud Interconnect', description: 'AWS Direct Connect Dedicated 10G Port', quantity: 1, unit: 'Port', status: 'Provisioning' },
                { category: 'Interconnect', description: 'Hosted Private Virtual Interface (VIF)', quantity: 1, unit: 'VIF', status: 'Staged' }
            ],
            stages: [
                { name: 'AWS LOA-CFA Generation & Partner Demarcation', status: 'complete', date: '2026-10-28' },
                { name: 'Physical Meet-Me-Room Cross-Connect Deployment', status: 'complete', date: '2026-11-04' },
                { name: 'Direct Connect Link Up & BGP Auth Establishment', status: 'current', date: 'In Progress' },
                { name: 'VPC Peering & Transit Gateway Integration', status: 'pending' },
                { name: 'Acceptance Signoff & Billing Handover', status: 'pending' }
            ],
            _source: 'omt_catalog'
        },
        {
            sys_id: 'ord-tmt-1008',
            order_number: 'ORD-2026-1008',
            product_name: 'Kolkata Delivery Center Wi-Fi 6 Enterprise Rollout',
            order_type: 'Macro Rollout',
            site_location: 'Kolkata Salt Lake Center',
            site_code: 'CCU-01',
            stage: 'Delivered',
            status: 'Completed',
            progress_pct: 100,
            summary: 'Turnkey enterprise Wi-Fi 6 wireless refresh with 48 Cisco Catalyst 9130AX Access Points and dual Cisco 9300 PoE+ core distribution switches',
            target_delivery_date: '2026-10-15',
            created_at: '2026-09-01 10:00:00',
            monthly_recurring_cost: 4200,
            items: [
                { category: 'Wi-Fi APs', description: 'Cisco Catalyst 9130AX Enterprise Wi-Fi 6 APs', quantity: 48, unit: 'APs', status: 'Active' },
                { category: 'Hardware', description: 'Cisco Catalyst 9300 48-Port PoE+ Core Switches', quantity: 4, unit: 'Switches', status: 'Active' }
            ],
            stages: [
                { name: 'Predictive RF Heatmap & Passive Site Survey', status: 'complete', date: '2026-09-05' },
                { name: 'Cat6A Shielded Structured Cabling Run', status: 'complete', date: '2026-09-18' },
                { name: 'AP Ceiling Mounting & PoE Switch Staging', status: 'complete', date: '2026-09-28' },
                { name: 'Cisco DNA Spaces Coverage Certification', status: 'complete', date: '2026-10-08' },
                { name: 'Final Building Handover & Acceptance', status: 'complete', date: '2026-10-15' }
            ],
            _source: 'omt_catalog'
        },
        {
            sys_id: 'ord-tmt-1009',
            order_number: 'ORD-2026-1009',
            product_name: 'Frankfurt Interconnect BGP Route Optimization & MTU Expansion',
            order_type: 'MACD Change',
            site_location: 'Frankfurt Interxion FRA1',
            site_code: 'FRA-01',
            stage: 'Delivered',
            status: 'Completed',
            progress_pct: 100,
            summary: 'Global transit peering configuration update to enable 9000-byte Jumbo Frames and AS64512 prefix limit expansion to 5,000 routes',
            target_delivery_date: '2026-10-10',
            created_at: '2026-09-20 12:00:00',
            monthly_recurring_cost: 3800,
            items: [
                { category: 'Interconnect', description: 'Jumbo Frame (MTU 9000) Core Optimization', quantity: 1, unit: 'Link', status: 'Active' },
                { category: 'Routing', description: 'AS64512 Prefix Limit Increase to 5,000', quantity: 1, unit: 'Service', status: 'Active' }
            ],
            stages: [
                { name: 'Change Advisory Board (CAB) Security Approval', status: 'complete', date: '2026-09-22' },
                { name: 'Core Edge Router Maintenance Window Configuration', status: 'complete', date: '2026-09-28' },
                { name: 'MTU 9198 End-to-End Ping Stress Verification', status: 'complete', date: '2026-10-02' },
                { name: 'BGP Convergence & Fast Reroute Validation', status: 'complete', date: '2026-10-08' },
                { name: 'Post-Implementation Review Signoff', status: 'complete', date: '2026-10-10' }
            ],
            _source: 'omt_catalog'
        },
        {
            sys_id: 'ord-tmt-1010',
            order_number: 'ORD-2026-1010',
            product_name: 'Ahmedabad Secondary Site 500M Optical SD-WAN Provisioning',
            order_type: 'New Installation',
            site_location: 'Ahmedabad Finance City',
            site_code: 'AMD-01',
            stage: 'Civil Works',
            status: 'In Progress',
            progress_pct: 35,
            summary: 'Underground fiber trenching and municipal right-of-way duct conduit laying for 500 Mbps redundant branch link to GIFT City',
            target_delivery_date: '2026-12-15',
            created_at: '2026-11-01 11:00:00',
            monthly_recurring_cost: 3500,
            items: [
                { category: 'Broadband', description: '500 Mbps Dark Fiber Metro Ethernet Tail', quantity: 1, unit: 'Circuit', status: 'Trenching' },
                { category: 'SD-WAN', description: 'Cisco Catalyst 8300 Edge Router', quantity: 1, unit: 'Unit', status: 'Dispatched' }
            ],
            stages: [
                { name: 'Municipal Right of Way (RoW) Approval', status: 'complete', date: '2026-11-04' },
                { name: 'Civil Trenching & Duct Pipe Laying', status: 'current', date: 'In Progress' },
                { name: 'Optical Fiber Splicing & OTDR Calibration', status: 'pending' },
                { name: 'Cisco Edge Router Installation & IP Allocation', status: 'pending' },
                { name: 'Customer Acceptance Testing & Handover', status: 'pending' }
            ],
            _source: 'omt_catalog'
        }
    ];
}

// ============================================================================
// RESOURCE 4: Get Orders (GET /orders)
// Returns Macro Enterprise Project Bundles with Live Milestones & Line Items
// ============================================================================
(function processOrders(request, response) {
    try {
        var ctx = resolveUserContext(request);
        var orders = [];

        var orderTable = 'sn_ind_tmt_orm_order';
        var testGr = new GlideRecord(orderTable);
        if (!testGr.isValid()) orderTable = 'customer_order';

        var ordGr = new GlideRecord(orderTable);
        if (ordGr.isValid()) {
            if (ctx.accountId) {
                if (ordGr.isValidField('account')) ordGr.addQuery('account', ctx.accountId);
                else if (ordGr.isValidField('customer')) ordGr.addQuery('customer', ctx.accountId);
            }
            ordGr.orderByDesc('sys_created_on');
            ordGr.setLimit(10);
            ordGr.query();
            while (ordGr.next()) {
                var orderId = ordGr.getUniqueValue();
                var pName = ordGr.getValue('product_name') || ordGr.getValue('short_description') || 'Telecom Service Order';
                var sLocation = ordGr.getValue('site_location') || 'Enterprise Site';
                var rawStage = ordGr.getValue('stage') || 'Provisioning';
                var rawStatus = ordGr.getValue('status') || 'in_progress';
                var summaryDesc = ordGr.getValue('description') || '';
                var targetDate = ordGr.getValue('target_delivery_date') || '';
                var createdOn = ordGr.getValue('sys_created_on') || '';

                var orderType = ordGr.getValue('order_type');
                if (!orderType) {
                    var pLower = pName.toLowerCase();
                    if (pLower.indexOf('bundle') !== -1 || pLower.indexOf('transformation') !== -1 || pLower.indexOf('infrastructure') !== -1) {
                        orderType = 'Macro Rollout';
                    } else if (pLower.indexOf('upgrade') !== -1 || pLower.indexOf('expansion') !== -1 || pLower.indexOf('10g') !== -1 || pLower.indexOf('interconnect') !== -1) {
                        orderType = 'Bandwidth Upgrade';
                    } else if (pLower.indexOf('migration') !== -1 || pLower.indexOf('cutover') !== -1 || pLower.indexOf('sip') !== -1) {
                        orderType = 'MACD Change';
                    } else {
                        orderType = 'New Installation';
                    }
                }

                var siteCode = ordGr.getValue('site_code');
                if (!siteCode) {
                    var locStr = (sLocation + ' ' + pName).toLowerCase();
                    if (locStr.indexOf('pune') !== -1) siteCode = 'PUN-01';
                    else if (locStr.indexOf('mumbai') !== -1) siteCode = 'MUM-HQ';
                    else if (locStr.indexOf('bangalore') !== -1 || locStr.indexOf('campus') !== -1) siteCode = 'BLR-01';
                    else if (locStr.indexOf('chennai') !== -1) siteCode = 'CHE-01';
                    else if (locStr.indexOf('singapore') !== -1 || locStr.indexOf('apac') !== -1) siteCode = 'SGP-01';
                    else if (locStr.indexOf('london') !== -1) siteCode = 'LON-01';
                    else if (locStr.indexOf('frankfurt') !== -1) siteCode = 'FRA-01';
                    else siteCode = 'SITE-01';
                }

                var progressPct = 68;
                var stLower = rawStage.toLowerCase();
                var statLower = rawStatus.toLowerCase();
                if (statLower === 'completed' || stLower.indexOf('delivered') !== -1 || stLower.indexOf('verified') !== -1 || stLower.indexOf('production') !== -1) {
                    progressPct = 100;
                } else if (stLower.indexOf('test') !== -1 || stLower.indexOf('acceptance') !== -1) {
                    progressPct = 85;
                } else if (stLower.indexOf('provisioning') !== -1 || stLower.indexOf('hardware') !== -1 || stLower.indexOf('carrier') !== -1) {
                    progressPct = 68;
                } else if (stLower.indexOf('trenching') !== -1 || stLower.indexOf('civil') !== -1 || stLower.indexOf('conduit') !== -1) {
                    progressPct = 45;
                } else if (stLower.indexOf('survey') !== -1 || stLower.indexOf('feasibility') !== -1) {
                    progressPct = 30;
                } else if (statLower === 'draft') {
                    progressPct = 20;
                }

                var stages = [];
                var taskTables = ['sn_ind_tmt_orm_order_task', 'customer_order_task', 'csm_order_task', 'task'];
                for (var t = 0; t < taskTables.length; t++) {
                    var tTable = taskTables[t];
                    var tGr = new GlideRecord(tTable);
                    if (tGr.isValid()) {
                        var hasQuery = false;
                        if (tGr.isValidField('order')) { tGr.addQuery('order', orderId); hasQuery = true; }
                        else if (tGr.isValidField('parent')) { tGr.addQuery('parent', orderId); hasQuery = true; }
                        
                        if (hasQuery) {
                            if (tGr.isValidField('order_index')) tGr.orderBy('order_index');
                            else tGr.orderBy('sys_created_on');
                            tGr.query();
                            while (tGr.next()) {
                                var tState = String(tGr.getValue('state') || '').toLowerCase();
                                var sStatus = (tState === '3' || tState === '4' || tState === '7' || tState === 'closed_complete' || tState === 'complete') ? 'complete' :
                                              (tState === '2' || tState === 'in_progress' || tState === 'current') ? 'current' : 'pending';
                                var tDate = '';
                                if (tGr.getValue('closed_at')) {
                                    tDate = new GlideDateTime(tGr.getValue('closed_at')).getDate().getDisplayValue();
                                } else if (tGr.getValue('expected_start') || tGr.getValue('sys_created_on')) {
                                    tDate = new GlideDateTime(tGr.getValue('expected_start') || tGr.getValue('sys_created_on')).getDate().getDisplayValue();
                                }
                                stages.push({
                                    name: tGr.getValue('short_description') || tGr.getValue('name') || 'Order Task',
                                    status: sStatus,
                                    date: tDate
                                });
                            }
                            if (stages.length > 0) break;
                        }
                    }
                }

                if (stages.length === 0) {
                    var orderCreatedGdt = createdOn ? new GlideDateTime(createdOn) : new GlideDateTime();
                    var createdDispDate = orderCreatedGdt.getDate().getDisplayValue();

                    var isDelivered = (progressPct === 100);
                    var isTesting = (progressPct >= 85);
                    var isProvisioning = (progressPct >= 65);
                    var isCivil = (progressPct >= 45);

                    stages = [
                        { name: 'Site Survey & Engineering Review', status: 'complete', date: createdDispDate },
                        { name: 'Optical Network Trenching & Feasibility', status: isCivil ? 'complete' : 'current', date: isCivil ? createdDispDate : 'In Review' },
                        { name: 'CPE Router Hardware Dispatch & Staging', status: isDelivered ? 'complete' : (isTesting ? 'complete' : (isProvisioning ? 'current' : 'pending')), date: isDelivered ? 'Verified' : (isProvisioning ? rawStage : '') },
                        { name: 'End-to-End Acceptance Testing', status: isDelivered ? 'complete' : (isTesting ? 'current' : 'pending'), date: isTesting ? 'In Testing' : '' },
                        { name: 'Handover & Service Go-Live', status: isDelivered ? 'complete' : 'pending', date: isDelivered ? 'Completed' : (targetDate || '') }
                    ];
                }

                var items = [];
                var lineItemTables = ['sn_ind_tmt_orm_order_line_item', 'customer_order_line_item', 'csm_order_line_item'];
                for (var l = 0; l < lineItemTables.length; l++) {
                    var lTable = lineItemTables[l];
                    var lGr = new GlideRecord(lTable);
                    if (lGr.isValid()) {
                        var hasLineQuery = false;
                        if (lGr.isValidField('order')) { lGr.addQuery('order', orderId); hasLineQuery = true; }
                        else if (lGr.isValidField('parent')) { lGr.addQuery('parent', orderId); hasLineQuery = true; }
                        if (hasLineQuery) {
                            lGr.query();
                            while (lGr.next()) {
                                items.push({
                                    category: lGr.getValue('product_family') || lGr.getValue('category') || 'Telecom Service',
                                    description: lGr.getValue('short_description') || lGr.getValue('product') || 'Line Item',
                                    quantity: parseInt(lGr.getValue('quantity') || '1', 10),
                                    unit: 'Units',
                                    status: lGr.getValue('stage') || rawStage || 'Provisioning'
                                });
                            }
                            if (items.length > 0) break;
                        }
                    }
                }

                if (items.length === 0) {
                    items.push({
                        category: 'Core WAN',
                        description: pName,
                        quantity: 1,
                        unit: 'Circuit',
                        status: rawStage
                    });
                }

                var mrc = ordGr.isValidField('monthly_recurring_cost') ? ordGr.getValue('monthly_recurring_cost') : 0;
                if (!mrc) mrc = 3500;

                orders.push({
                    sys_id: orderId,
                    order_number: ordGr.getValue('order_number') || ordGr.getValue('number') || ('ORD-2026-' + (9000 + orders.length)),
                    product_name: pName,
                    order_type: orderType,
                    site_location: sLocation,
                    site_code: siteCode,
                    stage: rawStage,
                    status: (rawStatus === 'completed' || rawStage === 'Delivered' || rawStage === 'Active & Verified') ? 'Completed' : (rawStatus === 'pending_acceptance' ? 'Pending Acceptance' : 'In Progress'),
                    progress_pct: progressPct,
                    summary: summaryDesc,
                    target_delivery_date: targetDate || '2026-11-15',
                    created_at: createdOn,
                    monthly_recurring_cost: Number(mrc),
                    items: items,
                    stages: stages,
                    _source: 'database'
                });
            }
        }

        // If no orders found in database table, fall back to master enterprise project orders
        if (orders.length === 0) {
            orders = getMasterEnterpriseOrders();
        }

        gs.info('[B2B Portal API] /orders returning ' + orders.length + ' scoped orders for user ' + ctx.userName);
        response.setBody({ result: orders, _source: 'omt_service' });
    } catch (e) {
        gs.error('[B2B Portal API /orders Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);
