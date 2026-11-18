import React from 'react';
import { SystemState } from '../types';

interface StatusBadgeProps {
  state: SystemState;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ state, size = 'md' }) => {
  const getBadgeConfig = () => {
    switch (state) {
      case 'STANDBY':
        return {
          text: 'SYSTEM STANDBY',
          classes: 'bg-slate-900/80 border-slate-700 text-slate-400',
          dot: 'bg-slate-500',
        };
      case 'CONNECTING':
        return {
          text: 'CONNECTING NODES',
          classes: 'bg-blue-950/60 border-cyan-800 text-cyan-400 animate-pulse',
          dot: 'bg-cyan-400 animate-ping',
        };
      case 'READY':
        return {
          text: 'ALL NODES READY',
          classes: 'bg-cyan-950/70 border-cyan-500/50 text-cyan-300',
          dot: 'bg-cyan-400',
        };
      case 'ARMED':
        return {
          text: '⚡ SYSTEM ARMED',
          classes: 'bg-cyan-900/80 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(0,240,255,0.4)] animate-pulse',
          dot: 'bg-cyan-300',
        };
      case 'ALL_AUTHORIZED':
        return {
          text: '★ ALL AUTHORIZATIONS RECEIVED',
          classes: 'bg-emerald-950/80 border-emerald-400 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.5)]',
          dot: 'bg-emerald-400',
        };
      case 'COUNTDOWN':
        return {
          text: 'COUNTDOWN ACTIVE',
          classes: 'bg-amber-950/80 border-amber-400 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-bounce',
          dot: 'bg-amber-400',
        };
      case 'AWAKENING':
      case 'LOGO_REVEAL':
      case 'INAUGURATED':
        return {
          text: '✦ YENARTIFICA AWAKENED',
          classes: 'bg-purple-950/80 border-purple-400 text-purple-200 shadow-[0_0_25px_rgba(168,85,247,0.6)]',
          dot: 'bg-purple-400',
        };
      default:
        return {
          text: state,
          classes: 'bg-slate-900 border-slate-700 text-slate-400',
          dot: 'bg-slate-500',
        };
    }
  };

  const conf = getBadgeConfig();
  const sizeStyles = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base font-semibold',
  };

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border font-mono tracking-wider transition-all duration-300 ${sizeStyles[size]} ${conf.classes}`}
    >
      <span className={`w-2 h-2 rounded-full ${conf.dot}`} />
      {conf.text}
    </span>
  );
};
