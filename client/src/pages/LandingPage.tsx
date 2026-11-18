import React from 'react';
import { useSocket } from '../hooks/useSocket';
import { StatusBadge } from '../components/StatusBadge';
import { 
  Tv, 
  Smartphone, 
  Sliders, 
  Shield, 
  ArrowRight, 
  CheckCircle2, 
  Wifi, 
  Radio
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { snapshot, connected } = useSocket();

  const state = snapshot?.state || 'STANDBY';
  const network = snapshot?.network || {
    ipv4: '127.0.0.1',
    port: 4000,
  };

  const interfaces = [
    {
      title: 'Projector Display',
      path: '/display',
      icon: Tv,
      color: 'from-cyan-500 to-blue-600',
      badge: 'MAIN STAGE',
      description: 'Cinematic 16:9 full-screen display for projector or large monitors. Visualizes live terminal indicators, authorization progress, and prepares the awakening chamber.',
    },
    {
      title: 'Mobile Controller',
      path: '/controller',
      icon: Smartphone,
      color: 'from-emerald-500 to-cyan-600',
      badge: 'DYNAMIC SLOTS',
      description: 'Mobile-first interface for dignitaries. Selects an available terminal, awaits administrator ARM command, and provides the biometric activation trigger.',
    },
    {
      title: 'Admin Dashboard',
      path: '/admin',
      icon: Sliders,
      color: 'from-purple-500 to-indigo-600',
      badge: 'PIN PROTECTED',
      description: 'Full supervisory console for the coordinator. Real-time slot management, Arm System verification, Begin Inauguration trigger, and emergency resets.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-4 md:p-8 bg-grid-cyber selection:bg-cyan-500 selection:text-black flex flex-col justify-between">
      {/* Decorative backdrop */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[160px] pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between pb-6 border-b border-cyan-500/20 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 border border-cyan-400/50 flex items-center justify-center glow-cyan">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="font-mono text-xl font-extrabold tracking-widest text-slate-100">
              YENARTIFICA
            </h1>
            <p className="text-xs font-mono text-cyan-400/80">
              DEPT. OF ARTIFICIAL INTELLIGENCE & MACHINE LEARNING
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg text-xs font-mono">
            <Radio className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400 animate-pulse' : 'text-rose-500'}`} />
            <span className="text-slate-400">LAN IP:</span>
            <span className="text-cyan-300 font-bold">{network.ipv4}</span>
          </div>
          <StatusBadge state={state} size="sm" />
        </div>
      </header>

      {/* Main Hub Selection */}
      <main className="max-w-6xl w-full mx-auto py-12 z-10">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="inline-block px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/40 text-cyan-300 font-mono text-xs tracking-wider">
            PROJECT AWAKEN // MILESTONE 1
          </div>
          <h2 className="font-mono text-3xl md:text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-slate-100 to-cyan-300">
            DEPARTMENT INAUGURATION CORE
          </h2>
          <p className="font-mono text-xs md:text-sm text-slate-400">
            Real-time synchronized multi-device inauguration platform. Select an interface below to participate or oversee the ceremony.
          </p>
        </div>

        {/* 3 Interface Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {interfaces.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.path}
                href={item.path}
                className="cyber-panel p-6 rounded-2xl border border-slate-800 hover:border-cyan-400 transition-all duration-300 hover:glow-cyan flex flex-col justify-between group hover:-translate-y-1"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} p-0.5`}>
                      <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                        <Icon className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                      {item.badge}
                    </span>
                  </div>

                  <h3 className="font-mono text-lg font-bold text-slate-100 group-hover:text-cyan-300 transition-colors mb-2">
                    {item.title}
                  </h3>
                  <p className="font-mono text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono text-cyan-400 font-semibold group-hover:text-cyan-300">
                  <span>LAUNCH INTERFACE</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </a>
            );
          })}
        </div>

        {/* System Summary Info */}
        <div className="mt-12 cyber-panel p-5 rounded-2xl border border-cyan-500/20 flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Local Network Mode: Zero cloud dependencies, server-authoritative state machine.</span>
          </div>
          <div>
            Connected Terminals: <span className="text-cyan-300 font-bold">{snapshot?.connectedCount || 0}/{snapshot?.targetDeviceCount || 3}</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto border-t border-slate-900 pt-4 text-center font-mono text-xs text-slate-600">
        PROJECT AWAKEN — YENARTIFICA // Department of Artificial Intelligence & Machine Learning
      </footer>
    </div>
  );
};
