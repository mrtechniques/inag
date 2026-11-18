import { EventEmitter } from 'events';
import { SystemState, SlotId, SlotState, SystemSnapshot, SystemLogEntry } from './types.js';
import { getLocalNetworkInfo } from '../network/ip.js';
import { CONFIG } from '../config.js';
import { AuthService } from '../auth/authService.js';

export interface StateMachineEvents {
  stateChanged: (state: SystemState, prev: SystemState) => void;
  snapshotUpdated: (snapshot: SystemSnapshot) => void;
  logAdded: (entry: SystemLogEntry) => void;
  inaugurationTriggered: () => void;
}

const DEFAULT_ROLES: { label: string; role: string }[] = [
  { label: 'Terminal Alpha', role: 'Chief Guest / Dignitary 1' },
  { label: 'Terminal Beta', role: 'Head of Department / Dignitary 2' },
  { label: 'Terminal Gamma', role: 'Faculty Coordinator / Dignitary 3' },
  { label: 'Terminal Delta', role: 'Student Lead / Dignitary 4' },
  { label: 'Terminal Epsilon', role: 'Guest of Honour / Dignitary 5' },
  { label: 'Terminal Zeta', role: 'Keynote Speaker / Dignitary 6' },
  { label: 'Terminal Eta', role: 'Dean / Dignitary 7' },
  { label: 'Terminal Theta', role: 'Director / Dignitary 8' },
];

function getDefaultSlotInfo(id: number): { label: string; role: string } {
  if (id <= DEFAULT_ROLES.length) {
    return DEFAULT_ROLES[id - 1];
  }
  return {
    label: `Terminal ${id < 10 ? '0' + id : id}`,
    role: `Participant / Dignitary ${id}`,
  };
}

export class StateMachine extends EventEmitter {
  private state: SystemState = 'STANDBY';
  private targetCount: number = 3;
  private armedAt: number | null = null;
  private inauguratedAt: number | null = null;
  private logs: SystemLogEntry[] = [];
  private maxLogs = 100;

  private slots: Record<SlotId, SlotState> = {};

  constructor() {
    super();
    this.initSlots(3);
    this.addLog('INFO', 'SYSTEM', 'YENARTIFICA Core State Machine Initialized in STANDBY mode (3 devices).');
  }

  private initSlots(count: number): void {
    const newSlots: Record<SlotId, SlotState> = {};
    for (let i = 1; i <= count; i++) {
      if (this.slots[i]) {
        newSlots[i] = this.slots[i];
      } else {
        const info = getDefaultSlotInfo(i);
        newSlots[i] = {
          id: i,
          label: info.label,
          role: info.role,
          claimed: false,
          connected: false,
          sessionToken: null,
          socketId: null,
          deviceName: null,
          authorized: false,
          authorizedAt: null,
          lastConnectedAt: null,
        };
      }
    }
    this.slots = newSlots;
    this.targetCount = count;
  }

  public getState(): SystemState {
    return this.state;
  }

  public getTargetDeviceCount(): number {
    return this.targetCount;
  }

  public getSnapshot(): SystemSnapshot {
    const net = getLocalNetworkInfo();
    const port = CONFIG.PORT;
    const base = `http://${net.ipv4}:${port}`;

    let connectedCount = 0;
    let authorizedCount = 0;

    for (const slot of Object.values(this.slots)) {
      if (slot.connected) connectedCount++;
      if (slot.authorized) authorizedCount++;
    }

    return {
      state: this.state,
      targetDeviceCount: this.targetCount,
      slots: { ...this.slots },
      connectedCount,
      authorizedCount,
      armedAt: this.armedAt,
      inauguratedAt: this.inauguratedAt,
      network: {
        ipv4: net.ipv4,
        port,
        controllerUrl: `${base}/controller`,
        displayUrl: `${base}/display`,
        adminUrl: `${base}/admin`,
      },
      logs: this.logs.slice(-30),
    };
  }

