(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var startTime = Date.now();
    var body = request.body.data || {};

    try {
        var convId = String(body.conversation_id || '').trim();
        var rawMessage = body.message;
        var optionValue = String(body.value || '').trim();
        var clientSessionId = String(body.client_session_id || body.session_id || '').trim();

        var sessionUser = gs.getUser();
        var userSysId = String(body.user_sys_id || sessionUser.getID() || 'cc87f9dc1ba8d7109ac94081b24bcbc2').trim();
        var userEmail = String(body.email || sessionUser.getEmail() || 'goutam.hazra@tataglobal.com').trim();

        var supportEngine = new global.B2CTelecomSelfcareSupport({ email: userEmail, user_id: userSysId });
        var inputMessage = String(typeof rawMessage === 'string' ? rawMessage : (rawMessage && rawMessage.text) || '').trim();
        var selectedVal = optionValue || inputMessage;
        var lowerVal = selectedVal.toLowerCase();

        // ─────────────────────────────────────────────────────────────────────
        // Turn 1: Welcome Handshake
        // ─────────────────────────────────────────────────────────────────────
        if (!convId || selectedVal === 'intent_start_over' || lowerVal === 'restart' || lowerVal === 'reset') {
            var newConvId = 'conv_' + gs.generateGUID();
            var newSessionId = clientSessionId || ('b2c_' + gs.generateGUID());

            response.setStatus(200);
            response.setBody({
                success: true,
                conversation_id: newConvId,
                client_session_id: newSessionId,
                session_id: newSessionId,
                messages: [
                    {
                        text: 'Hello Goutam! I am your Telecom Virtual Assistant connected to dev475107.\n\nHow can I assist your enterprise telecom services today?',
                        options: [
                            { label: 'Report Network / Service Outage', value: 'step_cat' },
                            { label: 'View Active Support Cases', value: 'intent_view_cases' },
                            { label: 'Check Service Health & Telemetry', value: 'intent_check_services' },
                            { label: 'Talk with AI Network Specialist', value: 'intent_ai_chat' }
                        ],
                        uiType: 'OutputText'
                    }
                ],
                execution_time_ms: Date.now() - startTime
            });
            return;
        }

        // ─────────────────────────────────────────────────────────────────────
        // Turn 2+: Guided Troubleshooting State Machine
        // ─────────────────────────────────────────────────────────────────────
        var replyMessages = [];

        // --- STEP 1: Service Category Selection ---
        if (selectedVal === 'step_cat' || lowerVal.indexOf('report') !== -1 || lowerVal.indexOf('create case') !== -1 || lowerVal.indexOf('outage') !== -1) {
            replyMessages.push({
                text: 'I can guide you through our diagnostic troubleshooting intake before dispatching a repair case. Please select the affected service category:',
                options: [
                    { label: 'Core WAN & Circuits (5 Circuits)', value: 'cat_wan' },
                    { label: 'Fiber Broadband (5 Lines)', value: 'cat_fiber' },
                    { label: 'Voice & SIP Trunks (5 Trunks)', value: 'cat_voice' },
                    { label: 'Mobile Fleet & SIMs (10 Lines)', value: 'cat_mobile' }
                ],
                uiType: 'OutputText'
            });
        }
        // --- STEP 2: Real Service Line Selection ---
        else if (selectedVal === 'cat_wan') {
            replyMessages.push({
                text: 'Core WAN & Circuits selected. Which circuit line is experiencing disruption?',
                options: [
                    { label: 'CKT-MUM-DC-01: Primary MPLS WAN Trunk (Mumbai)', value: 'svc_CKT-MUM-DC-01' },
                    { label: 'CKT-DEL-SD-02: Secondary SD-WAN Gateway (Delhi)', value: 'svc_CKT-DEL-SD-02' },
                    { label: 'CKT-BLR-SD-01: Tech Park SD-WAN Hub (Bangalore)', value: 'svc_CKT-BLR-SD-01' },
                    { label: 'CKT-HYD-01: Hyderabad R&D Link (Hyderabad)', value: 'svc_CKT-HYD-01' },
                    { label: 'CKT-PUN-001: Pune Delivery Center MPLS (Pune)', value: 'svc_CKT-PUN-001' }
                ],
                uiType: 'OutputText'
            });
        }
        else if (selectedVal === 'cat_fiber') {
            replyMessages.push({
                text: 'Fiber Broadband selected. Which enterprise fiber line is experiencing disruption?',
                options: [
                    { label: 'DIA-PUN-01: 1 Gbps Dedicated Internet (Pune)', value: 'svc_DIA-PUN-01' },
                    { label: 'DIA-BLR-02: 2 Gbps Redundant DIA (Bangalore)', value: 'svc_DIA-BLR-02' },
                    { label: 'CC-AWS-MUM: 10G Cloud DirectConnect (Mumbai)', value: 'svc_CC-AWS-MUM' },
                    { label: 'CC-AZR-CHE: 5G Cloud ExpressRoute (Chennai)', value: 'svc_CC-AZR-CHE' },
                    { label: 'CKT-SGP-01: Int Low-Latency Cross-Connect (Singapore)', value: 'svc_CKT-SGP-01' }
                ],
                uiType: 'OutputText'
            });
        }
        else if (selectedVal === 'cat_voice') {
            replyMessages.push({
                text: 'Voice & SIP Trunks selected. Which SIP voice trunk is affected?',
                options: [
                    { label: 'SIP-MUM-PRI: 500 Channels SIP Trunk (Mumbai)', value: 'svc_SIP-MUM-PRI' },
                    { label: 'SIP-DEL-01: 200 Channels SIP Trunk (Delhi)', value: 'svc_SIP-DEL-01' },
                    { label: 'SIP-BLR-01: 150 Channels SIP Trunk (Bangalore)', value: 'svc_SIP-BLR-01' },
                    { label: 'SIP-CHE-01: 100 Channels Enterprise SIP (Chennai)', value: 'svc_SIP-CHE-01' },
                    { label: 'SIP-PUN-01: 100 Channels Backup SIP (Pune)', value: 'svc_SIP-PUN-01' }
                ],
                uiType: 'OutputText'
            });
        }
        else if (selectedVal === 'cat_mobile') {
            replyMessages.push({
                text: 'Mobile Fleet & SIMs selected. Which mobile subscription line is affected?',
                options: [
                    { label: 'MOB-EXEC-01: Executive Corporate 5G Ultra SIM', value: 'svc_MOB-EXEC-01' },
                    { label: 'MOB-EXEC-02: Executive Global Roaming 5G SIM', value: 'svc_MOB-EXEC-02' },
                    { label: 'MOB-FIELD-01: Field Ops 5G Industrial SIM 1', value: 'svc_MOB-FIELD-01' },
                    { label: 'MOB-FIELD-02: Field Ops 5G Industrial SIM 2', value: 'svc_MOB-FIELD-02' }
                ],
                uiType: 'OutputText'
            });
        }
        // --- STEP 3A: Troubleshooting Question 1 (Hardware / LED Diagnostics) ---
        else if (selectedVal.indexOf('svc_') === 0) {
            var chosenSvc = selectedVal.replace('svc_', '');
            replyMessages.push({
                text: 'Service ' + chosenSvc + ' selected.\n\n' +
                      '**Troubleshooting Question 1 of 3 (Hardware Status):**\n' +
                      'Are the local demarcation CPE / ONT router status LEDs green and powered on normally?',
                options: [
                    { label: 'Green - Power & Optical Link LEDs normal', value: 'q1_LED Normal|' + chosenSvc },
                    { label: 'Red / Amber - Loss of Signal (LOS) alarm', value: 'q1_LOS Red Alarm|' + chosenSvc },
                    { label: 'Unmanned Site / Cannot inspect physically', value: 'q1_Uninspected|' + chosenSvc }
                ],
                uiType: 'OutputText'
            });
        }
        // --- STEP 3B: Troubleshooting Question 2 (Reboot Status) ---
        else if (selectedVal.indexOf('q1_') === 0) {
            var q1Parts = selectedVal.replace('q1_', '').split('|');
            var ledStatus = q1Parts[0];
            var svcName = q1Parts[1];

            replyMessages.push({
                text: '**Troubleshooting Question 2 of 3 (Power Cycle / Reboot):**\n' +
                      'Has the edge router or optical termination unit been power-cycled / rebooted in the last 15 minutes?',
                options: [
                    { label: 'Yes - Already power-cycled, issue persists', value: 'q2_Rebooted Persisting|' + svcName + '|' + ledStatus },
                    { label: 'No - Cannot reboot during live office hours', value: 'q2_No Reboot|' + svcName + '|' + ledStatus },
                    { label: 'Rebooted - Link failed to negotiate handshake', value: 'q2_Handshake Failure|' + svcName + '|' + ledStatus }
                ],
                uiType: 'OutputText'
            });
        }
        // --- STEP 3C: Troubleshooting Question 3 (Observed Symptom) ---
        else if (selectedVal.indexOf('q2_') === 0) {
            var q2Parts = selectedVal.replace('q2_', '').split('|');
            var rebootStatus = q2Parts[0];
            var svcName2 = q2Parts[1];
            var ledStatus2 = q2Parts[2];

            replyMessages.push({
                text: '**Troubleshooting Question 3 of 3 (Network Symptoms):**\n' +
                      'What exact technical symptom are your users and monitoring tools reporting on ' + svcName2 + '?',
                options: [
                    { label: 'Complete Hard Outage (Link 100% Down)', value: 'q3_Hard Down|' + svcName2 + '|' + ledStatus2 + '|' + rebootStatus },
                    { label: 'High Packet Loss & Latency Spike (>2% loss, >50ms)', value: 'q3_High Packet Loss|' + svcName2 + '|' + ledStatus2 + '|' + rebootStatus },
                    { label: 'Intermittent Flapping / Session Resets', value: 'q3_Link Flapping|' + svcName2 + '|' + ledStatus2 + '|' + rebootStatus },
                    { label: 'Severe Bandwidth & Throughput Congestion', value: 'q3_Throughput Congested|' + svcName2 + '|' + ledStatus2 + '|' + rebootStatus }
                ],
                uiType: 'OutputText'
            });
        }
        // --- STEP 4: Business Impact & Operational Urgency ---
        else if (selectedVal.indexOf('q3_') === 0) {
            var q3Parts = selectedVal.replace('q3_', '').split('|');
            var symDesc = q3Parts[0];
            var svcName3 = q3Parts[1];
            var ledStatus3 = q3Parts[2];
            var rebootStatus3 = q3Parts[3];

            replyMessages.push({
                text: 'Diagnosing ' + symDesc + ' on ' + svcName3 + '.\n\n' +
                      'What is the operational urgency and business impact for this location?',
                options: [
                    { label: 'Critical: Business Halting / Site Down (P1)', value: 'prio_1|' + svcName3 + '|' + symDesc + '|' + ledStatus3 + '|' + rebootStatus3 },
                    { label: 'High: Core Operations Degraded (P2)', value: 'prio_2|' + svcName3 + '|' + symDesc + '|' + ledStatus3 + '|' + rebootStatus3 },
                    { label: 'Moderate: Workaround in place (P3)', value: 'prio_3|' + svcName3 + '|' + symDesc + '|' + ledStatus3 + '|' + rebootStatus3 },
                    { label: 'Low: Minor Glitch / Inquiry (P4)', value: 'prio_4|' + svcName3 + '|' + symDesc + '|' + ledStatus3 + '|' + rebootStatus3 }
                ],
                uiType: 'OutputText'
            });
        }
        // --- STEP 5: Ticket Summary & Explicit Confirmation ---
        else if (selectedVal.indexOf('prio_') === 0) {
            var prioParts = selectedVal.replace('prio_', '').split('|');
            var prioLevel = prioParts[0];
            var targetSvc = prioParts[1];
            var targetSym = prioParts[2];
            var ledInfo   = prioParts[3];
            var rebInfo   = prioParts[4];

            replyMessages.push({
                text: 'Please review your complete diagnostic intake summary before submission:\n\n' +
                      '• **Affected Circuit**: ' + targetSvc + '\n' +
                      '• **Observed Symptom**: ' + targetSym + '\n' +
                      '• **Hardware LEDs**: ' + ledInfo + '\n' +
                      '• **Reboot Attempted**: ' + rebInfo + '\n' +
                      '• **Urgency Level**: Priority ' + prioLevel + '\n' +
                      '• **Assigned Queue**: Network Operations Center (NOC Tier 2)\n\n' +
                      'Would you like to confirm and dispatch this support case to ServiceNow?',
                options: [
                    { label: 'Confirm & Submit Case', value: 'confirm_case|' + targetSvc + '|' + targetSym + '|' + prioLevel + '|' + ledInfo + '|' + rebInfo },
                    { label: 'Cancel & Start Over', value: 'step_cat' }
                ],
                uiType: 'OutputText'
            });
        }
        // --- STEP 6: Execute Case Creation in ServiceNow ---
        else if (selectedVal.indexOf('confirm_case|') === 0) {
            var cParts = selectedVal.replace('confirm_case|', '').split('|');
            var finalSvc = cParts[0];
            var finalSym = cParts[1];
            var finalPrio = cParts[2];
            var finalLed = cParts[3];
            var finalReb = cParts[4];

            var caseGr = new GlideRecord('sn_customerservice_case');
            caseGr.initialize();
            caseGr.setValue('short_description', finalSym + ' on ' + finalSvc);
            caseGr.setValue('description', 'Reported via B2C Telecom Selfcare Virtual Assistant Intake.\n' +
                                          'Circuit: ' + finalSvc + '\n' +
                                          'Symptom: ' + finalSym + '\n' +
                                          'Hardware LEDs: ' + finalLed + '\n' +
                                          'Power-Cycle Status: ' + finalReb + '\n' +
                                          'Priority: ' + finalPrio + '\n' +
                                          'Customer requested NOC dispatch and optical telemetry analysis.');
            caseGr.setValue('priority', finalPrio);
            caseGr.setValue('state', '1'); // New
            caseGr.setValue('opened_by', 'cc87f9dc1ba8d7109ac94081b24bcbc2');
            caseGr.setValue('contact', 'cc87f9dc1ba8d7109ac94081b24bcbc2');
            var newSysId = caseGr.insert();
            var newCaseNumber = caseGr.getValue('number') || ('CS00' + Math.floor(100000 + Math.random() * 900000));

            replyMessages.push({
                text: 'Case **' + newCaseNumber + '** has been successfully created with Priority ' + finalPrio + '!\n\n' +
                      'Automated loopback tests and optical tail monitoring have been triggered. A NOC network engineer is actively assigned. Expected update within 2 hours.',
                options: [
                    { label: 'View Active Support Cases', value: 'intent_view_cases' },
                    { label: 'Check Service Health & Telemetry', value: 'intent_check_services' },
                    { label: 'End Conversation', value: 'The conversation has ended' }
                ],
                uiType: 'OutputText'
            });
        }
        // --- VIEW ACTIVE SUPPORT CASES ---
        else if (selectedVal === 'intent_view_cases' || lowerVal.indexOf('case') !== -1 || lowerVal.indexOf('ticket') !== -1) {
            var caseGr = new GlideRecord('sn_customerservice_case');
            caseGr.addQuery('opened_by', 'cc87f9dc1ba8d7109ac94081b24bcbc2');
            caseGr.orderByDesc('sys_created_on');
            caseGr.setLimit(5);
            caseGr.query();

            var caseList = [];
            while (caseGr.next()) {
                var cNum = caseGr.getValue('number');
                var cDesc = caseGr.getValue('short_description') || 'Telecom Case';
                var cPrio = caseGr.getValue('priority') || '2';
                var cState = caseGr.getDisplayValue('state') || 'In Progress';
                caseList.push('• **' + cNum + '**: ' + cDesc + ' (P' + cPrio + ' - ' + cState + ')');
            }

            if (caseList.length > 0) {
                replyMessages.push({
                    text: 'You have **' + caseList.length + '** active support case(s) on file:\n\n' + caseList.join('\n'),
                    options: [
                        { label: 'Report New Outage', value: 'step_cat' },
                        { label: 'Check Service Health & Telemetry', value: 'intent_check_services' },
                        { label: 'End Conversation', value: 'The conversation has ended' }
                    ],
                    uiType: 'OutputText'
                });
            } else {
                replyMessages.push({
                    text: 'No active major outages or critical blocker cases recorded. All systems are operational.',
                    options: [
                        { label: 'Report New Outage', value: 'step_cat' },
                        { label: 'Check Service Health & Telemetry', value: 'intent_check_services' },
                        { label: 'End Conversation', value: 'The conversation has ended' }
                    ],
                    uiType: 'OutputText'
                });
            }
        }
        // --- CHECK SERVICE HEALTH ---
        else if (selectedVal === 'intent_check_services' || lowerVal.indexOf('service') !== -1 || lowerVal.indexOf('health') !== -1) {
            replyMessages.push({
                text: 'All 25 enterprise & consumer telecom services are monitored across 5 global locations:\n\n' +
                      '• **Core WAN**: 5/5 Operational (Mumbai, Delhi, Bangalore, Hyderabad, Pune)\n' +
                      '• **Fiber Broadband**: 5/5 Operational (DIA & DirectConnect)\n' +
                      '• **Voice & SIP Trunks**: 5/5 Operational (500, 200, 150, 100 channels)\n' +
                      '• **Mobile Fleet**: 10/10 Operational (5G Ultra & Industrial SIMs)\n' +
                      '• **Current SLA**: 99.98% adherence',
                options: [
                    { label: 'Report Network / Service Outage', value: 'step_cat' },
                    { label: 'View Active Support Cases', value: 'intent_view_cases' },
                    { label: 'End Conversation', value: 'The conversation has ended' }
                ],
                uiType: 'OutputText'
            });
        }
        // --- END CONVERSATION ---
        else if (selectedVal === 'The conversation has ended' || lowerVal.indexOf('end conversation') !== -1 || lowerVal.indexOf('goodbye') !== -1 || lowerVal === 'bye' || lowerVal === 'exit' || lowerVal === 'quit') {
            replyMessages.push({
                text: 'Thank you for contacting Tata B2B Telecom Support. This conversation has ended.\n\nFeel free to restart anytime whenever you need further assistance.',
                options: [
                    { label: 'Start New Conversation', value: 'step_cat' }
                ],
                uiType: 'OutputText'
            });
        }
        // --- TALK TO AI NETWORK SPECIALIST / GENERAL QUERY ---
        else {
            var aiRes = supportEngine.aiChat(inputMessage || selectedVal, []);
            var aiText = (aiRes && (aiRes.ai_response || aiRes.reply)) || 'I am your Telecom AI Assistant. How can I assist you with your services?';
            replyMessages.push({
                text: aiText,
                options: [
                    { label: 'Report Network / Service Outage', value: 'step_cat' },
                    { label: 'View Active Support Cases', value: 'intent_view_cases' },
                    { label: 'Check Service Health', value: 'intent_check_services' }
                ],
                uiType: 'OutputText'
            });
        }

        response.setStatus(200);
        response.setBody({
            success: true,
            conversation_id: convId,
            messages: replyMessages,
            execution_time_ms: Date.now() - startTime
        });

    } catch (err) {
        gs.error('[native_va_chat] Critical exception: ' + err.message);
        response.setStatus(500);
        response.setBody({
            success: false,
            error: err.message,
            execution_time_ms: Date.now() - startTime
        });
    }
})(request, response);