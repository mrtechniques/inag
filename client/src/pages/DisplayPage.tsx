import React, { useEffect, useRef } from 'react';
import { useSocket } from '../hooks/useSocket';
import { LedIndicator } from '../components/LedIndicator';
import { StatusBadge } from '../components/StatusBadge';
import { sound } from '../utils/audio';
import { Maximize2, Shield, Radio, Cpu, Sparkles, CheckCircle2 } from 'lucide-react';

export const DisplayPage: React.FC = () => {
  const { snapshot, connected, inaugurationEngaged } = useSocket();
  const prevArmedRef = useRef(false);
  const prevAllAuthRef = useRef(false);

  // Trigger futuristic audio cues on state transitions
  useEffect(() => {
    if (!snapshot) return;

    if (snapshot.state === 'ARMED' && !prevArmedRef.current) {
      sound.playArmed();
    }
    prevArmedRef.current = snapshot.state === 'ARMED';

    if (snapshot.state === 'ALL_AUTHORIZED' && !prevAllAuthRef.current) {
      sound.playAuthorized();
    }
    prevAllAuthRef.current = snapshot.state === 'ALL_AUTHORIZED';

    if (inaugurationEngaged) {
      sound.playInaugurate();
    }
  }, [snapshot, inaugurationEngaged]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const state = snapshot?.state || 'STANDBY';
  const targetDeviceCount = snapshot?.targetDeviceCount || 3;
  const slots = snapshot?.slots || {};
  const slotList = Object.values(slots).sort((a, b) => a.id - b.id);

  const authorizedCount = snapshot?.authorizedCount || 0;
  const connectedCount = snapshot?.connectedCount || 0;
  const progressPercent = Math.round((authorizedCount / targetDeviceCount) * 100);

  const getGridClass = () => {
    if (slotList.length === 1) return 'max-w-md mx-auto w-full';
    if (slotList.length === 2) return 'grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full';
    if (slotList.length === 3) return 'grid grid-cols-1 md:grid-cols-3 gap-6';
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4';
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between p-4 md:p-8 bg-grid-cyber selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      {/* Decorative ambient glowing backdrops */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-700/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Top HUD Bar */}
      <header className="flex items-center justify-between border-b border-cyan-500/20 pb-4 z-10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center glow-cyan">
            <Shield className="w-7 h-7 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="font-mono text-2xl md:text-3xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-200 to-cyan-300">
                PROJECT AWAKEN
              </h1>
              <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300">
                YENARTIFICA
              </span>
            </div>
            <p className="font-mono text-xs text-slate-400 tracking-wider">
              DEPARTMENT OF ARTIFICIAL INTELLIGENCE & MACHINE LEARNING
            </p>
          </div>
        </div>

        {/* System State & Fullscreen Button */}
        <div className="flex items-center gap-4">
          <StatusBadge state={state} size="lg" />

          <div className="hidden lg:flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
            <span className="text-slate-400">NODES:</span>
            <span className="text-cyan-400 font-semibold">{connectedCount}/{targetDeviceCount} ONLINE</span>
          </div>

          <button
            onClick={toggleFullscreen}
            title="Toggle Cinematic Fullscreen"
            className="p-2.5 rounded-lg bg-slate-900/80 border border-cyan-500/30 text-cyan-400 hover:bg-cyan-950 hover:border-cyan-400 transition-all duration-200 active:scale-95"
          >
            <Maximize2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Cinematic 16:9 Viewport & HUD Stage */}
      <main className="my-auto py-6 max-w-7xl w-full mx-auto flex flex-col gap-8 z-10">
        {/* Dynamic Alerts Banner */}
        {state === 'ARMED' && (
          <div className="w-full bg-cyan-950/60 border-2 border-cyan-400/80 rounded-2xl p-4 glow-cyan flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <Cpu className="w-6 h-6 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <div>
                <h3 className="font-mono font-bold text-lg text-cyan-300 tracking-wider">
                  ⚡ SYSTEM ARMED — MOBILE CONTROLLERS PRIMED
                </h3>
                <p className="text-xs font-mono text-cyan-200/80">
                  Awaiting biometric / physical authorization inputs from all {targetDeviceCount} designated participant {targetDeviceCount === 1 ? 'terminal' : 'terminals'}.
                </p>
              </div>
            </div>
            <span className="hidden md:inline font-mono text-xs text-cyan-300 bg-cyan-900/60 px-3 py-1 rounded-full border border-cyan-400/30">
              READY FOR ACTIVATION
            </span>
          </div>
        )}

        {state === 'ALL_AUTHORIZED' && (
          <div className="w-full bg-emerald-950/70 border-2 border-emerald-400 rounded-2xl p-4 glow-green flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-6 h-6 text-emerald-400 animate-bounce" />
              <div>
                <h3 className="font-mono font-bold text-lg text-emerald-300 tracking-wider">
                  ★ ALL AUTHORIZATIONS RECEIVED ({targetDeviceCount}/{targetDeviceCount})
                </h3>
                <p className="text-xs font-mono text-emerald-200/80">
                  Handshake authenticated across all terminals. Department core awaiting Admin Inauguration trigger.
                </p>
              </div>
            </div>
            <span className="font-mono text-xs text-emerald-300 bg-emerald-900/60 px-4 py-1.5 rounded-full border border-emerald-400/40 font-bold tracking-widest animate-pulse">
              100% SYNCHRONIZED
            </span>
          </div>
        )}

        {/* Dedicated Area for Upcoming 60-Second Animation Stage */}
        <div className="w-full aspect-[16/7] md:aspect-[16/6] bg-slate-950/90 border border-cyan-500/30 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center p-6 cyber-panel">
          {/* Futuristic Telemetry Grid and Reticle */}
          <div className="absolute inset-0 bg-grid-cyber opacity-40 pointer-events-none" />
          <div className="absolute top-3 left-4 text-[10px] font-mono text-cyan-500/60 tracking-widest">
            CHAMBER STATUS: [SYNCHRONIZED] // REVEAL STAGE RESERVED
          </div>
          <div className="absolute top-3 right-4 text-[10px] font-mono text-cyan-500/60 tracking-widest">
            CORE FREQUENCY: 1.21 THz // LOCAL_SECURE_LAN
          </div>

          {/* Central Chamber Status Visual */}
          <div className="relative z-10 flex flex-col items-center text-center max-w-2xl">
            <div className="relative mb-4">
              <div
                className={`w-24 h-24 md:w-32 md:h-32 rounded-full border-2 flex items-center justify-center transition-all duration-700 ${
                  state === 'ALL_AUTHORIZED' || state === 'COUNTDOWN'
                    ? 'border-emerald-400 bg-emerald-950/40 shadow-[0_0_40px_#10b981]'
                    : state === 'ARMED'
                    ? 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_30px_#00f0ff] animate-pulse'
                    : 'border-slate-800 bg-slate-900/50'
                }`}
              >
                {state === 'ALL_AUTHORIZED' || state === 'COUNTDOWN' ? (
                  <CheckCircle2 className="w-12 h-12 md:w-16 md:h-16 text-emerald-400 animate-pulse" />
                ) : (
                  <Shield
                    className={`w-12 h-12 md:w-16 md:h-16 transition-colors duration-500 ${
                      state === 'ARMED' ? 'text-cyan-400' : 'text-slate-600'
                    }`}
                  />
                )}
              </div>

              {/* Rotating radar ring */}
              <div
                className={`absolute inset-[-10px] rounded-full border border-dashed pointer-events-none ${
                  state === 'ARMED'
                    ? 'border-cyan-400/60 animate-spin'
                    : state === 'ALL_AUTHORIZED'
                    ? 'border-emerald-400/60 animate-spin'
                    : 'border-slate-800'
                }`}
                style={{ animationDuration: '16s' }}
              />
            </div>

            <h2 className="font-mono text-xl md:text-2xl font-bold tracking-widest text-slate-100 uppercase">
              {state === 'COUNTDOWN'
                ? '✦ INAUGURATION COUNTDOWN ENGAGED ✦'
                : state === 'ALL_AUTHORIZED'
                ? 'DEPARTMENT CORE PRIMED FOR AWAKENING'
                : state === 'ARMED'
                ? 'AUTHORIZATION MATRIX ACTIVE'
                : 'SYNCHRONIZING PARTICIPANT TERMINALS'}
            </h2>
            <p className="font-mono text-xs md:text-sm text-slate-400 mt-2 max-w-lg">
              {state === 'COUNTDOWN'
                ? 'Final synchronization protocol in progress. 60-Second cinematic awakening sequence ready to deploy.'
                : state === 'ALL_AUTHORIZED'
                ? `Handshakes authenticated across all ${targetDeviceCount} terminals. Awaiting Administrator Begin command.`
                : state === 'ARMED'
                ? `Requires ${targetDeviceCount} synchronized ${targetDeviceCount === 1 ? 'key' : 'keys'}. Touch controller terminals to transmit authorization pulses.`
                : `Connect all ${targetDeviceCount} registered mobile ${targetDeviceCount === 1 ? 'device' : 'devices'} via local network to arm the inauguration core.`}
            </p>
          </div>
        </div>

        {/* Authorization Progress Bar (0/N to N/N) */}
        <div className="cyber-panel p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-3 font-mono">
            <div className="flex items-center gap-2">
              <span className="text-cyan-400 text-sm font-semibold tracking-wider">
                AUTHORIZATION PROGRESS:
              </span>
              <span className="text-xs bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-slate-300">
                {authorizedCount}/{targetDeviceCount} KEYS VERIFIED
              </span>
            </div>
            <span
              className={`text-lg font-bold tracking-widest ${
                authorizedCount === targetDeviceCount
                  ? 'text-emerald-400'
                  : authorizedCount > 0
                  ? 'text-cyan-300'
                  : 'text-slate-400'
              }`}
            >
              {progressPercent}%
            </span>
          </div>

          {/* Progress bar container */}
          <div className="w-full h-4 bg-slate-950 rounded-full border border-slate-800 overflow-hidden relative p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-700 relative ${
                authorizedCount === targetDeviceCount
                  ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 shadow-[0_0_20px_#10b981]'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-500 shadow-[0_0_15px_#00f0ff]'
              }`}
              style={{ width: `${progressPercent}%` }}
            >
              {/* Pulsing light tip */}
              {progressPercent > 0 && (
                <div className="absolute right-0 top-0 bottom-0 w-3 bg-white rounded-full blur-[1px] animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Dynamic Authorization Indicators */}
        <div className={getGridClass()}>
          {slotList.map((slot) => {
            const isAuthorized = slot.authorized;
            const isConnected = slot.connected;
            const isArmed = state === 'ARMED';

            const ledStatus = isAuthorized
              ? 'authorized'
              : isConnected
              ? isArmed
                ? 'armed'
                : 'connected'
              : 'disconnected';

            return (
              <div
                key={slot.id}
                className={`cyber-panel p-6 rounded-2xl transition-all duration-500 relative overflow-hidden flex flex-col justify-between ${
                  isAuthorized
                    ? 'border-emerald-500/70 shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                    : isConnected && isArmed
                    ? 'border-cyan-400 shadow-[0_0_25px_rgba(0,240,255,0.25)] animate-pulse'
                    : isConnected
                    ? 'border-cyan-800 shadow-[0_0_15px_rgba(0,240,255,0.1)]'
                    : 'border-slate-800/80 opacity-75'
                }`}
              >
                {/* Header: Slot Badge & LED */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-sm font-bold flex items-center justify-center">
                      0{slot.id}
                    </div>
                    <div>
                      <h3 className="font-mono text-base font-bold text-slate-100 tracking-wider">
                        {slot.label}
                      </h3>
                      <p className="text-xs font-mono text-cyan-400/90">{slot.role}</p>
                    </div>
                  </div>

                  <LedIndicator status={ledStatus} size="lg" />
                </div>

                {/* Body: Terminal Status & Device Link */}
                <div className="my-5 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>CONNECTION LINK:</span>
                    <span
                      className={`font-semibold flex items-center gap-1.5 ${
                        isConnected ? 'text-emerald-400' : 'text-slate-500'
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                        }`}
                      />
                      {isConnected ? 'ONLINE & SYNCED' : 'OFFLINE'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400">
                    <span>DEVICE CLIENT:</span>
                    <span className="text-slate-200 font-medium truncate max-w-[150px]">
                      {slot.claimed ? slot.deviceName || `Terminal ${slot.id}` : 'Awaiting Connection...'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-400 pt-2 border-t border-slate-900">
                    <span>AUTHORIZATION:</span>
                    <span
                      className={`font-bold tracking-wider ${
                        isAuthorized
                          ? 'text-emerald-400'
                          : isArmed
                          ? 'text-cyan-300 animate-pulse'
                          : 'text-amber-400'
                      }`}
                    >
                      {isAuthorized
                        ? '✓ VERIFIED'
                        : isArmed
                        ? 'ARMED — READY'
                        : 'PENDING'}
                    </span>
                  </div>
                </div>

                {/* Footer status bar */}
                <div
                  className={`py-2 px-3 rounded-lg text-center font-mono text-xs font-semibold tracking-wider uppercase transition-colors duration-300 ${
                    isAuthorized
                      ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                      : isArmed
                      ? 'bg-cyan-950/80 border border-cyan-500/40 text-cyan-300'
                      : 'bg-slate-900 border border-slate-800 text-slate-500'
                  }`}
                >
                  {isAuthorized
                    ? `AUTHENTICATED AT ${slot.authorizedAt ? new Date(slot.authorizedAt).toLocaleTimeString() : 'NOW'}`
                    : isArmed
                    ? 'AWAITING PARTICIPANT ACTIVATION'
                    : 'TERMINAL READY'}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Footer System Telemetry */}
      <footer className="border-t border-slate-900 pt-4 flex flex-col md:flex-row items-center justify-between text-xs font-mono text-slate-500 gap-2 z-10">
        <div>
          SERVER: <span className="text-cyan-400">{snapshot?.network.ipv4}:{snapshot?.network.port}</span> // BIND: 0.0.0.0
        </div>
        <div className="text-center">
          YENARTIFICA — INAUGURATION SYSTEM // DYNAMIC TERMINALS ({targetDeviceCount})
        </div>
        <div>
          STATUS: <span className="text-slate-300 uppercase">{state}</span>
        </div>
      </footer>
    </div>
  );
};