  public addLog(
    type: SystemLogEntry['type'],
    source: SystemLogEntry['source'],
    message: string
  ): void {
    const entry: SystemLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
      type,
      source,
      message,
    };
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
    this.emit('logAdded', entry);
  }

  /**
   * Admin sets target device count dynamically (minimum 1).
   */
  public setTargetDeviceCount(adminToken: string, count: number): { success: boolean; error?: string } {
    if (!AuthService.validateAdminToken(adminToken)) {
      return { success: false, error: 'Unauthorized: Invalid Admin Credentials.' };
    }

    const n = Math.floor(Number(count));
    if (isNaN(n) || n < 1 || n > 12) {
      return { success: false, error: 'Device count must be a number between 1 and 12.' };
    }

    if (['COUNTDOWN', 'AWAKENING', 'LOGO_REVEAL', 'INAUGURATED'].includes(this.state)) {
      return { success: false, error: 'Cannot change device count during or after inauguration sequence.' };
    }

    const prevCount = this.targetCount;
    this.initSlots(n);

    this.addLog('INFO', 'ADMIN', `Administrator updated required participant devices: ${prevCount} ➔ ${n}.`);
    this.recalculateState(true);
    this.broadcastUpdate();

    return { success: true };
  }

  /**
   * Device attempts to reclaim an existing slot using its saved session token.
   */
  public resumeSession(sessionToken: string, socketId: string): { success: boolean; slot?: SlotState; error?: string } {
    for (const slot of Object.values(this.slots)) {
      if (slot.sessionToken === sessionToken) {
        slot.connected = true;
        slot.socketId = socketId;
        slot.lastConnectedAt = Date.now();
        this.addLog('SUCCESS', `SLOT_${slot.id}`, `${slot.label} reconnected (Session resumed).`);
        this.recalculateState();
        this.broadcastUpdate();
        return { success: true, slot: { ...slot } };
      }
    }
    return { success: false, error: 'Session token not recognized or expired.' };
  }

  /**
   * Device registers into a specific slot.
   */
  public registerSlot(
    slotId: SlotId,
    deviceName: string,
    socketId: string
  ): { success: boolean; token?: string; slot?: SlotState; error?: string } {
    if (!this.slots[slotId]) {
      return { success: false, error: `Invalid slot ID. Must be between 1 and ${this.targetCount}.` };
    }

    const targetSlot = this.slots[slotId];

    // If slot is already claimed and currently connected by another device
    if (targetSlot.claimed && targetSlot.connected && targetSlot.socketId !== socketId) {
      return { success: false, error: `${targetSlot.label} is currently active and occupied.` };
    }

    // Check if total claimed slots is at capacity and this is another device trying to take an unclaimed slot
    const allClaimed = Object.values(this.slots).every(s => s.claimed);
    if (allClaimed && !targetSlot.claimed) {
      return { success: false, error: `System capacity reached (${this.targetCount}/${this.targetCount}). No additional devices permitted.` };
    }

    // Claim slot
    const token = AuthService.generateDeviceToken(slotId);
    targetSlot.claimed = true;
    targetSlot.connected = true;
    targetSlot.sessionToken = token;
    targetSlot.socketId = socketId;
    targetSlot.deviceName = deviceName || `Device ${slotId}`;
    targetSlot.lastConnectedAt = Date.now();

    this.addLog('INFO', `SLOT_${slotId}`, `${targetSlot.label} registered by "${targetSlot.deviceName}".`);
    this.recalculateState();
    this.broadcastUpdate();

    return { success: true, token, slot: { ...targetSlot } };
  }

  /**
   * Device Authorizes its assigned slot.
   */
  public authorizeSlot(
    slotId: SlotId,
    sessionToken: string
  ): { success: boolean; error?: string } {
    const slot = this.slots[slotId];
    if (!slot) {
      return { success: false, error: 'Invalid slot.' };
    }

    // Validate token
    if (slot.sessionToken !== sessionToken) {
      this.addLog('ERROR', 'SYSTEM', `Unauthorized activation attempt on ${slot.label}. Token mismatch.`);
      return { success: false, error: 'Device session token verification failed.' };
    }

    // Check if system is ARMED
    if (this.state !== 'ARMED') {
      return { success: false, error: 'Authorization denied: System is not in ARMED state.' };
    }

    // Prevent duplicate authorization
    if (slot.authorized) {
      return { success: false, error: 'Slot has already authorized. Duplicate authorization prevented.' };
    }

    slot.authorized = true;
    slot.authorizedAt = Date.now();

    this.addLog('SUCCESS', `SLOT_${slotId}`, `✓ ${slot.label} AUTHORIZED successfully.`);

    this.recalculateState();
    this.broadcastUpdate();

    return { success: true };
  }

  /**
   * Admin: Arm the system.
   */
  public armSystem(adminToken: string): { success: boolean; error?: string } {
    if (!AuthService.validateAdminToken(adminToken)) {
      return { success: false, error: 'Unauthorized: Invalid Admin Credentials.' };
    }

    const slotList = Object.values(this.slots);
    const allConnected = slotList.every(s => s.connected && s.claimed);
    if (!allConnected) {
      const missing = slotList.filter(s => !s.connected || !s.claimed).map(s => s.label);
      return { success: false, error: `Cannot ARM system. Missing devices (${slotList.filter(s => s.connected && s.claimed).length}/${this.targetCount}): ${missing.join(', ')}.` };
    }

    if (this.state === 'ARMED') {
      return { success: false, error: 'System is already ARMED.' };
    }

    this.state = 'ARMED';
    this.armedAt = Date.now();
    this.addLog('ALERT', 'ADMIN', `SYSTEM ARMED. All ${this.targetCount} mobile authorization terminals enabled.`);
    this.emit('stateChanged', this.state, 'READY');
    this.broadcastUpdate();

    return { success: true };
  }

  /**
   * Admin: Begin Inauguration.
   */
  public beginInauguration(adminToken: string): { success: boolean; error?: string } {
    if (!AuthService.validateAdminToken(adminToken)) {
      return { success: false, error: 'Unauthorized: Invalid Admin Credentials.' };
    }

    // Prevent multiple triggers or invalid states
    if (this.state !== 'ALL_AUTHORIZED') {
      if (['COUNTDOWN', 'AWAKENING', 'LOGO_REVEAL', 'INAUGURATED'].includes(this.state)) {
        return { success: false, error: 'Inauguration sequence is already in progress or completed.' };
      }
      return { success: false, error: `Cannot begin inauguration: All ${this.targetCount} devices must authorize first.` };
    }

    const slotList = Object.values(this.slots);
    const allAuthorized = slotList.every(s => s.authorized);
    if (!allAuthorized) {
      return { success: false, error: `Cannot begin inauguration: All ${this.targetCount} devices must authorize first.` };
    }

    const prev = this.state;
    this.state = 'COUNTDOWN';
    this.inauguratedAt = Date.now();
    this.addLog('ALERT', 'ADMIN', '★ BEGIN INAUGURATION TRIGGERED. Initiating countdown sequence.');
    this.emit('stateChanged', this.state, prev);
    this.emit('inaugurationTriggered');
    this.broadcastUpdate();

    return { success: true };
  }

  /**
   * Called when video finishes playing or ceremony is complete.
   */
  public completeInauguration(): void {
    if (this.state !== 'INAUGURATED') {
      const prev = this.state;
      this.state = 'INAUGURATED';
      this.addLog('ALERT', 'SYSTEM', '✦ YENARTIFICA OFFICIALLY INAUGURATED! Ceremony sequence complete.');
      this.emit('stateChanged', this.state, prev);
      this.broadcastUpdate();
    }
  }

  /**
   * Admin: Reset the system.
   */
  public resetSystem(adminToken: string, hardReset: boolean = false): { success: boolean; error?: string } {
    if (!AuthService.validateAdminToken(adminToken)) {
      return { success: false, error: 'Unauthorized: Invalid Admin Credentials.' };
    }

    const prev = this.state;
    this.state = 'STANDBY';

    for (const slot of Object.values(this.slots)) {
      slot.authorized = false;
      slot.authorizedAt = null;

      if (hardReset) {
        slot.claimed = false;
        slot.connected = false;
        slot.sessionToken = null;
        slot.socketId = null;
        slot.deviceName = null;
      }
    }

    this.armedAt = null;
    this.inauguratedAt = null;
    this.addLog('WARN', 'ADMIN', hardReset ? 'EMERGENCY FULL RESET executed by administrator.' : 'System authorizations reset by administrator.');
    this.recalculateState(true);
    this.emit('stateChanged', this.state, prev);
    this.broadcastUpdate();

    return { success: true };
  }

  /**
   * Admin: Force release a single slot (if a device dies or was misassigned).
   */
  public releaseSlot(adminToken: string, slotId: SlotId): { success: boolean; error?: string } {
    if (!AuthService.validateAdminToken(adminToken)) {
      return { success: false, error: 'Unauthorized: Invalid Admin Credentials.' };
    }

    const slot = this.slots[slotId];
    if (!slot) return { success: false, error: 'Invalid slot ID.' };

    slot.claimed = false;
    slot.connected = false;
    slot.sessionToken = null;
    slot.socketId = null;
    slot.deviceName = null;
    slot.authorized = false;
    slot.authorizedAt = null;

    this.addLog('WARN', 'ADMIN', `Slot ${slotId} (${slot.label}) forcefully released by administrator.`);
    this.recalculateState();
    this.broadcastUpdate();

    return { success: true };
  }

  /**
   * Socket disconnect handler.
   */
  public handleDisconnect(socketId: string): void {
    for (const slot of Object.values(this.slots)) {
      if (slot.socketId === socketId) {
        slot.connected = false;
        slot.socketId = null;
        this.addLog('WARN', `SLOT_${slot.id}`, `${slot.label} disconnected (Authorization state preserved).`);
        this.recalculateState();
        this.broadcastUpdate();
        break;
      }
    }
  }

  /**
   * Internal state recalculation based on device connections and authorizations.
   */
  private recalculateState(force: boolean = false): void {
    const prev = this.state;

    // Do not revert if already in COUNTDOWN, AWAKENING, LOGO_REVEAL, or INAUGURATED unless forced
    if (!force && ['COUNTDOWN', 'AWAKENING', 'LOGO_REVEAL', 'INAUGURATED'].includes(this.state)) {
      return;
    }

    const slotList = Object.values(this.slots);
    const allConnected = slotList.length > 0 && slotList.every(s => s.connected && s.claimed);
    const allAuthorized = slotList.length > 0 && slotList.every(s => s.authorized);
    const anyConnected = slotList.some(s => s.connected && s.claimed);

    if (allAuthorized) {
      if (this.state !== 'COUNTDOWN' && this.state !== 'AWAKENING' && this.state !== 'LOGO_REVEAL' && this.state !== 'INAUGURATED') {
        this.state = 'COUNTDOWN';
        this.inauguratedAt = Date.now();
        this.addLog('ALERT', 'SYSTEM', `★ ALL ${this.targetCount} AUTHORIZATIONS RECEIVED! Automatic 3-2-1 Countdown & Inauguration Video Sequence Engaged!`);
        this.emit('stateChanged', this.state, prev);
        this.emit('inaugurationTriggered');
        return;
      }
    } else if (this.state === 'ARMED') {
      // Keep ARMED once armed until reset or all authorized
      this.state = 'ARMED';
    } else if (allConnected) {
      this.state = 'READY';
    } else if (anyConnected) {
      this.state = 'CONNECTING';
    } else {
      this.state = 'STANDBY';
    }

    if (prev !== this.state) {
      this.addLog('INFO', 'SYSTEM', `System State transitioned: ${prev} ➔ ${this.state}`);
      this.emit('stateChanged', this.state, prev);
    }
  }

  private broadcastUpdate(): void {
    this.emit('snapshotUpdated', this.getSnapshot());
  }
}
