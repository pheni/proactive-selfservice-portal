// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: services
// HTTP Method: GET
// URI: /api/taair/b2b_auth_api/services
// Relative Path: /services
// Web Service Definition: B2B Auth API
// Sys ID: 031bb6d01b281b109ac94081b24bcb34
// Consumes: application/json,application/xml,text/xml
// Produces: application/json,application/xml,text/xml
// Requires Authentication: false
// Updated: 2026-11-12T17:15:00.000Z (25 Master Sold Products Alignment)
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
            ctx.accountId = 'f9277ad81be41b109ac94081b24bcb66';
        }
    }

    return ctx;
}


// ============================================================================
// RESOURCE 5: Get Services (GET /services)
// Returns Clean 25 Master Telecom Assets across Enterprise Sites
// =============================================================================
(function processServices(request, response) {
    try {
        var accountId = 'f9277ad81be41b109ac94081b24bcb66';
        var userName = 'goutam.hazra';

        var userGr = new GlideRecord('sys_user');
        userGr.addQuery('user_name', userName);
        userGr.query();
        if (userGr.next() && userGr.company) {
            accountId = userGr.getValue('company');
        }

        var services = [];
        var siteParam = (request.queryParams && (request.queryParams.site || request.queryParams.site_code)) ? String(request.queryParams.site || request.queryParams.site_code) : '';

        // Primary: Query sn_install_base_sold_product (Customer Service Install Base Management)
        var soldGr = new GlideRecord('sn_install_base_sold_product');
        if (soldGr.isValid()) {
            if (accountId && soldGr.isValidField('account')) {
                soldGr.addQuery('account', accountId);
            }
            soldGr.orderBy('number');
            soldGr.setLimit(50);
            soldGr.query();
            while (soldGr.next()) {
                var sNum = soldGr.getValue('number') || '';
                var sName = soldGr.getValue('name') || '';
                var sCat = 'Core WAN & Circuits';
                if (sNum.indexOf('MOB-') === 0 || /sim|mobile|fleet/i.test(sName)) sCat = 'Mobile Fleet & SIMs';
                else if (sNum.indexOf('SIP-') === 0 || /sip|trunk|voice/i.test(sName)) sCat = 'Voice & SIP Trunks';
                else if (sNum.indexOf('DIA-') === 0 || sNum.indexOf('CC-') !== -1 || sNum === 'CKT-SGP-01' || sNum === 'CKT-PUN-DIA' || /fiber|dia|broadband/i.test(sName)) sCat = 'Fiber Broadband';

                var sLoc = 'Pune Technical Center';
                var sCode = 'PUN-01';
                if (sNum.indexOf('MUM') !== -1 || /mumbai/i.test(sName)) { sLoc = 'Mumbai Global HQ & Trading Floor'; sCode = 'MUM-HQ'; }
                else if (sNum.indexOf('DEL') !== -1 || /delhi/i.test(sName)) { sLoc = 'New Delhi Corporate'; sCode = 'DEL-HQ'; }
                else if (sNum.indexOf('BLR') !== -1 || /bangalore|whitefield/i.test(sName)) { sLoc = 'Bangalore Cloud & AI R&D Campus'; sCode = 'BLR-01'; }
                else if (sNum.indexOf('CHE') !== -1 || /chennai/i.test(sName)) { sLoc = 'Chennai Automotive Smart Plant'; sCode = 'CHE-02'; }
                else if (sNum.indexOf('SGP') !== -1 || /singapore/i.test(sName)) { sLoc = 'Singapore APAC Regional Gateway'; sCode = 'SGP-01'; }
                else if (sNum.indexOf('HYD') !== -1 || /hyderabad/i.test(sName)) { sLoc = 'Hyderabad HITEC City'; sCode = 'HYD-01'; }

                if (siteParam && sCode !== siteParam) continue;

                services.push({
                    sys_id: soldGr.getUniqueValue(),
                    service_id: sNum,
                    number: sNum,
                    name: sName,
                    site_id: 'site-' + sCode.toLowerCase(),
                    site_code: sCode,
                    site_name: sLoc,
                    category: sCat,
                    product_family: sCat === 'Core WAN & Circuits' ? 'WAN & Internet' : sCat === 'Fiber Broadband' ? 'Broadband & Optical' : sCat === 'Voice & SIP Trunks' ? 'Voice & Unified Comm' : 'Mobility & IoT',
                    status: (sNum === 'CKT-PUN-001' || sNum === 'CKT-MUM-DC-01') ? 'Degraded' : 'Operational',
                    telemetry: {
                        latency_ms: (sNum === 'CKT-PUN-001') ? 118 : 14,
                        packet_loss_pct: (sNum === 'CKT-PUN-001') ? 2.4 : 0.0,
                        availability_30d_pct: 99.98
                    },
                    _source: 'sn_install_base_sold_product'
                });
            }
        }

        // Fallback: If sold products table was empty, fallback to cmdb_ci_service
        if (services.length === 0) {
            var ciGr = new GlideRecord('cmdb_ci_service');
            if (ciGr.isValid()) {
                if (accountId) ciGr.addQuery('company', accountId);
                ciGr.setLimit(50);
                ciGr.query();
                while (ciGr.next()) {
                    services.push({
                        sys_id: ciGr.getUniqueValue(),
                        service_id: ciGr.getValue('name'),
                        name: ciGr.getValue('name'),
                        category: 'Broadband & Optical',
                        status: 'Operational',
                        _source: 'cmdb_ci_service'
                    });
                }
            }
        }

        if (services.length > 0) {
            response.setBody({ result: services, total_count: services.length, _source: 'database' });
        } else {
            response.setBody({
                result: [
                    {
                        sys_id: 'svc-01',
                        service_id: 'CKT-PUN-001',
                        name: '1 Gbps Primary Optical MPLS Trunk',
                        category: 'Core WAN & Circuits',
                        status: 'Degraded',
                        _source: 'fallback_seed'
                    }
                ],
                total_count: 1,
                _source: 'fallback_seed'
            });
        }
    } catch (e) {
        gs.error('[B2B Portal API /services Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);
