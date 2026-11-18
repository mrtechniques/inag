import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config.js';
import { getLocalNetworkInfo } from './network/ip.js';
import { StateMachine } from './state/stateMachine.js';
import { setupSocketHandlers } from './socket/socketHandler.js';
import { AuthService } from './auth/authService.js';

const app = express();
const server = http.createServer(app);

// Enable CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
}));

app.use(express.json());

// Initialize Core State Machine & Socket Handlers
const stateMachine = new StateMachine();
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

setupSocketHandlers(io, stateMachine);

// REST API Endpoints
app.get('/api/status', (_req, res) => {
  res.json(stateMachine.getSnapshot());
});

app.get('/api/network', (_req, res) => {
  const net = getLocalNetworkInfo();
  res.json({
    ...net,
    port: CONFIG.PORT,
    controllerUrl: `http://${net.ipv4}:${CONFIG.PORT}/controller`,
    displayUrl: `http://${net.ipv4}:${CONFIG.PORT}/display`,
    adminUrl: `http://${net.ipv4}:${CONFIG.PORT}/admin`,
  });
});

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  const result = AuthService.verifyAdminPin(pin);
  if (result.success) {
    res.json(result);
  } else {
    res.status(401).json(result);
  }
});

// Serve frontend static build if available
const clientDistPath = path.resolve(process.cwd(), '../client/dist');
const localClientDist = path.resolve(process.cwd(), 'client/dist');
const distPath = fs.existsSync(clientDistPath) ? clientDistPath : fs.existsSync(localClientDist) ? localClientDist : null;

if (distPath) {
  console.log(`[HTTP] Serving static client build from: ${distPath}`);
  app.use(express.static(distPath));

  // Catch-all route to support client-side SPA routing
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => {
    const net = getLocalNetworkInfo();
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>YENARTIFICA Server Online</title>
        <style>
          body { background: #030712; color: #00f0ff; font-family: monospace; padding: 40px; text-align: center; }
          .card { max-width: 600px; margin: 0 auto; background: #0b132b; padding: 30px; border: 1px solid #00f0ff; border-radius: 8px; box-shadow: 0 0 20px rgba(0,240,255,0.2); }
          h1 { color: #38bdf8; letter-spacing: 2px; }
          a { color: #10b981; font-size: 18px; text-decoration: none; display: block; margin: 12px 0; }
          a:hover { text-decoration: underline; color: #34d399; }
          .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; background: #002244; color: #38bdf8; margin: 5px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>⚡ PROJECT AWAKEN — YENARTIFICA ⚡</h1>
          <p>Department of Artificial Intelligence & Machine Learning</p>
          <div style="margin: 20px 0;">
            <div class="badge">Backend API: ONLINE</div>
            <div class="badge">Socket.IO: PORT ${CONFIG.PORT}</div>
            <div class="badge">LAN IPv4: ${net.ipv4}</div>
          </div>
          <p>Client build not yet compiled or running in Vite dev mode (Port 5173).</p>
          <p>Access client endpoints:</p>
          <a href="http://${net.ipv4}:5173/display" target="_blank">🖥️ Projector Display (/display)</a>
          <a href="http://${net.ipv4}:5173/controller" target="_blank">📱 Mobile Controller (/controller)</a>
          <a href="http://${net.ipv4}:5173/admin" target="_blank">⚙️ Admin Dashboard (/admin)</a>
        </div>
      </body>
      </html>
    `);
  });
}

// Bind to 0.0.0.0
server.listen(CONFIG.PORT, CONFIG.HOST, () => {
  const net = getLocalNetworkInfo();
  console.log(`
===================================================================
⚡  PROJECT AWAKEN — YENARTIFICA INAUGURATION CORE SERVER
===================================================================
  Host Bind      : ${CONFIG.HOST}:${CONFIG.PORT}
  Detected LAN IP: ${net.ipv4} (${net.interfaceName})
  Environment    : ${CONFIG.NODE_ENV}
  Security PIN   : [PROTECTED] (configured)

  🌐 LOCAL NETWORK ACCESS URLS:
  -----------------------------------------------------------------
  📱 Mobile Controller : http://${net.ipv4}:${CONFIG.PORT}/controller
  🖥️ Projector Display  : http://${net.ipv4}:${CONFIG.PORT}/display
  ⚙️ Admin Dashboard    : http://${net.ipv4}:${CONFIG.PORT}/admin
  🔍 Core Health API   : http://${net.ipv4}:${CONFIG.PORT}/api/status

  (If using Vite Dev Server, replace port with 5173)
===================================================================
  Server State: STANDBY — Ready for terminal connections.
===================================================================
`);
});

export { app, server, stateMachine };
