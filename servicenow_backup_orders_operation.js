// ============================================================================
// BACKUP: Scripted REST Resource 'orders' (sys_ws_operation)
// Sys ID: 121b76d01b281b109ac94081b24bcb99
// Web Service: B2B Auth API (a0d9fa101b281b109ac94081b24bcbf0)
// Relative Path: /orders (GET)
// Backed up on: 2026-11-11
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
// RESOURCE 4: Get Orders (GET /orders)
// Returns Macro Enterprise Project Bundles with Live Milestones & Line Items
// ============================================================================
(function processOrders(request, response) {
    try {
        var ctx = resolveUserContext(request);
        var orders = [];

        var orderTable = 'sn_ind_tmt_orm_order';
        var testGr = new GlideRecord(orderTable);
        if (!testGr.isValid()) orderTable = 'customer_order';

        var ordGr = new GlideRecord(orderTable);
        if (ordGr.isValid()) {
            if (ctx.accountId) {
                if (ordGr.isValidField('account')) ordGr.addQuery('account', ctx.accountId);
                else if (ordGr.isValidField('customer')) ordGr.addQuery('customer', ctx.accountId);
            }
            ordGr.orderByDesc('sys_created_on');
            ordGr.setLimit(10);
            ordGr.query();
            while (ordGr.next()) {
                var orderId = ordGr.getUniqueValue();
                var pName = ordGr.getValue('product_name') || ordGr.getValue('short_description') || 'Telecom Service Order';
                var sLocation = ordGr.getValue('site_location') || 'Enterprise Site';
                var rawStage = ordGr.getValue('stage') || 'Provisioning';
                var rawStatus = ordGr.getValue('status') || 'in_progress';
                var summaryDesc = ordGr.getValue('description') || '';
                var targetDate = ordGr.getValue('target_delivery_date') || '';
                var createdOn = ordGr.getValue('sys_created_on') || '';

                var orderType = ordGr.getValue('order_type');
                if (!orderType) {
                    var pLower = pName.toLowerCase();
                    if (pLower.indexOf('bundle') !== -1 || pLower.indexOf('transformation') !== -1 || pLower.indexOf('infrastructure') !== -1) {
                        orderType = 'Macro Rollout';
                    } else if (pLower.indexOf('upgrade') !== -1 || pLower.indexOf('expansion') !== -1 || pLower.indexOf('10g') !== -1 || pLower.indexOf('interconnect') !== -1) {
                        orderType = 'Bandwidth Upgrade';
                    } else if (pLower.indexOf('migration') !== -1 || pLower.indexOf('cutover') !== -1 || pLower.indexOf('sip') !== -1) {
                        orderType = 'MACD Change';
                    } else {
                        orderType = 'New Installation';
                    }
                }

                var siteCode = ordGr.getValue('site_code');
                if (!siteCode) {
                    var locStr = (sLocation + ' ' + pName).toLowerCase();
                    if (locStr.indexOf('pune') !== -1) siteCode = 'PUN-01';
                    else if (locStr.indexOf('mumbai') !== -1) siteCode = 'MUM-HQ';
                    else if (locStr.indexOf('bangalore') !== -1 || locStr.indexOf('campus') !== -1) siteCode = 'BLR-01';
                    else if (locStr.indexOf('chennai') !== -1) siteCode = 'CHE-01';
                    else if (locStr.indexOf('singapore') !== -1 || locStr.indexOf('apac') !== -1) siteCode = 'SGP-01';
                    else if (locStr.indexOf('london') !== -1) siteCode = 'LON-01';
                    else if (locStr.indexOf('frankfurt') !== -1) siteCode = 'FRA-01';
                    else siteCode = 'SITE-01';
                }

                var progressPct = 68;
                var stLower = rawStage.toLowerCase();
                var statLower = rawStatus.toLowerCase();
                if (statLower === 'completed' || stLower.indexOf('delivered') !== -1 || stLower.indexOf('verified') !== -1 || stLower.indexOf('production') !== -1) {
                    progressPct = 100;
                } else if (stLower.indexOf('test') !== -1 || stLower.indexOf('acceptance') !== -1) {
                    progressPct = 85;
                } else if (stLower.indexOf('provisioning') !== -1 || stLower.indexOf('hardware') !== -1 || stLower.indexOf('carrier') !== -1) {
                    progressPct = 68;
                } else if (stLower.indexOf('trenching') !== -1 || stLower.indexOf('civil') !== -1 || stLower.indexOf('conduit') !== -1) {
                    progressPct = 45;
                } else if (stLower.indexOf('survey') !== -1 || stLower.indexOf('feasibility') !== -1) {
                    progressPct = 30;
                } else if (statLower === 'draft') {
                    progressPct = 20;
                }

                var stages = [];
                var taskTables = ['sn_ind_tmt_orm_order_task', 'customer_order_task', 'csm_order_task', 'task'];
                for (var t = 0; t < taskTables.length; t++) {
                    var tTable = taskTables[t];
                    var tGr = new GlideRecord(tTable);
                    if (tGr.isValid()) {
                        var hasQuery = false;
                        if (tGr.isValidField('order')) { tGr.addQuery('order', orderId); hasQuery = true; }
                        else if (tGr.isValidField('parent')) { tGr.addQuery('parent', orderId); hasQuery = true; }
                        
                        if (hasQuery) {
                            if (tGr.isValidField('order_index')) tGr.orderBy('order_index');
                            else tGr.orderBy('sys_created_on');
                            tGr.query();
                            while (tGr.next()) {
                                var tState = String(tGr.getValue('state') || '').toLowerCase();
                                var sStatus = (tState === '3' || tState === '4' || tState === '7' || tState === 'closed_complete' || tState === 'complete') ? 'complete' :
                                              (tState === '2' || tState === 'in_progress' || tState === 'current') ? 'current' : 'pending';
                                var tDate = '';
                                if (tGr.getValue('closed_at')) {
                                    tDate = new GlideDateTime(tGr.getValue('closed_at')).getDate().getDisplayValue();
                                } else if (tGr.getValue('expected_start') || tGr.getValue('sys_created_on')) {
                                    tDate = new GlideDateTime(tGr.getValue('expected_start') || tGr.getValue('sys_created_on')).getDate().getDisplayValue();
                                }
                                stages.push({
                                    name: tGr.getValue('short_description') || tGr.getValue('name') || 'Order Task',
                                    status: sStatus,
                                    date: tDate
                                });
                            }
                            if (stages.length > 0) break;
                        }
                    }
                }

                if (stages.length === 0) {
                    var orderCreatedGdt = createdOn ? new GlideDateTime(createdOn) : new GlideDateTime();
                    var createdDispDate = orderCreatedGdt.getDate().getDisplayValue();

                    var isDelivered = (progressPct === 100);
                    var isTesting = (progressPct >= 85);
                    var isProvisioning = (progressPct >= 65);
                    var isCivil = (progressPct >= 45);

                    stages = [
                        {
                            name: 'Site Survey & Engineering Review',
                            status: 'complete',
                            date: createdDispDate
                        },
                        {
                            name: 'Optical Network Trenching & Feasibility',
                            status: isCivil ? 'complete' : 'current',
                            date: isCivil ? createdDispDate : 'In Review'
                        },
                        {
                            name: 'CPE Router Hardware Dispatch & Staging',
                            status: isDelivered ? 'complete' : (isTesting ? 'complete' : (isProvisioning ? 'current' : 'pending')),
                            date: isDelivered ? 'Verified' : (isProvisioning ? rawStage : '')
                        },
                        {
                            name: 'End-to-End Acceptance Testing',
                            status: isDelivered ? 'complete' : (isTesting ? 'current' : 'pending'),
                            date: isTesting ? 'In Testing' : ''
                        },
                        {
                            name: 'Handover & Service Go-Live',
                            status: isDelivered ? 'complete' : 'pending',
                            date: isDelivered ? 'Completed' : (targetDate || '')
                        }
                    ];
                }

                var items = [];
                var lineItemTables = ['sn_ind_tmt_orm_order_line_item', 'customer_order_line_item', 'csm_order_line_item'];
                for (var l = 0; l < lineItemTables.length; l++) {
                    var lTable = lineItemTables[l];
                    var lGr = new GlideRecord(lTable);
                    if (lGr.isValid()) {
                        var hasLineQuery = false;
                        if (lGr.isValidField('order')) { lGr.addQuery('order', orderId); hasLineQuery = true; }
                        else if (lGr.isValidField('parent')) { lGr.addQuery('parent', orderId); hasLineQuery = true; }
                        if (hasLineQuery) {
                            lGr.query();
                            while (lGr.next()) {
                                items.push({
                                    category: lGr.getValue('product_family') || lGr.getValue('category') || 'Telecom Service',
                                    description: lGr.getValue('short_description') || lGr.getValue('product') || 'Line Item',
                                    quantity: parseInt(lGr.getValue('quantity') || '1', 10),
                                    unit: 'Units',
                                    status: lGr.getValue('stage') || rawStage || 'Provisioning'
                                });
                            }
                            if (items.length > 0) break;
                        }
                    }
                }

                if (items.length === 0) {
                    if (summaryDesc && summaryDesc.indexOf('·') !== -1) {
                        var parts = summaryDesc.split('·');
                        for (var p = 0; p < parts.length; p++) {
                            var partTrim = parts[p].trim();
                            if (!partTrim) continue;
                            var numMatch = partTrim.match(/^(\d+[\d,]*)\s*(.*)$/);
                            var qty = numMatch ? parseInt(numMatch[1].replace(/,/g, ''), 10) : 1;
                            var label = numMatch ? numMatch[2] : partTrim;
                            var cat = 'Broadband';
                            if (label.toLowerCase().indexOf('sim') !== -1 || label.toLowerCase().indexOf('mobile') !== -1) cat = 'Mobile Fleet';
                            else if (label.toLowerCase().indexOf('trunk') !== -1 || label.toLowerCase().indexOf('channel') !== -1 || label.toLowerCase().indexOf('did') !== -1 || label.toLowerCase().indexOf('sip') !== -1) cat = 'Voice & SIP';
                            else if (label.toLowerCase().indexOf('ap') !== -1 || label.toLowerCase().indexOf('wi-fi') !== -1 || label.toLowerCase().indexOf('cisco') !== -1) cat = 'Wi-Fi APs';
                            else if (label.toLowerCase().indexOf('optical') !== -1 || label.toLowerCase().indexOf('cross-connect') !== -1 || label.toLowerCase().indexOf('port') !== -1) cat = 'Interconnect';

                            items.push({
                                category: cat,
                                description: partTrim,
                                quantity: qty,
                                unit: label.split(' ')[0] || 'Units',
                                status: rawStage
                            });
                        }
                    } else if (summaryDesc) {
                        items.push({
                            category: 'Telecom Service',
                            description: summaryDesc,
                            quantity: 1,
                            unit: 'Package',
                            status: rawStage
                        });
                    } else {
                        items.push({
                            category: 'Core WAN',
                            description: pName,
                            quantity: 1,
                            unit: 'Circuit',
                            status: rawStage
                        });
                    }
                }

                var mrc = ordGr.isValidField('monthly_recurring_cost') ? ordGr.getValue('monthly_recurring_cost') : 0;
                if (!mrc) {
                    if (pName.indexOf('Transformation') !== -1 || pName.indexOf('Global') !== -1) mrc = 14200;
                    else if (pName.indexOf('10G') !== -1 || pName.indexOf('DirectConnect') !== -1) mrc = 8600;
                    else if (pName.indexOf('1,000 Channels') !== -1 || pName.indexOf('SIP') !== -1) mrc = 6400;
                    else if (pName.indexOf('Wi-Fi 6') !== -1) mrc = 4200;
                    else if (pName.indexOf('5G FWA') !== -1 || pName.indexOf('4G LTE') !== -1) mrc = 2800;
                    else mrc = 3500;
                }

                orders.push({
                    sys_id: orderId,
                    order_number: ordGr.getValue('order_number') || ordGr.getValue('number') || ('ORD-2026-' + (9000 + orders.length)),
                    product_name: pName,
                    order_type: orderType,
                    site_location: sLocation,
                    site_code: siteCode,
                    stage: rawStage,
                    status: (rawStatus === 'completed' || rawStage === 'Delivered' || rawStage === 'Active & Verified') ? 'Completed' : (rawStatus === 'pending_acceptance' ? 'Pending Acceptance' : 'In Progress'),
                    progress_pct: progressPct,
                    summary: summaryDesc,
                    target_delivery_date: targetDate || '2026-11-15',
                    created_at: createdOn,
                    monthly_recurring_cost: Number(mrc),
                    items: items,
                    stages: stages,
                    _source: 'database'
                });
            }
        }

        if (orders.length > 0) {
            gs.info('[B2B Portal API] /orders fetched ' + orders.length + ' scoped orders for user ' + ctx.userName);
            response.setBody({ result: orders, _source: 'database' });
        } else {
            response.setBody({
                result: [],
                _source: 'database'
            });
        }
    } catch (e) {
        gs.error('[B2B Portal API /orders Error] ' + e.message);
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);
