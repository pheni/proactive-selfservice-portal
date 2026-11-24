// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: cases
// HTTP Method: GET
// URI: /api/taair/b2b_auth_api/cases
// Relative Path: /cases
// Web Service Definition: B2B Auth API
// Sys ID: ba7a7a501b281b109ac94081b24bcba6
// Consumes: application/json,application/xml,text/xml
// Produces: application/json,application/xml,text/xml
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.317Z
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

// RESOURCE 1: Cases (GET /cases)
// =============================================================================
(function processCases(request, response) {
    try {
        var ctx = resolveUserContext(request);
        var stateParam = request.queryParams.state || '';
        var siteParam = request.queryParams.site || request.queryParams.site_code || '';
        var limitParam = parseInt(request.queryParams.limit || '20', 10);

        var caseGr = new GlideRecord('sn_customerservice_case');
        if (ctx.accountId) {
            caseGr.addQuery('account', ctx.accountId);
        } else if (ctx.userSysId) {
            caseGr.addQuery('contact', ctx.userSysId);
        }

        if (siteParam && caseGr.isValidField('u_site_code')) {
            caseGr.addQuery('u_site_code', siteParam);
        }

        if (stateParam === 'active') {
            caseGr.addActiveQuery();
        }
        caseGr.orderByDesc('sys_created_on');
        caseGr.setLimit(limitParam);
        caseGr.query();

        var cases = [];
        while (caseGr.next()) {
            var caseSysId = caseGr.getUniqueValue();
            var pVal = caseGr.getValue('priority') || '3';
            var sVal = caseGr.getValue('state') || '1';
            var assignedName = caseGr.assigned_to ? caseGr.assigned_to.getDisplayValue() : 'Anish Kutti';
            var contactName = caseGr.contact ? caseGr.contact.getDisplayValue() : ctx.fullName;

            var priority = (pVal === '1') ? 'P1' : (pVal === '2') ? 'P2' : (pVal === '3') ? 'P3' : 'P4';
            var status = (sVal === '6') ? 'Resolved' : (sVal === '7') ? 'Closed' : (sVal === '2') ? 'In Progress' : 'Open';

            // Query linked SLA dynamically from task_sla
            var slaPercentage = 72;
            var slaBreached = false;
            var slaGr = new GlideRecord('task_sla');
            slaGr.addQuery('task', caseSysId);
            slaGr.query();
            if (slaGr.next()) {
                slaPercentage = parseFloat(slaGr.getValue('percentage') || 72);
                slaBreached = slaGr.getValue('has_breached') === 'true' || slaGr.getValue('has_breached') === '1';
            }

            var serviceName = '1 Gbps Primary Optical MPLS Trunk';
            var serviceId = 'CKT-PUN-001';
            var siteName = 'Pune Technical Center';
            var desc = (caseGr.getValue('short_description') || '').toLowerCase();

            if (desc.indexOf('roaming') !== -1 || desc.indexOf('invoice') !== -1) {
                serviceName = 'Global Enterprise Mobility & Roaming Pool';
                serviceId = 'MOB-SGP-POOL';
                siteName = 'Singapore Regional Hub';
            } else if (desc.indexOf('bgp') !== -1 || desc.indexOf('london') !== -1) {
                serviceName = 'AWS DirectConnect 10G Interconnect';
                serviceId = 'INT-LON-02';
                siteName = 'London Equinix LD4 Gateway';
            } else if (desc.indexOf('bangalore') !== -1) {
                serviceName = 'Dedicated Cloud Connect 1 Gbps Link';
                serviceId = 'DIA-500-BLR-01';
                siteName = 'Bangalore Tech Campus';
            } else if (desc.indexOf('mumbai') !== -1) {
                serviceName = '10G Ultra-Low Latency Core Optical Ring';
                serviceId = 'CKT-MUM-DC-01';
                siteName = 'Mumbai Global HQ Core';
            }

            var aiSummary = (caseGr.isValidField('u_ai_summary') && caseGr.getValue('u_ai_summary'))
                ? caseGr.getValue('u_ai_summary')
                : (caseGr.getValue('description') || caseGr.getValue('short_description') || '');
            var escalationRisk = (caseGr.isValidField('u_escalation_risk') && caseGr.getValue('u_escalation_risk'))
                ? caseGr.getValue('u_escalation_risk')
                : (priority === 'P1' ? 'High' : 'Normal');

            var siteCodeVal = (caseGr.isValidField('u_site_code') && caseGr.getValue('u_site_code'))
                ? caseGr.getValue('u_site_code')
                : (siteName.indexOf('Pune') !== -1 ? 'PUN-01' : siteName.indexOf('Mumbai') !== -1 ? 'MUM-HQ' : siteName.indexOf('Bangalore') !== -1 ? 'BLR-01' : siteName.indexOf('Chennai') !== -1 ? 'CHE-02' : 'SGP-01');

            cases.push({
                sys_id: caseSysId,
                case_number: caseGr.getValue('number'),
                short_description: caseGr.getValue('short_description') || 'Telecom Case',
                description: caseGr.getValue('description') || '',
                ai_summary: aiSummary,
                escalation_risk: escalationRisk,
                priority: priority,
                status: status,
                state: sVal,
                service_id: serviceId,
                service_name: serviceName,
                site_name: siteName,
                site_code: siteCodeVal,
                assigned_to: assignedName,
                contact: contactName,
                created_at: caseGr.getValue('sys_created_on'),
                updated_at: caseGr.getValue('sys_updated_on'),
                sla_percentage: slaPercentage,
                sla_breached: slaBreached,
                sla_remaining_hours: slaBreached ? 0 : 1.2,
                _source: 'database'
            });
        }

        if (cases.length > 0) {
            gs.info('[B2B Portal API] /cases fetched ' + cases.length + ' scoped records for user ' + ctx.userName);
            response.setBody({ result: cases, count: cases.length, _source: 'database' });
        } else {
            gs.warn('[B2B Portal API] No scoped records found in sn_customerservice_case. Using fallback seed.');
            response.setBody({
                result: [
                    {
                        sys_id: 'c-pun-01',
                        case_number: 'CS0001255',
                        short_description: 'Primary MPLS Circuit Flapping Detected — Optical Attenuation Active',
                        description: 'Circuit CKT-PUN-001 at Pune Technical Center experiencing repeated optical flapping. Optical Rx dipped to -19.4 dBm. Autonomous failover engaged to secondary SD-WAN 4G LTE. Field technician en-route.',
                        priority: 'P1',
                        status: 'Open',
                        service_id: 'CKT-PUN-001',
                        service_name: '1 Gbps Primary Optical MPLS Trunk',
                        site_name: 'Pune Technical Center',
                        assigned_to: 'Anish Kutti',
                        contact: ctx.fullName,
                        created_at: new Date(Date.now() - 3600000 * 2.8).toISOString(),
                        sla_percentage: 122,
                        sla_breached: true,
                        sla_remaining_hours: 0,
                        credit_exposure: 4210,
                        _source: 'fallback_seed'
                    }
                ],
                count: 1,
                _source: 'fallback_seed'
            });
        }
    } catch (e) {
        gs.error('[B2B Portal API /cases Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);


// =============================================================================
