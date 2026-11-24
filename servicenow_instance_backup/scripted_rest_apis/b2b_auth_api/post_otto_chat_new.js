// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: otto_chat_new
// HTTP Method: POST
// URI: /api/taair/b2b_auth_api/otto/chat_new
// Relative Path: /otto/chat_new
// Web Service Definition: B2B Auth API
// Sys ID: f12b3ad01b281b109ac94081b24bcb99
// Consumes: application/json,application/xml,text/xml
// Produces: application/json,application/xml,text/xml
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.323Z
// ============================================================================

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

    // Default to Tata B2B Enterprise Services parent account if accountId wasn't found on user
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


// ============================================================================

// RESOURCE 8: ottoChat_new (POST /otto/chat_new)
// =============================================================================
(function processOttoChat(request, response) {
    try {
        var ctx = resolveUserContext(request);
        var body = request.body.data || {};
        var prompt = body.prompt || '';
        var caseNum = body.caseNumber;
        var actionKey = body.actionKey || '';

        var caseGr = new GlideRecord('sn_customerservice_case');
        if (caseNum) {
            caseGr.addQuery('number', caseNum);
        } else {
            if (ctx.accountId) caseGr.addQuery('account', ctx.accountId);
            caseGr.addActiveQuery();
            caseGr.orderBy('priority');
        }
        caseGr.setLimit(1);
        caseGr.query();

        var activeNumber = 'CS0001255';
        var activeDesc = 'Primary MPLS Circuit Flapping Detected — Optical Attenuation Active';
        var activeState = 'Open';

        if (caseGr.next()) {
            activeNumber = caseGr.getValue('number');
            activeDesc = caseGr.getValue('short_description') || '';
            activeState = caseGr.getDisplayValue('state');
        }

        var isPune = prompt.toLowerCase().indexOf('pune') !== -1 || prompt.toLowerCase().indexOf('mpls') !== -1 || prompt.toLowerCase().indexOf('flapping') !== -1;
        var isOrder = prompt.toLowerCase().indexOf('order') !== -1 || prompt.toLowerCase().indexOf('sd-wan') !== -1;
        var isBilling = prompt.toLowerCase().indexOf('billing') !== -1 || prompt.toLowerCase().indexOf('invoice') !== -1;

        var replyText = '';
        var actionPills = [];

        if (isPune || (!isOrder && !isBilling)) {
            replyText = '### 🚨 Autonomous Diagnostic Report — Incident ' + activeNumber + '\n' +
                'I coordinated with the **Service Test & Repair Agent** and the **Network Incident Analysis Agent** for **' + ctx.fullName + '** (' + ctx.title + '):\n\n' +
                '1. **Optical Root Cause**: Optical receive power attenuated to **-19.4 dBm** (threshold: -14.0 dBm) due to roadside conduit micro-bending near Hinjewadi Phase 2.\n' +
                '2. **Mitigation**: Autonomous SD-WAN failover engaged to secondary **4G LTE pathway (280ms switchover)**. Zero packet drop on corporate ERP.\n' +
                '3. **Field Dispatch**: Field technician en-route (ETA 35m). Site NOC contact: **Anish Kutti**.\n' +
                '4. **SLA Protection**: Pre-approved for **$4,210 SLA credit** under Contract #CONT-00283.\n' +
                '5. **Assigned Specialist**: **Anish Kutti** is actively supervising.';

            actionPills = [
                { label: 'Trigger Loopback Test', actionKey: 'loopback_test' },
                { label: 'Verify BGP Route Tables', actionKey: 'verify_bgp' },
                { label: 'Notify Site NOC (Anish Kutti)', actionKey: 'notify_noc' },
                { label: 'Confirm Restoration', actionKey: 'confirm_restoration' }
            ];
        } else if (isOrder) {
            replyText = '### 📦 Order Fulfillment Telemetry — ORD-2026-9921\n' +
                'I analyzed order **ORD-2026-9921** (Global Enterprise SD-WAN & 5G Mobility Transformation) with the **Order Tracking Agent**:\n\n' +
                '1. **Volume Scope**: 250 Mobile SIM Lines · 50 Broadband Circuits · 20 Voice Trunks across Pune, Mumbai & London.\n' +
                '2. **Current Stage**: Provisioning (Last-mile fiber blown).\n' +
                '3. **Target Delivery**: **November 15, 2026** (Confidence: 94%).\n' +
                '4. **Autonomous Handover**: Partial turn-up available for 250 Mobile SIM lines immediately.';

            actionPills = [
                { label: 'View Multi-Unit Badges', actionKey: 'view_order' },
                { label: 'Trigger Partial Activation', actionKey: 'partial_handover' }
            ];
        } else {
            replyText = '### 💳 Billing Variance Analysis — Invoice INV-2026-0456\n' +
                'I audited invoice **INV-2026-0456** ($94,300, +12% variance) with the **Billing Resolution Agent**:\n\n' +
                '1. **Variance Driver**: 420 GB unpooled data roaming surge in Singapore ($10,100) during APAC Tech Summit.\n' +
                '2. **Contract Benchmark**: Exceeds standard pool under Contract #CONT-00283.\n' +
                '3. **Recommended Action**: Retroactive roaming pool credit eligible. Pre-approved $10,100 adjustment ready to apply.';

            actionPills = [
                { label: 'Apply Roaming Pool Credit', actionKey: 'initiate_credit' },
                { label: 'Download Itemized CDR', actionKey: 'download_cdr' }
            ];
        }

        response.setBody({
            result: {
                success: true,
                reply: replyText,
                isGenAi: true,
                caseNumber: activeNumber,
                caseState: activeState,
                actionPills: actionPills,
                telemetryReport: {
                    latency: '48ms',
                    packetLoss: '1.4% (Degraded Optical Loop)',
                    bgpState: 'Established via Secondary SD-WAN 4G LTE',
                    healthScore: (activeState === 'Resolved' || activeState === 'Closed') ? '100% (Operational)' : '92.1% (Degraded)'
                },
                _source: 'database'
            }
        });
    } catch (e) {
        gs.error('[B2B Portal API /otto/chat_new Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);


// =============================================================================
