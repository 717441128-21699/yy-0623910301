import React, { useState } from 'react';
import { Archive, AlertTriangle, User, Truck, Layers, Clock, Gauge, Radio, ChevronRight, Flame, Target } from 'lucide-react';
import { useTrainingStore } from '../store/trainingStore';
import { mockCases } from '../data/cases';
import { WindowFrame } from './WindowFrame';
import type { CrisisCategory, CrisisCase } from '../types';
import { CATEGORY_LABELS, DIFFICULTY_LABELS, OUTBREAK_SPEEDS, MEDIA_ATTENTIONS } from '../types';

const CATEGORY_ICONS: Record<CrisisCategory, React.ReactNode> = {
  product_quality: <Archive size={14} />,
  safety_incident: <AlertTriangle size={14} />,
  employee_speech: <User size={14} />,
  supply_chain: <Truck size={14} />,
  other: <Layers size={14} />,
};

const CATEGORY_ORDER: CrisisCategory[] = ['product_quality', 'safety_incident', 'employee_speech', 'supply_chain', 'other'];

const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-calm-teal-400 border-calm-teal-500',
  medium: 'text-terminal-amber border-terminal-amber',
  hard: 'text-alert-red-400 border-alert-red-500',
  expert: 'text-alert-red-500 border-alert-red-600 bg-alert-red-500/10',
};

