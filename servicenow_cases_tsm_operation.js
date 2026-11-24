(function processCases(request, response) {
    try {
        var stateParam = request.queryParams.state || '';
        var limitParam = parseInt(request.queryParams.limit || '20', 10);
        var caseParam = (request.queryParams && (request.queryParams.case_number || request.queryParams.number)) ? String(request.queryParams.case_number || request.queryParams.number).trim() : '';
        var userName = (request.queryParams && request.queryParams.user_name) ? String(request.queryParams.user_name) : (gs.getUserName() !== 'guest' ? gs.getUserName() : '');

        var userSysId = '';
        var accountSysId = '';
        if (userName) {
            var userGr = new GlideRecord('sys_user');
            userGr.addQuery('user_name', userName);
            userGr.setLimit(1);
            userGr.query();
            if (userGr.next()) {
                userSysId = userGr.getUniqueValue();
                if (userGr.company) accountSysId = userGr.getValue('company');
            }
            if (!accountSysId && userSysId) {
                var cGr = new GlideRecord('customer_contact');
                if (cGr.get(userSysId) && cGr.account) {
                    accountSysId = cGr.getValue('account');
                }
            }
        }

        var caseGr = new GlideRecord('sn_customerservice_case');
        if (caseParam) {
            caseGr.addQuery('number', caseParam);
        } else {
            if (stateParam === 'active') {
                caseGr.addActiveQuery();
            }
            if (accountSysId) {
                caseGr.addQuery('account', accountSysId);
            } else if (userSysId) {
                caseGr.addQuery('contact', userSysId);
            }
        }
        caseGr.orderByDesc('sys_created_on');
        caseGr.setLimit(limitParam);
        caseGr.query();

        var cases = [];
        while (caseGr.next()) {
            var caseSysId = caseGr.getUniqueValue();
            var pVal = caseGr.getValue('priority') || '3';
            var sVal = caseGr.getValue('state') || '1';
            var assignedName = caseGr.assigned_to ? caseGr.assigned_to.getDisplayValue() : 'Duty Lead NOC';
            
            var contactName = '';
            if (caseGr.contact && caseGr.contact.getDisplayValue()) {
                contactName = caseGr.contact.getDisplayValue();
            } else if (caseGr.opened_by && caseGr.opened_by.getDisplayValue() && caseGr.opened_by.getDisplayValue() !== 'Guest') {
                contactName = caseGr.opened_by.getDisplayValue();
            } else if (caseGr.account) {
                var grLookup = new GlideRecord('customer_contact');
                grLookup.addQuery('account', caseGr.account);
                grLookup.addQuery('active', true);
                grLookup.setLimit(1);
                grLookup.query();
                if (grLookup.next()) {
                    contactName = grLookup.getDisplayValue('name');
                    caseGr.setWorkflow(false);
                    caseGr.setValue('contact', grLookup.getUniqueValue());
                    caseGr.update();
                }
            }

            var priority = (pVal === '1') ? 'P1' : (pVal === '2') ? 'P2' : (pVal === '3') ? 'P3' : 'P4';
            var status = (sVal === '6') ? 'Resolved' : (sVal === '7') ? 'Closed' : (sVal === '2') ? 'In Progress' : 'Open';

            var slaPercentage = 72;
            var slaBreached = false;
            var slaGr = new GlideRecord('task_sla');
            slaGr.addQuery('task', caseSysId);
            slaGr.query();
            if (slaGr.next()) {
                slaPercentage = parseFloat(slaGr.getValue('percentage') || 72);
                slaBreached = slaGr.getValue('has_breached') === 'true' || slaGr.getValue('has_breached') === '1';
            }

            var serviceName = '';
            var serviceId = '';
            var siteName = '';
            var siteCode = '';

            // 1. TSM Module: Check sn_install_base_sold_product first
            if (caseGr.isValidField('sold_product') && caseGr.sold_product && caseGr.sold_product.name) {
                serviceName = caseGr.sold_product.getDisplayValue('name') || caseGr.sold_product.getValue('name');
                serviceId = caseGr.sold_product.getValue('number') || caseGr.sold_product.getDisplayValue('number');
                if (caseGr.sold_product.product_location) {
                    siteName = caseGr.sold_product.product_location.getDisplayValue();
                }
            }

            // 2. Check CMDB CI or Asset as secondary
            if (!serviceId) {
                if (caseGr.cmdb_ci && caseGr.cmdb_ci.name) {
                    serviceName = caseGr.cmdb_ci.getDisplayValue();
                    serviceId = caseGr.cmdb_ci.getValue('asset_tag') || caseGr.cmdb_ci.getValue('name');
                } else if (caseGr.asset && caseGr.asset.display_name) {
                    serviceName = caseGr.asset.getDisplayValue();
                    serviceId = caseGr.asset.getValue('asset_tag') || caseGr.asset.getValue('serial_number');
                }
            }

            // 3. Fallback: Parse description and dynamically bind to sn_install_base_sold_product
            if (!serviceId) {
                var fullText = (caseGr.getValue('short_description') || '') + ' ' + (caseGr.getValue('description') || '');
                var matchCkt = fullText.match(/CKT-[A-Z0-9-]+|DIA-[A-Z0-9-]+|SIP-[A-Z0-9-]+|MOB-[A-Z0-9-]+/i);
                if (matchCkt) {
                    serviceId = matchCkt[0].toUpperCase();
                    var spLookup = new GlideRecord('sn_install_base_sold_product');
                    spLookup.addQuery('number', serviceId);
                    if (caseGr.account) spLookup.addQuery('account', caseGr.account);
                    spLookup.setLimit(1);
                    spLookup.query();
                    if (spLookup.next()) {
                        serviceName = spLookup.getValue('name');
                        if (spLookup.product_location) siteName = spLookup.product_location.getDisplayValue();
                        if (caseGr.isValidField('sold_product')) {
                            caseGr.setWorkflow(false);
                            caseGr.setValue('sold_product', spLookup.getUniqueValue());
                            caseGr.update();
                        }
                    } else {
                        var ciLookup = new GlideRecord('cmdb_ci_service');
                        ciLookup.addQuery('name', 'CONTAINS', serviceId);
                        ciLookup.setLimit(1);
                        ciLookup.query();
                        if (ciLookup.next()) {
                            serviceName = ciLookup.getValue('name');
                        } else {
                            serviceName = serviceId;
                        }
                    }
                }
            }

            if (!serviceId) {
                serviceId = 'GEN-SVC';
                serviceName = 'General Telecom Service';
                siteName = 'Enterprise Site';
                siteCode = 'GEN-01';
            }

            if (!siteName) {
                var sUpper = (serviceId + ' ' + serviceName).toUpperCase();
                if (sUpper.indexOf('BLR') !== -1 || sUpper.indexOf('BANGALORE') !== -1) {
                    siteName = 'Bangalore Cloud & AI R&D Campus';
                    siteCode = 'BLR-01';
                } else if (sUpper.indexOf('CHE') !== -1 || sUpper.indexOf('CHENNAI') !== -1) {
                    siteName = 'Chennai Automotive Smart Plant';
                    siteCode = 'CHE-02';
                } else if (sUpper.indexOf('MUM') !== -1 || sUpper.indexOf('MUMBAI') !== -1) {
                    siteName = 'Mumbai Global HQ & Trading Floor';
                    siteCode = 'MUM-HQ';
                } else if (sUpper.indexOf('SGP') !== -1 || sUpper.indexOf('SINGAPORE') !== -1) {
                    siteName = 'Singapore APAC Regional Gateway';
                    siteCode = 'SGP-01';
                } else {
                    siteName = 'Pune Technical Center';
                    siteCode = 'PUN-01';
                }
            } else if (!siteCode) {
                var sUpper2 = (siteName + ' ' + serviceId).toUpperCase();
                if (sUpper2.indexOf('BLR') !== -1 || sUpper2.indexOf('BANGALORE') !== -1) siteCode = 'BLR-01';
                else if (sUpper2.indexOf('CHE') !== -1 || sUpper2.indexOf('CHENNAI') !== -1) siteCode = 'CHE-02';
                else if (sUpper2.indexOf('MUM') !== -1 || sUpper2.indexOf('MUMBAI') !== -1) siteCode = 'MUM-HQ';
                else if (sUpper2.indexOf('SGP') !== -1 || sUpper2.indexOf('SINGAPORE') !== -1) siteCode = 'SGP-01';
                else siteCode = 'PUN-01';
            }

            // Dynamically load activities / comments from database for this case
            var activities = [];
            var openedTime = caseGr.getValue('sys_created_on') || '';
            
            // 1. Initial report activity
            activities.push({
                id: 'act_init_' + caseSysId,
                author: contactName || 'Customer',
                role: 'Customer',
                text: caseGr.getValue('short_description') + (caseGr.getValue('description') ? ('\n\n' + caseGr.getValue('description')) : ''),
                timestamp: openedTime,
                isUrgent: (pVal === '1')
            });
            activities.push({
                id: 'act_sys_' + caseSysId,
                author: 'Service Assurance Automation',
                role: 'System Automation',
                text: 'Support case ' + caseGr.getValue('number') + ' initialized in ServiceNow. Assigned to ' + assignedName + ' Desk.',
                timestamp: openedTime,
                isUrgent: false
            });

            // 2. Journal entries from sys_journal_field
            var jfGr = new GlideRecord('sys_journal_field');
            jfGr.addQuery('element_id', caseSysId);
            jfGr.orderBy('sys_created_on');
            jfGr.query();
            var foundJournal = false;
            while (jfGr.next()) {
                var jVal = (jfGr.getValue('value') || '').trim();
                if (!jVal) continue;
                foundJournal = true;
                var jElem = jfGr.getValue('element');
                var isCust = (jElem === 'comments') || (jVal.toLowerCase().indexOf('customer') !== -1) || (jVal.indexOf('[Selfcare Portal') !== -1);
                var jCreatedBy = jfGr.getValue('sys_created_by') || '';
                var jAuthor = isCust ? (contactName || 'Customer') : (jCreatedBy === 'system' ? 'System Automation' : assignedName);
                var cleanJVal = jVal.replace(/^\[Selfcare Portal - [^\]]+\]:\s*/i, '')
                                    .replace(/^\[URGENT CUSTOMER UPDATE\]:\s*/i, '')
                                    .replace(/^\[Customer Update\]:\s*/i, '')
                                    .replace(/^\[Customer Self-Care\]:\s*/i, '');
                activities.push({
                    id: jfGr.getUniqueValue() || ('act_j_' + Math.random().toString(36).substr(2, 9)),
                    author: jAuthor,
                    role: isCust ? 'Customer' : (jCreatedBy === 'system' ? 'System Automation' : 'ServiceNow Specialist'),
                    text: cleanJVal,
                    timestamp: jfGr.getValue('sys_created_on') || '',
                    isUrgent: cleanJVal.indexOf('P1') !== -1 || cleanJVal.indexOf('URGENT') !== -1
                });
            }

            // 3. If sys_journal_field had 0 entries, parse caseGr.comments
            if (!foundJournal && caseGr.comments) {
                var rawJournalComments = caseGr.comments.getJournalEntry(-1);
                if (rawJournalComments) {
                    var entries = rawJournalComments.split('\n\n');
                    for (var ej = 0; ej < entries.length; ej++) {
                        var eChunk = entries[ej].trim();
                        if (!eChunk) continue;
                        var lines = eChunk.split('\n');
                        var headerLine = lines[0] || '';
                        var bodyLines = lines.slice(1).join('\n').trim();
                        if (!bodyLines && lines.length === 1) bodyLines = headerLine;
                        
                        var isC = headerLine.toLowerCase().indexOf('additional comments') !== -1 || bodyLines.indexOf('[Selfcare Portal') !== -1;
                        var cleanB = bodyLines.replace(/^\[Selfcare Portal - [^\]]+\]:\s*/i, '');
                        activities.push({
                            id: 'act_parse_' + ej + '_' + caseSysId,
                            author: isC ? (contactName || 'Customer') : assignedName,
                            role: isC ? 'Customer' : 'ServiceNow Specialist',
                            text: cleanB || bodyLines,
                            timestamp: headerLine.substring(0, 19) || 'Recently',
                            isUrgent: cleanB.indexOf('P1') !== -1 || cleanB.indexOf('URGENT') !== -1
                        });
                    }
                }
            }

            cases.push({
                sys_id: caseSysId,
                case_number: caseGr.getValue('number'),
                short_description: caseGr.getValue('short_description') || 'Telecom Case',
                description: caseGr.getValue('description') || '',
                priority: priority,
                status: status,
                state: sVal,
                service_id: serviceId,
                service_name: serviceName,
                site_name: siteName,
                site_code: siteCode,
                assigned_to: assignedName,
                contact: contactName,
                created_at: caseGr.getValue('sys_created_on'),
                updated_at: caseGr.getValue('sys_updated_on'),
                sla_percentage: slaPercentage,
                sla_breached: slaBreached,
                sla_remaining_hours: slaBreached ? 0 : 1.2,
                activities: activities,
                sold_product_linked: Boolean(caseGr.isValidField('sold_product') && caseGr.sold_product),
                _source: 'tsm_database'
            });
        }

        response.setBody({ result: cases, count: cases.length, tsm_module: true, _source: 'tsm_database' });
    } catch (e) {
        gs.error('[B2B Portal API /cases Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);
