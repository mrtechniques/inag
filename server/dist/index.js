"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stateMachine = exports.server = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_js_1 = require("./config.js");
const ip_js_1 = require("./network/ip.js");
const stateMachine_js_1 = require("./state/stateMachine.js");
const socketHandler_js_1 = require("./socket/socketHandler.js");
const authService_js_1 = require("./auth/authService.js");
const app = (0, express_1.default)();
exports.app = app;
const server = http_1.default.createServer(app);
exports.server = server;
// Enable CORS
app.use((0, cors_1.default)({
    origin: '*',
    methods: ['GET', 'POST'],
}));
app.use(express_1.default.json());
// Initialize Core State Machine & Socket Handlers
const stateMachine = new stateMachine_js_1.StateMachine();
exports.stateMachine = stateMachine;
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
    pingInterval: 10000,
    pingTimeout: 5000,
});
(0, socketHandler_js_1.setupSocketHandlers)(io, stateMachine);
// REST API Endpoints
app.get('/api/status', (_req, res) => {
    res.json(stateMachine.getSnapshot());
});
app.get('/api/network', (_req, res) => {
    const net = (0, ip_js_1.getLocalNetworkInfo)();
    res.json({
        ...net,
        port: config_js_1.CONFIG.PORT,
        controllerUrl: `http://${net.ipv4}:${config_js_1.CONFIG.PORT}/controller`,
        displayUrl: `http://${net.ipv4}:${config_js_1.CONFIG.PORT}/display`,
        adminUrl: `http://${net.ipv4}:${config_js_1.CONFIG.PORT}/admin`,
    });
});
app.post('/api/admin/login', (req, res) => {
    const { pin } = req.body;
    const result = authService_js_1.AuthService.verifyAdminPin(pin);
    if (result.success) {
        res.json(result);
    }
    else {
        res.status(401).json(result);
    }
});
// Serve video directory (e.g. /video/1.mp4)
const rootVideoDir = path_1.default.resolve(process.cwd(), 'video');
const parentVideoDir = path_1.default.resolve(process.cwd(), '../video');
const videoDir = fs_1.default.existsSync(rootVideoDir) ? rootVideoDir : fs_1.default.existsSync(parentVideoDir) ? parentVideoDir : null;
if (videoDir) {
    console.log(`[HTTP] Serving video assets from: ${videoDir}`);
    app.use('/video', express_1.default.static(videoDir));
}
app.get('/api/video-check', (_req, res) => {
    const file1 = path_1.default.join(videoDir || '', '1.mp4');
    const exists = fs_1.default.existsSync(file1);
    res.json({ exists, path: '/video/1.mp4' });
});
// Serve frontend static build if available
const clientDistPath = path_1.default.resolve(process.cwd(), '../client/dist');
const localClientDist = path_1.default.resolve(process.cwd(), 'client/dist');
const distPath = fs_1.default.existsSync(clientDistPath) ? clientDistPath : fs_1.default.existsSync(localClientDist) ? localClientDist : null;
if (distPath) {
    console.log(`[HTTP] Serving static client build from: ${distPath}`);
    app.use(express_1.default.static(distPath));
    // Catch-all route to support client-side SPA routing
    app.get('*', (_req, res) => {
        res.sendFile(path_1.default.join(distPath, 'index.html'));
    });
}
else {
    app.get('/', (_req, res) => {
        const net = (0, ip_js_1.getLocalNetworkInfo)();
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
            <div class="badge">Socket.IO: PORT ${config_js_1.CONFIG.PORT}</div>
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
server.listen(config_js_1.CONFIG.PORT, config_js_1.CONFIG.HOST, () => {
    const net = (0, ip_js_1.getLocalNetworkInfo)();
    console.log(`
===================================================================
⚡  PROJECT AWAKEN — YENARTIFICA INAUGURATION CORE SERVER
===================================================================
  Host Bind      : ${config_js_1.CONFIG.HOST}:${config_js_1.CONFIG.PORT}
  Detected LAN IP: ${net.ipv4} (${net.interfaceName})
  Environment    : ${config_js_1.CONFIG.NODE_ENV}
  Security PIN   : [PROTECTED] (configured)

  🌐 LOCAL NETWORK ACCESS URLS:
  -----------------------------------------------------------------
  📱 Mobile Controller : http://${net.ipv4}:${config_js_1.CONFIG.PORT}/controller
  🖥️ Projector Display  : http://${net.ipv4}:${config_js_1.CONFIG.PORT}/display
  ⚙️ Admin Dashboard    : http://${net.ipv4}:${config_js_1.CONFIG.PORT}/admin
  🔍 Core Health API   : http://${net.ipv4}:${config_js_1.CONFIG.PORT}/api/status

  (If using Vite Dev Server, replace port with 5173)
===================================================================
  Server State: STANDBY — Ready for terminal connections.
===================================================================
`);
});