export const CaseLibrary: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CrisisCategory | 'all'>('all');
  const { selectedCase, selectCase, config, updateConfig, phase, startTraining } = useTrainingStore();

  const filteredCases = activeCategory === 'all'
    ? mockCases
    : mockCases.filter(c => c.category === activeCategory);

  const handleSelectCase = (caseData: CrisisCase) => {
    if (phase === 'running' || phase === 'reviewing') return;
    selectCase(caseData);
  };

  const canStart = phase === 'configuring' && selectedCase !== null;

  return (
    <WindowFrame
      title="案例库 / CASE LIBRARY"
      icon={<Archive size={14} />}
      statusIndicator={phase === 'idle' || phase === 'configuring' ? 'active' : 'idle'}
      className="h-full"
    >
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-deep-blue-500 bg-deep-blue-800/50">
          <div className="flex flex-wrap gap-1">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all ${
                activeCategory === 'all'
                  ? 'bg-pro-gold-500/20 border-pro-gold-400 text-pro-gold-300 shadow-glow-gold'
                  : 'bg-deep-blue-700 border-deep-blue-500 text-deep-blue-200 hover:border-deep-blue-400'
              }`}
            >
              全部场景
            </button>
            {CATEGORY_ORDER.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1 text-xs font-mono rounded-sm border flex items-center gap-1.5 transition-all ${
                  activeCategory === cat
                    ? 'bg-pro-gold-500/20 border-pro-gold-400 text-pro-gold-300 shadow-glow-gold'
                    : 'bg-deep-blue-700 border-deep-blue-500 text-deep-blue-200 hover:border-deep-blue-400'
                }`}
              >
                {CATEGORY_ICONS[cat]}
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {filteredCases.map(caseData => (
            <div
              key={caseData.id}
              onClick={() => handleSelectCase(caseData)}
              className={`p-3 rounded-sm border cursor-pointer transition-all ${
                selectedCase?.id === caseData.id
                  ? 'bg-deep-blue-600/60 border-pro-gold-400 shadow-glow-gold'
                  : 'bg-deep-blue-700/40 border-deep-blue-500 hover:border-deep-blue-400 hover:bg-deep-blue-600/30'
              } ${phase === 'running' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-pro-gold-400">{CATEGORY_ICONS[caseData.category]}</span>
                  <h3 className="font-serif-cn text-sm text-deep-blue-50 font-semibold leading-snug">{caseData.title}</h3>
                </div>
                <span className={`px-2 py-0.5 text-[10px] font-mono rounded-sm border whitespace-nowrap ${DIFFICULTY_COLORS[caseData.difficulty]}`}>
                  {DIFFICULTY_LABELS[caseData.difficulty]}
                </span>
              </div>
              <p className="text-xs text-deep-blue-200 leading-relaxed mb-2 font-mono">{caseData.summary}</p>
              <div className="flex items-center gap-3 text-[11px] text-deep-blue-300 font-mono">
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  约{caseData.estimatedDuration}分钟
                </span>
                <span className="flex items-center gap-1">
                  <Target size={11} />
                  {caseData.keywords.length}个核心关注点
                </span>
              </div>
            </div>
          ))}
        </div>

        {selectedCase && phase !== 'running' && phase !== 'reviewing' && (
          <div className="border-t border-deep-blue-500 bg-deep-blue-800/80 p-3 space-y-3">
            <div className="border-l-2 border-pro-gold-400 pl-3">
              <h4 className="font-serif-cn text-sm text-pro-gold-300 mb-1">训练参数配置</h4>
              <p className="text-[11px] text-deep-blue-300 font-mono">调整参数模拟不同强度的危机环境</p>
            </div>

            <div className="space-y-2">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-deep-blue-200 font-mono flex items-center gap-1.5">
                    <Flame size={12} className="text-alert-red-400" />
                    爆发速度
                  </label>
                  <span className="text-xs text-terminal-amber font-mono">{OUTBREAK_SPEEDS[config.outbreakSpeed - 1]}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={config.outbreakSpeed}
                  onChange={(e) => updateConfig({ outbreakSpeed: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                  className="w-full h-1.5 bg-deep-blue-600 rounded-full appearance-none cursor-pointer accent-alert-red-500"
                />
                <div className="flex justify-between text-[10px] text-deep-blue-400 font-mono mt-0.5">
                  <span>慢</span>
                  <span>中</span>
                  <span>快</span>
                  <span>极快</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-deep-blue-200 font-mono flex items-center gap-1.5">
                    <Radio size={12} className="text-terminal-cyan" />
                    媒体关注度
                  </label>
                  <span className="text-xs text-terminal-amber font-mono">{MEDIA_ATTENTIONS[config.mediaAttention - 1]}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  value={config.mediaAttention}
                  onChange={(e) => updateConfig({ mediaAttention: Number(e.target.value) as 1 | 2 | 3 | 4 })}
                  className="w-full h-1.5 bg-deep-blue-600 rounded-full appearance-none cursor-pointer accent-terminal-cyan"
                />
                <div className="flex justify-between text-[10px] text-deep-blue-400 font-mono mt-0.5">
                  <span>低</span>
                  <span>中</span>
                  <span>高</span>
                  <span>极高</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-deep-blue-200 font-mono flex items-center gap-1.5">
                    <Gauge size={12} className="text-calm-teal-400" />
                    演练时长
                  </label>
                  <span className="text-xs text-terminal-amber font-mono">{config.duration} 分钟</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={30}
                  step={5}
                  value={config.duration}
                  onChange={(e) => updateConfig({ duration: Number(e.target.value) })}
                  className="w-full h-1.5 bg-deep-blue-600 rounded-full appearance-none cursor-pointer accent-calm-teal-500"
                />
                <div className="flex justify-between text-[10px] text-deep-blue-400 font-mono mt-0.5">
                  <span>5分</span>
                  <span>15分</span>
                  <span>30分</span>
                </div>
              </div>
            </div>

            <div className="pt-1">
              <div className="text-[10px] text-deep-blue-400 font-mono mb-1">案例背景</div>
              <p className="text-xs text-deep-blue-200 leading-relaxed line-clamp-3">{selectedCase.background}</p>
            </div>

            <button
              onClick={startTraining}
              disabled={!canStart}
              className={`w-full py-2.5 text-sm font-serif-cn rounded-sm border flex items-center justify-center gap-2 transition-all ${
                canStart
                  ? 'bg-alert-red-600 hover:bg-alert-red-500 border-alert-red-400 text-white shadow-glow-red'
                  : 'bg-deep-blue-700 border-deep-blue-500 text-deep-blue-400 cursor-not-allowed'
              }`}
            >
              <ChevronRight size={16} />
              启动危机演练
            </button>
          </div>
        )}

        {!selectedCase && phase !== 'running' && phase !== 'reviewing' && (
          <div className="border-t border-deep-blue-500 bg-deep-blue-800/50 p-3">
            <p className="text-xs text-deep-blue-400 font-mono text-center">
              ↑ 请从上方选择一个危机案例开始训练
            </p>
          </div>
        )}

        {(phase === 'running' || phase === 'reviewing') && (
          <div className="border-t border-deep-blue-500 bg-deep-blue-800/50 p-3">
            <div className="text-xs text-terminal-amber font-mono text-center animate-pulse">
              ⚠ 演练进行中，请在中间窗口接收舆情并撰写回应
            </div>
          </div>
        )}
      </div>
    </WindowFrame>
  );
};
