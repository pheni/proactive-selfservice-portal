import { SERVICENOW_CONFIG } from '../config/servicenow.config';

export interface ServiceNowUser {
  sys_id: string;
  user_name: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  company?: any;
}

export interface AuthResponse {
  success: boolean;
  user?: ServiceNowUser;
  error?: string;
  isCorsError?: boolean;
}

class ServiceNowAuthService {
  private instanceUrl: string = SERVICENOW_CONFIG.instanceUrl;

  public setInstanceUrl(url: string) {
    this.instanceUrl = url.replace(/\/$/, "");
  }

  public getInstanceUrl(): string {
    return this.instanceUrl;
  }

  public setLiveMode(_isLive: boolean) {
    // Retained for API compatibility: Live ServiceNow authentication is always strictly enforced
  }

  public isLiveMode(): boolean {
    return true;
  }

  public async authenticate(username: string, password: string): Promise<AuthResponse> {
    if (!username.trim() || !password.trim()) {
      return {
        success: false,
        error: "Please enter your User ID / Email and password."
      };
    }

    const credentials = btoa(`${username}:${password}`);

    try {
      // 1. Direct Scripted REST Login Endpoint (/api/taair/b2b_auth_api/login)
      // Note: Must NOT send Basic Auth header to /login because ServiceNow's HTTP layer will reject
      // standard users without snc_basic_auth_api_access before the script body can be verified.
      const loginUrl = `${this.instanceUrl}${SERVICENOW_CONFIG.scriptedAuthPath}`;
      console.log(`[ServiceNow Auth] Attempting Scripted REST authentication at: ${loginUrl}`);

      try {
        const loginRes = await fetch(loginUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ 
            username, 
            password,
            user_name: username,
            user_password: password
          })
        });

        console.log(`[ServiceNow Auth] Response status from ${loginUrl}: ${loginRes.status}`);

