"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupSocketHandlers = setupSocketHandlers;
const authService_js_1 = require("../auth/authService.js");
function setupSocketHandlers(io, sm) {
    // Listen to StateMachine events and broadcast to all connected clients
    sm.on('snapshotUpdated', (snapshot) => {
        io.emit('system:snapshot', snapshot);
    });
    sm.on('logAdded', (logEntry) => {
        io.emit('system:log', logEntry);
    });
    sm.on('inaugurationTriggered', () => {
        io.emit('inauguration:triggered', {
            timestamp: Date.now(),
            message: 'INスAUGURATION PROTOCOL ENGAGED',
        });
    });
    io.on('connection', (socket) => {
        // Send immediate snapshot on connection
        socket.emit('system:snapshot', sm.getSnapshot());
        // 1. Client Init / Request current snapshot
        socket.on('client:init', () => {
            socket.emit('system:snapshot', sm.getSnapshot());
        });
        // 2. Session Resume (Reconnect handling)
        socket.on('session:resume', (data) => {
            if (!data?.sessionToken) {
                socket.emit('session:resumed', { success: false, error: 'No token provided' });
                return;
            }
            const result = sm.resumeSession(data.sessionToken, socket.id);
            socket.emit('session:resumed', result);
        });
        // 3. Controller Register (Claiming an available slot)
        socket.on('controller:register', (data) => {
            const slotId = data?.slotId;
            const deviceName = data?.deviceName || `Mobile-${socket.id.slice(0, 4)}`;
            const result = sm.registerSlot(slotId, deviceName, socket.id);
            socket.emit('session:registered', result);
            if (!result.success) {
                socket.emit('error:notification', { message: result.error });
            }
        });
        // 4. Controller Authorize (Device pressing activation button)
        socket.on('controller:authorize', (data) => {
            const slotId = data?.slotId;
            const sessionToken = data?.sessionToken;
            const result = sm.authorizeSlot(slotId, sessionToken);
            socket.emit('controller:authorize_result', result);
            if (!result.success) {
                socket.emit('error:notification', { message: result.error });
            }
        });
        // 5. Admin Authentication
        socket.on('admin:login', (data) => {
            const result = authService_js_1.AuthService.verifyAdminPin(data?.pin);
            socket.emit('admin:auth_result', result);
        });
        // 6. Admin: ARM SYSTEM
        socket.on('admin:arm', (data) => {
            const result = sm.armSystem(data?.adminToken);
            socket.emit('admin:action_result', { action: 'arm', ...result });
            if (!result.success) {
                socket.emit('error:notification', { message: result.error });
            }
        });
        // 7. Admin: BEGIN INAUGURATION
        socket.on('admin:begin_inauguration', (data) => {
            const result = sm.beginInauguration(data?.adminToken);
            socket.emit('admin:action_result', { action: 'begin_inauguration', ...result });
            if (!result.success) {
                socket.emit('error:notification', { message: result.error });
            }
        });
        // 8. Admin: RESET SYSTEM
        socket.on('admin:reset', (data) => {
            const result = sm.resetSystem(data?.adminToken, data?.hardReset ?? false);
            socket.emit('admin:action_result', { action: 'reset', ...result });
            if (!result.success) {
                socket.emit('error:notification', { message: result.error });
            }
        });
        // 9. Admin: FORCE RELEASE SLOT
        socket.on('admin:release_slot', (data) => {
            const result = sm.releaseSlot(data?.adminToken, data?.slotId);
            socket.emit('admin:action_result', { action: 'release_slot', ...result });
            if (!result.success) {
                socket.emit('error:notification', { message: result.error });
            }
        });
        // 10. Admin: SET TARGET DEVICE COUNT (Dynamic 1 to N)
        socket.on('admin:set_device_count', (data) => {
            const result = sm.setTargetDeviceCount(data?.adminToken, data?.count);
            socket.emit('admin:action_result', { action: 'set_device_count', ...result });
            if (!result.success) {
                socket.emit('error:notification', { message: result.error });
            }
        });
        // 11. Display: Video playback ended
        socket.on('display:inauguration_complete', () => {
            sm.completeInauguration();
        });
        // Disconnect handling
        socket.on('disconnect', () => {
            sm.handleDisconnect(socket.id);
        });
    });
}
