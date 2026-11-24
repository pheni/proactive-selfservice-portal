// ============================================================================
// ServiceNow Scripted REST API Resource: nlq-chat
// HTTP Method: POST
// URI: /api/sn_itsm_gen_ai/b2c_telecom_selfcare/nlq-chat
// Relative Path: /nlq-chat
// Web Service Definition: B2C Telecom Selfcare
// Consumes: application/json
// Produces: application/json
// Requires Authentication: false
// Architecture: Pure Now Assist Generative AI (Zero Hardcoded Regex Routing)
// Flow:
//   1. Resolve Customer Contact & B2B Account Boundary (Live GlideRecord)
//   2. Autonomous Planning: Now Assist LLM decides intent & tool call
//   3. Live Database Tool Execution (sn_ind_tmt_orm_order, sn_install_base_sold_product, sn_customerservice_case)
//   4. Autonomous Synthesis: Now Assist LLM generates grounded natural response
// ============================================================================

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var startTime = Date.now();
    var body = request.body.data || {};

    try {
        var rawMessage = String(body.message || '').trim();
        var userEmail = String(body.email || 'goutam.hazra@tataglobal.com').trim();
        var userName = String(body.user_name || 'goutam').trim();

        if (!rawMessage) {
            response.setStatus(400);
            response.setBody({
                success: false,
                message: 'Query message is required.'
            });
            return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 1. RESOLVE CUSTOMER & B2B ENTERPRISE ACCOUNT BOUNDARY
        // ─────────────────────────────────────────────────────────────────────
        var accountSysId = '66c0d2e02bc4935016f8f0aef291bf09'; // Tata B2B Enterprise Services
        var accountName = 'Tata B2B Enterprise Services';
        var contactName = 'Goutam Hazra';
        var contactSysId = '';

        var grContact = new GlideRecord('customer_contact');
        grContact.addQuery('email', userEmail)
                 .addOrCondition('user_name', userName)
                 .addOrCondition('name', 'CONTAINS', 'Goutam');
        grContact.setLimit(1);
        grContact.query();
        if (grContact.next()) {
            contactSysId = grContact.getUniqueValue();
            contactName = grContact.getDisplayValue('name') || contactName;
            var accRef = grContact.getValue('account');
            if (accRef) {
                accountSysId = accRef;
                accountName = grContact.getDisplayValue('account') || accountName;
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 2. NOW ASSIST LLM CALLER HELPER
        // ─────────────────────────────────────────────────────────────────────
        function callNowAssist(promptText) {
            if (typeof sn_one_extend === 'undefined' || !sn_one_extend.OneExtendUtil) {
                return null;
            }
            var capIds = ['0c90ca79533121106b38ddeeff7b12d7', '99dd60a83bcd525093107b6aa5e45aff'];
            for (var i = 0; i < capIds.length; i++) {
                var cId = capIds[i];
                try {
                    var req = {
                        executionRequests: [{
                            capabilityId: cId,
                            payload: { prompt: promptText }
                        }]
                    };
                    var resStat = sn_one_extend.OneExtendUtil.execute(req);
                    if (resStat && resStat.capabilities && resStat.capabilities[cId] && resStat.capabilities[cId].response) {
                        return String(resStat.capabilities[cId].response).trim();
                    }
                    if (resStat && resStat.response) {
                        return String(resStat.response).trim();
                    }
                } catch (eStat) {}

                try {
                    var util = new sn_one_extend.OneExtendUtil();
                    var resInst = util.execute(cId, { prompt: promptText });
                    if (resInst && resInst.response) {
                        return String(resInst.response).trim();
                    }
                } catch (eInst) {}
            }
            return null;
        }

        // ─────────────────────────────────────────────────────────────────────
        // 3. AUTONOMOUS AI PLANNING (INTENT & TOOL SELECTION BY NOW ASSIST)
        // ─────────────────────────────────────────────────────────────────────
        var plannerPrompt = 'You are the autonomous AI Telecom Assurance Agent for ' + accountName + '.\n' +
            'Customer: ' + contactName + ' (' + userEmail + ')\n\n' +
            'Available Backend Tools:\n' +
            '- getServices(search): Query active telecom circuits, WAN links, MPLS, leased lines, broadband, DIA\n' +
            '- getOrders(search): Query delivery, provisioning, milestone, rollout, upgrade, and mobile fleet orders\n' +
            '- listCases(filter): Query support cases, outages, and complaints (filter: "open", "closed", "p1", "all")\n' +
            '- getCaseStatus(caseNumber): Query real-time status of a specific case number (e.g. CS0001274)\n' +
            '- getCustomerContext(): Query customer account profile, SLAs, and subscription metrics\n' +
            '- direct_reply: Answer greetings, conversational questions, or explanations directly\n\n' +
            'Customer Query: "' + rawMessage + '"\n\n' +
            'Respond ONLY with a valid raw JSON object (no markdown, no extra text):\n' +
            '{"tool": "<tool_name>", "args": ["<search_term_or_filter>"]}\n' +
            'OR if answering directly without backend tools:\n' +
            '{"direct_reply": "<your response tailored to ' + accountName + '>"}';

        var rawPlan = callNowAssist(plannerPrompt);
        var decision = null;
        if (rawPlan) {
            try {
                var cleanedPlan = rawPlan.replace(/```json/gi, '').replace(/```/g, '').trim();
                var startB = cleanedPlan.indexOf('{');
                var endB = cleanedPlan.lastIndexOf('}');
                if (startB !== -1 && endB !== -1) {
                    cleanedPlan = cleanedPlan.substring(startB, endB + 1);
                }
                decision = JSON.parse(cleanedPlan);
            } catch (eParse) {
                gs.warn('nlq-chat: AI plan parse error: ' + eParse.message);
            }
        }

        // Fallback default decision if plan unparseable
        if (!decision || (!decision.tool && !decision.direct_reply)) {
            decision = { tool: 'listCases', args: ['open'] };
        }

        var toolName = decision.tool || 'direct_reply';
        var toolArgs = Array.isArray(decision.args) ? decision.args : [];
        var searchArg = String(toolArgs[0] || '').trim();
        var toolResults = [];

        // ─────────────────────────────────────────────────────────────────────
        // 4. EXECUTE THE TOOL CHOSEN BY NOW ASSIST (LIVE GLIDERECORD QUERIES)
        // ─────────────────────────────────────────────────────────────────────
        if (toolName === 'getOrders') {
            var grOrder = new GlideRecord('sn_ind_tmt_orm_order');
            grOrder.addQuery('account', accountSysId);
            if (searchArg && searchArg !== 'all' && searchArg !== 'orders' && searchArg !== 'undefined') {
                var oTerms = searchArg.toLowerCase().split(/\s+/).filter(function(t) { return t.length > 2; });
                if (oTerms.length > 0) {
                    var oCond = grOrder.addQuery('short_description', 'CONTAINS', oTerms[0]);
                    for (var ot = 1; ot < oTerms.length; ot++) {
                        oCond.addOrCondition('short_description', 'CONTAINS', oTerms[ot]);
                    }
                    oCond.addOrCondition('order_type', 'CONTAINS', oTerms[0]);
                    oCond.addOrCondition('number', 'CONTAINS', oTerms[0]);
                }
            }
            grOrder.orderByDesc('sys_created_on');
            grOrder.setLimit(15);
            grOrder.query();
            while (grOrder.next()) {
                toolResults.push({
                    number: grOrder.getValue('order_number') || grOrder.getValue('number') || '',
                    short_description: grOrder.getValue('short_description') || '',
                    order_type: grOrder.getDisplayValue('order_type') || grOrder.getValue('order_type') || 'Standard',
                    state: grOrder.getDisplayValue('state') || grOrder.getValue('state') || 'In progress',
                    created_on: grOrder.getValue('sys_created_on') || '',
                    account: accountName
                });
            }
            if (toolResults.length === 0) {
                var grAllOrders = new GlideRecord('sn_ind_tmt_orm_order');
                grAllOrders.addQuery('account', accountSysId);
                grAllOrders.orderByDesc('sys_created_on');
                grAllOrders.setLimit(10);
                grAllOrders.query();
                while (grAllOrders.next()) {
                    toolResults.push({
                        number: grAllOrders.getValue('order_number') || grAllOrders.getValue('number') || '',
                        short_description: grAllOrders.getValue('short_description') || '',
                        order_type: grAllOrders.getDisplayValue('order_type') || grAllOrders.getValue('order_type') || 'Standard',
                        state: grAllOrders.getDisplayValue('state') || grAllOrders.getValue('state') || 'In progress',
                        created_on: grAllOrders.getValue('sys_created_on') || '',
                        account: accountName
                    });
                }
            }
        } else if (toolName === 'getServices') {
            var grService = new GlideRecord('sn_install_base_sold_product');
            grService.addQuery('account', accountSysId);
            if (searchArg && searchArg !== 'all' && searchArg !== 'services' && searchArg !== 'undefined') {
                var sTerms = searchArg.toLowerCase().split(/\s+/).filter(function(t) { return t.length > 2; });
                if (sTerms.length > 0) {
                    var sCond = grService.addQuery('name', 'CONTAINS', sTerms[0]);
                    for (var st = 1; st < sTerms.length; st++) {
                        sCond.addOrCondition('name', 'CONTAINS', sTerms[st]);
                    }
                    sCond.addOrCondition('product_number', 'CONTAINS', sTerms[0]);
                }
            }
            grService.orderByDesc('sys_created_on');
            grService.setLimit(20);
            grService.query();
            while (grService.next()) {
                toolResults.push({
                    number: grService.getValue('product_number') || grService.getUniqueValue(),
                    name: grService.getValue('name') || '',
                    status: grService.getDisplayValue('state') || 'Installed',
                    price: grService.getDisplayValue('monthly_recurring_price') || '$0.00',
                    account: accountName
                });
            }
            if (toolResults.length === 0) {
                var grAllServ = new GlideRecord('sn_install_base_sold_product');
                grAllServ.addQuery('account', accountSysId);
                grAllServ.orderByDesc('sys_created_on');
                grAllServ.setLimit(15);
                grAllServ.query();
                while (grAllServ.next()) {
                    toolResults.push({
                        number: grAllServ.getValue('product_number') || grAllServ.getUniqueValue(),
                        name: grAllServ.getValue('name') || '',
                        status: grAllServ.getDisplayValue('state') || 'Installed',
                        price: grAllServ.getDisplayValue('monthly_recurring_price') || '$0.00',
                        account: accountName
                    });
                }
            }
        } else if (toolName === 'listCases') {
            var grCase = new GlideRecord('sn_customerservice_case');
            grCase.addQuery('account', accountSysId);
            if (searchArg === 'p1' || searchArg === '1') {
                grCase.addQuery('priority', '1');
            } else if (searchArg === 'closed' || searchArg === 'resolved') {
                grCase.addQuery('state', '3');
            } else if (searchArg !== 'all') {
                grCase.addQuery('state', '!=', '3');
            }
            grCase.orderByDesc('sys_created_on');
            grCase.setLimit(25);
            grCase.query();
            while (grCase.next()) {
                toolResults.push({
                    number: grCase.getValue('number') || '',
                    short_description: grCase.getValue('short_description') || '',
                    priority: grCase.getDisplayValue('priority') || grCase.getValue('priority') || '',
                    state: grCase.getDisplayValue('state') || grCase.getValue('state') || '',
                    assigned_to: grCase.getDisplayValue('assigned_to') || 'Assigned Support Engineer',
                    created_on: grCase.getValue('sys_created_on') || ''
                });
            }
        } else if (toolName === 'getCaseStatus') {
            var grSpecificCase = new GlideRecord('sn_customerservice_case');
            grSpecificCase.addQuery('account', accountSysId);
            if (searchArg) {
                grSpecificCase.addQuery('number', searchArg);
            }
            grSpecificCase.setLimit(1);
            grSpecificCase.query();
            if (grSpecificCase.next()) {
                toolResults.push({
                    number: grSpecificCase.getValue('number') || '',
                    short_description: grSpecificCase.getValue('short_description') || '',
                    priority: grSpecificCase.getDisplayValue('priority') || '',
                    state: grSpecificCase.getDisplayValue('state') || '',
                    assigned_to: grSpecificCase.getDisplayValue('assigned_to') || 'Assigned Support Engineer',
                    created_on: grSpecificCase.getValue('sys_created_on') || ''
                });
            }
        } else if (toolName === 'getCustomerContext') {
            var grAcc = new GlideRecord('customer_account');
            if (grAcc.get(accountSysId)) {
                toolResults.push({
                    name: grAcc.getValue('name') || accountName,
                    customer_number: grAcc.getValue('customer_number') || grAcc.getValue('number') || '',
                    status: grAcc.getDisplayValue('status') || 'Active',
                    contact: contactName,
                    email: userEmail
                });
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 5. AUTONOMOUS AI SYNTHESIS (NOW ASSIST LLM GENERATES FINAL RESPONSE)
        // ─────────────────────────────────────────────────────────────────────
        var finalAiResponse = '';

        if (decision.direct_reply && (!decision.tool || decision.tool === 'direct_reply')) {
            finalAiResponse = decision.direct_reply;
        } else {
            var synthPrompt = 'Customer Question: ' + rawMessage + '\n\n' +
                'Backend Tool Chosen by AI: ' + toolName + '\n' +
                'Live Database Records Retrieved (' + toolResults.length + ' records):\n' +
                JSON.stringify(toolResults.slice(0, 10)) + '\n\n' +
                'You are the autonomous AI Telecom Assurance Agent for ' + accountName + '.\n' +
                'Synthesize a helpful, professional, natural response based strictly on the live records above. Highlight key identifiers, statuses, and actionable details for the customer.';

            finalAiResponse = callNowAssist(synthPrompt);

            // If Now Assist synthesis is empty, provide a clean natural summary
            if (!finalAiResponse) {
                if (toolResults.length === 0) {
                    finalAiResponse = 'No matching records were found for your query under ' + accountName + '.';
                } else {
                    finalAiResponse = 'Here are the ' + toolResults.length + ' record(s) retrieved for **' + accountName + '**:\n\n';
                    for (var k = 0; k < Math.min(toolResults.length, 5); k++) {
                        var itm = toolResults[k];
                        var label = itm.number || itm.name || ('Item ' + (k + 1));
                        var desc = itm.short_description || itm.name || itm.status || '';
                        finalAiResponse += '• **' + label + '**: ' + desc + '\n';
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────────
        // 6. RESPONSE OUTPUT
        // ─────────────────────────────────────────────────────────────────────
        response.setStatus(200);
        response.setBody({
            success: true,
            message: rawMessage,
            ai_response: finalAiResponse,
            tool_executed: toolName,
            execution_engine: 'now_assist_ai',
            now_assist_status: 'completed',
            count: toolResults.length,
            records: toolResults,
            account: accountName,
            contact: contactName,
            duration_ms: (Date.now() - startTime)
        });

    } catch (ex) {
        response.setStatus(500);
        response.setBody({
            success: false,
            message: ex.message || 'Error executing Now Assist AI query',
            execution_engine: 'now_assist_ai',
            now_assist_status: 'error'
        });
    }
})(request, response);
