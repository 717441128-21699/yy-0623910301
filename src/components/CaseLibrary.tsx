import React, { useState } from 'react';
import {
  Archive,
  AlertTriangle,
  User,
  Truck,
  Layers,
  Clock,
  Gauge,
  Radio,
  ChevronRight,
  Flame,
  Target,
  Plus,
  History,
  Pencil,
  Trash2,
  Wand2,
} from 'lucide-react';
import { useTrainingStore } from '../store/trainingStore';
import { WindowFrame } from './WindowFrame';
import { CaseEditorModal } from './CaseEditorModal';
import type { CrisisCategory, CrisisCase } from '../types';
import { CATEGORY_LABELS, DIFFICULTY_LABELS, OUTBREAK_SPEEDS, MEDIA_ATTENTIONS, PRESSURE_LEVELS } from '../types';

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

function computePressure(outbreak: number, media: number) {
  const avg = (outbreak + media) / 2;
  const level = Math.max(1, Math.min(4, Math.round(avg))) as 1 | 2 | 3 | 4;
  return PRESSURE_LEVELS[level - 1];
}

export const CaseLibrary: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CrisisCategory | 'all'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CrisisCase | null>(null);

  const {
    selectedCase,
    selectCase,
    config,
    updateConfig,
    phase,
    startTraining,
    allCases,
    activePanel,
    setActivePanel,
    deleteCustomCase,
    records,
  } = useTrainingStore();

  const filteredCases = activeCategory === 'all'
    ? allCases
    : allCases.filter(c => c.category === activeCategory);

  const isCustom = (id: string) => id.startsWith('custom-');

  const handleSelectCase = (caseData: CrisisCase) => {
    if (phase === 'running' || phase === 'reviewing') return;
    selectCase(caseData);
  };

  const canStart = phase === 'configuring' && selectedCase !== null;

  const openNewEditor = () => {
    setEditingCase(null);
    setEditorOpen(true);
  };

  const openEditEditor = (c: CrisisCase) => {
    setEditingCase(c);
    setEditorOpen(true);
  };

  const previewPressure = computePressure(config.outbreakSpeed, config.mediaAttention);

  return (
    <>
      <CaseEditorModal isOpen={editorOpen} onClose={() => { setEditorOpen(false); setEditingCase(null); }} initialCase={editingCase} />

      <WindowFrame
        title="案例库 / CASE LIBRARY"
        icon={<Archive size={14} />}
        statusIndicator={phase === 'idle' || phase === 'configuring' ? 'active' : 'idle'}
        className="h-full"
        extraHeader={
          <div className="flex items-center gap-1">
            {records.length > 0 && (
              <button
                onClick={() => setActivePanel(activePanel === 'records' ? 'case' : 'records')}
                className={`px-2 py-0.5 text-[10px] font-mono rounded-sm border flex items-center gap-0.5 transition-all ${
                  activePanel === 'records'
                    ? 'bg-calm-teal-500/20 border-calm-teal-500/50 text-calm-teal-400'
                    : 'border-deep-blue-500 text-deep-blue-300 hover:text-deep-blue-100 hover:bg-deep-blue-700/50'
                }`}
              >
                <History size={10} />
                记录 {records.length > 0 && <span className="text-[9px] bg-deep-blue-600 px-1 rounded-sm">{records.length}</span>}
              </button>
            )}
            {(phase === 'idle' || phase === 'configuring') && (
              <button
                onClick={openNewEditor}
                className="px-2 py-0.5 text-[10px] font-mono rounded-sm border bg-pro-gold-500/20 border-pro-gold-500/50 text-pro-gold-300 hover:bg-pro-gold-500/30 flex items-center gap-0.5 transition-all"
              >
                <Plus size={10} />
                新建
              </button>
            )}
          </div>
        }
      >
        <div className="flex flex-col h-full">
          <div className="p-3 border-b border-deep-blue-500 bg-deep-blue-800/50 space-y-2">
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setActiveCategory('all')}
                className={`px-3 py-1 text-xs font-mono rounded-sm border transition-all ${
                  activeCategory === 'all'
                    ? 'bg-pro-gold-500/20 border-pro-gold-400 text-pro-gold-300 shadow-glow-gold'
                    : 'bg-deep-blue-700 border-deep-blue-500 text-deep-blue-200 hover:border-deep-blue-400'
                }`}
              >
                全部({allCases.length})
              </button>
              {CATEGORY_ORDER.map(cat => {
                const cnt = allCases.filter(c => c.category === cat).length;
                if (cnt === 0) return null;
                return (
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
                    {CATEGORY_LABELS[cat]}<span className="text-[10px] opacity-60">({cnt})</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {filteredCases.length === 0 ? (
              <div className="text-center py-8 text-xs text-deep-blue-400 font-mono">
                <Wand2 size={20} className="mx-auto mb-2 text-deep-blue-500" />
                此分类暂无案例
              </div>
            ) : filteredCases.map(caseData => {
              const custom = isCustom(caseData.id);
              return (
                <div
                  key={caseData.id}
                  className={`p-3 rounded-sm border transition-all ${
                    selectedCase?.id === caseData.id
                      ? 'bg-deep-blue-600/60 border-pro-gold-400 shadow-glow-gold'
                      : 'bg-deep-blue-700/40 border-deep-blue-500 hover:border-deep-blue-400 hover:bg-deep-blue-600/30'
                  } ${phase === 'running' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  onClick={() => handleSelectCase(caseData)}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 min-w-0">
                      <span className="text-pro-gold-400 flex-shrink-0 mt-0.5">{CATEGORY_ICONS[caseData.category]}</span>
                      <h3 className="font-serif-cn text-sm text-deep-blue-50 font-semibold leading-snug break-all">{caseData.title}</h3>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {custom && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono rounded-sm bg-calm-teal-500/15 border border-calm-teal-500/40 text-calm-teal-400">
                          自定义
                        </span>
                      )}
                      <span className={`px-2 py-0.5 text-[10px] font-mono rounded-sm border whitespace-nowrap ${DIFFICULTY_COLORS[caseData.difficulty]}`}>
                        {DIFFICULTY_LABELS[caseData.difficulty]}
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-deep-blue-200 leading-relaxed mb-2 font-mono line-clamp-2">
                    {caseData.background.slice(0, 120)}{caseData.background.length > 120 ? '...' : ''}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-[11px] text-deep-blue-300 font-mono">
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        约{caseData.estimatedDuration}分钟
                      </span>
                      <span className="flex items-center gap-1">
                        <Target size={11} />
                        {caseData.keywords.length}个关键词
                      </span>
                      <span className="flex items-center gap-1">
                        <Radio size={11} />
                        {caseData.opinionStream.length}条舆情
                      </span>
                    </div>
                    {custom && phase !== 'running' && phase !== 'reviewing' && (
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); openEditEditor(caseData); }}
                          className="p-1 rounded-sm text-deep-blue-400 hover:text-pro-gold-400 hover:bg-pro-gold-500/10 transition-colors"
                          title="编辑"
                        >
                          <Pencil size={12} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`确定删除案例「${caseData.title}」吗？此操作不可恢复。`)) {
                              deleteCustomCase(caseData.id);
                            }
                          }}
                          className="p-1 rounded-sm text-deep-blue-400 hover:text-alert-red-400 hover:bg-alert-red-500/10 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {selectedCase && phase !== 'running' && phase !== 'reviewing' && (
            <div className="border-t border-deep-blue-500 bg-deep-blue-800/80 p-3 space-y-3">
              <div className="border-l-2 border-pro-gold-400 pl-3">
                <h4 className="font-serif-cn text-sm text-pro-gold-300 mb-1">训练参数配置</h4>
                <p className="text-[11px] text-deep-blue-300 font-mono">调整参数模拟不同强度的危机环境</p>
              </div>

              <div
                className="p-2 rounded-sm border"
                style={{
                  borderColor: previewPressure.level >= 4 ? '#e63946' : previewPressure.level >= 3 ? '#ffb000' : previewPressure.level >= 2 ? '#d4a373' : '#2a9d8f',
                  background: previewPressure.level >= 3 ? 'rgba(230,57,70,0.05)' : 'transparent',
                }}
              >
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-deep-blue-300">预估压力等级</span>
                  <span style={{
                    color: previewPressure.level >= 4 ? '#e63946' : previewPressure.level >= 3 ? '#ffb000' : previewPressure.level >= 2 ? '#d4a373' : '#2a9d8f',
                  }}>
                    Lv.{previewPressure.level} · {previewPressure.label}
                  </span>
                </div>
                <div className="text-[9px] font-mono text-deep-blue-500 mt-0.5">
                  {previewPressure.description}
                </div>
              </div>

              <div className="space-y-2.5">
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
                    <span>慢发酵</span>
                    <span>稳定</span>
                    <span>快速</span>
                    <span>爆炸</span>
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
                    <span>行业内</span>
                    <span>本地媒体</span>
                    <span>全国媒体</span>
                    <span>全网聚焦</span>
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

              <div className="pt-0.5">
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
              <p className="text-xs text-deep-blue-400 font-mono text-center mb-2">
                ↑ 请从上方选择一个危机案例开始训练
              </p>
              <button
                onClick={openNewEditor}
                className="w-full py-1.5 text-[11px] font-mono rounded-sm border bg-deep-blue-700 hover:bg-deep-blue-600 border-deep-blue-500 text-deep-blue-200 flex items-center justify-center gap-1.5 transition-all"
              >
                <Plus size={11} />
                新建企业自定义案例
              </button>
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
    </>
  );
};
