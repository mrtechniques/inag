import React, { useState, useEffect } from 'react';
import { useSocket } from '../hooks/useSocket';
import { SlotId, SlotState } from '../types';
import { LedIndicator } from '../components/LedIndicator';
import { sound } from '../utils/audio';
import { 
  Shield, 
  Smartphone, 
  CheckCircle2, 
  AlertTriangle, 
  Lock, 
  Radio, 
  Sparkles,
  LogOut,
  Tv
} from 'lucide-react';

const STORAGE_TOKEN_KEY = 'yenartifica_dev_token';
const STORAGE_SLOT_KEY = 'yenartifica_dev_slot';

export const ControllerPage: React.FC = () => {
  const { socket, snapshot, connected, errorNotification } = useSocket();

  const [mySlotId, setMySlotId] = useState<SlotId | null>(() => {
    const saved = localStorage.getItem(STORAGE_SLOT_KEY);
    return saved ? (parseInt(saved, 10) as SlotId) : null;
  });

  const [sessionToken, setSessionToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  });

  const [deviceName, setDeviceName] = useState(() => {
    const stored = localStorage.getItem('yenartifica_dev_name');
    if (stored) return stored;
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isAndroid = /Android/.test(navigator.userAgent);
    const platform = isIOS ? 'iPhone' : isAndroid ? 'Android' : 'Mobile';
    const rand = Math.floor(100 + Math.random() * 900);
    const generated = `${platform} Node-${rand}`;
    localStorage.setItem('yenartifica_dev_name', generated);
    return generated;
  });

  const [submitting, setSubmitting] = useState(false);
  const [mobileCountdown, setMobileCountdown] = useState<number | null>(null);

  // Attempt to resume session on connect
  useEffect(() => {
    if (!socket || !connected || !sessionToken) return;

    socket.emit('session:resume', { sessionToken });

    const handleResume = (res: { success: boolean; slot?: SlotState; error?: string }) => {
      if (res.success && res.slot) {
        setMySlotId(res.slot.id);
      } else {
        localStorage.removeItem(STORAGE_TOKEN_KEY);
        localStorage.removeItem(STORAGE_SLOT_KEY);
        setSessionToken(null);
        setMySlotId(null);
      }
    };

    socket.once('session:resumed', handleResume);

    return () => {
      socket.off('session:resumed', handleResume);
    };
  }, [socket, connected, sessionToken]);

  const state = snapshot?.state || 'STANDBY';
  const slots = snapshot?.slots || {};
  const slotList = Object.values(slots).sort((a, b) => a.id - b.id);
  const mySlot = mySlotId && slots[mySlotId] ? slots[mySlotId] : null;
  const isArmed = state === 'ARMED';
  const isMyAuthorized = mySlot?.authorized || false;
  const canAuthorize = isArmed && !isMyAuthorized && connected;

  // Synchronized Mobile Countdown effect
  useEffect(() => {
    if (state === 'COUNTDOWN') {
      if (mobileCountdown === null) {
        setMobileCountdown(3);
        try {
          if ('vibrate' in navigator) navigator.vibrate([120]);
        } catch {}
      }
    } else if (state === 'STANDBY' || state === 'READY' || state === 'ARMED') {
      setMobileCountdown(null);
    }
  }, [state, mobileCountdown]);

  useEffect(() => {
    if (mobileCountdown === null) return;
    if (mobileCountdown > 1) {
      const t = setTimeout(() => {
        setMobileCountdown(mobileCountdown - 1);
        try {
          if ('vibrate' in navigator) navigator.vibrate([120]);
        } catch {}
      }, 1000);
      return () => clearTimeout(t);
    } else if (mobileCountdown === 1) {
      const t = setTimeout(() => {
        setMobileCountdown(0);
        try {
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 300]);
        } catch {}
      }, 1000);
      return () => clearTimeout(t);
    }
  }, [mobileCountdown]);

  // Handle slot registration response
  const handleClaimSlot = (slotId: SlotId) => {
    if (!socket || !connected) return;
    setSubmitting(true);
    sound.playClick();

    socket.emit('controller:register', {
      slotId,
      deviceName,
    });

    const handleRegister = (res: { success: boolean; token?: string; slot?: SlotState; error?: string }) => {
      setSubmitting(false);
      if (res.success && res.token && res.slot) {
        localStorage.setItem(STORAGE_TOKEN_KEY, res.token);
        localStorage.setItem(STORAGE_SLOT_KEY, res.slot.id.toString());
        setSessionToken(res.token);
        setMySlotId(res.slot.id);
        sound.playClick();
      }
    };

    socket.once('session:registered', handleRegister);
  };

  // Handle Authorize Button Press
  const handleAuthorize = () => {
    if (!socket || !connected || !mySlotId || !sessionToken) return;
    setSubmitting(true);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([100, 50, 200]);
      } catch {}
    }

    socket.emit('controller:authorize', {
      slotId: mySlotId,
      sessionToken,
    });

    const handleAuthResult = (res: { success: boolean; error?: string }) => {
      setSubmitting(false);
      if (res.success) {
        sound.playAuthorized();
      }
    };

    socket.once('controller:authorize_result', handleAuthResult);
  };

  // Leave / Disconnect slot (releasing local reservation)
  const handleLeaveSlot = () => {
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    localStorage.removeItem(STORAGE_SLOT_KEY);
    setSessionToken(null);
    setMySlotId(null);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col justify-between p-4 bg-grid-cyber selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      {/* Mobile Countdown / Grand Finale Overlay */}
      {(mobileCountdown !== null || state === 'INAUGURATED') && (
        <div className="fixed inset-0 z-50 bg-[#030712]/95 backdrop-blur-xl flex flex-col items-center justify-center p-6 text-center select-none animate-fadeIn">
          <div className="absolute inset-0 bg-grid-cyber opacity-30 pointer-events-none" />

          {mobileCountdown !== null && mobileCountdown > 0 ? (
            /* 3... 2... 1... Digit */
            <div className="space-y-6 relative z-10 flex flex-col items-center">
              <div className="w-48 h-48 rounded-full bg-cyan-950/80 border-4 border-cyan-400 flex items-center justify-center glow-cyan shadow-[0_0_50px_rgba(0,240,255,0.7)] animate-pulse">
                <span className="font-mono text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-cyan-300">
                  {mobileCountdown}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="font-mono text-base font-bold text-cyan-300 tracking-wider">
                  ALL KEYS VERIFIED // ENGAGING
                </h3>
                <p className="font-mono text-xs text-slate-400">
                  Hold on! Inauguration sequence activating...
                </p>
              </div>
            </div>
          ) : (
            /* Inauguration Active: Direct audience to look at stage projector screen */
            <div className="space-y-6 relative z-10 max-w-sm flex flex-col items-center">
              <div className="w-24 h-24 rounded-2xl bg-emerald-950/80 border-2 border-emerald-400 flex items-center justify-center glow-green shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                <Tv className="w-12 h-12 text-emerald-400 animate-bounce" />
              </div>

              <div className="space-y-2">
                <span className="px-3 py-1 rounded-full bg-emerald-950 border border-emerald-400/50 text-emerald-300 font-mono text-[10px] tracking-widest uppercase">
                  ✦ AWAKENING ENGAGED ✦
                </span>
                <h2 className="font-mono text-2xl font-black text-slate-100 tracking-widest">
                  YENARTIFICA
                </h2>
                <p className="font-mono text-xs font-semibold text-cyan-300">
                  LOOK AT THE MAIN STAGE PROJECTOR
                </p>
                <p className="font-mono text-[11px] text-slate-400 pt-2 leading-relaxed">
                  Your biometric key was successfully authenticated. The official department reveal video is playing on the main screen!
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Top Header */}
      <header className="border-b border-cyan-500/20 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-400/40 flex items-center justify-center glow-cyan">
              <Shield className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-mono text-sm font-bold tracking-widest text-slate-100">
                YENARTIFICA
              </h1>
              <p className="text-[10px] font-mono text-cyan-400/80">PARTICIPANT CONTROLLER</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`flex items-center gap-1.5 font-mono text-[11px] px-2.5 py-1 rounded-full border ${
                connected
                  ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                  : 'bg-rose-950/80 border-rose-500/40 text-rose-400 animate-pulse'
              }`}
            >
              <Radio className="w-3 h-3" />
              {connected ? 'LINKED' : 'OFFLINE'}
            </span>
          </div>
        </div>

        {/* Global Dynamic Live Peer Status Bar */}
        <div
          className="mt-3 grid gap-2 font-mono text-[11px]"
          style={{ gridTemplateColumns: `repeat(${Math.max(1, Math.min(slotList.length, 5))}, minmax(0, 1fr))` }}
        >
          {slotList.map((slot) => {
            const isSelf = mySlotId === slot.id;
            const auth = slot.authorized;
            const online = slot.connected;

            return (
              <div
                key={slot.id}
                className={`py-1.5 px-2 rounded-lg border text-center transition-all ${
                  auth
                    ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-300'
                    : isArmed && online
                    ? 'bg-cyan-950/60 border-cyan-400/50 text-cyan-300 animate-pulse'
                    : online
                    ? 'bg-slate-900 border-slate-700 text-slate-300'
                    : 'bg-slate-950/80 border-slate-900 text-slate-600'
                } ${isSelf ? 'ring-1 ring-cyan-400' : ''}`}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-bold">T0{slot.id}</span>
                  <LedIndicator
                    status={
                      auth
                        ? 'authorized'
                        : online
                        ? isArmed
                          ? 'armed'
                          : 'connected'
                        : 'disconnected'
                    }
                    size="sm"
                  />
                </div>
                <div className="text-[9px] truncate">
                  {isSelf ? '(YOU)' : auth ? 'VERIFIED' : online ? 'CONNECTED' : 'WAITING'}
                </div>
              </div>
            );
          })}
        </div>
      </header>

      {/* Error Notification Toast */}
      {errorNotification && (
        <div className="my-3 bg-rose-950/90 border border-rose-500 text-rose-200 p-3 rounded-xl text-xs font-mono flex items-center gap-2 glow-red">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorNotification}</span>
        </div>
      )}

      {/* Main Controller Content */}
      <main className="my-auto py-4 flex flex-col items-center justify-center">
        {!mySlotId ? (
          /* Slot Selection View: Participant Claims Slot */
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center space-y-1 mb-4">
              <h2 className="font-mono text-lg font-bold text-cyan-300 tracking-wider">
                SELECT PARTICIPANT TERMINAL
              </h2>
              <p className="font-mono text-xs text-slate-400">
                Choose your designated inauguration station. No QR scanning required.
              </p>
            </div>

            {/* Custom device label */}
            <div className="cyber-panel p-3 rounded-xl mb-4 text-xs font-mono">
              <label className="text-slate-400 block mb-1">Your Device Identifier:</label>
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <input
                  type="text"
                  value={deviceName}
                  onChange={(e) => {
                    setDeviceName(e.target.value);
                    localStorage.setItem('yenartifica_dev_name', e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                  placeholder="e.g. Chief Guest iPad"
                />
              </div>
            </div>

            {/* Dynamic Slot Options */}
            <div className="space-y-3">
              {slotList.map((slot) => {
                const isClaimed = slot.claimed;
                const isConnected = slot.connected;

                return (
                  <div
                    key={slot.id}
                    className={`cyber-panel p-4 rounded-xl border transition-all ${
                      isClaimed && isConnected
                        ? 'border-slate-800 opacity-60'
                        : 'border-cyan-500/40 hover:border-cyan-400 hover:glow-cyan'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold flex items-center justify-center">
                          0{slot.id}
                        </span>
                        <div>
                          <h4 className="font-mono font-bold text-sm text-slate-100">
                            {slot.label}
                          </h4>
                          <p className="text-[11px] font-mono text-cyan-400">{slot.role}</p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isClaimed && isConnected
                            ? 'bg-rose-950/80 text-rose-300 border border-rose-800'
                            : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {isClaimed && isConnected ? 'OCCUPIED' : 'AVAILABLE'}
                      </span>
                    </div>

                    <button
                      disabled={isClaimed && isConnected}
                      onClick={() => handleClaimSlot(slot.id)}
                      className={`w-full mt-2 py-2.5 rounded-lg font-mono text-xs font-semibold tracking-wider transition-all duration-200 active:scale-95 ${
                        isClaimed && isConnected
                          ? 'bg-slate-900 text-slate-600 cursor-not-allowed border border-slate-800'
                          : 'bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-400'
                      }`}
                    >
                      {isClaimed && isConnected ? 'SLOT OCCUPIED' : `CLAIM TERMINAL 0${slot.id}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Active Controller Station View: Giant Activation Button */
          <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
            {/* Station Identity Badge */}
            <div className="cyber-panel w-full p-4 rounded-2xl border border-cyan-500/40 relative">
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <span className="text-[10px] font-mono uppercase text-cyan-400/80 tracking-widest block">
                    ASSIGNED TERMINAL
                  </span>
                  <h3 className="font-mono text-lg font-bold text-slate-100">
                    {mySlot?.label || `Terminal 0${mySlotId}`}
                  </h3>
                  <p className="text-xs font-mono text-cyan-300">{mySlot?.role}</p>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <LedIndicator
                    status={
                      isMyAuthorized
                        ? 'authorized'
                        : isArmed
                        ? 'armed'
                        : 'connected'
                    }
                    size="lg"
                    showLabel
                  />
                  <span className="text-[10px] font-mono text-slate-400">
                    {deviceName}
                  </span>
                </div>
              </div>
            </div>

            {/* Giant Futuristic Activation Button */}
            <div className="relative my-4 flex items-center justify-center">
              {canAuthorize && (
                <div className="absolute inset-[-14px] rounded-full border-2 border-cyan-400/60 animate-ping pointer-events-none" />
              )}

              <button
                disabled={!canAuthorize || submitting}
                onClick={handleAuthorize}
                className={`w-56 h-56 md:w-64 md:h-64 rounded-full border-4 flex flex-col items-center justify-center transition-all duration-300 relative select-none touch-manipulation ${
                  isMyAuthorized
                    ? 'border-emerald-400 bg-emerald-950/80 shadow-[0_0_50px_#10b981] text-emerald-300'
                    : canAuthorize
                    ? 'border-cyan-400 bg-gradient-to-b from-cyan-950 to-slate-950 shadow-[0_0_40px_#00f0ff] active:scale-95 text-cyan-300 hover:border-white'
                    : 'border-slate-800 bg-slate-950/90 text-slate-600 shadow-none cursor-not-allowed'
                }`}
              >
                {isMyAuthorized ? (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-2 animate-bounce" />
                    <span className="font-mono font-bold text-base tracking-widest text-emerald-300">
                      AUTHORIZED
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400/80 mt-1">
                      VERIFIED & RECORDED
                    </span>
                  </>
                ) : canAuthorize ? (
                  <>
                    <Sparkles className="w-14 h-14 text-cyan-300 mb-2 animate-pulse" />
                    <span className="font-mono font-extrabold text-lg tracking-widest text-cyan-200">
                      PRESS TO AUTHORIZE
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400/90 mt-1 uppercase">
                      YENARTIFICA 2025
                    </span>
                  </>
                ) : (
                  <>
                    <Lock className="w-12 h-12 text-slate-600 mb-2" />
                    <span className="font-mono font-bold text-xs tracking-wider text-slate-500">
                      SYSTEM UNARMED
                    </span>
                    <span className="text-[10px] font-mono text-slate-600 mt-1">
                      Awaiting Administrator Arm
                    </span>
                  </>
                )}
              </button>
            </div>

            {/* Status Guidance Banner */}
            <div className="cyber-panel w-full p-3 rounded-xl text-xs font-mono text-slate-300">
              {isMyAuthorized ? (
                <div className="text-emerald-400 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Your authorization is recorded! Countdown will start automatically when all terminals press.</span>
                </div>
              ) : isArmed ? (
                <div className="text-cyan-300 flex items-center justify-center gap-2 animate-pulse">
                  <Sparkles className="w-4 h-4 shrink-0" />
                  <span>System is ARMED! Touch the glowing trigger above to authorize.</span>
                </div>
              ) : (
                <div className="text-slate-400 flex items-center justify-center gap-2">
                  <Lock className="w-4 h-4 shrink-0 text-amber-500" />
                  <span>Standing by. Administrator will arm the system shortly.</span>
                </div>
              )}
            </div>

            {/* Leave / Release Station Button */}
            <button
              onClick={handleLeaveSlot}
              className="text-xs font-mono text-slate-500 hover:text-rose-400 transition-colors flex items-center gap-1.5 pt-2"
            >
              <LogOut className="w-3.5 h-3.5" />
              Switch Station / Release Terminal
            </button>
          </div>
        )}
      </main>

      {/* Mobile Footer */}
      <footer className="border-t border-slate-900 pt-3 text-center text-[10px] font-mono text-slate-600">
        PROJECT AWAKEN // SECURE DYNAMIC WEBSOCKET CONTROLLER
      </footer>
    </div>
  );
};
