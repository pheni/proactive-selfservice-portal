// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: confirm_restoration
// HTTP Method: POST
// URI: /api/taair/b2b_auth_api/confirm_restoration
// Relative Path: /confirm_restoration
// Web Service Definition: B2B Auth API
// Sys ID: 201bbe901b281b109ac94081b24bcb95
// Consumes: application/json,application/xml,text/xml
// Produces: application/json,application/xml,text/xml
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.259Z
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

// RESOURCE 2: Confirm Resolution (POST /confirm_restoration)
// =============================================================================
(function processConfirmRestoration(request, response) {
    try {
        var ctx = resolveUserContext(request);
        var body = request.body.data || {};
        var caseNum = body.case_number;
        var notes = body.resolution_notes || 'Customer confirmed service restoration via AI Self-Service Workspace.';

        if (!caseNum) {
            response.setStatus(400);
            response.setBody({ error: 'Missing required field: case_number' });
            return;
        }

        var caseGr = new GlideRecord('sn_customerservice_case');
        caseGr.addQuery('number', caseNum);
        caseGr.query();
        if (caseGr.next()) {
            caseGr.setValue('state', '6'); // 6 = Resolved
            caseGr.work_notes = '[AI Agent Orchestrator] ' + notes + '\nCustomer Executive: ' + ctx.fullName + ' (' + ctx.title + ')\nAssigned Engineer: Anish Kutti (Site NOC Operations Lead)';
            caseGr.update();
            gs.info('[B2B Portal API] Case ' + caseNum + ' marked as Resolved in database.');
            response.setBody({
                result: {
                    success: true,
                    case_number: caseNum,
                    status: 'Resolved',
                    message: 'Case ' + caseNum + ' has been marked as Resolved in ServiceNow.',
                    _source: 'database'
                }
            });
        } else {
            response.setBody({
                result: {
                    success: true,
                    case_number: caseNum,
                    status: 'Resolved',
                    message: 'Restoration confirmed (simulation).',
                    _source: 'fallback_seed'
                }
            });
        }
    } catch (e) {
        gs.error('[B2B Portal API /confirm_restoration Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);


// =============================================================================
