/**
 * ServiceNow Integration Configuration
 * Centralized configuration for ServiceNow instance URL, endpoints, and credentials.
 * Modify parameters here or override via environment variables (VITE_SERVICENOW_*).
 */

export const SERVICENOW_CONFIG = {
  // ServiceNow Instance URL
  instanceUrl: (import.meta.env.VITE_SERVICENOW_INSTANCE_URL as string) || "https://tataamericaintlcorpdemo3.service-now.com",

  // Flag to show/hide the ServiceNow REST Inspector in the UI (set to false to hide completely, true to show)
  showRestInspector: false,

  // API Namespace for Scripted REST API (taair)
  apiNamespace: (import.meta.env.VITE_SERVICENOW_API_NAMESPACE as string) || "taair",

  // Scripted REST Auth Endpoint Path (/api/taair/b2b_auth_api/login)
  scriptedAuthPath: "/api/taair/b2b_auth_api/login",

  // Scripted REST Otto AI Chat Endpoint Path (/api/taair/b2b_auth_api/otto/chat)
  scriptedOttoPath: "/api/taair/b2b_auth_api/otto/chat",

  // Scripted REST Cases Endpoint Path (/api/taair/b2b_auth_api/cases)
  scriptedCasesPath: "/api/taair/b2b_auth_api/cases",
  scriptedServicesPath: "/api/taair/b2b_auth_api/services",
  scriptedOrdersPath: "/api/taair/b2b_auth_api/orders",
  scriptedAccountPath: "/api/taair/b2b_auth_api/account",
  scriptedSitesPath: "/api/taair/b2b_auth_api/sites",
  scriptedSlaPath: "/api/taair/b2b_auth_api/sla",
  scriptedOutagesPath: "/api/taair/b2b_auth_api/outages",

  // Scripted REST Confirm Restoration Endpoint Path (/api/taair/b2b_auth_api/confirm_restoration)
  scriptedConfirmRestorationPath: "/api/taair/b2b_auth_api/confirm_restoration",

  // Scripted REST Create Case Endpoint Path (/api/taair/b2b_auth_api/create_case)
  scriptedCreateCasePath: "/api/taair/b2b_auth_api/create_case",

  // Default Username / User ID for Portal Login
  defaultUsername: (import.meta.env.VITE_SERVICENOW_DEFAULT_USER as string) || "goutam.hazra",

  // Default Password (left blank so password is NOT hardcoded; user enters password securely)
  defaultPassword: "",

  // ServiceNow Table API Endpoints
  tableApi: {
    user: "/api/now/table/sys_user",
    case: "/api/now/table/sn_customerservice_case"
  }
};

/**
 * Helper to construct full ServiceNow URL from path
 */
export const getServiceNowFullUrl = (path: string): string => {
  const baseUrl = SERVICENOW_CONFIG.instanceUrl.replace(/\/$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
};
