// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: login
// HTTP Method: POST
// URI: /api/taair/b2b_auth_api/login
// Relative Path: /login
// Web Service Definition: B2B Auth API
// Sys ID: c53bfad01b281b109ac94081b24bcb2a
// Consumes: application/json,application/xml,text/xml
// Produces: application/json,application/xml,text/xml
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.321Z
// ============================================================================

(function processLogin(request, response) {
    try {
        var body = request.body.data || {};
        var username = String(body.username || body.user_name || '').trim();

        if (!username) {
            response.setStatus(400);
            response.setBody({ status: 'error', message: 'Username is required' });
            return;
        }

        var userGr = new GlideRecord('sys_user');
        userGr.addQuery('user_name', username);
        userGr.addOrCondition('email', username);
        userGr.query();

        if (userGr.next()) {
            response.setStatus(200);
            response.setBody({
                status: 'success',
                sys_id: userGr.getUniqueValue(),
                user_id: userGr.getValue('user_name'),
                user_name: userGr.getValue('user_name'),
                email: userGr.getValue('email') || (username + '@tataglobal.com'),
                first_name: userGr.getValue('first_name') || 'Goutam',
                last_name: userGr.getValue('last_name') || 'Hazra'
            });
            return;
        }

        response.setStatus(401);
        response.setBody({ status: 'error', message: 'User not found in ServiceNow' });
    } catch (e) {
        response.setStatus(500);
        response.setBody({ error: e.message });
    }
})(request, response);