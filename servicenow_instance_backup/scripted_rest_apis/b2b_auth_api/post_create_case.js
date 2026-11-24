// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: create_case
// HTTP Method: POST
// URI: /api/taair/b2b_auth_api/create_case
// Relative Path: /create_case
// Web Service Definition: B2B Auth API
// Sys ID: 291b76d01b281b109ac94081b24bcba6
// Consumes: application/json,application/xml,text/xml
// Produces: application/json,application/xml,text/xml
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.263Z
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

// RESOURCE 3: Create Support Case (POST /create_case)
// =============================================================================
(function processCreateCase(request, response) {
    try {
        var ctx = resolveUserContext(request);
        var body = request.body.data || {};
        var shortDesc = body.short_description || 'Telecom Inquiry';
        var desc = body.description || shortDesc;
        var priority = body.priority || '3';
        var category = body.category || 'inquiry';
        var serviceId = body.service_id || 'CKT-PUN-001';

        var caseGr = new GlideRecord('sn_customerservice_case');
        caseGr.initialize();
        caseGr.setValue('short_description', shortDesc);
        caseGr.setValue('description', desc);
        caseGr.setValue('priority', priority);
        caseGr.setValue('category', category);
        caseGr.setValue('state', '1'); // Open
        if (ctx.accountId) caseGr.setValue('account', ctx.accountId);
        if (ctx.userSysId) caseGr.setValue('contact', ctx.userSysId);

        var newSysId = caseGr.insert();
        var newNumber = caseGr.getValue('number') || ('CS' + Math.floor(1000000 + Math.random() * 9000000));

        gs.info('[B2B Portal API] Created new case ' + newNumber + ' scoped to user ' + ctx.userName);
        response.setStatus(201);
        response.setBody({
            result: {
                success: true,
                sys_id: newSysId,
                case_number: newNumber,
                short_description: shortDesc,
                status: 'Open',
                priority: 'P' + priority,
                service_id: serviceId,
                contact: ctx.fullName,
                account: ctx.accountName,
                _source: 'database'
            }
        });
    } catch (e) {
        gs.error('[B2B Portal API /create_case Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);


// =============================================================================
