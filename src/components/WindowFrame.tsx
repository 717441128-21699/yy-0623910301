import React from 'react';
import { Maximize2, Minimize2 } from 'lucide-react';

interface WindowFrameProps {
  title: string;
  icon?: React.ReactNode;
  statusIndicator?: 'idle' | 'active' | 'warning' | 'danger' | 'success';
  children: React.ReactNode;
  className?: string;
  extraHeader?: React.ReactNode;
}

export const WindowFrame: React.FC<WindowFrameProps> = ({
  title,
  icon,
  statusIndicator = 'idle',
  children,
  className = '',
  extraHeader,
}) => {
  const statusColors: Record<string, string> = {
    idle: 'bg-deep-blue-400',
    active: 'bg-terminal-green animate-pulse',
    warning: 'bg-terminal-amber animate-pulse',
    danger: 'bg-alert-red-500 animate-pulse-fast',
    success: 'bg-calm-teal-500',
  };

  return (
    <div className={`bg-deep-blue-700 border border-deep-blue-500 rounded-sm shadow-terminal overflow-hidden flex flex-col ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 bg-deep-blue-800 border-b border-deep-blue-500">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusColors[statusIndicator]}`} />
          {icon && <span className="text-pro-gold-400">{icon}</span>}
          <h2 className="font-serif-cn text-sm text-pro-gold-300 tracking-wider">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          {extraHeader}
          <div className="flex gap-2">
            <button className="w-5 h-5 rounded-sm bg-deep-blue-600 hover:bg-deep-blue-500 flex items-center justify-center transition-colors">
              <Minimize2 size={10} className="text-deep-blue-300" />
            </button>
            <button className="w-5 h-5 rounded-sm bg-deep-blue-600 hover:bg-deep-blue-500 flex items-center justify-center transition-colors">
              <Maximize2 size={10} className="text-deep-blue-300" />
            </button>
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-terminal-green/[0.02] via-transparent to-terminal-green/[0.02] animate-scanline" />
        </div>
        {children}
      </div>
    </div>
  );
};
