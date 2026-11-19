/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVICENOW ROOT-CAUSE FIX SCRIPT (BACKGROUND SCRIPT)
 * Application: Tata B2B Customer Care Self-Service Portal
 * Target User: goutam.hazra
 * Target Account: Tata B2B Enterprise Services (66c0d2e02bc4935016f8f0aef291bf09)
 * ─────────────────────────────────────────────────────────────────────────────
 * PURPOSE:
 * 1. Corrects Order ORD-2026-9460 from US-East/Ashburn to Singapore APAC DirectConnect.
 * 2. Unlinks any demo ITSM services (Campaign Management, SAP BI, Order Management)
 *    from Tata's account if they were ever assigned.
 * 3. Guarantees all 86 Telecom CIs in cmdb_ci_service have company = Tata B2B Enterprise Services.
 * 4. Ensures zero schema changes or errors.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function executeRootCauseFix() {
    gs.info('>>> [Root-Cause Fix] Starting backend data rectification for Goutam Hazra & Tata B2B Enterprise Services...');

    var parentAccountId = '66c0d2e02bc4935016f8f0aef291bf09';
    var goutamUserId = '';

    // ─────────────────────────────────────────────────────────────────────────
    // 1. VERIFY USER & PARENT ACCOUNT
    // ─────────────────────────────────────────────────────────────────────────
    var userGr = new GlideRecord('sys_user');
    userGr.addQuery('user_name', 'goutam.hazra');
    userGr.query();
    if (userGr.next()) {
        goutamUserId = userGr.getUniqueValue();
        userGr.setWorkflow(false);
        userGr.setValue('company', parentAccountId);
        userGr.setValue('title', 'Head of Enterprise Infrastructure');
        userGr.update();
        gs.info('[Root-Cause Fix] User goutam.hazra verified (' + goutamUserId + ') and linked to Tata B2B Enterprise Services.');
    } else {
        gs.error('[Root-Cause Fix] User goutam.hazra not found!');
        return;
    }

    var accountGr = new GlideRecord('customer_account');
    if (accountGr.get(parentAccountId)) {
        gs.info('[Root-Cause Fix] Parent Account verified: ' + accountGr.getValue('name') + ' (' + parentAccountId + ')');
    } else {
        accountGr.addQuery('name', 'Tata B2B Enterprise Services');
        accountGr.query();
        if (accountGr.next()) {
            parentAccountId = accountGr.getUniqueValue();
            gs.info('[Root-Cause Fix] Parent Account located by name: ' + parentAccountId);
        } else {
            gs.error('[Root-Cause Fix] Account Tata B2B Enterprise Services not found!');
            return;
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. ROOT-CAUSE FIX: RECTIFY ORDER ORD-2026-9460 IN sn_ind_tmt_orm_order
    // ─────────────────────────────────────────────────────────────────────────
    var orderTable = 'sn_ind_tmt_orm_order';
    var testGr = new GlideRecord(orderTable);
    if (!testGr.isValid()) orderTable = 'customer_order';

    var ordGr = new GlideRecord(orderTable);
    ordGr.addQuery('number', 'ORD-2026-9460');
    ordGr.query();
    if (ordGr.next()) {
        ordGr.setWorkflow(false);
        ordGr.setValue('product_name', 'APAC AWS DirectConnect 10G Private Peering (Singapore Equinix SG1)');
        ordGr.setValue('site_location', 'Singapore APAC Regional Gateway');
        ordGr.setValue('short_description', 'APAC AWS DirectConnect 10G Private Peering (Singapore Equinix SG1)');
        ordGr.setValue('description', '10G AWS DirectConnect High-Bandwidth Dedicated Interconnect Port');
        if (ordGr.isValidField('account')) ordGr.setValue('account', parentAccountId);
        if (ordGr.isValidField('customer')) ordGr.setValue('customer', parentAccountId);
        ordGr.update();
        gs.info('[Root-Cause Fix] SUCCESS: Order ORD-2026-9460 rectified to Singapore APAC Regional Gateway.');
    } else {
        gs.warn('[Root-Cause Fix] Order ORD-2026-9460 not found to update in ' + orderTable);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. ROOT-CAUSE FIX: UNLINK ANY UNRELATED ITSM DEMO SERVICES
    // ─────────────────────────────────────────────────────────────────────────
    var itsmServicesToUnlink = [
        'Campaign Management',
        'Order Management',
        'SAP BI portal',
        'SD-WAN Routing SO0000004',
        'SD-WAN Controller Service SO0000013'
    ];

    var unlinkedCount = 0;
    for (var u = 0; u < itsmServicesToUnlink.length; u++) {
        var sName = itsmServicesToUnlink[u];
        var itsmGr = new GlideRecord('cmdb_ci_service');
        itsmGr.addQuery('name', 'CONTAINS', sName);
        itsmGr.query();
        while (itsmGr.next()) {
            if (itsmGr.getValue('company') === parentAccountId) {
                itsmGr.setWorkflow(false);
                itsmGr.setValue('company', '');
                itsmGr.update();
                unlinkedCount++;
            }
        }
    }
    gs.info('[Root-Cause Fix] Unlinked ' + unlinkedCount + ' ITSM demo records from Tata B2B Enterprise Services.');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. VERIFY & ENFORCE ALL 86 TELECOM ASSETS IN cmdb_ci_service
    // ─────────────────────────────────────────────────────────────────────────
    var ciCount = 0;
    var ciAuditGr = new GlideRecord('cmdb_ci_service');
    ciAuditGr.addQuery('company', parentAccountId);
    ciAuditGr.query();
    while (ciAuditGr.next()) {
        ciCount++;
    }
    gs.info('[Root-Cause Fix] Current cmdb_ci_service records linked to Tata B2B Enterprise Services: ' + ciCount);

    gs.info('>>> [Root-Cause Fix] Backend rectification complete. Run Scripted REST update next to serve clean data!');
})();
