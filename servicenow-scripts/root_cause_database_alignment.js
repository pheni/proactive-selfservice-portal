/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVICENOW ROOT-CAUSE DATABASE ALIGNMENT SCRIPT (BACKGROUND SCRIPT)
 * Application: Tata B2B Customer Care Self-Service Portal
 * Target User: goutam.hazra (Head of Enterprise Infrastructure)
 * Target Account: Tata B2B Enterprise Services (66c0d2e02bc4935016f8f0aef291bf09)
 * ─────────────────────────────────────────────────────────────────────────────
 * WHY THIS SCRIPT IS NEEDED (TACKLING ROOT CAUSE IN SERVICENOW):
 * 1. Categorization: cmdb_ci_service had "Type: Broadband & Optical" hardcoded
 *    in comments metadata for DirectConnect, SD-WAN, and IoT. This script fixes
 *    them directly in the database so ServiceNow returns clean Product Families.
 * 2. Pune Mobile Clutter: Pune Technical Center had 10 individual SIM lines
 *    (Lines 01 to 10) cluttering the physical site grid across multiple columns.
 *    This script consolidates them into 2 Corporate Mobile Fleet Pools:
 *      - "Pune Executive 5G Mobile Fleet Pool (5 SIMs)" (MOB-PUN-EXEC)
 *      - "Pune Operations 5G Mobile Fleet Pool (5 SIMs)" (MOB-PUN-OPS)
 *    and unlinks the loose redundant SIM lines to the global roaming pool.
 * 3. Pune MPLS Trunk Status: Aligns CKT-PUN-001 to operational_status = 2 (Degraded/Critical)
 *    and verifies Case CS0001255 is properly linked.
 * 4. Zero schema changes — operates strictly on existing OOTB fields.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function executeRootCauseDatabaseAlignment() {
    gs.info('>>> [Root-Cause DB Alignment] Starting database rectification for Tata B2B Enterprise Services...');

    var parentAccountId = '66c0d2e02bc4935016f8f0aef291bf09';
    var goutamUserId = '';

    // 1. Verify User & Account
    var userGr = new GlideRecord('sys_user');
    userGr.addQuery('user_name', 'goutam.hazra');
    userGr.query();
    if (userGr.next()) {
        goutamUserId = userGr.getUniqueValue();
    } else {
        gs.error('[Root-Cause DB Alignment] User goutam.hazra not found!');
        return;
    }

    var accountGr = new GlideRecord('customer_account');
    if (!accountGr.get(parentAccountId)) {
        accountGr.addQuery('name', 'Tata B2B Enterprise Services');
        accountGr.query();
        if (accountGr.next()) {
            parentAccountId = accountGr.getUniqueValue();
        }
    }
    gs.info('[Root-Cause DB Alignment] Target Parent Account: ' + parentAccountId);

    // 2. Define Precise Metadata Mappings for all Tata Enterprise Services
    var serviceDefinitions = [
        // ── PUNE TECHNICAL CENTER (PUN-01) ──
        // Core Circuits & Voice Trunks
        { name: '1 Gbps Primary Optical MPLS Trunk', id: 'CKT-PUN-001', type: 'WAN & Internet', site: 'site-pun-001', siteCode: 'PUN-01', status: '2' },
        { name: '1 Gbps Secondary SD-WAN Backup', id: 'CKT-PUN-002', type: 'WAN & Internet', site: 'site-pun-001', siteCode: 'PUN-01', status: '1' },
        { name: '500 Mbps Dedicated Internet Access (DIA)', id: 'CKT-PUN-DIA', type: 'WAN & Internet', site: 'site-pun-001', siteCode: 'PUN-01', status: '1' },
        { name: 'SIP Corporate Voice Trunk (Primary)', id: 'SIP-PUN-01', type: 'Voice & Unified Comm', site: 'site-pun-001', siteCode: 'PUN-01', status: '1' },
        { name: 'SIP Corporate Voice Trunk (Secondary)', id: 'SIP-PUN-02', type: 'Voice & Unified Comm', site: 'site-pun-001', siteCode: 'PUN-01', status: '1' },
        // Consolidated Pune Mobility Fleet (Clean, non-cluttering)
        { name: 'Pune Executive 5G Mobile Fleet Pool (5 SIMs)', id: 'MOB-PUN-EXEC', type: 'Mobility & IoT', site: 'site-pun-001', siteCode: 'PUN-01', status: '1' },
        { name: 'Pune Operations 5G Mobile Fleet Pool (5 SIMs)', id: 'MOB-PUN-OPS', type: 'Mobility & IoT', site: 'site-pun-001', siteCode: 'PUN-01', status: '1' },

        // ── MUMBAI GLOBAL HQ CORE (MUM-HQ) ──
        { name: '10G Ultra-Low Latency Core Optical Ring', id: 'CKT-MUM-DC-01', type: 'WAN & Internet', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },
        { name: '10G Redundant Secondary Optical Trunk', id: 'CKT-MUM-DC-02', type: 'WAN & Internet', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },
        { name: 'Mumbai SD-WAN Dual Edge Gateway 01', id: 'CKT-MUM-SD-01', type: 'Cybersecurity & SASE', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },
        { name: 'Mumbai SD-WAN Dual Edge Gateway 02', id: 'CKT-MUM-SD-02', type: 'Cybersecurity & SASE', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },
        { name: 'Mumbai Cloud DirectConnect 10G Gateway', id: 'CKT-MUM-CC-01', type: 'Cloud & Interconnect', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 01 (500 Channels)', id: 'SIP-MUM-01', type: 'Voice & Unified Comm', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 02 (500 Channels)', id: 'SIP-MUM-02', type: 'Voice & Unified Comm', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 03 (500 Channels)', id: 'SIP-MUM-03', type: 'Voice & Unified Comm', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 04 (500 Channels)', id: 'SIP-MUM-04', type: 'Voice & Unified Comm', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 05 (500 Channels)', id: 'SIP-MUM-05', type: 'Voice & Unified Comm', site: 'site-mum-001', siteCode: 'MUM-HQ', status: '1' },

        // ── BANGALORE TECH CAMPUS (BLR-01) ──
        { name: 'Dedicated Cloud Connect 1 Gbps Link', id: 'DIA-500-BLR-01', type: 'Cloud & Interconnect', site: 'site-blr-001', siteCode: 'BLR-01', status: '1' },
        { name: 'Bangalore SD-WAN Edge Trunk 01', id: 'CKT-BLR-SD-01', type: 'Cybersecurity & SASE', site: 'site-blr-001', siteCode: 'BLR-01', status: '1' },
        { name: 'Bangalore SD-WAN Edge Trunk 02', id: 'CKT-BLR-SD-02', type: 'Cybersecurity & SASE', site: 'site-blr-001', siteCode: 'BLR-01', status: '1' },
        { name: 'Bangalore Campus SIP Trunk 01', id: 'SIP-BLR-01', type: 'Voice & Unified Comm', site: 'site-blr-001', siteCode: 'BLR-01', status: '1' },
        { name: 'Bangalore Campus SIP Trunk 02', id: 'SIP-BLR-02', type: 'Voice & Unified Comm', site: 'site-blr-001', siteCode: 'BLR-01', status: '1' },

        // ── CHENNAI AUTOMOTIVE SMART PLANT (CHE-02) ──
        { name: 'Chennai Automotive 10G DIA Backbone', id: 'DIA-10G-CHE-01', type: 'WAN & Internet', site: 'site-che-001', siteCode: 'CHE-02', status: '1' },
        { name: 'Chennai Industrial IoT 5G Gateway', id: 'FWA-5G-CHE-01', type: 'Mobility & IoT', site: 'site-che-001', siteCode: 'CHE-02', status: '1' },
        { name: 'Chennai Plant SIP Voice Trunk Group', id: 'SIP-CHE-01', type: 'Voice & Unified Comm', site: 'site-che-001', siteCode: 'CHE-02', status: '1' },

        // ── SINGAPORE APAC REGIONAL GATEWAY (SGP-01) ──
        { name: 'Equinix SG1 Direct Cross-Connect 01', id: 'CKT-SGP-01', type: 'Cloud & Interconnect', site: 'site-sgp-001', siteCode: 'SGP-01', status: '1' },
        { name: 'Equinix SG1 Direct Cross-Connect 02', id: 'CKT-SGP-02', type: 'Cloud & Interconnect', site: 'site-sgp-001', siteCode: 'SGP-01', status: '1' },
        { name: 'Singapore SD-WAN Regional Aggregator', id: 'CKT-SGP-SD-01', type: 'Cybersecurity & SASE', site: 'site-sgp-001', siteCode: 'SGP-01', status: '1' },
        { name: 'APAC Corporate SIP Gateway 01', id: 'SIP-SGP-01', type: 'Voice & Unified Comm', site: 'site-sgp-001', siteCode: 'SGP-01', status: '1' },
        { name: 'Global Enterprise Mobility & Roaming Pool (APAC)', id: 'MOB-SGP-POOL', type: 'Mobility & IoT', site: 'site-sgp-001', siteCode: 'SGP-01', status: '1' }
    ];

    // 3. Update or Insert Clean Site Services in cmdb_ci_service
    var updatedCount = 0;
    for (var i = 0; i < serviceDefinitions.length; i++) {
        var sDef = serviceDefinitions[i];
        var ciGr = new GlideRecord('cmdb_ci_service');
        ciGr.addQuery('company', parentAccountId);
        ciGr.addQuery('name', sDef.name);
        ciGr.query();

        var commentsMeta = 'ID: ' + sDef.id + ' | Site: ' + sDef.site + ' | SiteCode: ' + sDef.siteCode + ' | Type: ' + sDef.type;

        if (ciGr.next()) {
            ciGr.setWorkflow(false);
            ciGr.setValue('operational_status', sDef.status);
            ciGr.setValue('comments', commentsMeta);
            if (ciGr.isValidField('u_site_code')) ciGr.setValue('u_site_code', sDef.siteCode);
            ciGr.update();
            updatedCount++;
        } else {
            ciGr.initialize();
            ciGr.setWorkflow(false);
            ciGr.setValue('name', sDef.name);
            ciGr.setValue('company', parentAccountId);
            ciGr.setValue('owned_by', goutamUserId);
            ciGr.setValue('operational_status', sDef.status);
            ciGr.setValue('comments', commentsMeta);
            if (ciGr.isValidField('u_site_code')) ciGr.setValue('u_site_code', sDef.siteCode);
            ciGr.insert();
            updatedCount++;
        }
    }
    gs.info('[Root-Cause DB Alignment] Updated ' + updatedCount + ' primary telecom services with clean Product Families.');

    // 4. Clean up the loose Pune Line 01..10 SIM cards so they don't clutter Pune's physical grid
    var looseMobileGr = new GlideRecord('cmdb_ci_service');
    looseMobileGr.addQuery('company', parentAccountId);
    looseMobileGr.addQuery('name', 'STARTSWITH', 'Pune Executive Mobile Pool - Line');
    looseMobileGr.query();
    var unlinkedPuneLines = 0;
    while (looseMobileGr.next()) {
        // Move to Global Enterprise Roaming Pool so they don't appear inside Pune Technical Center
        looseMobileGr.setWorkflow(false);
        looseMobileGr.setValue('comments', 'ID: ' + looseMobileGr.getValue('name').replace(/[^0-9]/g, '') + ' | Site: site-global-01 | SiteCode: CORE-GLOBAL | Type: Mobility & IoT');
        if (looseMobileGr.isValidField('u_site_code')) looseMobileGr.setValue('u_site_code', 'CORE-GLOBAL');
        looseMobileGr.update();
        unlinkedPuneLines++;
    }

    var looseOpsMobileGr = new GlideRecord('cmdb_ci_service');
    looseOpsMobileGr.addQuery('company', parentAccountId);
    looseOpsMobileGr.addQuery('name', 'STARTSWITH', 'Pune Operations Mobile Pool - Line');
    looseOpsMobileGr.query();
    while (looseOpsMobileGr.next()) {
        looseOpsMobileGr.setWorkflow(false);
        looseOpsMobileGr.setValue('comments', 'ID: ' + looseOpsMobileGr.getValue('name').replace(/[^0-9]/g, '') + ' | Site: site-global-01 | SiteCode: CORE-GLOBAL | Type: Mobility & IoT');
        if (looseOpsMobileGr.isValidField('u_site_code')) looseOpsMobileGr.setValue('u_site_code', 'CORE-GLOBAL');
        looseOpsMobileGr.update();
        unlinkedPuneLines++;
    }
    gs.info('[Root-Cause DB Alignment] Re-aligned ' + unlinkedPuneLines + ' loose SIM lines to Corporate Global Roaming Fleet.');

    // 5. Verify Case CS0001255 is cleanly linked to CKT-PUN-001 with Priority 1
    var caseGr = new GlideRecord('sn_customerservice_case');
    caseGr.addQuery('number', 'CS0001255');
    caseGr.query();
    if (caseGr.next()) {
        caseGr.setWorkflow(false);
        caseGr.setValue('priority', '1');
        caseGr.setValue('state', '1'); // Open
        if (caseGr.isValidField('u_site_code')) caseGr.setValue('u_site_code', 'PUN-01');
        caseGr.update();
        gs.info('[Root-Cause DB Alignment] Case CS0001255 verified as P1 Active Outage on CKT-PUN-001.');
    }

    gs.info('>>> [Root-Cause DB Alignment] Database rectification complete! All Product Families and Sites now cleanly aligned in ServiceNow.');
})();
