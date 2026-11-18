import React, { useState } from 'react';
import { useSocket } from '../hooks/useSocket';
import { SlotCard } from '../components/SlotCard';
import { StatusBadge } from '../components/StatusBadge';
import { SystemLog } from '../components/SystemLog';
import { sound } from '../utils/audio';
import { 
  Shield, 
  Key, 
  Play, 
  RotateCcw, 
  AlertTriangle, 
  Copy, 
  Check, 
  Trash2,
  Share2,
  ExternalLink,
  Lock,
  Smartphone,
  Plus,
  Minus
} from 'lucide-react';
import { SlotId } from '../types';

export const AdminPage: React.FC = () => {
  const { socket, snapshot, connected, errorNotification } = useSocket();

  const [adminPin, setAdminPin] = useState('2025');
  const [adminToken, setAdminToken] = useState<string | null>(() => {
    return sessionStorage.getItem('yenartifica_admin_token');
  });
  const [authError, setAuthError] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Admin login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !connected) return;
    setAuthError(null);
    sound.playClick();

    socket.emit('admin:login', { pin: adminPin });

    socket.once('admin:auth_result', (res: { success: boolean; token?: string; error?: string }) => {
      if (res.success && res.token) {
        sessionStorage.setItem('yenartifica_admin_token', res.token);
        setAdminToken(res.token);
        sound.playClick();
      } else {
        setAuthError(res.error || 'Invalid Admin Security PIN');
      }
    });
  };

  const handleLogout = () => {
    sessionStorage.removeItem('yenartifica_admin_token');
    setAdminToken(null);
  };

  // Dynamic device count update
  const handleSetDeviceCount = (count: number) => {
    if (!socket || !adminToken) return;
    sound.playClick();
    socket.emit('admin:set_device_count', { adminToken, count });
  };

  // Admin Actions
  const handleArm = () => {
    if (!socket || !adminToken) return;
    setActionLoading(true);
    sound.playClick();
    socket.emit('admin:arm', { adminToken });
    setTimeout(() => setActionLoading(false), 500);
  };

  const handleBeginInauguration = () => {
    if (!socket || !adminToken) return;
    setActionLoading(true);
    sound.playInaugurate();
    socket.emit('admin:begin_inauguration', { adminToken });
    setTimeout(() => setActionLoading(false), 500);
  };

  const handleReset = (hardReset: boolean = false) => {
    if (!socket || !adminToken) return;
    if (hardReset && !confirm('Are you sure you want to completely wipe all device registrations?')) return;
    setActionLoading(true);
    sound.playClick();
    socket.emit('admin:reset', { adminToken, hardReset });
    setTimeout(() => setActionLoading(false), 500);
  };

  const handleReleaseSlot = (slotId: SlotId) => {
    if (!socket || !adminToken) return;
    sound.playClick();
    socket.emit('admin:release_slot', { adminToken, slotId });
  };

  const copyToClipboard = (url: string, key: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(key);
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  const state = snapshot?.state || 'STANDBY';
  const targetDeviceCount = snapshot?.targetDeviceCount || 3;
  const slots = snapshot?.slots || {};
  const slotList = Object.values(slots).sort((a, b) => a.id - b.id);

  const connectedCount = snapshot?.connectedCount || 0;
  const authorizedCount = snapshot?.authorizedCount || 0;

  // Dynamic validation rules
  const canArm = connectedCount === targetDeviceCount && state !== 'ARMED' && state !== 'ALL_AUTHORIZED' && state !== 'COUNTDOWN';
  const canInaugurate = authorizedCount === targetDeviceCount && state === 'ALL_AUTHORIZED';
  const canModifyDeviceCount = !['COUNTDOWN', 'AWAKENING', 'LOGO_REVEAL', 'INAUGURATED'].includes(state);

  const network = snapshot?.network || {
    ipv4: '127.0.0.1',
    port: 4000,
    controllerUrl: 'http://127.0.0.1:4000/controller',
    displayUrl: 'http://127.0.0.1:4000/display',
    adminUrl: 'http://127.0.0.1:4000/admin',
  };

  // Dynamic grid column class based on device count
  const getGridColsClass = () => {
    if (slotList.length === 1) return 'max-w-md mx-auto';
    if (slotList.length === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto';
    if (slotList.length === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-6';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-8 bg-grid-cyber selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <header className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-cyan-500/20 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center glow-cyan">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-mono text-xl font-bold tracking-widest text-slate-100">
                ADMIN COMMAND CONSOLE
              </h1>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 border border-cyan-400/40 text-cyan-300">
                AUTHORITATIVE
              </span>
            </div>
            <p className="text-xs font-mono text-slate-400">
              YENARTIFICA Dynamic State Machine & Terminal Management
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <StatusBadge state={state} size="md" />

          {adminToken && (
            <button
              onClick={handleLogout}
              className="text-xs font-mono px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-400 hover:text-rose-400 hover:border-rose-800 transition-colors"
            >
              Lock Console
            </button>
          )}
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-7xl mx-auto py-6 space-y-6">
        {/* Error Notification */}
        {errorNotification && (
          <div className="bg-rose-950/80 border border-rose-500/80 text-rose-200 p-4 rounded-xl text-xs font-mono flex items-center gap-3 glow-red">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{errorNotification}</span>
          </div>
        )}

        {/* PIN Authentication Gate */}
        {!adminToken ? (
          <div className="max-w-md mx-auto my-12 cyber-panel p-8 rounded-2xl border border-cyan-500/40 glow-cyan">
            <div className="flex flex-col items-center text-center space-y-3 mb-6">
              <div className="w-14 h-14 rounded-full bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center">
                <Lock className="w-7 h-7 text-cyan-400" />
              </div>
              <h2 className="font-mono text-lg font-bold text-slate-100 tracking-wider">
                ADMIN SECURITY VERIFICATION
              </h2>
              <p className="font-mono text-xs text-slate-400">
                Enter the master administrator PIN to operate arming, inauguration, and dynamic device capacity.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
              <div>
                <label className="text-slate-300 block mb-1">Administrator PIN:</label>
                <div className="flex items-center gap-2">
                  <Key className="w-4 h-4 text-cyan-400" />
                  <input
                    type="password"
                    value={adminPin}
                    onChange={(e) => setAdminPin(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 font-mono tracking-widest text-center text-base focus:border-cyan-400 focus:outline-none"
                    placeholder="Enter PIN (Default: 2025)"
                  />
                </div>
              </div>

              {authError && (
                <div className="text-rose-400 text-xs font-mono text-center">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={!connected}
                className="w-full py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs tracking-wider transition-all duration-200 active:scale-95 glow-cyan"
              >
                UNLOCK CONSOLE
              </button>
            </form>
          </div>
        ) : (
          /* Unlocked Admin Operations */
          <>
            {/* Dynamic Mobile Device Capacity Selector */}
            <div className="cyber-panel p-5 rounded-2xl border border-cyan-500/30">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-mono text-sm font-bold text-slate-100 tracking-wider">
                      PARTICIPANT DEVICE REQUIREMENT
                    </h3>
                    <p className="text-xs font-mono text-slate-400">
                      Configure how many mobile controllers are required for inauguration (min 1).
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono">
                  {/* Stepper controls */}
                  <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl overflow-hidden p-1 gap-1">
                    <button
                      type="button"
                      disabled={!canModifyDeviceCount || targetDeviceCount <= 1}
                      onClick={() => handleSetDeviceCount(targetDeviceCount - 1)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-cyan-400 transition-colors"
                      title="Decrease device count"
                    >
                      <Minus className="w-4 h-4" />
                    </button>

                    <div className="px-4 py-1 text-center">
                      <span className="text-lg font-bold text-cyan-300">{targetDeviceCount}</span>
                      <span className="text-[10px] text-slate-400 block -mt-1">
                        {targetDeviceCount === 1 ? 'DEVICE' : 'DEVICES'}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={!canModifyDeviceCount || targetDeviceCount >= 8}
                      onClick={() => handleSetDeviceCount(targetDeviceCount + 1)}
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-cyan-400 transition-colors"
                      title="Increase device count"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="hidden sm:flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        disabled={!canModifyDeviceCount}
                        onClick={() => handleSetDeviceCount(num)}
                        className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                          targetDeviceCount === num
                            ? 'bg-cyan-500 text-slate-950 glow-cyan'
                            : 'bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-400'
                        }`}
                      >
                        {num}P
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* LAN URLs Quick Share Card */}
            <div className="cyber-panel p-5 rounded-2xl border border-cyan-500/30">
              <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
                <span className="flex items-center gap-2 font-mono text-xs text-cyan-400 font-bold tracking-wider">
                  <Share2 className="w-4 h-4" />
                  LOCAL NETWORK CONNECTION URLS (Wi-Fi / LAN)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  Host: {network.ipv4}:{network.port}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                {/* Mobile Controller URL */}
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">MOBILE CONTROLLER (For {targetDeviceCount} Devices):</span>
                    <a
                      href={network.controllerUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 font-semibold hover:underline flex items-center gap-1"
                    >
                      {network.controllerUrl}
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(network.controllerUrl, 'controller')}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl === 'controller' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {/* Projector Display URL */}
                <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
                  <div>
                    <span className="text-slate-400 block text-[10px]">PROJECTOR DISPLAY (Stage Screen):</span>
                    <a
                      href={network.displayUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-300 font-semibold hover:underline flex items-center gap-1"
                    >
                      {network.displayUrl}
                      <ExternalLink className="w-3 h-3 text-slate-500" />
                    </a>
                  </div>
                  <button
                    onClick={() => copyToClipboard(network.displayUrl, 'display')}
                    className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                    title="Copy URL"
                  >
                    {copiedUrl === 'display' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Core Action Command Bar */}
            <div className="cyber-panel p-6 rounded-2xl border border-cyan-500/40">
              <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
                <div>
                  <h3 className="font-mono text-base font-bold text-slate-100 tracking-wider">
                    EXECUTIVE PROTOCOL CONTROLS
                  </h3>
                  <p className="font-mono text-xs text-slate-400">
                    Step 1: Wait for {targetDeviceCount}/{targetDeviceCount} connections &rarr; ARM SYSTEM. Step 2: Dignitaries press mobile triggers &rarr; BEGIN INAUGURATION.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {/* ARM SYSTEM BUTTON */}
                  <button
                    disabled={!canArm || actionLoading}
                    onClick={handleArm}
                    className={`font-mono text-xs px-5 py-3 rounded-xl font-bold tracking-wider flex items-center gap-2 transition-all duration-200 active:scale-95 ${
                      canArm
                        ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 glow-cyan cursor-pointer'
                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <Key className="w-4 h-4" />
                    ARM SYSTEM ({connectedCount}/{targetDeviceCount} CONNECTED)
                  </button>

                  {/* BEGIN INAUGURATION BUTTON */}
                  <button
                    disabled={!canInaugurate || actionLoading}
                    onClick={handleBeginInauguration}
                    className={`font-mono text-xs px-6 py-3 rounded-xl font-bold tracking-wider flex items-center gap-2 transition-all duration-200 active:scale-95 ${
                      canInaugurate
                        ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 glow-green animate-pulse cursor-pointer'
                        : 'bg-slate-900 text-slate-600 border border-slate-800 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4" />
                    BEGIN INAUGURATION ({authorizedCount}/{targetDeviceCount} KEYS)
                  </button>

                  {/* RESET SYSTEM BUTTON */}
                  <button
                    onClick={() => handleReset(false)}
                    className="font-mono text-xs px-4 py-3 rounded-xl font-semibold tracking-wider bg-slate-900 hover:bg-amber-950/60 border border-amber-500/40 hover:border-amber-400 text-amber-300 flex items-center gap-2 transition-all duration-200 active:scale-95"
                    title="Reset authorizations back to standby/ready"
                  >
                    <RotateCcw className="w-4 h-4" />
                    RESET
                  </button>

                  {/* EMERGENCY HARD WIPE */}
                  <button
                    onClick={() => handleReset(true)}
                    className="font-mono text-xs px-3 py-3 rounded-xl font-semibold tracking-wider bg-slate-900 hover:bg-rose-950/60 border border-rose-500/40 hover:border-rose-400 text-rose-300 transition-all duration-200"
                    title="Emergency full reset: kicks all claimed slots"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Participant Terminal Slots Grid */}
            <div className={getGridColsClass()}>
              {slotList.map((slot) => {
                return (
                  <div key={slot.id} className="relative">
                    <SlotCard slot={slot} systemState={state} />

                    {/* Admin Force Release Slot button */}
                    {slot.claimed && (
                      <button
                        onClick={() => handleReleaseSlot(slot.id)}
                        className="mt-2 w-full py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/40 text-[11px] font-mono text-slate-400 hover:text-rose-300 transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3 text-rose-400" />
                        Force Evict / Free Slot 0{slot.id}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Telemetry Event Stream */}
            <SystemLog logs={snapshot?.logs || []} maxHeight="max-h-64" />
          </>
        )}
      </main>
    </div>
  );
};
