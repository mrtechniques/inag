import React from 'react';

interface LedIndicatorProps {
  status: 'authorized' | 'connected' | 'disconnected' | 'armed';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showLabel?: boolean;
}

export const LedIndicator: React.FC<LedIndicatorProps> = ({
  status,
  size = 'md',
  showLabel = false,
}) => {
  const sizeClasses = {
    sm: 'w-2.5 h-2.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
    xl: 'w-10 h-10',
  };

  const getStyle = () => {
    switch (status) {
      case 'authorized':
        return {
          bg: 'bg-emerald-500',
          shadow: 'shadow-[0_0_15px_#10b981,0_0_30px_#10b981]',
          pulse: 'animate-none',
          label: 'AUTHORIZED',
          labelColor: 'text-emerald-400',
        };
      case 'armed':
        return {
          bg: 'bg-cyan-400',
          shadow: 'shadow-[0_0_15px_#00f0ff,0_0_25px_#00f0ff]',
          pulse: 'animate-pulse',
          label: 'ARMED',
          labelColor: 'text-cyan-400',
        };
      case 'connected':
        return {
          bg: 'bg-amber-400',
          shadow: 'shadow-[0_0_10px_#f59e0b]',
          pulse: '',
          label: 'STANDBY',
          labelColor: 'text-amber-400',
        };
      case 'disconnected':
      default:
        return {
          bg: 'bg-slate-700',
          shadow: 'shadow-none',
          pulse: '',
          label: 'OFFLINE',
          labelColor: 'text-slate-500',
        };
    }
  };

  const conf = getStyle();

  return (
    <div className="inline-flex items-center gap-2">
      <div
        className={`rounded-full transition-all duration-500 border border-white/20 ${sizeClasses[size]} ${conf.bg} ${conf.shadow} ${conf.pulse}`}
      />
      {showLabel && (
        <span className={`text-xs font-mono font-semibold tracking-wider ${conf.labelColor}`}>
          {conf.label}
        </span>
      )}
    </div>
  );
};
