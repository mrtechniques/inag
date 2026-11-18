import React from 'react';
import { SlotState, SystemState } from '../types';
import { LedIndicator } from './LedIndicator';
import { Smartphone, CheckCircle, Clock, Wifi, WifiOff } from 'lucide-react';

interface SlotCardProps {
  slot: SlotState;
  systemState: SystemState;
  isCurrentDevice?: boolean;
  onClaim?: () => void;
  canClaim?: boolean;
}

export const SlotCard: React.FC<SlotCardProps> = ({
  slot,
  systemState,
  isCurrentDevice = false,
  onClaim,
  canClaim = false,
}) => {
  // Determine LED status
  const getLedStatus = () => {
    if (slot.authorized) return 'authorized';
    if (slot.connected) {
      return systemState === 'ARMED' ? 'armed' : 'connected';
    }
    return 'disconnected';
  };

  const ledStatus = getLedStatus();

  return (
    <div
      className={`cyber-panel p-5 rounded-xl transition-all duration-300 relative overflow-hidden ${
        slot.authorized
          ? 'border-emerald-500/60 shadow-[0_0_25px_rgba(16,185,129,0.25)]'
          : slot.connected
          ? 'border-cyan-500/40 shadow-[0_0_20px_rgba(0,240,255,0.15)]'
          : 'border-slate-800 opacity-80'
      } ${isCurrentDevice ? 'ring-2 ring-cyan-400' : ''}`}
    >
      {/* Background ambient gradient */}
      <div
        className={`absolute inset-0 opacity-10 pointer-events-none ${
          slot.authorized
            ? 'bg-gradient-to-br from-emerald-500 to-transparent'
            : slot.connected
            ? 'bg-gradient-to-br from-cyan-500 to-transparent'
            : 'bg-transparent'
        }`}
      />

      {/* Header with Slot ID and LED */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-4">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-md bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 font-mono text-xs font-bold flex items-center justify-center">
            0{slot.id}
          </span>
          <div>
            <h4 className="text-sm font-mono font-bold tracking-wider text-slate-100 uppercase">
              {slot.label}
            </h4>
            <p className="text-xs text-cyan-400/80 font-mono tracking-tight">{slot.role}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isCurrentDevice && (
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              YOU
            </span>
          )}
          <LedIndicator status={ledStatus} size="md" />
        </div>
      </div>

      {/* Device Info & Status */}
      <div className="space-y-2.5 text-xs font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-cyan-400" />
            Device:
          </span>
          <span className="text-slate-200 font-medium truncate max-w-[160px]">
            {slot.claimed ? slot.deviceName || `Terminal Node ${slot.id}` : 'Unassigned'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-400">
          <span className="flex items-center gap-1.5">
            {slot.connected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-slate-500" />
            )}
            Link:
          </span>
          <span
            className={`font-semibold ${
              slot.connected ? 'text-emerald-400' : 'text-slate-500'
            }`}
          >
            {slot.connected ? 'ONLINE / SYNCED' : 'OFFLINE'}
          </span>
        </div>

        <div className="flex items-center justify-between text-slate-400 pt-1">
          <span className="flex items-center gap-1.5">
            {slot.authorized ? (
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            )}
            Auth Status:
          </span>
          <span
            className={`font-bold tracking-wider ${
              slot.authorized
                ? 'text-emerald-400'
                : systemState === 'ARMED'
                ? 'text-cyan-300 animate-pulse'
                : 'text-amber-400/80'
            }`}
          >
            {slot.authorized
              ? 'AUTHORIZED'
              : systemState === 'ARMED'
              ? 'ARMED — READY'
              : 'PENDING'}
          </span>
        </div>

        {slot.authorizedAt && (
          <div className="text-[10px] text-right text-emerald-500/80 font-mono">
            Auth: {new Date(slot.authorizedAt).toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Claim Button for Controller Slot Selection */}
      {canClaim && onClaim && !slot.claimed && (
        <div className="mt-4 pt-3 border-t border-slate-800">
          <button
            onClick={onClaim}
            className="w-full py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 font-mono text-xs tracking-wider transition-all duration-200 active:scale-95"
          >
            CLAIM TERMINAL 0{slot.id}
          </button>
        </div>
      )}
    </div>
  );
};
