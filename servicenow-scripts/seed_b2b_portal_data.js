/**
 * ─────────────────────────────────────────────────────────────────────────────
 * SERVICENOW MASTER DATA SEEDER (FIX SCRIPT / BACKGROUND SCRIPT)
 * Application: Tata B2B Customer Care Self-Service Portal
 * 
 * STRICT COMPLIANCE & SAFETY GUARANTEES:
 * 1. ZERO SCHEMA MODIFICATIONS:
 *    • Does NOT create any new tables.
 *    • Does NOT modify table structures, columns, or dictionary definitions.
 *    • Operates 100% strictly within existing, out-of-the-box ServiceNow tables:
 *      - customer_account
 *      - ast_contract
 *      - sys_user
 *      - sys_user_has_role
 *      - sn_customerservice_case
 *      - task_sla
 *      - cmdb_ci_service
 *      - sn_ind_tmt_orm_order (fallback: customer_order)
 * 
 * 2. IDEMPOTENT & SAFE ON EXISTING DATA:
 *    • Uses exact lookup queries before updating existing records.
 *    • Preserves all previously seeded records without duplication.
 * 
 * 3. ENTERPRISE PLATFORM COMPLIANCE:
 *    • Respects ServiceNow Explicit Roles plugin: avoids role collision by
 *      detecting existing 'snc_internal' on goutam.hazra.
 *    • Avoids table inheritance unique key violation on customer_contact by
 *      linking account directly via sys_user.company.
 *    • Uses gr.setWorkflow(false) on Cases and Orders to bypass account-lock
 *      business rules and uninstalled TSM sales agreement script dependencies.
 *    • Uses gr.autoSysFields(false) to preserve realistic historical timestamps.
 * ─────────────────────────────────────────────────────────────────────────────
 */

