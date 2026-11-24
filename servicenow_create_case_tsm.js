(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    try {
        var body = request.body.data || {};
        var gr = new GlideRecord('sn_customerservice_case');
        gr.initialize();

        gr.short_description = body.subject || body.short_description || "Customer Self-Care Inquiry";
        gr.description = body.description || gr.short_description;
        gr.contact_type = 'self-service';

        // 1. Resolve Contact dynamically
        var contactSysId = body.contact || '';
        var userSysId = '';
        var rawUser = body.userName || body.user_name || '';

        if (!contactSysId && rawUser) {
            var uGr = new GlideRecord('sys_user');
            uGr.addQuery('user_name', rawUser);
            uGr.setLimit(1);
            uGr.query();
            if (uGr.next()) {
                userSysId = uGr.getUniqueValue();
            }
        }

        if (!contactSysId && !userSysId && gs.getUserID() && gs.getUserName() !== 'guest') {
            userSysId = gs.getUserID();
        }

        if (!contactSysId && (userSysId || body.contactEmail || body.email)) {
            var cLookup = new GlideRecord('customer_contact');
            if (userSysId) cLookup.addQuery('sys_id', userSysId);
            else if (body.contactEmail || body.email) cLookup.addQuery('email', body.contactEmail || body.email);
            cLookup.setLimit(1);
            cLookup.query();
            if (cLookup.next()) {
                contactSysId = cLookup.getUniqueValue();
            }
        }

        if (contactSysId) {
            gr.contact = contactSysId;
        } else if (userSysId) {
            gr.contact = userSysId;
        }

        // 2. Resolve Account dynamically
        var accountSysId = body.account || '';
        if (!accountSysId && gr.contact) {
            var cGr = new GlideRecord('customer_contact');
            if (cGr.get(gr.contact) && cGr.account) {
                accountSysId = cGr.getValue('account');
            }
            if (!accountSysId) {
                var uComp = new GlideRecord('sys_user');
                if (uComp.get(gr.contact) && uComp.company) {
                    accountSysId = uComp.getValue('company');
                }
            }
        }

        if (!accountSysId) {
            var defaultAcc = new GlideRecord('customer_account');
            defaultAcc.addQuery('name', 'Tata B2B Enterprise Services');
            defaultAcc.setLimit(1);
            defaultAcc.query();
            if (defaultAcc.next()) {
                accountSysId = defaultAcc.getUniqueValue();
            }
        }

        if (accountSysId) {
            gr.account = accountSysId;
        }

        // 3. Resolve TSM Sold Product (sn_install_base_sold_product)
        var serviceId = body.serviceId || body.service_id || '';
        var fullText = (gr.short_description + ' ' + gr.description);
        if (!serviceId) {
            var matchCkt = fullText.match(/CKT-[A-Z0-9-]+|DIA-[A-Z0-9-]+|SIP-[A-Z0-9-]+|MOB-[A-Z0-9-]+/i);
            if (matchCkt) serviceId = matchCkt[0].toUpperCase();
        }

        if (serviceId) {
            var spLookup = new GlideRecord('sn_install_base_sold_product');
            spLookup.addQuery('number', serviceId);
            if (accountSysId) spLookup.addQuery('account', accountSysId);
            spLookup.setLimit(1);
            spLookup.query();
            if (spLookup.next()) {
                if (gr.isValidField('sold_product')) {
                    gr.sold_product = spLookup.getUniqueValue();
                }
            }
            
            var ciGr = new GlideRecord('cmdb_ci_service');
            ciGr.addQuery('name', 'CONTAINS', serviceId);
            ciGr.setLimit(1);
            ciGr.query();
            if (ciGr.next()) {
                gr.cmdb_ci = ciGr.getUniqueValue();
            }
        }

        // Auto-assign category dynamically based on serviceId / description
        var category = body.category || '';
        if (!category || category === 'General Account & Billing Support') {
            var lowerAll = (serviceId + ' ' + fullText).toLowerCase();
            if (lowerAll.indexOf('mob-') !== -1 || lowerAll.indexOf('5g') !== -1 || lowerAll.indexOf('sim') !== -1 || lowerAll.indexOf('roaming') !== -1) {
                category = 'Mobile Fleet • 5G Cellular Data & Roaming';
            } else if (lowerAll.indexOf('sip-') !== -1 || lowerAll.indexOf('voice') !== -1 || lowerAll.indexOf('trunk') !== -1) {
                category = 'Voice Assurance • SIP Trunking & SBC Interconnect';
            } else if (lowerAll.indexOf('dia-') !== -1 || lowerAll.indexOf('broadband') !== -1 || lowerAll.indexOf('directconnect') !== -1) {
                category = 'Fiber Broadband • Dedicated Internet Access (DIA)';
            } else {
                category = 'Core Network Assurance • SD-WAN & MPLS Optical Transport';
            }
        }
        gr.category = category;

        // Map priority, impact, and urgency
        var rawPrio = String(body.priority || '3').replace(/[^0-9]/g, '') || '3';
        gr.priority = rawPrio;
        if (rawPrio === '1') {
            gr.impact = '1';
            gr.urgency = '1';
        } else if (rawPrio === '2') {
            gr.impact = '2';
            gr.urgency = '1';
        } else if (rawPrio === '3') {
            gr.impact = '2';
            gr.urgency = '2';
        } else {
            gr.impact = '3';
            gr.urgency = '3';
        }

        if (body.comments) {
            gr.comments = body.comments;
        }

        var sys_id = gr.insert();

        if (!sys_id) {
            response.setStatus(500);
            return { status: "error", message: "Failed to insert record into sn_customerservice_case." };
        }

        var caseNumber = gr.getValue('number');
        if (!caseNumber) {
            var grFetch = new GlideRecord('sn_customerservice_case');
            if (grFetch.get(sys_id)) {
                caseNumber = grFetch.getValue('number');
            }
        }

        response.setStatus(201);
        return {
            status: "success",
            sys_id: sys_id,
            number: caseNumber,
            category: category,
            contact: gr.contact ? gr.contact.getDisplayValue() : '',
            account: gr.account ? gr.account.getDisplayValue() : '',
            sold_product: gr.isValidField('sold_product') && gr.sold_product ? gr.sold_product.getDisplayValue() : '',
            tsm_module: true
        };

    } catch (e) {
        response.setStatus(500);
        return { status: "error", message: e.message };
    }
})(request, response);
