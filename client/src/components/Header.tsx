import React, { useState } from 'react';
import { Volume2, VolumeX, Shield, Wifi, WifiOff } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeaderProps {
  ipv4?: string;
  connected: boolean;
  currentInterface?: 'display' | 'controller' | 'admin' | 'hub';
}

export const Header: React.FC<HeaderProps> = ({
  ipv4 = '127.0.0.1',
  connected,
  currentInterface = 'hub',
}) => {
  const [muted, setMuted] = useState(!sound.enabled);

  const toggleSound = () => {
    sound.enabled = !sound.enabled;
    setMuted(!sound.enabled);
    if (sound.enabled) sound.playClick();
  };

  return (
    <header className="border-b border-cyan-500/20 bg-slate-950/80 backdrop-blur-md px-4 py-3 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-950 border border-cyan-400/40 flex items-center justify-center glow-cyan">
            <Shield className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold tracking-widest text-slate-100 text-sm md:text-base">
                YENARTIFICA
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950/90 text-cyan-400 border border-cyan-500/30">
                AWAKEN
              </span>
            </div>
            <p className="text-[10px] md:text-xs text-slate-400 font-mono tracking-tight hidden sm:block">
              Dept. of Artificial Intelligence & Machine Learning
            </p>
          </div>
        </div>

        {/* Telemetry & Controls */}
        <div className="flex items-center gap-3 md:gap-5 font-mono text-xs">
          {/* LAN IP & Link Status */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3 py-1 rounded-md text-slate-300">
            {connected ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-rose-500" />
            )}
            <span className="hidden md:inline text-slate-400">LAN:</span>
            <span className="text-cyan-400 font-semibold">{ipv4}</span>
          </div>

          {/* Sound Toggle */}
          <button
            onClick={toggleSound}
            title={muted ? 'Unmute Audio SFX' : 'Mute Audio SFX'}
            className="p-1.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 hover:text-cyan-300 transition-colors"
          >
            {muted ? <VolumeX className="w-4 h-4 text-slate-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
          </button>

          {/* Current view indicator */}
          <div className="text-[11px] uppercase tracking-wider text-cyan-400/70 border-l border-slate-800 pl-3 hidden lg:block">
            {currentInterface}
          </div>
        </div>
      </div>
    </header>
  );
};
