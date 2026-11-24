// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: services
// HTTP Method: POST
// URI: /api/sn_itsm_gen_ai/b2c_telecom_selfcare/services
// Relative Path: /services
// Web Service Definition: B2C Telecom Selfcare
// Sys ID: c18b96181be01b109ac94081b24bcb7d
// Consumes: application/json
// Produces: application/json
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.319Z
// ============================================================================

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var body = request.body.data || {};
    var support = new global.B2CTelecomSelfcareSupport({ email: body.email });
    var result = support.getServices(body.filter || 'all');
    response.setContentType('application/json');
    response.setStatus(200);
    response.setBody(result);
})(request, response);