import React, { useEffect, useRef, useState } from 'react';
import {
  RadioTower,
  Clock,
  Newspaper,
  Users,
  MessageSquare,
  Headphones,
  Tv,
  FileText,
  BookOpen,
  AlertCircle,
  Send,
  RotateCcw,
  Activity,
  TrendingUp,
} from 'lucide-react';
import { useTrainingStore } from '../store/trainingStore';
import { WindowFrame } from './WindowFrame';
import type { OpinionSource, OpinionItem, Sentiment } from '../types';
import { SOURCE_LABELS } from '../types';

const SOURCE_CONFIG: Record<OpinionSource, { icon: React.ReactNode; color: string; labelColor: string }> = {
  news: { icon: <Newspaper size={12} />, color: 'border-terminal-cyan', labelColor: 'text-terminal-cyan bg-terminal-cyan/10' },
  social_media: { icon: <Users size={12} />, color: 'border-alert-red-400', labelColor: 'text-alert-red-400 bg-alert-red-400/10' },
  kol: { icon: <MessageSquare size={12} />, color: 'border-pro-gold-400', labelColor: 'text-pro-gold-400 bg-pro-gold-400/10' },
  customer_service: { icon: <Headphones size={12} />, color: 'border-terminal-amber', labelColor: 'text-terminal-amber bg-terminal-amber/10' },
  media: { icon: <Tv size={12} />, color: 'border-terminal-green', labelColor: 'text-terminal-green bg-terminal-green/10' },
};

const SENTIMENT_BADGE: Record<Sentiment, { text: string; color: string }> = {
  positive: { text: '正面', color: 'text-calm-teal-400 bg-calm-teal-400/10 border-calm-teal-500' },
  neutral: { text: '中性', color: 'text-deep-blue-200 bg-deep-blue-500/30 border-deep-blue-400' },
  negative: { text: '负面', color: 'text-alert-red-400 bg-alert-red-400/10 border-alert-red-500' },
};

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

