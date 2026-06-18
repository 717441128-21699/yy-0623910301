import React, { useEffect } from 'react';
import { Shield, AlertOctagon, Terminal } from 'lucide-react';
import { CaseLibrary } from '../components/CaseLibrary';
import { OpinionStream } from '../components/OpinionStream';
import { ReviewPanel } from '../components/ReviewPanel';
import { TrainingRecords } from '../components/TrainingRecords';
import { useTrainingStore } from '../store/trainingStore';

const Home: React.FC = () => {
  const { phase, activePanel, resetTraining } = useTrainingStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (confirm('确定重置当前演练吗？')) resetTraining();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [resetTraining]);

  const phaseLabel: Record<string, { text: string; color: string }> = {
    idle: { text: '待命', color: 'text-deep-blue-400' },
    configuring: { text: '配置中', color: 'text-terminal-amber' },
    running: { text: '危机爆发中', color: 'text-alert-red-400 animate-pulse' },
    submitted: { text: '已提交', color: 'text-terminal-cyan' },
    reviewing: { text: '复盘评估', color: 'text-calm-teal-400' },
  };

  const currentPhase = phaseLabel[phase];

  return (
    <div className="h-screen w-screen bg-deep-blue-900 text-white flex flex-col overflow-hidden">
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-3 bg-deep-blue-800 border-b border-deep-blue-600 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(212,163,115,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,163,115,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        </div>
        <div className="relative flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-sm bg-alert-red-600/20 border border-alert-red-500 flex items-center justify-center">
              <Shield size={18} className="text-alert-red-400" />
            </div>
            <div>
              <h1 className="font-serif-cn text-base text-pro-gold-300 tracking-wider leading-tight">
                危机回应演练系统
              </h1>
              <p className="text-[10px] text-deep-blue-400 font-mono tracking-widest leading-tight">
                CRISIS RESPONSE TRAINING TERMINAL
              </p>
            </div>
          </div>
          <div className="h-8 w-px bg-deep-blue-600" />
          <div className="flex items-center gap-2">
            <Terminal size={14} className="text-terminal-green" />
            <span className="text-[11px] font-mono text-deep-blue-300">v1.0.0</span>
          </div>
        </div>
        <div className="relative flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-sm bg-deep-blue-700/50 border border-deep-blue-600">
            <AlertOctagon size={12} className={currentPhase.color} />
            <span className={`text-[11px] font-mono ${currentPhase.color}`}>
              系统状态：{currentPhase.text}
            </span>
          </div>
          <div className="text-[10px] font-mono text-deep-blue-500 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-terminal-green animate-pulse" />
            ONLINE
          </div>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden p-3 gap-3">
        <div className="w-[360px] flex-shrink-0 h-full">
          {activePanel === 'case' ? <CaseLibrary /> : <TrainingRecords />}
        </div>
        <div className="flex-1 h-full min-w-0">
          <OpinionStream />
        </div>
        <div className="w-[380px] flex-shrink-0 h-full">
          <ReviewPanel />
        </div>
      </main>

      <footer className="flex-shrink-0 flex items-center justify-between px-6 py-1.5 bg-deep-blue-800 border-t border-deep-blue-600">
        <div className="text-[10px] font-mono text-deep-blue-500">
          © PR Training System · 仅供内部培训使用
        </div>
        <div className="flex items-center gap-4 text-[10px] font-mono text-deep-blue-500">
          <span>适用对象：公关/市场/客服主管</span>
          <span className="w-px h-3 bg-deep-blue-600" />
          <span>ESC 重置演练</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
