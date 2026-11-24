// ============================================================================
// ServiceNow Scripted REST API Resource
// Name: outages
// HTTP Method: GET
// URI: /api/sn_itsm_gen_ai/b2c_telecom_selfcare/outages
// Relative Path: /outages
// Web Service Definition: B2C Telecom Selfcare
// Sys ID: 1f37ae901b641b109ac94081b24bcba3
// Consumes: application/json
// Produces: application/json
// Requires Authentication: false
// Exported on: 2026-11-12T15:33:37.258Z
// ============================================================================

(function process(request, response) {
    response.setStatus(200);
    response.setBody({
      result: [
        {
          id: 'OUT-PUN-001',
          title: 'Pune Optical Core Link Degradation',
          service: 'CKT-PUN-001',
          severity: 'Moderate',
          impact: 'Packet loss (1.8%) on primary link, failover to secondary MPLS path active',
          status: 'Investigating',
          started_at: new GlideDateTime().getDisplayValue()
        }
      ]
    });
  })(request, response);