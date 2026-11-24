// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: sites
// HTTP Method: GET
// URI: /api/taair/b2b_auth_api/sites
// Relative Path: /sites
// Web Service Definition: B2B Auth API
// Sys ID: a32bfad01b281b109ac94081b24bcb31
// Consumes: application/json,application/xml,text/xml
// Produces: application/json,application/xml,text/xml
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.312Z
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

// RESOURCE 10: Get Sites Hierarchy (GET /sites)
// Returns 5 Child Site Accounts under Tata B2B Enterprise Services
// =============================================================================
(function processGetSites(request, response) {
    try {
        var ctx = resolveUserContext(request);
        var sites = [];
        var siteGr = new GlideRecord('customer_account');
        if (ctx.accountId) {
            siteGr.addQuery('parent', ctx.accountId);
            siteGr.orderBy('name');
            siteGr.query();
            while (siteGr.next()) {
                var desc = siteGr.getValue('description') || '';
                var siteCode = 'SITE-01';
                var sla = '99.9%';
                var siteId = siteGr.getUniqueValue();

                var parts = desc.split('|');
                for (var p = 0; p < parts.length; p++) {
                    var chunk = parts[p].trim();
                    if (chunk.indexOf('Site Code:') !== -1) siteCode = chunk.split(':')[1].trim();
                    if (chunk.indexOf('Site ID:') !== -1) siteId = chunk.split(':')[1].trim();
                    if (chunk.indexOf('Committed SLA:') !== -1) sla = chunk.split(':')[1].trim();
                }

                sites.push({
                    sys_id: siteGr.getUniqueValue(),
                    site_id: siteId,
                    site_code: siteCode,
                    name: siteGr.getValue('name'),
                    sla_attainment: parseFloat(sla.replace('%', '')) || 99.9,
                    status: (siteCode === 'PUN-01') ? 'Degraded' : 'Operational',
                    parent_account: ctx.accountName,
                    _source: 'database'
                });
            }
        }

        if (sites.length > 0) {
            response.setBody({ result: sites, count: sites.length, _source: 'database' });
        } else {
            response.setBody({
                result: [
                    { sys_id: 'site-pun-01', site_id: 'site-pun-001', site_code: 'PUN-01', name: 'Pune Technical Center', sla_attainment: 92.1, status: 'Degraded', _source: 'fallback_seed' },
                    { sys_id: 'site-mum-01', site_id: 'site-mum-001', site_code: 'MUM-HQ', name: 'Mumbai Global HQ & Trading Floor', sla_attainment: 99.98, status: 'Operational', _source: 'fallback_seed' },
                    { sys_id: 'site-che-01', site_id: 'site-che-001', site_code: 'CHE-02', name: 'Chennai Automotive Smart Plant', sla_attainment: 97.4, status: 'Operational', _source: 'fallback_seed' },
                    { sys_id: 'site-blr-01', site_id: 'site-blr-001', site_code: 'BLR-01', name: 'Bangalore Cloud & AI R&D Campus', sla_attainment: 99.95, status: 'Operational', _source: 'fallback_seed' },
                    { sys_id: 'site-sgp-01', site_id: 'site-sgp-001', site_code: 'SGP-01', name: 'Singapore APAC Regional Gateway', sla_attainment: 99.1, status: 'Operational', _source: 'fallback_seed' }
                ],
                count: 5,
                _source: 'fallback_seed'
            });
        }
    } catch (e) {
        gs.error('[B2B Portal API /sites Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);


// =============================================================================
