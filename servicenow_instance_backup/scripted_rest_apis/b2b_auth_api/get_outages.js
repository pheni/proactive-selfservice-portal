// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: outages
// HTTP Method: GET
// URI: /api/taair/b2b_auth_api/outages
// Relative Path: /outages
// Web Service Definition: B2B Auth API
// Sys ID: ae2bbad01b281b109ac94081b24bcb9c
// Consumes: application/json,application/xml,text/xml
// Produces: application/json,application/xml,text/xml
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.313Z
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

// RESOURCE 9: Get Active Outages & Proactive Telemetry (GET /outages)
// =============================================================================
(function processGetOutages(request, response) {
    try {
        var ctx = resolveUserContext(request);
        var caseGr = new GlideRecord('sn_customerservice_case');
        if (ctx.accountId) caseGr.addQuery('account', ctx.accountId);
        caseGr.addActiveQuery();
        caseGr.addQuery('priority', 'IN', '1,2');
        caseGr.orderBy('priority');
        caseGr.setLimit(5);
        caseGr.query();

        var outages = [];
        while (caseGr.next()) {
            var pVal = caseGr.getValue('priority');
            var priority = (pVal === '1' || pVal === 1) ? 'P1' : 'P2';
            var sVal = caseGr.getValue('state');
            var status = (sVal === '1') ? 'Open' : (sVal === '2') ? 'In Progress' : (sVal === '3') ? 'Monitoring' : 'Recovery';

            outages.push({
                case_number: caseGr.getValue('number'),
                short_description: caseGr.getValue('short_description') || 'Telecom Outage Incident',
                priority: priority,
                state: status,
                site_name: 'Pune Technical Center',
                service_id: 'CKT-PUN-001',
                service_name: '1 Gbps Primary Optical MPLS Trunk',
                assigned_to: 'Anish Kutti',
                root_cause: 'Optical fiber attenuation on last-mile local loop (-19.4 dBm)',
                failover_status: 'Autonomous failover engaged to secondary SD-WAN 4G LTE pathway in 280ms',
                technician_status: 'Field engineer dispatched · ETA 35m',
                mttr_sla_hours: 4,
                opened_at: caseGr.getValue('sys_created_on'),
                credit_exposure: 4210,
                _source: 'database'
            });
        }

        if (outages.length > 0) {
            response.setBody({ result: outages, count: outages.length, _source: 'database' });
        } else {
            response.setBody({
                result: [
                    {
                        case_number: 'CS0001255',
                        short_description: 'Primary MPLS Circuit Flapping Detected — Optical Attenuation Active',
                        priority: 'P1',
                        state: 'Recovery',
                        site_name: 'Pune Technical Center',
                        service_id: 'CKT-PUN-001',
                        service_name: '1 Gbps Primary Optical MPLS Trunk',
                        assigned_to: 'Anish Kutti',
                        root_cause: 'Optical fiber attenuation on last-mile local loop (-19.4 dBm)',
                        failover_status: 'Autonomous failover engaged to secondary SD-WAN 4G LTE pathway in 280ms',
                        technician_status: 'Technician en-route · ETA 35m',
                        mttr_sla_hours: 4,
                        credit_exposure: 4210,
                        opened_at: new Date(Date.now() - 3600000 * 1.2).toISOString(),
                        _source: 'fallback_seed'
                    }
                ],
                count: 1,
                _source: 'fallback_seed'
            });
        }
    } catch (e) {
        gs.error('[B2B Portal API /outages Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);


// =============================================================================
