import React, { useRef, useEffect } from 'react';
import { SystemLogEntry } from '../types';
import { Terminal } from 'lucide-react';

interface SystemLogProps {
  logs: SystemLogEntry[];
  maxHeight?: string;
}

export const SystemLog: React.FC<SystemLogProps> = ({ logs, maxHeight = 'max-h-52' }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs]);

  const getTypeStyle = (type: SystemLogEntry['type']) => {
    switch (type) {
      case 'SUCCESS':
        return 'text-emerald-400 font-semibold';
      case 'ALERT':
        return 'text-cyan-300 font-bold';
      case 'WARN':
        return 'text-amber-400';
      case 'ERROR':
        return 'text-rose-400 font-bold';
      case 'INFO':
      default:
        return 'text-slate-400';
    }
  };

  return (
    <div className="cyber-panel rounded-xl overflow-hidden font-mono text-xs">
      <div className="bg-slate-950/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between">
        <span className="flex items-center gap-2 text-cyan-400 font-semibold tracking-wider">
          <Terminal className="w-4 h-4" />
          SYSTEM TELEMETRY & EVENT LOG
        </span>
        <span className="text-[10px] text-slate-500">{logs.length} EVENTS RECORDED</span>
      </div>

      <div
        ref={containerRef}
        className={`p-3 space-y-1.5 overflow-y-auto ${maxHeight} bg-slate-950/60 font-mono`}
      >
        {logs.length === 0 ? (
          <div className="text-slate-600 italic py-2">Awaiting system events...</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex items-start gap-2 leading-relaxed">
              <span className="text-slate-600 select-none shrink-0">
                [{new Date(log.timestamp).toLocaleTimeString()}]
              </span>
              <span className="text-cyan-500/80 shrink-0 font-semibold">
                [{log.source}]
              </span>
              <span className={getTypeStyle(log.type)}>{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
