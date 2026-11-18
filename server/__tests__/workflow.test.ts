import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import { server, stateMachine } from '../src/index.js';
import { CONFIG } from '../src/config.js';
import { SystemSnapshot } from '../src/state/types.js';

const PORT = CONFIG.PORT;
const SERVER_URL = `http://127.0.0.1:${PORT}`;

function createClient(): ClientSocket {
  const socket = Client(SERVER_URL, {
    transports: ['polling', 'websocket'],
    forceNew: true,
    reconnection: false,
  });
  socket.on('connect_error', (err) => {
    console.error(`[SOCKET CLIENT ERROR] on ${SERVER_URL}:`, err.message);
  });
  return socket;
}

function waitForEvent<T = any>(socket: ClientSocket, event: string, timeout = 3000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for event "${event}"`));
    }, timeout);

    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

function waitForSnapshot(socket: ClientSocket, predicate: (snap: SystemSnapshot) => boolean, timeout = 3000): Promise<SystemSnapshot> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout waiting for snapshot matching predicate`));
    }, timeout);

    const handler = (snap: SystemSnapshot) => {
      if (predicate(snap)) {
        clearTimeout(timer);
        socket.off('system:snapshot', handler);
        resolve(snap);
      }
    };
    socket.on('system:snapshot', handler);
  });
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runTests() {
  console.log('🧪 ========================================================');
  console.log('🧪 RUNNING PROJECT AWAKEN — MILESTONE 1 VERIFICATION TESTS');
  console.log('🧪 ========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, errorDetail?: any) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      if (errorDetail) console.error('     Detail:', errorDetail);
      failed++;
    }
  }

  // Sockets for our devices
  let client1: ClientSocket;
  let client2: ClientSocket;
  let client3: ClientSocket;
  let client4: ClientSocket;
  let adminClient: ClientSocket;

  let token1: string = '';
  let token2: string = '';
  let token3: string = '';
  let adminToken: string = '';

  try {
    // Wait for server to be actively listening
    if (!server.listening) {
      await new Promise(resolve => server.once('listening', resolve));
    }
    await sleep(100);

    // 0. Connect admin client and authenticate
    adminClient = createClient();
    await waitForEvent(adminClient, 'connect');
    
    adminClient.emit('admin:login', { pin: CONFIG.ADMIN_PIN });
    const authRes = await waitForEvent<{ success: boolean; token: string }>(adminClient, 'admin:auth_result');
    assert(authRes.success && !!authRes.token, 'Admin PIN Authentication with correct PIN');
    adminToken = authRes.token;

    // Reset state cleanly before test run
    adminClient.emit('admin:reset', { adminToken, hardReset: true });
    await sleep(200);

    // Initial state check
    assert(stateMachine.getState() === 'STANDBY', 'Initial state is STANDBY');

    // 1. Device 1 connects and registers into Slot 1
    client1 = createClient();
    await waitForEvent(client1, 'connect');
    client1.emit('controller:register', { slotId: 1, deviceName: 'iPhone 15 - Chief Guest' });
    const reg1 = await waitForEvent<{ success: boolean; token: string }>(client1, 'session:registered');
    assert(reg1.success && !!reg1.token, 'Device 1 registered into Slot 1');
    token1 = reg1.token;

    // 2. Device 2 connects and registers into Slot 2
    client2 = createClient();
    await waitForEvent(client2, 'connect');
    client2.emit('controller:register', { slotId: 2, deviceName: 'Galaxy S24 - HOD' });
    const reg2 = await waitForEvent<{ success: boolean; token: string }>(client2, 'session:registered');
    assert(reg2.success && !!reg2.token, 'Device 2 registered into Slot 2');
    token2 = reg2.token;

    // Intermediate state: 2 devices connected -> CONNECTING
    assert(stateMachine.getState() === 'CONNECTING', 'System state is CONNECTING with 2 devices');

    // 3. Try to arm system with only 2 devices -> MUST BE REJECTED
    adminClient.emit('admin:arm', { adminToken });
    const armFailRes = await waitForEvent<{ success: boolean; error: string }>(adminClient, 'admin:action_result');
    assert(!armFailRes.success && stateMachine.getState() !== 'ARMED', 'Arming denied when only 2/3 devices are connected');

    // 4. Device 3 connects and registers into Slot 3
    client3 = createClient();
    await waitForEvent(client3, 'connect');
    client3.emit('controller:register', { slotId: 3, deviceName: 'Pixel 9 - Faculty Lead' });
    const reg3 = await waitForEvent<{ success: boolean; token: string }>(client3, 'session:registered');
    assert(reg3.success && !!reg3.token, 'Device 3 registered into Slot 3');
    token3 = reg3.token;

    // Now all 3 connected -> State must be READY
    assert(stateMachine.getState() === 'READY', 'System state transitions to READY with 3/3 devices');

    // 5. Fourth device attempts to register -> MUST BE REJECTED
    client4 = createClient();
    await waitForEvent(client4, 'connect');
    client4.emit('controller:register', { slotId: 1, deviceName: 'Intruder Device' });
    const reg4 = await waitForEvent<{ success: boolean; error: string }>(client4, 'session:registered');
    assert(!reg4.success, 'Fourth device registration rejected (capacity limit 3/3)');

    // 6. Device attempts to authorize BEFORE system is ARMED -> MUST BE REJECTED
    client1.emit('controller:authorize', { slotId: 1, sessionToken: token1 });
    const preArmAuth = await waitForEvent<{ success: boolean; error: string }>(client1, 'controller:authorize_result');
    assert(!preArmAuth.success, 'Authorization rejected when system is not yet ARMED');

    // 7. Admin arms system -> MUST SUCCEED
    adminClient.emit('admin:arm', { adminToken });
    const armSuccessRes = await waitForEvent<{ success: boolean }>(adminClient, 'admin:action_result');
    assert(armSuccessRes.success && stateMachine.getState() === 'ARMED', 'Admin successfully ARMED system (State: ARMED)');

    // 8. Device 1 authorizes -> MUST SUCCEED
    // Set up listener on client2 to verify real-time propagation of LED/authorization
    const updatePromise1 = waitForSnapshot(client2, snap => snap.slots[1].authorized === true);
    client1.emit('controller:authorize', { slotId: 1, sessionToken: token1 });
    const auth1 = await waitForEvent<{ success: boolean }>(client1, 'controller:authorize_result');
    const snap1 = await updatePromise1;
    assert(auth1.success && snap1.slots[1].authorized === true, 'Device 1 authorized and state propagated to peers (1/3)');

    // 9. Device 1 tries duplicate authorization -> MUST BE REJECTED
    client1.emit('controller:authorize', { slotId: 1, sessionToken: token1 });
    const authDup = await waitForEvent<{ success: boolean }>(client1, 'controller:authorize_result');
    assert(!authDup.success, 'Duplicate authorization from Device 1 prevented');

    // 10. Admin attempts to Begin Inauguration at 1/3 -> MUST BE REJECTED
    adminClient.emit('admin:begin_inauguration', { adminToken });
    const prematureInaug = await waitForEvent<{ success: boolean }>(adminClient, 'admin:action_result');
    assert(!prematureInaug.success, 'Begin Inauguration rejected when progress is only 1/3');

    // 11. Device 2 authorizes (2/3)
    client2.emit('controller:authorize', { slotId: 2, sessionToken: token2 });
    const auth2 = await waitForEvent<{ success: boolean }>(client2, 'controller:authorize_result');
    assert(auth2.success, 'Device 2 authorized (2/3)');

    // 12. Test temporary disconnect & reconnect of Device 3 before authorizing
    client3.disconnect();
    await sleep(200);
    assert(!stateMachine.getSnapshot().slots[3].connected, 'Device 3 disconnected safely');

    // Reconnect Device 3 with session token
    client3 = createClient();
    await waitForEvent(client3, 'connect');
    client3.emit('session:resume', { sessionToken: token3 });
    const resumeRes = await waitForEvent<{ success: boolean; slot: any }>(client3, 'session:resumed');
    assert(resumeRes.success && resumeRes.slot.id === 3, 'Device 3 successfully resumed session and slot reservation');

    // 13. Device 3 authorizes (3/3) -> System must transition to ALL_AUTHORIZED
    const snapPromise3 = waitForEvent<SystemSnapshot>(adminClient, 'system:snapshot');
    client3.emit('controller:authorize', { slotId: 3, sessionToken: token3 });
    const auth3 = await waitForEvent<{ success: boolean }>(client3, 'controller:authorize_result');
    const snap3 = await snapPromise3;
    assert(auth3.success && snap3.state === 'ALL_AUTHORIZED' && snap3.authorizedCount === 3, 'All 3 devices authorized -> State: ALL_AUTHORIZED (3/3)');

    // 14. Begin Inauguration now -> MUST SUCCEED and trigger inauguration sequence
    const inaugEventPromise = waitForEvent(client1, 'inauguration:triggered');
    adminClient.emit('admin:begin_inauguration', { adminToken });
    const inaugResult = await waitForEvent<{ success: boolean }>(adminClient, 'admin:action_result');
    const inaugEvent = await inaugEventPromise;
    assert(inaugResult.success && stateMachine.getState() === 'COUNTDOWN' && !!inaugEvent, 'Begin Inauguration triggered countdown & broadcasted event to all clients');

    // 15. Attempt duplicate inauguration trigger -> MUST BE REJECTED
    adminClient.emit('admin:begin_inauguration', { adminToken });
    const dupInaug = await waitForEvent<{ success: boolean }>(adminClient, 'admin:action_result');
    assert(!dupInaug.success, 'Duplicate Inauguration trigger prevented');

    // 16. Test Emergency Reset
    adminClient.emit('admin:reset', { adminToken, hardReset: false });
    const resetRes = await waitForEvent<{ success: boolean }>(adminClient, 'admin:action_result');
    const snapAfterReset = stateMachine.getSnapshot();
    assert(resetRes.success && snapAfterReset.authorizedCount === 0 && snapAfterReset.state === 'READY', 'Admin Reset successfully cleared authorizations back to READY');

    // 17. Test Dynamic Device Count: Rejection of invalid count (< 1)
    adminClient.emit('admin:set_device_count', { adminToken, count: 0 });
    const invalidCountRes = await waitForEvent<{ success: boolean }>(adminClient, 'admin:action_result');
    assert(!invalidCountRes.success, 'Rejection of invalid device count (0 devices)');

    // 18. Test Dynamic Device Count: Set target devices to 1 (Min 1)
    adminClient.emit('admin:reset', { adminToken, hardReset: true });
    await sleep(100);
    adminClient.emit('admin:set_device_count', { adminToken, count: 1 });
    const set1Res = await waitForEvent<{ success: boolean }>(adminClient, 'admin:action_result');
    const snapAfterSet1 = stateMachine.getSnapshot();
    assert(set1Res.success && snapAfterSet1.targetDeviceCount === 1 && Object.keys(snapAfterSet1.slots).length === 1, 'Admin dynamically changed device requirement to 1 terminal (Min 1)');

    // 19. Single-device Inauguration Workflow (1/1)
    // Connect single client
    const singleClient = createClient();
    await waitForEvent(singleClient, 'connect');
    singleClient.emit('controller:register', { slotId: 1, deviceName: 'VIP Solo Tablet' });
    const singleReg = await waitForEvent<{ success: boolean; token: string }>(singleClient, 'session:registered');
    assert(singleReg.success && stateMachine.getState() === 'READY', 'Single device registered -> transitions to READY immediately with 1/1');

    // Admin arms single-device system
    adminClient.emit('admin:arm', { adminToken });
    const singleArm = await waitForEvent<{ success: boolean }>(adminClient, 'admin:action_result');
    assert(singleArm.success && stateMachine.getState() === 'ARMED', 'System ARMED for 1-device inauguration');

    // Single device authorizes
    singleClient.emit('controller:authorize', { slotId: 1, sessionToken: singleReg.token });
    const singleAuth = await waitForEvent<{ success: boolean }>(singleClient, 'controller:authorize_result');
    assert(singleAuth.success && stateMachine.getState() === 'ALL_AUTHORIZED', 'Single device authorized -> reaches ALL_AUTHORIZED (1/1)');

    // Begin Inauguration on single-device system
    adminClient.emit('admin:begin_inauguration', { adminToken });
    const singleInaug = await waitForEvent<{ success: boolean }>(adminClient, 'admin:action_result');
    assert(singleInaug.success && stateMachine.getState() === 'COUNTDOWN', 'Begin Inauguration triggered for 1-device ceremony');

    singleClient.disconnect();

  } catch (err) {
    console.error('💥 Unexpected test error:', err);
    failed++;
  } finally {
    // Cleanup sockets
    client1?.disconnect();
    client2?.disconnect();
    client3?.disconnect();
    client4?.disconnect();
    adminClient?.disconnect();
    server.close();
  }

  console.log('\n========================================================');
  console.log(`🏁 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run tests
runTests();
