(function processServices(request, response) {
    try {
        var userName = (request.queryParams && request.queryParams.user_name) ? String(request.queryParams.user_name) : (gs.getUserName() !== 'guest' ? gs.getUserName() : '');
        var accountId = '';

        if (userName) {
            var userGr = new GlideRecord('sys_user');
            userGr.addQuery('user_name', userName);
            userGr.setLimit(1);
            userGr.query();
            if (userGr.next()) {
                if (userGr.company) accountId = userGr.getValue('company');
                else {
                    var cGr = new GlideRecord('customer_contact');
                    if (cGr.get(userGr.getUniqueValue()) && cGr.account) {
                        accountId = cGr.getValue('account');
                    }
                }
            }
        }

        if (!accountId) {
            var accGr = new GlideRecord('customer_account');
            accGr.addQuery('name', 'Tata B2B Enterprise Services');
            accGr.setLimit(1);
            accGr.query();
            if (accGr.next()) {
                accountId = accGr.getUniqueValue();
            }
        }

        // Query all active cases to dynamically match degraded circuits
        var activeCasesByCkt = {};
        var activeCasesBySpId = {};
        var activeCaseGr = new GlideRecord('sn_customerservice_case');
        activeCaseGr.addActiveQuery();
        if (accountId) activeCaseGr.addQuery('account', accountId);
        activeCaseGr.query();
        while (activeCaseGr.next()) {
            var cNum = activeCaseGr.getValue('number');
            var pVal = activeCaseGr.getValue('priority') || '3';
            var spVal = activeCaseGr.isValidField('sold_product') ? activeCaseGr.getValue('sold_product') : '';
            if (spVal) {
                activeCasesBySpId[spVal] = { number: cNum, priority: pVal };
            }

            var ciTag = activeCaseGr.cmdb_ci ? (activeCaseGr.cmdb_ci.getValue('asset_tag') || activeCaseGr.cmdb_ci.getValue('name')) : '';
            var assetTag = activeCaseGr.asset ? activeCaseGr.asset.getValue('asset_tag') : '';
            var descText = (activeCaseGr.getValue('short_description') || '') + ' ' + (activeCaseGr.getValue('description') || '');

            if (ciTag) activeCasesByCkt[ciTag.toUpperCase()] = { number: cNum, priority: pVal };
            if (assetTag) activeCasesByCkt[assetTag.toUpperCase()] = { number: cNum, priority: pVal };

            var cktMatches = descText.match(/CKT-[A-Z0-9-]+|DIA-[A-Z0-9-]+|SIP-[A-Z0-9-]+|MOB-[A-Z0-9-]+/ig);
            if (cktMatches) {
                for (var m = 0; m < cktMatches.length; m++) {
                    activeCasesByCkt[cktMatches[m].toUpperCase()] = { number: cNum, priority: pVal };
                }
            }
        }

        var services = [];
        var siteParam = (request.queryParams && (request.queryParams.site || request.queryParams.site_code)) ? String(request.queryParams.site || request.queryParams.site_code).toUpperCase() : '';

        // TSM Module Core Table: sn_install_base_sold_product
        var spGr = new GlideRecord('sn_install_base_sold_product');
        if (accountId) {
            spGr.addQuery('account', accountId);
        }
        spGr.orderBy('number');
        spGr.query();

        while (spGr.next()) {
            var spSysId = spGr.getUniqueValue();
            var serviceId = spGr.getValue('number') || '';
            var serviceName = spGr.getValue('name') || '';
            var locationName = spGr.product_location ? spGr.product_location.getDisplayValue() : '';
            var stateVal = spGr.getValue('state') || 'installed';

            // Resolve Site Code & Site Name
            var siteCode = 'GEN-01';
            var sUpper = (serviceId + ' ' + serviceName + ' ' + locationName).toUpperCase();
            if (sUpper.indexOf('BLR') !== -1 || sUpper.indexOf('BANGALORE') !== -1) {
                siteCode = 'BLR-01';
                if (!locationName) locationName = 'Bangalore Cloud & AI R&D Campus';
            } else if (sUpper.indexOf('CHE') !== -1 || sUpper.indexOf('CHENNAI') !== -1) {
                siteCode = 'CHE-02';
                if (!locationName) locationName = 'Chennai Automotive Smart Plant';
            } else if (sUpper.indexOf('MUM') !== -1 || sUpper.indexOf('MUMBAI') !== -1) {
                siteCode = 'MUM-HQ';
                if (!locationName) locationName = 'Mumbai Global HQ & Trading Floor';
            } else if (sUpper.indexOf('SGP') !== -1 || sUpper.indexOf('SINGAPORE') !== -1) {
                siteCode = 'SGP-01';
                if (!locationName) locationName = 'Singapore APAC Regional Gateway';
            } else {
                siteCode = 'PUN-01';
                if (!locationName) locationName = 'Pune Technical Center';
            }

            if (siteParam && siteCode !== siteParam && sUpper.indexOf(siteParam) === -1) {
                continue;
            }

            // Categorize cleanly into TSM Telecom Domains
            var assetType = 'Core WAN & Circuits';
            var prodFamily = 'WAN & Internet';
            var throughput = '1 Gbps';
            var demarc = 'Cisco ASR 9001 PE';

            if (serviceId.indexOf('MOB-') === 0 || serviceName.toLowerCase().indexOf('sim') !== -1) {
                assetType = 'Mobile Fleet & SIMs';
                prodFamily = 'Mobility & IoT';
                throughput = '5G Ultra';
                demarc = 'Cisco Industrial 5G Gateway';
            } else if (serviceId.indexOf('SIP-') === 0 || serviceName.toLowerCase().indexOf('sip') !== -1 || serviceName.toLowerCase().indexOf('voice') !== -1) {
                assetType = 'Voice & SIP Trunks';
                prodFamily = 'Voice & Unified Comm';
                throughput = serviceName.indexOf('500 Channels') !== -1 ? '500 Channels' : (serviceName.indexOf('200 Channels') !== -1 ? '200 Channels' : (serviceName.indexOf('150 Channels') !== -1 ? '150 Channels' : '100 Channels'));
                demarc = 'AudioCodes Mediant 1000B SBC';
            } else if (serviceId.indexOf('DIA-') === 0 || serviceName.toLowerCase().indexOf('dia') !== -1 || serviceName.toLowerCase().indexOf('dedicated internet') !== -1 || serviceName.toLowerCase().indexOf('directconnect') !== -1 || serviceName.toLowerCase().indexOf('cross-connect') !== -1) {
                assetType = 'Fiber Broadband';
                prodFamily = serviceName.toLowerCase().indexOf('directconnect') !== -1 || serviceName.toLowerCase().indexOf('cross-connect') !== -1 ? 'Cloud & Interconnect' : 'Broadband & Optical';
                throughput = serviceName.indexOf('10G') !== -1 ? '10 Gbps' : (serviceName.indexOf('500 Mbps') !== -1 ? '500 Mbps' : '1 Gbps');
                demarc = 'Adtran SDX 6320 Optical ONT';
            } else {
                assetType = 'Core WAN & Circuits';
                prodFamily = serviceName.toLowerCase().indexOf('ultra-low latency') !== -1 ? 'Cloud & Interconnect' : 'WAN & Internet';
                throughput = serviceName.indexOf('10G') !== -1 ? '10 Gbps' : (serviceName.indexOf('2 Gbps') !== -1 ? '2 Gbps' : (serviceName.indexOf('500 Mbps') !== -1 ? '500 Mbps' : '1 Gbps'));
                demarc = 'Cisco ASR 9001 PE';
            }

            // Dynamically evaluate active case status for this sold product
            var matchingCase = activeCasesBySpId[spSysId] || activeCasesByCkt[serviceId.toUpperCase()];
            var statusStr = 'Operational';
            var activeCaseNum = null;
            if (matchingCase) {
                statusStr = (matchingCase.priority === '1') ? 'Critical' : 'Degraded';
                activeCaseNum = matchingCase.number;
            }

            services.push({
                sys_id: spSysId,
                service_id: serviceId,
                number: serviceId,
                name: serviceName,
                site_code: siteCode,
                site_name: locationName,
                location: locationName,
                category: assetType,
                product_family: prodFamily,
                status: statusStr,
                active_case: activeCaseNum,
                bandwidth: throughput,
                throughput: throughput,
                demarcation: demarc,
                telemetry: {
                    latency_ms: (statusStr === 'Critical' || statusStr === 'Degraded') ? 48 : 14,
                    packet_loss_pct: (statusStr === 'Critical') ? 14.8 : (statusStr === 'Degraded') ? 1.4 : 0.0,
                    availability_30d_pct: (statusStr === 'Critical' || statusStr === 'Degraded') ? 92.1 : 99.98
                },
                tsm_table: 'sn_install_base_sold_product',
                _source: 'tsm_database'
            });
        }

        services.sort(function(a, b) {
            var pOrder = { 'Critical': 0, 'Degraded': 1, 'Operational': 2, 'Maintenance': 3 };
            var pA = pOrder[a.status] !== undefined ? pOrder[a.status] : 2;
            var pB = pOrder[b.status] !== undefined ? pOrder[b.status] : 2;
            if (pA !== pB) return pA - pB;
            var fOrder = { 'Core WAN & Circuits': 0, 'Fiber Broadband': 1, 'Voice & SIP Trunks': 2, 'Mobile Fleet & SIMs': 3 };
            var fA = fOrder[a.category] !== undefined ? fOrder[a.category] : 4;
            var fB = fOrder[b.category] !== undefined ? fOrder[b.category] : 4;
            if (fA !== fB) return fA - fB;
            return (a.name || '').localeCompare(b.name || '');
        });

        response.setBody({ result: services, total_count: services.length, tsm_module: true, _source: 'tsm_database' });
    } catch (e) {
        gs.error('[B2B Portal API /services Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);
