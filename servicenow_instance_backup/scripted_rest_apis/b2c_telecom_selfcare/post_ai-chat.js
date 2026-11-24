// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: ai-chat
// HTTP Method: POST
// URI: /api/sn_itsm_gen_ai/b2c_telecom_selfcare/ai-chat
// Relative Path: /ai-chat
// Web Service Definition: B2C Telecom Selfcare
// Sys ID: 188b16d01be01b109ac94081b24bcbdb
// Consumes: application/json
// Produces: application/json
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.257Z
// ============================================================================

(function process(/*RESTAPIRequest*/ request, /*RESTAPIResponse*/ response) {
    var support = new global.B2CTelecomSelfcareSupport();
    support.route(request, response);
})(request, response);