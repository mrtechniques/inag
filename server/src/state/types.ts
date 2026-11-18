export type SystemState =
  | 'STANDBY'
  | 'CONNECTING'
  | 'READY'
  | 'ARMED'
  | 'ALL_AUTHORIZED'
  | 'COUNTDOWN'
  | 'AWAKENING'
  | 'LOGO_REVEAL'
  | 'INAUGURATED';

export type SlotId = number;

export interface SlotState {
  id: SlotId;
  label: string;
  role: string;
  claimed: boolean;
  connected: boolean;
  sessionToken: string | null;
  socketId: string | null;
  deviceName: string | null;
  authorized: boolean;
  authorizedAt: number | null;
  lastConnectedAt: number | null;
}

export interface SystemLogEntry {
  id: string;
  timestamp: number;
  type: 'INFO' | 'WARN' | 'SUCCESS' | 'ERROR' | 'ALERT';
  message: string;
  source: 'SYSTEM' | 'ADMIN' | string;
}

export interface SystemSnapshot {
  state: SystemState;
  targetDeviceCount: number;
  slots: Record<SlotId, SlotState>;
  connectedCount: number;
  authorizedCount: number;
  armedAt: number | null;
  inauguratedAt: number | null;
  network: {
    ipv4: string;
    port: number;
    controllerUrl: string;
    displayUrl: string;
    adminUrl: string;
  };
  logs: SystemLogEntry[];
}