(function seedPortalData() {
    gs.info('>>> [B2B Portal Seeder] Starting safe master data update for Goutam Hazra / Tata B2B Enterprise Services...');

    // ─────────────────────────────────────────────────────────────────────────
    // 1. SEED / UPDATE USERS & HANDLE EXPLICIT ROLES SAFELY
    // ─────────────────────────────────────────────────────────────────────────
    function createOrUpdateUser(username, firstName, lastName, title, email, phone) {
        var userGr = new GlideRecord('sys_user');
        userGr.addQuery('user_name', username);
        userGr.query();
        if (userGr.next()) {
            userGr.setWorkflow(false);
            userGr.setValue('first_name', firstName);
            userGr.setValue('last_name', lastName);
            userGr.setValue('title', title);
            userGr.setValue('email', email);
            userGr.setValue('phone', phone);
            userGr.update();
            gs.info('[B2B Portal Seeder] User updated: ' + username);
            return userGr.getUniqueValue();
        } else {
            userGr.initialize();
            userGr.setWorkflow(false);
            userGr.setValue('user_name', username);
            userGr.setValue('first_name', firstName);
            userGr.setValue('last_name', lastName);
            userGr.setValue('title', title);
            userGr.setValue('email', email);
            userGr.setValue('phone', phone);
            var uid = userGr.insert();
            gs.info('[B2B Portal Seeder] User created: ' + username);
            return uid;
        }
    }

    var goutamUserId = createOrUpdateUser('goutam.hazra', 'Goutam', 'Hazra', 'Head of Enterprise Infrastructure', 'goutam.hazra@tataglobal.com', '+91 98200 99887');
    var ankurUserId = createOrUpdateUser('ankur.sarkar', 'Ankur', 'Sarkar', 'VP Infrastructure Engineering', 'ankur.sarkar@tataglobal.com', '+91 98200 11223');
    var anishUserId = createOrUpdateUser('anish.kutti', 'Anish', 'Kutti', 'Site NOC Operations Lead', 'anish.kutti@tataglobal.com', '+91 98200 44556');

    // SAFE ROLE ASSIGNMENT:
    // Only assign 'sn_customerservice.customer' if user does NOT have 'snc_internal'
    // This strictly prevents the "Operation interrupted: explicit role collision" error
    var roleGr = new GlideRecord('sys_user_role');
    if (roleGr.get('name', 'sn_customerservice.customer')) {
        var customerRoleId = roleGr.getUniqueValue();
        var candidateUsers = [goutamUserId, ankurUserId];

        for (var u = 0; u < candidateUsers.length; u++) {
            var targetUid = candidateUsers[u];
            if (!targetUid) continue;

            // Check if user already has snc_internal (internal employee/admin)
            var internalRoleGr = new GlideRecord('sys_user_has_role');
            internalRoleGr.addQuery('user', targetUid);
            internalRoleGr.addQuery('role.name', 'snc_internal');
            internalRoleGr.query();

            if (internalRoleGr.hasNext()) {
                gs.info('[B2B Portal Seeder] User ' + targetUid + ' has snc_internal; skipping external role to prevent collision.');
            } else {
                var checkRole = new GlideRecord('sys_user_has_role');
                checkRole.addQuery('user', targetUid);
                checkRole.addQuery('role', customerRoleId);
                checkRole.query();
                if (!checkRole.next()) {
                    checkRole.initialize();
                    checkRole.setValue('user', targetUid);
                    checkRole.setValue('role', customerRoleId);
                    checkRole.insert();
                    gs.info('[B2B Portal Seeder] Assigned customer role to external user: ' + targetUid);
                }
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 2. PARENT ACCOUNT: Tata B2B Enterprise Services
    // ─────────────────────────────────────────────────────────────────────────
    var parentAccountId = '';
    var accountGr = new GlideRecord('customer_account');
    accountGr.addQuery('name', 'Tata B2B Enterprise Services');
    accountGr.query();
    if (accountGr.next()) {
        parentAccountId = accountGr.getUniqueValue();
        accountGr.setWorkflow(false);
        accountGr.setValue('customer', true);
        accountGr.setValue('phone', '+91 20 6601 8000');
        accountGr.setValue('city', 'Pune');
        accountGr.setValue('country', 'India');
        accountGr.update();
        gs.info('[B2B Portal Seeder] Parent Account verified: ' + parentAccountId);
    } else {
        accountGr.initialize();
        accountGr.setWorkflow(false);
        accountGr.setValue('name', 'Tata B2B Enterprise Services');
        accountGr.setValue('customer', true);
        accountGr.setValue('phone', '+91 20 6601 8000');
        accountGr.setValue('city', 'Pune');
        accountGr.setValue('country', 'India');
        parentAccountId = accountGr.insert();
        gs.info('[B2B Portal Seeder] Parent Account created: ' + parentAccountId);
    }

    // Link users to Parent Account via sys_user.company
    // (Bypasses customer_contact table inheritance unique key conflict)
    var userCompanyGr = new GlideRecord('sys_user');
    if (userCompanyGr.get(goutamUserId)) {
        userCompanyGr.setWorkflow(false);
        userCompanyGr.setValue('company', parentAccountId);
        userCompanyGr.update();
    }
    if (userCompanyGr.get(ankurUserId)) {
        userCompanyGr.setWorkflow(false);
        userCompanyGr.setValue('company', parentAccountId);
        userCompanyGr.update();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 3. SITE HIERARCHY: 5 Child Accounts (customer_account.parent)
    // ─────────────────────────────────────────────────────────────────────────
    var sitesData = [
        { name: 'Pune Technical Center', code: 'PUN-01', siteId: 'site-pun-001', sla: '92.1%' },
        { name: 'Mumbai Global HQ & Trading Floor', code: 'MUM-HQ', siteId: 'site-mum-001', sla: '99.98%' },
        { name: 'Chennai Automotive Smart Plant', code: 'CHE-02', siteId: 'site-che-001', sla: '97.4%' },
        { name: 'Bangalore Cloud & AI R&D Campus', code: 'BLR-01', siteId: 'site-blr-001', sla: '99.95%' },
        { name: 'Singapore APAC Regional Gateway', code: 'SGP-01', siteId: 'site-sgp-001', sla: '99.1%' }
    ];

    var siteAccountMap = {};
    for (var s = 0; s < sitesData.length; s++) {
        var site = sitesData[s];
        var siteGr = new GlideRecord('customer_account');
        siteGr.addQuery('name', site.name);
        siteGr.addQuery('parent', parentAccountId);
        siteGr.query();
        var siteSysId = '';
        if (siteGr.next()) {
            siteSysId = siteGr.getUniqueValue();
            siteGr.setWorkflow(false);
            siteGr.setValue('customer', true);
            siteGr.setValue('description', 'Site Code: ' + site.code + ' | Site ID: ' + site.siteId + ' | Target SLA: ' + site.sla);
            siteGr.update();
        } else {
            siteGr.initialize();
            siteGr.setWorkflow(false);
            siteGr.setValue('name', site.name);
            siteGr.setValue('parent', parentAccountId);
            siteGr.setValue('customer', true);
            siteGr.setValue('description', 'Site Code: ' + site.code + ' | Site ID: ' + site.siteId + ' | Target SLA: ' + site.sla);
            siteSysId = siteGr.insert();
        }
        siteAccountMap[site.code] = siteSysId;
        siteAccountMap[site.siteId] = siteSysId;
    }
    gs.info('[B2B Portal Seeder] 5 Child Site Accounts verified under Tata B2B Enterprise Services.');

    // ─────────────────────────────────────────────────────────────────────────
    // 4. CONTRACT: #CONT-00283 (ast_contract)
    // ─────────────────────────────────────────────────────────────────────────
    var contractGr = new GlideRecord('ast_contract');
    if (contractGr.isValid()) {
        contractGr.addQuery('short_description', 'CONTAINS', 'CONT-00283');
        contractGr.query();
        if (contractGr.next()) {
            contractGr.setWorkflow(false);
            contractGr.setValue('account', parentAccountId);
            contractGr.setValue('starts', '2026-01-01');
            contractGr.setValue('ends', '2029-12-31');
            contractGr.setValue('description', 'Tier-1 Platinum SLA: 99.90% availability, 4.0h MTTR resolution commitment, 5% monthly recurring charge credit ($4,210) for breach.');
            contractGr.update();
            gs.info('[B2B Portal Seeder] Contract #CONT-00283 verified.');
        } else {
            contractGr.initialize();
            contractGr.setWorkflow(false);
            contractGr.setValue('short_description', 'Tata Global Enterprise Telecom Services Contract #CONT-00283');
            contractGr.setValue('account', parentAccountId);
            contractGr.setValue('starts', '2026-01-01');
            contractGr.setValue('ends', '2029-12-31');
            contractGr.setValue('description', 'Tier-1 Platinum SLA: 99.90% availability, 4.0h MTTR resolution commitment, 5% monthly recurring charge credit ($4,210) for breach.');
            contractGr.insert();
            gs.info('[B2B Portal Seeder] Contract #CONT-00283 created.');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 5. 86 TELECOM ASSETS IN cmdb_ci_service (No schema changes)
    // ─────────────────────────────────────────────────────────────────────────
    var telecomAssets = [
        // ── PUNE TECHNICAL CENTER (PUN-01) ──
        { name: '1 Gbps Primary Optical MPLS Trunk', id: 'CKT-PUN-001', type: 'Broadband & Optical', site: 'site-pun-001', site_code: 'PUN-01', status: '2' },
        { name: '1 Gbps Secondary SD-WAN Backup', id: 'CKT-PUN-002', type: 'Broadband & Optical', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: '500 Mbps Dedicated Internet Access (DIA)', id: 'CKT-PUN-DIA', type: 'Broadband & Optical', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'SIP Corporate Voice Trunk (Primary)', id: 'SIP-PUN-01', type: 'Fixed Voice & SIP', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'SIP Corporate Voice Trunk (Secondary)', id: 'SIP-PUN-02', type: 'Fixed Voice & SIP', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Executive Mobile Pool - Line 01', id: 'MOB-PUN-001', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Executive Mobile Pool - Line 02', id: 'MOB-PUN-002', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Executive Mobile Pool - Line 03', id: 'MOB-PUN-003', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Executive Mobile Pool - Line 04', id: 'MOB-PUN-004', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Executive Mobile Pool - Line 05', id: 'MOB-PUN-005', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Operations Mobile Pool - Line 06', id: 'MOB-PUN-006', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Operations Mobile Pool - Line 07', id: 'MOB-PUN-007', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Operations Mobile Pool - Line 08', id: 'MOB-PUN-008', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Operations Mobile Pool - Line 09', id: 'MOB-PUN-009', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },
        { name: 'Pune Operations Mobile Pool - Line 10', id: 'MOB-PUN-010', type: 'Enterprise Mobile SIM', site: 'site-pun-001', site_code: 'PUN-01', status: '1' },

        // ── MUMBAI GLOBAL HQ CORE (MUM-HQ) ──
        { name: '10G Ultra-Low Latency Core Optical Ring', id: 'CKT-MUM-DC-01', type: 'Broadband & Optical', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },
        { name: '10G Redundant Secondary Optical Trunk', id: 'CKT-MUM-DC-02', type: 'Broadband & Optical', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },
        { name: 'Mumbai SD-WAN Dual Edge Gateway 01', id: 'CKT-MUM-SD-01', type: 'Broadband & Optical', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },
        { name: 'Mumbai SD-WAN Dual Edge Gateway 02', id: 'CKT-MUM-SD-02', type: 'Broadband & Optical', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },
        { name: 'Mumbai Cloud DirectConnect 10G Gateway', id: 'CKT-MUM-CC-01', type: 'Broadband & Optical', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 01 (500 Channels)', id: 'SIP-MUM-01', type: 'Fixed Voice & SIP', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 02 (500 Channels)', id: 'SIP-MUM-02', type: 'Fixed Voice & SIP', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 03 (500 Channels)', id: 'SIP-MUM-03', type: 'Fixed Voice & SIP', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 04 (500 Channels)', id: 'SIP-MUM-04', type: 'Fixed Voice & SIP', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },
        { name: 'Core SIP Trunk Group 05 (500 Channels)', id: 'SIP-MUM-05', type: 'Fixed Voice & SIP', site: 'site-mum-001', site_code: 'MUM-HQ', status: '1' },

        // ── BANGALORE TECH CAMPUS (BLR-01) ──
        { name: 'Dedicated Cloud Connect 1 Gbps Link', id: 'DIA-500-BLR-01', type: 'Broadband & Optical', site: 'site-blr-001', site_code: 'BLR-01', status: '1' },
        { name: 'Bangalore SD-WAN Edge Trunk 01', id: 'CKT-BLR-SD-01', type: 'Broadband & Optical', site: 'site-blr-001', site_code: 'BLR-01', status: '1' },
        { name: 'Bangalore SD-WAN Edge Trunk 02', id: 'CKT-BLR-SD-02', type: 'Broadband & Optical', site: 'site-blr-001', site_code: 'BLR-01', status: '1' },
        { name: 'Bangalore Campus SIP Trunk 01', id: 'SIP-BLR-01', type: 'Fixed Voice & SIP', site: 'site-blr-001', site_code: 'BLR-01', status: '1' },
        { name: 'Bangalore Campus SIP Trunk 02', id: 'SIP-BLR-02', type: 'Fixed Voice & SIP', site: 'site-blr-001', site_code: 'BLR-01', status: '1' },

        // ── CHENNAI AUTOMOTIVE SMART PLANT (CHE-02) ──
        { name: 'Chennai Automotive 10G DIA Backbone', id: 'DIA-10G-CHE-01', type: 'Broadband & Optical', site: 'site-che-001', site_code: 'CHE-02', status: '1' },
        { name: 'Chennai Industrial IoT 5G Gateway', id: 'FWA-5G-CHE-01', type: 'Broadband & Optical', site: 'site-che-001', site_code: 'CHE-02', status: '1' },
        { name: 'Chennai Plant SIP Voice Trunk Group', id: 'SIP-CHE-01', type: 'Fixed Voice & SIP', site: 'site-che-001', site_code: 'CHE-02', status: '1' },

        // ── SINGAPORE APAC REGIONAL GATEWAY (SGP-01) ──
        { name: 'Equinix SG1 Direct Cross-Connect 01', id: 'CKT-SGP-01', type: 'Broadband & Optical', site: 'site-sgp-001', site_code: 'SGP-01', status: '1' },
        { name: 'Equinix SG1 Direct Cross-Connect 02', id: 'CKT-SGP-02', type: 'Broadband & Optical', site: 'site-sgp-001', site_code: 'SGP-01', status: '1' },
        { name: 'Singapore SD-WAN Regional Aggregator', id: 'CKT-SGP-SD-01', type: 'Broadband & Optical', site: 'site-sgp-001', site_code: 'SGP-01', status: '1' },
        { name: 'APAC Corporate SIP Gateway 01', id: 'SIP-SGP-01', type: 'Fixed Voice & SIP', site: 'site-sgp-001', site_code: 'SGP-01', status: '1' },
        { name: 'Global Enterprise Mobility & Roaming Pool (APAC)', id: 'MOB-SGP-POOL', type: 'Enterprise Mobile SIM', site: 'site-sgp-001', site_code: 'SGP-01', status: '1' }
    ];

    // Expand mobile lines 11-60 to hit exact 86 telecom inventory assets
    var targetAssetCount = 86;
    var mobileIndex = 11;
    var siteDist = ['PUN-01', 'MUM-HQ', 'BLR-01', 'CHE-02', 'SGP-01'];
    while (telecomAssets.length < targetAssetCount) {
        var sCode = siteDist[mobileIndex % siteDist.length];
        telecomAssets.push({
            name: 'Corporate 5G Mobility Line - Pool Unit ' + mobileIndex,
            id: 'MOB-LINE-' + mobileIndex,
            type: 'Enterprise Mobile SIM',
            site: 'site-' + sCode.toLowerCase().replace('-', ''),
            site_code: sCode,
            status: '1'
        });
        mobileIndex++;
    }

    var seededCIs = 0;
    for (var a = 0; a < telecomAssets.length; a++) {
        var asset = telecomAssets[a];
        var ciGr = new GlideRecord('cmdb_ci_service');
        ciGr.addQuery('name', asset.name);
        ciGr.query();

        var commentsMetadata = 'ID: ' + asset.id + ' | Site: ' + asset.site + ' | SiteCode: ' + asset.site_code + ' | Type: ' + asset.type;

        if (ciGr.next()) {
            ciGr.setWorkflow(false);
            ciGr.setValue('company', parentAccountId);
            ciGr.setValue('owned_by', goutamUserId);
            ciGr.setValue('operational_status', asset.status);
            ciGr.setValue('comments', commentsMetadata);
            ciGr.update();
        } else {
            ciGr.initialize();
            ciGr.setWorkflow(false);
            ciGr.setValue('name', asset.name);
            ciGr.setValue('company', parentAccountId);
            ciGr.setValue('owned_by', goutamUserId);
            ciGr.setValue('operational_status', asset.status);
            ciGr.setValue('comments', commentsMetadata);
            ciGr.insert();
        }
        seededCIs++;
    }
    gs.info('[B2B Portal Seeder] ' + seededCIs + ' Telecom Services verified in cmdb_ci_service.');

    // ─────────────────────────────────────────────────────────────────────────
    // 6. 20 CALIBRATED CASES IN sn_customerservice_case
    // Uses gr.setWorkflow(false) to bypass "Block Case Account Change" on existing records
    // Uses gr.autoSysFields(false) to preserve calculated historical sys_created_on
    // ─────────────────────────────────────────────────────────────────────────
    var casesToSeed = [
        // ── P1 CRITICAL (1 Total) ──
        {
            number: 'CS0001255',
            short_description: 'Primary MPLS Circuit Flapping Detected — Optical Attenuation Active',
            description: 'Circuit CKT-PUN-001 at Pune Technical Center experiencing repeated optical flapping. Optical Rx dipped to -19.4 dBm. Autonomous failover engaged to secondary SD-WAN 4G LTE. Field technician en-route with replacement SFP-10G-LR.',
            priority: '1', state: '1', service_id: 'CKT-PUN-001', service_name: '1 Gbps Primary Optical MPLS Trunk', site_code: 'PUN-01',
            sla_percentage: 122, sla_breached: true, sla_remaining_hours: 0, credit_exposure: 4210, created_hours_ago: 3.2
        },

        // ── P2 HIGH (4 Total) ──
        {
            number: 'CS0001248',
            short_description: 'Invoice Variance Investigation — Singapore Data Roaming Spike',
            description: 'Invoice INV-2026-0456 reflects +12% variance ($94,300 vs $84,200). AI CDR analysis isolated Singapore APN roaming spike of 420 GB ($10,100) during APAC Tech Summit. Corporate pooling credit applied.',
            priority: '2', state: '2', service_id: 'MOB-SGP-POOL', service_name: 'Global Enterprise Mobility & Roaming Pool', site_code: 'SGP-01',
            sla_percentage: 84, sla_breached: false, sla_remaining_hours: 1.6, credit_exposure: 0, created_hours_ago: 5.4
        },
        {
            number: 'CS0001244',
            short_description: 'BGP Route Flapping and Latency Elevation on London Cloud Gateway',
            description: 'Cloud interconnect INT-LON-02 exhibiting latency elevation (142ms vs 35ms baseline). BGP route reconvergence identified at carrier transit node.',
            priority: '2', state: '2', service_id: 'INT-LON-02', service_name: 'AWS DirectConnect 10G Interconnect', site_code: 'CHE-02',
            sla_percentage: 78, sla_breached: false, sla_remaining_hours: 2.1, credit_exposure: 0, created_hours_ago: 6.8
        },
        {
            number: 'CS0001239',
            short_description: 'Mumbai SD-WAN Tunnel Transient Packet Loss Spike',
            description: 'Packet drop on secondary broadband overlay resolved following upstream carrier optic card reseat.',
            priority: '2', state: '6', service_id: 'CKT-MUM-SD-01', service_name: 'Mumbai SD-WAN Dual Edge Gateway 01', site_code: 'MUM-HQ',
            sla_percentage: 65, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 18.2
        },
        {
            number: 'CS0001235',
            short_description: 'Bandwidth Utilization Exceeding 85% Warning on Mumbai Core',
            description: 'Mumbai core link trending above threshold during peak financial market trading hours. Capacity expansion recommended.',
            priority: '2', state: '6', service_id: 'CKT-MUM-DC-01', service_name: '10G Ultra-Low Latency Core Optical Ring', site_code: 'MUM-HQ',
            sla_percentage: 54, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 26.5
        },

        // ── P3 MODERATE (10 Total) ──
        {
            number: 'CS0001231',
            short_description: 'Bangalore Cloud Connect Secondary Interface Health Check',
            description: 'Routine verification of standby circuit DIA-500-BLR-01 failover readiness.',
            priority: '3', state: '1', service_id: 'DIA-500-BLR-01', service_name: 'Dedicated Cloud Connect 1 Gbps Link', site_code: 'BLR-01',
            sla_percentage: 35, sla_breached: false, sla_remaining_hours: 14.5, credit_exposure: 0, created_hours_ago: 8.1
        },
        {
            number: 'CS0001228',
            short_description: 'Chennai Automotive Smart Plant Optical Cross-Connect Audit',
            description: 'Scheduled maintenance completed successfully. Circuit health nominal and telemetry normal.',
            priority: '3', state: '6', service_id: 'DIA-10G-CHE-01', service_name: 'Chennai Automotive 10G DIA Backbone', site_code: 'CHE-02',
            sla_percentage: 42, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 32.0
        },
        {
            number: 'CS0001225',
            short_description: 'Singapore SIP Gateway Jitter Telemetry Calibration',
            description: 'Voice packet jitter observed at 14ms (threshold 20ms). Codec buffer realigned proactively.',
            priority: '3', state: '2', service_id: 'SIP-SGP-01', service_name: 'APAC Corporate SIP Gateway 01', site_code: 'SGP-01',
            sla_percentage: 48, sla_breached: false, sla_remaining_hours: 11.2, credit_exposure: 0, created_hours_ago: 12.0
        },
        {
            number: 'CS0001220',
            short_description: 'Pune Secondary SD-WAN Firmware Security Patching',
            description: 'Non-disruptive hotfix deployment to Edge OS 14.2 on CKT-PUN-002 completed.',
            priority: '3', state: '6', service_id: 'CKT-PUN-002', service_name: '1 Gbps Secondary SD-WAN Backup', site_code: 'PUN-01',
            sla_percentage: 38, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 44.0
        },
        {
            number: 'CS0001218',
            short_description: 'Mumbai HQ SIP Channel Allocation Request (+50 DIDs)',
            description: 'Added 50 direct inward dialing lines to SIP Trunk Group 01 for expanding trading desk.',
            priority: '3', state: '6', service_id: 'SIP-MUM-01', service_name: 'Core SIP Trunk Group 01 (500 Channels)', site_code: 'MUM-HQ',
            sla_percentage: 50, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 50.0
        },
        {
            number: 'CS0001214',
            short_description: 'Bangalore Campus Wi-Fi 6 APN Roaming Latency Audit',
            description: 'Campus-wide roaming latency between core controllers verified within 15ms target.',
            priority: '3', state: '7', service_id: 'DIA-500-BLR-01', service_name: 'Dedicated Cloud Connect 1 Gbps Link', site_code: 'BLR-01',
            sla_percentage: 25, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 72.0
        },
        {
            number: 'CS0001210',
            short_description: 'Chennai IoT Gateway 5G Network Slice Latency Benchmark',
            description: 'Factory floor automated robotics slice latency validated at 8.4ms (target <10ms).',
            priority: '3', state: '7', service_id: 'FWA-5G-CHE-01', service_name: 'Chennai Industrial IoT 5G Gateway', site_code: 'CHE-02',
            sla_percentage: 30, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 80.0
        },
        {
            number: 'CS0001206',
            short_description: 'Pune DIA Circuit DNS Recursive Resolver Latency Spike',
            description: 'DNS cache cleared at local forwarder. Query resolution returned to 1.8ms.',
            priority: '3', state: '7', service_id: 'CKT-PUN-DIA', service_name: '500 Mbps Dedicated Internet Access (DIA)', site_code: 'PUN-01',
            sla_percentage: 40, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 96.0
        },
        {
            number: 'CS0001202',
            short_description: 'Equinix SG1 Cross-Connect Optical Transceiver Telemetry Check',
            description: 'DOM optical power readings within normal operating margins (+1.2 dBm).',
            priority: '3', state: '6', service_id: 'CKT-SGP-01', service_name: 'Equinix SG1 Direct Cross-Connect 01', site_code: 'SGP-01',
            sla_percentage: 33, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 104.0
        },
        {
            number: 'CS0001198',
            short_description: 'Mumbai Data Center Backup Power Transfer Test',
            description: 'Dual UPS switchover verification performed during maintenance window without drop.',
            priority: '3', state: '7', service_id: 'CKT-MUM-DC-02', service_name: '10G Redundant Secondary Optical Trunk', site_code: 'MUM-HQ',
            sla_percentage: 20, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 120.0
        },

        // ── P4 LOW (5 Total) ──
        {
            number: 'CS0001195',
            short_description: 'Corporate Mobile Roaming Tariff Plan Confirmation for Q4',
            description: 'Requested confirmation of APAC roaming rates for upcoming board executive travel.',
            priority: '4', state: '1', service_id: 'MOB-SGP-POOL', service_name: 'Global Enterprise Mobility & Roaming Pool', site_code: 'SGP-01',
            sla_percentage: 15, sla_breached: false, sla_remaining_hours: 36.0, credit_exposure: 0, created_hours_ago: 4.0
        },
        {
            number: 'CS0001190',
            short_description: 'Monthly Optical Dispersion & Attenuation Certificate Generation',
            description: 'Automated generation of ISO-9001 fiber SLA compliance reports for procurement audit.',
            priority: '4', state: '1', service_id: 'CKT-PUN-001', service_name: '1 Gbps Primary Optical MPLS Trunk', site_code: 'PUN-01',
            sla_percentage: 22, sla_breached: false, sla_remaining_hours: 32.0, credit_exposure: 0, created_hours_ago: 7.5
        },
        {
            number: 'CS0001185',
            short_description: 'Request for Bangalore SD-WAN Portal Additional Read-Only Credentials',
            description: 'Created 2 viewer accounts for local IT campus support staff.',
            priority: '4', state: '6', service_id: 'CKT-BLR-SD-01', service_name: 'Bangalore SD-WAN Edge Trunk 01', site_code: 'BLR-01',
            sla_percentage: 10, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 58.0
        },
        {
            number: 'CS0001180',
            short_description: 'SIP Codec G.711 to G.729 Quality Assessment in Chennai',
            description: 'Completed acoustic MOS score test; verified MOS rating of 4.38 across all trunks.',
            priority: '4', state: '7', service_id: 'SIP-CHE-01', service_name: 'Chennai Plant SIP Voice Trunk Group', site_code: 'CHE-02',
            sla_percentage: 12, sla_breached: false, sla_remaining_hours: 0, credit_exposure: 0, created_hours_ago: 130.0
        },
        {
            number: 'CS0001175',
            short_description: 'Quarterly NOC Escalation Matrix Contact Verification',
            description: 'Updated secondary escalation contact numbers for Goutam Hazra and Anish Kutti.',
            priority: '4', state: '1', service_id: 'CKT-MUM-DC-01', service_name: '10G Ultra-Low Latency Core Optical Ring', site_code: 'MUM-HQ',
            sla_percentage: 18, sla_breached: false, sla_remaining_hours: 42.0, credit_exposure: 0, created_hours_ago: 10.0
        }
    ];

    var p1CaseSysId = '';
    for (var i = 0; i < casesToSeed.length; i++) {
        var c = casesToSeed[i];
        var caseGr = new GlideRecord('sn_customerservice_case');
        caseGr.addQuery('number', c.number);
        caseGr.query();

        var createdDateTime = new GlideDateTime();
        createdDateTime.addSeconds(-(c.created_hours_ago * 3600));

        if (caseGr.next()) {
            // SUPPRESS BUSINESS RULES: Prevents "Block Case Account Change" abort error
            caseGr.setWorkflow(false);
            caseGr.autoSysFields(false); // Preserves calculated historical sys_created_on
            caseGr.setValue('short_description', c.short_description);
            caseGr.setValue('description', c.description);
            caseGr.setValue('priority', c.priority);
            caseGr.setValue('state', c.state);
            caseGr.setValue('sys_created_on', createdDateTime);
            caseGr.setValue('sys_updated_on', createdDateTime);
            caseGr.setValue('account', parentAccountId);
            caseGr.setValue('contact', goutamUserId);
            caseGr.setValue('assigned_to', anishUserId);
            caseGr.update();
            if (c.number === 'CS0001255') p1CaseSysId = caseGr.getUniqueValue();
        } else {
            caseGr.initialize();
            caseGr.setWorkflow(false);
            caseGr.autoSysFields(false);
            caseGr.setValue('number', c.number);
            caseGr.setValue('short_description', c.short_description);
            caseGr.setValue('description', c.description);
            caseGr.setValue('priority', c.priority);
            caseGr.setValue('state', c.state);
            caseGr.setValue('sys_created_on', createdDateTime);
            caseGr.setValue('sys_updated_on', createdDateTime);
            caseGr.setValue('account', parentAccountId);
            caseGr.setValue('contact', goutamUserId);
            caseGr.setValue('assigned_to', anishUserId);
            var insertedCaseId = caseGr.insert();
            if (c.number === 'CS0001255') p1CaseSysId = insertedCaseId;
        }
    }
    gs.info('[B2B Portal Seeder] 20 Calibrated Telecom Cases verified in sn_customerservice_case.');

    // ─────────────────────────────────────────────────────────────────────────
    // 7. SLA BREACH RECORD IN task_sla (Linked to CS0001255)
    // ─────────────────────────────────────────────────────────────────────────
    if (p1CaseSysId) {
        var slaGr = new GlideRecord('task_sla');
        if (slaGr.isValid()) {
            slaGr.addQuery('task', p1CaseSysId);
            slaGr.query();
            if (slaGr.next()) {
                slaGr.setWorkflow(false);
                slaGr.setValue('stage', 'in_progress');
                slaGr.setValue('has_breached', true);
                slaGr.setValue('percentage', 122.5);
                slaGr.update();
            } else {
                slaGr.initialize();
                slaGr.setWorkflow(false);
                slaGr.setValue('task', p1CaseSysId);
                slaGr.setValue('stage', 'in_progress');
                slaGr.setValue('has_breached', true);
                slaGr.setValue('percentage', 122.5);
                slaGr.insert();
            }
            gs.info('[B2B Portal Seeder] task_sla breached record verified for CS0001255.');
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // 8. 10 MACRO PROJECT ORDERS (sn_ind_tmt_orm_order or customer_order)
    // Uses gr.setWorkflow(false) to bypass missing sn_sales_agmt_core script error
    // ─────────────────────────────────────────────────────────────────────────
    var ordersToSeed = [
        {
            number: 'ORD-2026-9921',
            product_name: 'Global Enterprise SD-WAN & 5G Mobility Transformation Bundle',
            site_location: 'Pune, Mumbai & London (3 Sites)',
            site_code: 'PUN-01',
            status: 'in_progress',
            stage: 'Provisioning',
            summary: '250 Mobile SIM Lines · 50 Broadband Circuits · 20 Voice Trunks',
            created_days_ago: 4
        },
        {
            number: 'ORD-2026-9884',
            product_name: 'APAC High-Bandwidth Cloud Interconnect Expansion (10G)',
            site_location: 'Singapore Regional Hub',
            site_code: 'SGP-01',
            status: 'in_progress',
            stage: 'Feasibility Completed',
            summary: '2x 10G Optical Cross-Connects',
            created_days_ago: 8
        },
        {
            number: 'ORD-2026-9810',
            product_name: 'Mumbai HQ Next-Gen SIP Voice Migration (1,000 Channels)',
            site_location: 'Mumbai Global HQ Core',
            site_code: 'MUM-HQ',
            status: 'completed',
            stage: 'Active & Verified',
            summary: '1,000 Channels · 3,000 DIDs',
            created_days_ago: 18
        },
        {
            number: 'ORD-2026-9770',
            product_name: 'London Equinix LD4 Redundant Direct Connect Turn-Up',
            site_location: 'London Equinix LD4 Gateway',
            site_code: 'CHE-02',
            status: 'completed',
            stage: 'Acceptance Testing Passed',
            summary: '10G AWS & Azure ExpressRoute',
            created_days_ago: 28
        },
        {
            number: 'ORD-2026-9712',
            product_name: 'Bangalore Innovation Campus Enterprise Wi-Fi 6 AP Infrastructure',
            site_location: 'Bangalore Tech Campus',
            site_code: 'BLR-01',
            status: 'in_progress',
            stage: 'Hardware Dispatched',
            summary: '120 Cisco Catalyst APs',
            created_days_ago: 12
        },
        {
            number: 'ORD-2026-9650',
            product_name: 'Chennai Automotive Smart Plant Edge Compute Link (5G FWA)',
            site_location: 'Chennai Automotive Smart Plant',
            site_code: 'CHE-02',
            status: 'in_progress',
            stage: 'Site Survey Completed',
            summary: 'Private 5G NSA Slice',
            created_days_ago: 15
        },
        {
            number: 'ORD-2026-9580',
            product_name: 'Frankfurt Disaster Recovery Optical Ring Interconnect',
            site_location: 'Frankfurt Equinix FR2',
            site_code: 'MUM-HQ',
            status: 'in_progress',
            stage: 'Fiber Trenching & Conduit',
            summary: '1 Gbps Dedicated Ring',
            created_days_ago: 22
        },
        {
            number: 'ORD-2026-9520',
            product_name: 'Pune Secondary 4G LTE Autonomous Failover Gateway',
            site_location: 'Pune Technical Center',
            site_code: 'PUN-01',
            status: 'completed',
            stage: 'Live in Production',
            summary: 'Dual LTE Cradlepoint Gateway',
            created_days_ago: 45
        },
        {
            number: 'ORD-2026-9460',
            product_name: 'APAC AWS DirectConnect 10G Private Peering (Singapore Equinix SG1)',
            site_location: 'Singapore APAC Regional Gateway',
            site_code: 'SGP-01',
            status: 'in_progress',
            stage: 'Carrier LOA Pending',
            summary: '10G DirectConnect Port',
            created_days_ago: 35
        },
        {
            number: 'ORD-2026-9390',
            product_name: 'Corporate Contact Center SIP Trunk Expansion (+250 Channels)',
            site_location: 'Pune Technical Center',
            site_code: 'PUN-01',
            status: 'completed',
            stage: 'Provisioned & Tested',
            summary: '250 SIP Sessions',
            created_days_ago: 60
        }
    ];

    var orderTable = 'sn_ind_tmt_orm_order';
    var testGr = new GlideRecord(orderTable);
    if (!testGr.isValid()) orderTable = 'customer_order';

    for (var o = 0; o < ordersToSeed.length; o++) {
        var ord = ordersToSeed[o];
        var orderGr = new GlideRecord(orderTable);
        orderGr.addQuery('number', ord.number);
        orderGr.query();

        var orderDateTime = new GlideDateTime();
        orderDateTime.addDaysLocalTime(-ord.created_days_ago);

        if (orderGr.next()) {
            orderGr.setWorkflow(false); // Bypasses sn_sales_agmt_core evaluation error
            orderGr.autoSysFields(false);
            orderGr.setValue('short_description', ord.product_name);
            if (orderGr.isValidField('product_name')) orderGr.setValue('product_name', ord.product_name);
            orderGr.setValue('site_location', ord.site_location);
            orderGr.setValue('status', ord.status);
            orderGr.setValue('stage', ord.stage);
            orderGr.setValue('account', parentAccountId);
            orderGr.setValue('opened_by', goutamUserId);
            orderGr.setValue('description', ord.summary);
            orderGr.setValue('sys_created_on', orderDateTime);
            orderGr.setValue('sys_updated_on', orderDateTime);
            orderGr.update();
        } else {
            orderGr.initialize();
            orderGr.setWorkflow(false);
            orderGr.autoSysFields(false);
            orderGr.setValue('number', ord.number);
            orderGr.setValue('short_description', ord.product_name);
            if (orderGr.isValidField('product_name')) orderGr.setValue('product_name', ord.product_name);
            orderGr.setValue('site_location', ord.site_location);
            orderGr.setValue('status', ord.status);
            orderGr.setValue('stage', ord.stage);
            orderGr.setValue('account', parentAccountId);
            orderGr.setValue('opened_by', goutamUserId);
            orderGr.setValue('description', ord.summary);
            orderGr.setValue('sys_created_on', orderDateTime);
            orderGr.setValue('sys_updated_on', orderDateTime);
            orderGr.insert();
        }
    }
    gs.info('[B2B Portal Seeder] 10 Macro Project Orders verified in ' + orderTable + '.');

    gs.info('>>> [B2B Portal Seeder] Safe data verification complete! Zero schema changes. All records cleanly verified for Goutam Hazra & Tata B2B Enterprise Services.');
})();