        if (loginRes.ok) {
          const loginData = await loginRes.json();
          console.log(`[ServiceNow Auth] Result:`, loginData);
          const resObj = loginData.result || loginData;

          if (resObj && (resObj.status === 'success' || resObj.sys_id || resObj.user_id)) {
            const user_name = resObj.user_id || resObj.user_name || username;
            const email = resObj.email || (username.includes("@") ? username : `${username}@tataglobal.com`);
            const sys_id = resObj.sys_id || "";
            const first_name = resObj.first_name || (user_name.split('.')[0] ? user_name.split('.')[0].charAt(0).toUpperCase() + user_name.split('.')[0].slice(1) : "Customer");
            const last_name = resObj.last_name || (user_name.split('.')[1] ? user_name.split('.')[1].charAt(0).toUpperCase() + user_name.split('.')[1].slice(1) : "User");

            // Save credentials only after verified 200 OK from ServiceNow
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('sn_auth_token', credentials);
              sessionStorage.setItem('sn_username', user_name);
              sessionStorage.setItem('sn_email', email);
              sessionStorage.setItem('sn_first_name', first_name);
              sessionStorage.setItem('sn_last_name', last_name);
              if (sys_id) sessionStorage.setItem('sn_user_sys_id', sys_id);

              localStorage.setItem('sn_auth_token', credentials);
              localStorage.setItem('sn_username', user_name);
              localStorage.setItem('sn_email', email);
              localStorage.setItem('sn_first_name', first_name);
              localStorage.setItem('sn_last_name', last_name);
              if (sys_id) localStorage.setItem('sn_user_sys_id', sys_id);
            }

            return {
              success: true,
              user: {
                sys_id,
                user_name,
                first_name,
                last_name,
                email
              }
            };
          }
        } else if (loginRes.status === 401) {
          this.logout();
          return {
            success: false,
            error: `Invalid credentials: User "${username}" was rejected by ServiceNow (HTTP 401 Unauthorized).`
          };
        }
      } catch (loginErr: any) {
        console.warn(`[ServiceNow Auth] Error calling ${loginUrl}:`, loginErr);
      }

      // 2. Fallback: Standard Table API Basic Auth
      const endpoint = `${this.instanceUrl}${SERVICENOW_CONFIG.tableApi.user}?sysparm_query=user_name=${encodeURIComponent(username)}^ORemail=${encodeURIComponent(username)}&sysparm_limit=1`;

      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          "Authorization": `Basic ${credentials}`,
          "Accept": "application/json",
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401) {
        this.logout();
        return {
          success: false,
          error: `Invalid credentials: User "${username}" was rejected by ServiceNow (HTTP 401 Unauthorized).`
        };
      }

      if (response.status === 403) {
        this.logout();
        return {
          success: false,
          error: `Access Forbidden (HTTP 403): User "${username}" does not have permission to access self-care services.`
        };
      }

      if (!response.ok) {
        this.logout();
        return {
          success: false,
          error: `ServiceNow responded with HTTP ${response.status}: ${response.statusText}`
        };
      }

      const data = await response.json();
      const userResult = data.result && data.result.length > 0 ? data.result[0] : null;

      if (!userResult) {
        this.logout();
        return {
          success: false,
          error: `User "${username}" was not found in ServiceNow user records.`
        };
      }

      const user_name = userResult.user_name || username;
      const email = userResult.email || (username.includes("@") ? username : `${username}@tataglobal.com`);
      const sys_id = userResult.sys_id || "";
      const nameParts = user_name.split('@')[0].split('.');
      const inferredFirst = nameParts[0] ? nameParts[0].charAt(0).toUpperCase() + nameParts[0].slice(1) : "Customer";
      const inferredLast = nameParts[1] ? nameParts[1].charAt(0).toUpperCase() + nameParts[1].slice(1) : "User";

      // Save credentials only after verified 200 OK from ServiceNow
      if (typeof window !== 'undefined') {
        const finalFirstName = userResult.first_name || inferredFirst;
        const finalLastName = userResult.last_name || inferredLast;

        sessionStorage.setItem('sn_auth_token', credentials);
        sessionStorage.setItem('sn_username', user_name);
        sessionStorage.setItem('sn_email', email);
        sessionStorage.setItem('sn_first_name', finalFirstName);
        sessionStorage.setItem('sn_last_name', finalLastName);
        if (sys_id) sessionStorage.setItem('sn_user_sys_id', sys_id);

        localStorage.setItem('sn_auth_token', credentials);
        localStorage.setItem('sn_username', user_name);
        localStorage.setItem('sn_email', email);
        localStorage.setItem('sn_first_name', finalFirstName);
        localStorage.setItem('sn_last_name', finalLastName);
        if (sys_id) localStorage.setItem('sn_user_sys_id', sys_id);
      }

      return {
        success: true,
        user: {
          sys_id,
          user_name,
          first_name: userResult.first_name || inferredFirst,
          last_name: userResult.last_name || inferredLast,
          email
        }
      };
    } catch (err: any) {
      console.error("[ServiceNow Auth] Connection/CORS Error:", err);
      this.logout();
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'current origin';
      return {
        success: false,
        isCorsError: true,
        error: `CORS / Connection Error: ServiceNow instance (${this.instanceUrl}) blocked request from "${currentOrigin}". Please verify CORS configuration in ServiceNow.`
      };
    }
  }

  public getAuthHeaders(): Record<string, string> {
    const token = typeof window !== 'undefined' 
      ? (sessionStorage.getItem('sn_auth_token') || localStorage.getItem('sn_auth_token')) 
      : null;
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };
    if (token) {
      headers["Authorization"] = `Basic ${token}`;
    }
    return headers;
  }

  public isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    const isAuthFlag = (
      localStorage.getItem('sn_portal_authenticated') === 'true' ||
      sessionStorage.getItem('sn_portal_authenticated') === 'true'
    );
    const hasToken = (
      !!localStorage.getItem('sn_auth_token') ||
      !!sessionStorage.getItem('sn_auth_token')
    );
    return isAuthFlag && hasToken;
  }

  public logout() {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sn_portal_authenticated');
      sessionStorage.removeItem('sn_auth_token');
      sessionStorage.removeItem('sn_username');
      sessionStorage.removeItem('sn_email');
      sessionStorage.removeItem('sn_first_name');
      sessionStorage.removeItem('sn_last_name');
      sessionStorage.removeItem('sn_user_sys_id');
      localStorage.removeItem('sn_portal_authenticated');
      localStorage.removeItem('sn_auth_token');
      localStorage.removeItem('sn_username');
      localStorage.removeItem('sn_email');
      localStorage.removeItem('sn_first_name');
      localStorage.removeItem('sn_last_name');
      localStorage.removeItem('sn_user_sys_id');
    }
  }
}

export const serviceNowAuthService = new ServiceNowAuthService();