const OpinionCard: React.FC<{ opinion: OpinionItem; isNew: boolean }> = ({ opinion, isNew }) => {
  const config = SOURCE_CONFIG[opinion.source];
  const sentiment = SENTIMENT_BADGE[opinion.sentiment];

  return (
    <div
      className={`p-3 rounded-sm border-l-2 ${config.color} bg-deep-blue-800/50 border-y border-r border-deep-blue-500 transition-all duration-500 ${
        isNew ? 'animate-pulse shadow-glow-teal' : ''
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm flex items-center gap-1 ${config.labelColor}`}>
            {config.icon}
            {SOURCE_LABELS[opinion.source]}
          </span>
          <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm border ${sentiment.color}`}>
            {sentiment.text}
          </span>
        </div>
        <span className="text-[10px] text-deep-blue-400 font-mono">
          T+{formatTime(opinion.timestamp)}
        </span>
      </div>
      <div className="text-xs text-deep-blue-100 font-mono mb-1.5 text-deep-blue-300/80">
        @{opinion.sourceName}
      </div>
      {opinion.isScreenshot ? (
        <div className="bg-deep-blue-900/80 p-2.5 rounded-sm border border-deep-blue-500">
          <div className="text-[10px] text-deep-blue-400 font-mono mb-1 flex items-center gap-1">
            <Activity size={10} />
            [截图来源: {opinion.screenshotMeta?.platform} - @{opinion.screenshotMeta?.username}]
          </div>
          <p className="text-xs text-terminal-green font-mono leading-relaxed whitespace-pre-wrap">
            {opinion.content}
          </p>
        </div>
      ) : (
        <p className="text-sm text-deep-blue-50 leading-relaxed">
          {opinion.content}
        </p>
      )}
    </div>
  );
};

export const OpinionStream: React.FC = () => {
  const {
    phase,
    selectedCase,
    config,
    timeRemaining,
    currentOpinions,
    response,
    updateResponse,
    submitResponse,
    addOpinion,
    setTimeRemaining,
    resetTraining,
  } = useTrainingStore();

  const [activeTab, setActiveTab] = useState<'stream' | 'response'>('stream');
  const [responseTab, setResponseTab] = useState<'official' | 'qa' | 'internal'>('official');
  const [newOpinionIds, setNewOpinionIds] = useState<Set<string>>(new Set());
  const streamRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);
  const deliveredRef = useRef<Set<string>>(new Set());

  const totalSeconds = config.duration * 60;
  const isUrgent = timeRemaining <= 30 && phase === 'running';
  const isVeryUrgent = timeRemaining <= 10 && phase === 'running';

  useEffect(() => {
    if (phase !== 'running') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    deliveredRef.current = new Set();

    timerRef.current = window.setInterval(() => {
      setTimeRemaining(Math.max(0, useTrainingStore.getState().timeRemaining - 1));

      const state = useTrainingStore.getState();
      if (state.selectedCase && state.phase === 'running') {
        const elapsed = totalSeconds - state.timeRemaining;
        const speedMultiplier = 1 + (state.config.outbreakSpeed - 1) * 0.5;
        const adjustedElapsed = elapsed * speedMultiplier;

        for (const opinion of state.selectedCase.opinionStream) {
          if (opinion.timestamp <= adjustedElapsed && !deliveredRef.current.has(opinion.id)) {
            deliveredRef.current.add(opinion.id);
            addOpinion(opinion);
            setNewOpinionIds(prev => {
              const next = new Set(prev);
              next.add(opinion.id);
              return next;
            });
            setTimeout(() => {
              setNewOpinionIds(prev => {
                const next = new Set(prev);
                next.delete(opinion.id);
                return next;
              });
            }, 3000);
          }
        }
      }

      if (useTrainingStore.getState().timeRemaining <= 0) {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        useTrainingStore.getState().submitResponse();
      }
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [phase, totalSeconds, addOpinion, setTimeRemaining]);

  useEffect(() => {
    if (streamRef.current && phase === 'running') {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [currentOpinions, phase]);

  const sentimentCounts = currentOpinions.reduce(
    (acc, o) => {
      acc[o.sentiment]++;
      return acc;
    },
    { positive: 0, neutral: 0, negative: 0 }
  );

  const heatLevel = Math.min(100, Math.round((currentOpinions.length / (selectedCase?.opinionStream.length || 10)) * 100));

  const handleSubmit = () => {
    if (phase === 'running') {
      submitResponse();
    }
  };

  const statusColor = phase === 'running'
    ? (isVeryUrgent ? 'danger' : isUrgent ? 'warning' : 'active')
    : phase === 'reviewing'
      ? 'success'
      : 'idle';

  const headerExtra = phase === 'running' && (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1 text-[11px] font-mono">
        <TrendingUp size={12} className="text-terminal-amber" />
        <span className="text-deep-blue-200">热度:</span>
        <span className={heatLevel > 70 ? 'text-alert-red-400' : heatLevel > 40 ? 'text-terminal-amber' : 'text-terminal-green'}>
          {heatLevel}%
        </span>
      </div>
      <div
        className={`px-3 py-1 rounded-sm border font-mono text-lg tracking-wider ${
          isVeryUrgent
            ? 'bg-alert-red-500/30 border-alert-red-400 text-alert-red-400 animate-pulse-fast shadow-glow-red'
            : isUrgent
              ? 'bg-alert-red-500/20 border-alert-red-400 text-alert-red-400 animate-pulse'
              : 'bg-deep-blue-700 border-deep-blue-500 text-terminal-green'
        }`}
      >
        <Clock size={14} className="inline mr-1.5 -mt-0.5" />
        {formatTime(timeRemaining)}
      </div>
    </div>
  );

  return (
    <WindowFrame
      title="模拟舆情流 / OPINION STREAM"
      icon={<RadioTower size={14} />}
      statusIndicator={statusColor as any}
      className="h-full"
      extraHeader={headerExtra}
    >
      <div className="flex flex-col h-full">
        {(phase === 'running' || phase === 'reviewing') && (
          <div className="flex border-b border-deep-blue-500 bg-deep-blue-800/50">
            <button
              onClick={() => setActiveTab('stream')}
              className={`flex-1 px-4 py-2 text-xs font-mono border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'stream'
                  ? 'border-pro-gold-400 text-pro-gold-300 bg-pro-gold-500/10'
                  : 'border-transparent text-deep-blue-300 hover:text-deep-blue-100'
              }`}
            >
              <RadioTower size={13} />
              舆情监控
              {currentOpinions.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 rounded-sm bg-alert-red-500/30 text-alert-red-400 text-[10px]">
                  {currentOpinions.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('response')}
              className={`flex-1 px-4 py-2 text-xs font-mono border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                activeTab === 'response'
                  ? 'border-pro-gold-400 text-pro-gold-300 bg-pro-gold-500/10'
                  : 'border-transparent text-deep-blue-300 hover:text-deep-blue-100'
              }`}
            >
              <FileText size={13} />
              撰写回应
            </button>
          </div>
        )}

        {phase === 'idle' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-deep-blue-600 border border-deep-blue-500 flex items-center justify-center">
                <RadioTower size={36} className="text-deep-blue-400" />
              </div>
              <h3 className="font-serif-cn text-deep-blue-200 text-sm">等待启动演练</h3>
              <p className="text-xs text-deep-blue-400 font-mono max-w-xs">
                请在左侧案例库中选择危机案例并配置训练参数，点击「启动危机演练」按钮开始
              </p>
            </div>
          </div>
        )}

        {phase === 'configuring' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-deep-blue-600 border border-deep-blue-500 flex items-center justify-center">
                <AlertCircle size={36} className="text-terminal-amber animate-pulse" />
              </div>
              <h3 className="font-serif-cn text-deep-blue-200 text-sm">训练参数已就绪</h3>
              <p className="text-xs text-deep-blue-400 font-mono max-w-xs">
                案例: {selectedCase?.title}<br />
                请检查左侧配置后启动演练
              </p>
            </div>
          </div>
        )}

        {phase === 'reviewing' && activeTab === 'stream' && (
          <div ref={streamRef} className="flex-1 overflow-y-auto p-3 space-y-2">
            {currentOpinions.map((op) => (
              <OpinionCard key={op.id} opinion={op} isNew={false} />
            ))}
          </div>
        )}

        {phase === 'running' && activeTab === 'stream' && (
          <>
            {currentOpinions.length > 0 && (
              <div className="px-3 py-2 bg-deep-blue-800/60 border-b border-deep-blue-500 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[11px] font-mono">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-alert-red-500" />
                    负面: {sentimentCounts.negative}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-deep-blue-400" />
                    中性: {sentimentCounts.neutral}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-calm-teal-500" />
                    正面: {sentimentCounts.positive}
                  </span>
                </div>
                <div className="text-[10px] text-deep-blue-400 font-mono">
                  共 {currentOpinions.length} 条舆情
                </div>
              </div>
            )}
            <div ref={streamRef} className="flex-1 overflow-y-auto p-3 space-y-2">
              {currentOpinions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-deep-blue-400 font-mono animate-pulse">
                    ▌ 等待舆情爆发...
                  </p>
                </div>
              ) : (
                currentOpinions.map((op) => (
                  <OpinionCard key={op.id} opinion={op} isNew={newOpinionIds.has(op.id)} />
                ))
              )}
            </div>
          </>
        )}

        {(phase === 'running' || phase === 'reviewing') && activeTab === 'response' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-deep-blue-500 bg-deep-blue-800/30">
              {[
                { key: 'official', label: '第一版回应', icon: <FileText size={12} /> },
                { key: 'qa', label: '问答口径', icon: <BookOpen size={12} /> },
                { key: 'internal', label: '内部通报', icon: <Users size={12} /> },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setResponseTab(tab.key as any)}
                  className={`flex-1 px-3 py-2 text-xs font-mono border-b-2 transition-colors flex items-center justify-center gap-1 ${
                    responseTab === tab.key
                      ? 'border-calm-teal-400 text-calm-teal-400 bg-calm-teal-400/10'
                      : 'border-transparent text-deep-blue-300 hover:text-deep-blue-100'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex-1 p-3 overflow-y-auto">
              {responseTab === 'official' && (
                <div className="space-y-2 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-pro-gold-300 font-serif-cn">面向公众的第一版官方回应</label>
                    <span className="text-[11px] font-mono text-deep-blue-400">
                      {response.officialResponse.length} 字
                    </span>
                  </div>
                  <textarea
                    value={response.officialResponse}
                    onChange={(e) => updateResponse({ officialResponse: e.target.value })}
                    disabled={phase === 'reviewing'}
                    placeholder={`【标题】关于XX事件的情况说明\n\n尊敬的消费者/公众：\n\n我们关注到近日关于XX事件的讨论，对此高度重视...\n\n【正文】\n1. 事件情况...\n2. 已采取措施...\n3. 后续安排...\n\n对此次事件给大家带来的困扰，我们深表歉意。\n\nXX公司\nXXXX年X月X日`}
                    className="flex-1 w-full min-h-[180px] p-3 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono leading-relaxed focus:outline-none focus:border-pro-gold-400 focus:shadow-glow-gold transition-all resize-none placeholder:text-deep-blue-500"
                  />
                </div>
              )}

              {responseTab === 'qa' && (
                <div className="space-y-2 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-pro-gold-300 font-serif-cn">媒体及消费者问答口径（Q&A）</label>
                    <span className="text-[11px] font-mono text-deep-blue-400">
                      {response.qaPoints.length} 字
                    </span>
                  </div>
                  <textarea
                    value={response.qaPoints}
                    onChange={(e) => updateResponse({ qaPoints: e.target.value })}
                    disabled={phase === 'reviewing'}
                    placeholder={`问：事件的具体情况是什么？\n答：...\n\n问：公司将采取什么措施？\n答：...\n\n问：受影响的消费者如何维权？\n答：...\n\n问：类似事件如何避免？\n答：...`}
                    className="flex-1 w-full min-h-[180px] p-3 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono leading-relaxed focus:outline-none focus:border-pro-gold-400 focus:shadow-glow-gold transition-all resize-none placeholder:text-deep-blue-500"
                  />
                </div>
              )}

              {responseTab === 'internal' && (
                <div className="space-y-2 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-pro-gold-300 font-serif-cn">内部通报要点（员工口径统一）</label>
                    <span className="text-[11px] font-mono text-deep-blue-400">
                      {response.internalNotice.length} 字
                    </span>
                  </div>
                  <textarea
                    value={response.internalNotice}
                    onChange={(e) => updateResponse({ internalNotice: e.target.value })}
                    disabled={phase === 'reviewing'}
                    placeholder={`【内部紧急通知】\n\n各位同事：\n\n今日发生XX事件，现将有关事项通知如下：\n\n一、事件定级：...\n二、对外统一口径：...\n三、各部门工作要求：\n1. 客服部：...\n2. 销售部：...\n3. 公关部：...\n\n请各部门传达到每一位同事，未经授权任何人不得擅自对外发表言论。\n\n危机管理小组\nXXXX年X月X日`}
                    className="flex-1 w-full min-h-[180px] p-3 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono leading-relaxed focus:outline-none focus:border-pro-gold-400 focus:shadow-glow-gold transition-all resize-none placeholder:text-deep-blue-500"
                  />
                </div>
              )}
            </div>

            {phase === 'running' && (
              <div className="p-3 border-t border-deep-blue-500 bg-deep-blue-800/50 flex gap-2">
                <button
                  onClick={handleSubmit}
                  className="flex-1 py-2.5 text-sm font-serif-cn rounded-sm border bg-calm-teal-600 hover:bg-calm-teal-500 border-calm-teal-400 text-white shadow-glow-teal flex items-center justify-center gap-2 transition-all"
                >
                  <Send size={14} />
                  提交回应方案
                </button>
              </div>
            )}

            {phase === 'reviewing' && (
              <div className="p-3 border-t border-deep-blue-500 bg-deep-blue-800/50">
                <button
                  onClick={resetTraining}
                  className="w-full py-2 text-xs font-mono rounded-sm border bg-deep-blue-700 hover:bg-deep-blue-600 border-deep-blue-500 text-deep-blue-200 flex items-center justify-center gap-2 transition-all"
                >
                  <RotateCcw size={13} />
                  返回案例库，重新训练
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </WindowFrame>
  );
};
