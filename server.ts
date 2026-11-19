import express from "express";
import http from "http";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", environment: process.env.NODE_ENV || 'development' });
  });

  // Localhost test proxy for ServiceNow Virtual Agent embed (eliminates X-Frame-Options/CSP for localhost testing)
  const SN_TARGET = (process.env.VITE_SERVICENOW_URL as string) || "https://tataamericaintlcorpdemo3.service-now.com";
  app.get("/api/sn-va-embed", async (req, res) => {
    try {
      const targetUrl = `${SN_TARGET}/$sn_va_web_client_app_embed.do?sysparm_skip_load_history=1`;
      const snRes = await fetch(targetUrl);
      const snData = await snRes.text();
      res.removeHeader('X-Frame-Options');
      res.removeHeader('x-frame-options');
      res.removeHeader('Content-Security-Policy');
      res.removeHeader('content-security-policy');
      res.set('Content-Type', 'text/html');
      res.send(snData);
    } catch (err: any) {
      res.status(502).send("ServiceNow VA Proxy Error: " + err.message);
    }
  });
  app.all(["/api/now/*", "/api/taair/*"], async (req, res) => {
    try {
      const targetUrl = `${SN_TARGET}${req.originalUrl}`;
      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };
      if (req.headers.authorization) {
        headers['Authorization'] = req.headers.authorization as string;
        try {
          const b64 = (req.headers.authorization as string).replace(/^Basic\s+/i, '');
          const decoded = Buffer.from(b64, 'base64').toString('utf8');
          const [u] = decoded.split(':');
          console.log(`[SN Proxy] Request for user "${u}" to: ${targetUrl}`);
        } catch {
          console.log(`[SN Proxy] Request to: ${targetUrl}`);
        }
      } else {
        console.warn(`[SN Proxy] WARNING: No Authorization header received for: ${targetUrl}`);
      }

      const fetchOptions: RequestInit = {
        method: req.method,
        headers,
      };

      if (req.method !== 'GET' && req.method !== 'HEAD' && req.body && Object.keys(req.body).length > 0) {
        fetchOptions.body = JSON.stringify(req.body);
      }

      const snRes = await fetch(targetUrl, fetchOptions);
      const snData = await snRes.text();
      console.log(`[SN Proxy] ServiceNow responded with HTTP ${snRes.status}`);
      if (snRes.status !== 200) {
        console.warn(`[SN Proxy] Response body:`, snData.substring(0, 300));
      }

      res.status(snRes.status);
      res.set('Content-Type', snRes.headers.get('content-type') || 'application/json');
      res.removeHeader('WWW-Authenticate');
      res.removeHeader('www-authenticate');
      res.send(snData);
    } catch (err: any) {
      console.error('[SN Proxy Error]', err);
      res.status(502).json({ error: 'ServiceNow Proxy Error', message: err.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production serving
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
