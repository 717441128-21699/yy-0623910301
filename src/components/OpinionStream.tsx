import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  AlertTriangle,
  ShieldAlert,
  Flame,
} from 'lucide-react';
import { useTrainingStore } from '../store/trainingStore';
import { WindowFrame } from './WindowFrame';
import type { OpinionSource, OpinionItem, Sentiment, CrisisCase } from '../types';
import { SOURCE_LABELS, PRESSURE_LEVELS, MEDIA_ATTENTIONS } from '../types';

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

function formatDateTime(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}月${d.getDate()}日 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

const ADDITIONAL_OPINIONS_BY_LEVEL: Record<number, OpinionItem[]> = {
  1: [],
  2: [
    { id: 'extra-l2-1', source: 'media', sourceName: '行业资讯号', content: '网友热议：这家公司的处理方式你怎么看？评论区已经吵翻了...', timestamp: 120, sentiment: 'neutral' },
  ],
  3: [
    { id: 'extra-l3-1', source: 'kol', sourceName: '行业大V观察', content: '我从业十年，这种情况如果24小时内拿不出像样的回应，基本就凉了。坐等看戏。', timestamp: 90, sentiment: 'negative' },
    { id: 'extra-l3-2', source: 'news', sourceName: '财经快讯', content: '【快讯】受事件影响，相关板块个股出现异动，分析师提示风险', timestamp: 130, sentiment: 'negative' },
    { id: 'extra-l3-3', source: 'social_media', sourceName: '微博话题', content: '#某某某事件#话题主持人：已有5万条讨论，热度持续上升中', timestamp: 150, sentiment: 'negative' },
  ],
  4: [
    { id: 'extra-l4-1', source: 'kol', sourceName: '百万粉丝大V-内幕帝', content: '收到内部爆料，这事比曝出来的严重多了！有员工透露早就有隐患...懂的都懂', timestamp: 70, sentiment: 'negative' },
    { id: 'extra-l4-2', source: 'news', sourceName: '国家级媒体', content: '【评论】企业主体责任不容推卸，三问某某公司：良知何在？底线何在？担当何在？', timestamp: 100, sentiment: 'negative' },
    { id: 'extra-l4-3', source: 'kol', sourceName: '前资深公关总监', content: '从专业角度看这个回应窗口：还剩X小时，如果我是公关现在已经在公司打地铺了', timestamp: 120, sentiment: 'neutral' },
    { id: 'extra-l4-4', source: 'news', sourceName: '证券时报', content: '上市公司舆情危机追踪：某某公司股价盘中跳水逾5%，机构紧急评估', timestamp: 140, sentiment: 'negative' },
    { id: 'extra-l4-5', source: 'social_media', sourceName: '抖音热搜', content: '热搜TOP1：某某某道歉 沸；TOP3：某某某股价；TOP7：某某某员工发声', timestamp: 160, sentiment: 'negative' },
    { id: 'extra-l4-6', source: 'kol', sourceName: '法律博主', content: '科普：类似情况消费者可主张哪些赔偿？集体诉讼怎么发起？我整理了一份清单...', timestamp: 180, sentiment: 'negative' },
    { id: 'extra-l4-7', source: 'customer_service', sourceName: '维权群截图', content: '"已有300多人了，还在不断加人！大家团结起来！""我已经联系了媒体朋友"', timestamp: 110, sentiment: 'negative', isScreenshot: true, screenshotMeta: { platform: '微信群', username: '维权志愿者' } },
  ],
};

const OpinionCard: React.FC<{ opinion: OpinionItem; isNew: boolean; tension: number }> = ({ opinion, isNew, tension }) => {
  const config = SOURCE_CONFIG[opinion.source];
  const sentiment = SENTIMENT_BADGE[opinion.sentiment];
  const highTension = tension >= 3;
  const extremeTension = tension >= 4;

  return (
    <div
      className={`p-3 rounded-sm border-l-2 ${config.color} bg-deep-blue-800/50 border-y border-r border-deep-blue-500 transition-all duration-500 ${
        isNew ? (extremeTension ? 'animate-pulse-fast shadow-glow-red' : highTension ? 'animate-pulse shadow-glow-teal' : 'animate-pulse') : ''
      } ${highTension && opinion.sentiment === 'negative' ? 'bg-alert-red-500/5' : ''}`}
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
          {extremeTension && opinion.sentiment === 'negative' && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-sm bg-alert-red-500/20 border border-alert-red-500 text-alert-red-400 animate-pulse">
              <Flame size={9} className="inline -mt-0.5 mr-0.5" />火
            </span>
          )}
        </div>
        <span className="text-[10px] text-deep-blue-400 font-mono">
          T+{formatTime(opinion.timestamp)}
        </span>
      </div>
      <div className="text-xs text-deep-blue-100 font-mono mb-1.5 text-deep-blue-300/80">
        @{opinion.sourceName}
      </div>
      {opinion.isScreenshot ? (
        <div className={`bg-deep-blue-900/80 p-2.5 rounded-sm border ${extremeTension ? 'border-alert-red-500/30' : 'border-deep-blue-500'}`}>
          <div className="text-[10px] text-deep-blue-400 font-mono mb-1 flex items-center gap-1">
            <Activity size={10} />
            [截图来源: {opinion.screenshotMeta?.platform} - @{opinion.screenshotMeta?.username}]
          </div>
          <p className="text-xs text-terminal-green font-mono leading-relaxed whitespace-pre-wrap">
            {opinion.content}
          </p>
        </div>
      ) : (
        <p className={`text-sm leading-relaxed ${highTension && opinion.sentiment === 'negative' ? 'text-deep-blue-100' : 'text-deep-blue-50'}`}>
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
  const extraInjectedRef = useRef<Set<string>>(new Set());

  const totalSeconds = config.duration * 60;
  const isUrgent = timeRemaining <= 30 && phase === 'running';
  const isVeryUrgent = timeRemaining <= 10 && phase === 'running';

  const pressureLevel = useMemo(() => {
    const avg = (config.outbreakSpeed + config.mediaAttention) / 2;
    const level = Math.max(1, Math.min(4, Math.round(avg))) as 1 | 2 | 3 | 4;
    return PRESSURE_LEVELS[level - 1];
  }, [config.outbreakSpeed, config.mediaAttention]);

  const augmentedOpinionStream = useMemo((): OpinionItem[] => {
    if (!selectedCase) return [];
    const extras = ADDITIONAL_OPINIONS_BY_LEVEL[pressureLevel.level] || [];
    return [...selectedCase.opinionStream, ...extras].sort((a, b) => a.timestamp - b.timestamp);
  }, [selectedCase, pressureLevel.level]);

  useEffect(() => {
    if (phase !== 'running') {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    deliveredRef.current = new Set();
    extraInjectedRef.current = new Set();

    timerRef.current = window.setInterval(() => {
      setTimeRemaining(Math.max(0, useTrainingStore.getState().timeRemaining - 1));

      const state = useTrainingStore.getState();
      if (state.selectedCase && state.phase === 'running') {
        const elapsed = totalSeconds - state.timeRemaining;
        const speedMultiplier = 1 + (state.config.outbreakSpeed - 1) * 0.5;
        const attentionMultiplier = pressureLevel.opinionMultiplier;
        const combinedMultiplier = speedMultiplier * (0.8 + attentionMultiplier * 0.3);
        const adjustedElapsed = elapsed * combinedMultiplier;

        for (const opinion of augmentedOpinionStream) {
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
            }, 3000 + pressureLevel.visualTension * 200);
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
  }, [phase, totalSeconds, addOpinion, setTimeRemaining, augmentedOpinionStream, pressureLevel]);

  useEffect(() => {
    if (streamRef.current && (phase === 'running' || phase === 'reviewing')) {
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

  const expectedTotal = augmentedOpinionStream.length || 1;
  const baseHeat = Math.min(100, Math.round((currentOpinions.length / expectedTotal) * 80));
  const negativeRatio = currentOpinions.length > 0
    ? sentimentCounts.negative / currentOpinions.length
    : 0.5;
  const heatLevel = Math.min(100, Math.round(baseHeat + negativeRatio * 20 * pressureLevel.level));

  const handleSubmit = () => {
    if (phase === 'running') submitResponse();
  };

  const statusColor = phase === 'running'
    ? (isVeryUrgent ? 'danger' : isUrgent ? 'warning' : 'active')
    : phase === 'reviewing' ? 'success' : 'idle';

  const tension = pressureLevel.visualTension;
  const heatColorClass = heatLevel > 85 ? 'text-alert-red-400 animate-pulse-fast'
    : heatLevel > 65 ? 'text-alert-red-400'
      : heatLevel > 40 ? 'text-terminal-amber'
        : 'text-terminal-green';

  const headerExtra = phase === 'running' && (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-sm border"
        style={{
          borderColor: tension >= 4 ? '#e63946' : tension >= 3 ? '#ffb000' : tension >= 2 ? '#d4a373' : '#2a9d8f',
          color: tension >= 4 ? '#ef5a67' : tension >= 3 ? '#ffb000' : tension >= 2 ? '#e0bd99' : '#3ab5a6',
          backgroundColor: tension >= 3 ? 'rgba(230,57,70,0.08)' : 'transparent',
        }}
      >
        <ShieldAlert size={11} />
        {pressureLevel.label}
      </div>
      <div className="flex items-center gap-1 text-[11px] font-mono">
        <TrendingUp size={12} className="text-terminal-amber" />
        <span className="text-deep-blue-200">热度</span>
        <span className={heatColorClass}>{heatLevel}%</span>
      </div>
      <div
        className={`px-3 py-1 rounded-sm border font-mono text-lg tracking-wider ${
          isVeryUrgent
            ? 'bg-alert-red-500/30 border-alert-red-400 text-alert-red-400 animate-pulse-fast shadow-glow-red'
            : isUrgent
              ? 'bg-alert-red-500/20 border-alert-red-400 text-alert-red-400 animate-pulse'
              : tension >= 3
                ? 'bg-deep-blue-700 border-alert-red-500/50 text-terminal-amber'
                : 'bg-deep-blue-700 border-deep-blue-500 text-terminal-green'
        }`}
      >
        <Clock size={14} className="inline mr-1.5 -mt-0.5" />
        {formatTime(timeRemaining)}
      </div>
    </div>
  );

  const streamContainerClass = phase === 'running' && tension >= 4
    ? 'flex-1 overflow-y-auto p-3 space-y-2 bg-alert-red-500/[0.02]'
    : 'flex-1 overflow-y-auto p-3 space-y-2';

  return (
    <WindowFrame
      title={`模拟舆情流 / OPINION STREAM${phase === 'running' ? ` [${MEDIA_ATTENTIONS[config.mediaAttention - 1]}]` : ''}`}
      icon={<RadioTower size={14} />}
      statusIndicator={statusColor as any}
      className="h-full"
      extraHeader={headerExtra}
    >
      <div className="flex flex-col h-full">
        {(phase === 'running' || phase === 'reviewing') && (
          <div className={`flex border-b border-deep-blue-500 ${tension >= 3 && phase === 'running' ? 'bg-alert-red-500/[0.04]' : 'bg-deep-blue-800/50'}`}>
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
                  {currentOpinions.length}/{augmentedOpinionStream.length}
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
              {response.officialResponse && <span className="ml-1 text-[10px] text-calm-teal-400">已填写</span>}
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
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-full bg-deep-blue-600 border border-deep-blue-500 flex items-center justify-center">
                <AlertCircle size={36} className="text-terminal-amber animate-pulse" />
              </div>
              <h3 className="font-serif-cn text-deep-blue-200 text-sm">训练参数已就绪</h3>
              <div className="space-y-1 text-xs text-deep-blue-400 font-mono max-w-xs">
                <p>案例: {selectedCase?.title}</p>
                <p>压力等级: {pressureLevel.label}（{pressureLevel.description}）</p>
                <p>预计舆情条目: {augmentedOpinionStream.length}条</p>
              </div>
              {tension >= 3 && (
                <div className="p-2 rounded-sm border border-alert-red-500/40 bg-alert-red-500/5 text-[11px] text-alert-red-400 font-mono">
                  <AlertTriangle size={12} className="inline -mt-0.5 mr-1" />
                  高压力模式：舆情来得快且猛，注意时间分配！
                </div>
              )}
            </div>
          </div>
        )}

        {phase === 'reviewing' && activeTab === 'stream' && (
          <div ref={streamRef} className={streamContainerClass}>
            {currentOpinions.map((op) => (
              <OpinionCard key={op.id} opinion={op} isNew={false} tension={tension} />
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
                  {tension >= 3 && sentimentCounts.negative > sentimentCounts.positive + sentimentCounts.neutral && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-sm bg-alert-red-500/20 border border-alert-red-500 text-alert-red-400 animate-pulse text-[10px]">
                      <AlertTriangle size={9} className="inline -mt-0.5 mr-0.5" />
                      负面主导
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-deep-blue-400 font-mono">
                  共 {currentOpinions.length} / {augmentedOpinionStream.length} 条
                </div>
              </div>
            )}
            <div ref={streamRef} className={streamContainerClass}>
              {currentOpinions.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-deep-blue-400 font-mono animate-pulse">
                    ▌ {tension >= 3 ? '暴风雨前的宁静...舆情即将爆发！' : '等待舆情发酵...'}
                  </p>
                </div>
              ) : (
                currentOpinions.map((op) => (
                  <OpinionCard key={op.id} opinion={op} isNew={newOpinionIds.has(op.id)} tension={tension} />
                ))
              )}
            </div>
          </>
        )}

        {(phase === 'running' || phase === 'reviewing') && activeTab === 'response' && (
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex border-b border-deep-blue-500 bg-deep-blue-800/30">
              {[
                { key: 'official', label: '第一版回应', icon: <FileText size={12} />, done: !!response.officialResponse },
                { key: 'qa', label: '问答口径', icon: <BookOpen size={12} />, done: !!response.qaPoints },
                { key: 'internal', label: '内部通报', icon: <Users size={12} />, done: !!response.internalNotice },
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
                  {tab.done && <CheckCircleMini />}
                </button>
              ))}
            </div>

            <div className="flex-1 p-3 overflow-y-auto">
              {responseTab === 'official' && (
                <div className="space-y-2 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-pro-gold-300 font-serif-cn">面向公众的第一版官方回应</label>
                    <span className="text-[11px] font-mono text-deep-blue-400">{response.officialResponse.length} 字</span>
                  </div>
                  <textarea
                    value={response.officialResponse}
                    onChange={(e) => updateResponse({ officialResponse: e.target.value })}
                    disabled={phase === 'reviewing'}
                    placeholder={`【标题】关于XX事件的情况说明\n\n尊敬的消费者/公众：\n\n我们高度关注近日关于XX事件的讨论，对此深表歉意...\n\n一、事件情况\n...\n\n二、已采取措施\n1. ...\n2. ...\n\n三、后续承诺\n\n联系方式：\n\nXX公司\nXXXX年X月X日`}
                    className="flex-1 w-full min-h-[180px] p-3 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono leading-relaxed focus:outline-none focus:border-pro-gold-400 focus:shadow-glow-gold transition-all resize-none placeholder:text-deep-blue-500"
                  />
                </div>
              )}
              {responseTab === 'qa' && (
                <div className="space-y-2 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-pro-gold-300 font-serif-cn">媒体及消费者问答口径（Q&A）</label>
                    <span className="text-[11px] font-mono text-deep-blue-400">{response.qaPoints.length} 字</span>
                  </div>
                  <textarea
                    value={response.qaPoints}
                    onChange={(e) => updateResponse({ qaPoints: e.target.value })}
                    disabled={phase === 'reviewing'}
                    placeholder={`问：[高频问题1]\n答：[清晰回答]\n\n问：[高频问题2]\n答：[清晰回答]\n\n（建议至少5组）`}
                    className="flex-1 w-full min-h-[180px] p-3 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono leading-relaxed focus:outline-none focus:border-pro-gold-400 focus:shadow-glow-gold transition-all resize-none placeholder:text-deep-blue-500"
                  />
                </div>
              )}
              {responseTab === 'internal' && (
                <div className="space-y-2 h-full flex flex-col">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-pro-gold-300 font-serif-cn">内部通报要点</label>
                    <span className="text-[11px] font-mono text-deep-blue-400">{response.internalNotice.length} 字</span>
                  </div>
                  <textarea
                    value={response.internalNotice}
                    onChange={(e) => updateResponse({ internalNotice: e.target.value })}
                    disabled={phase === 'reviewing'}
                    placeholder={`【内部紧急通知】\n\n一、事件定级：\n二、对外统一口径（三句话版本）：\n三、绝对禁令：\n四、各部门任务：\n五、上报机制：`}
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
                  提交回应方案（当前：{response.officialResponse.length + response.qaPoints.length + response.internalNotice.length}字）
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

const CheckCircleMini: React.FC = () => (
  <span className="ml-1 w-3 h-3 rounded-full bg-calm-teal-500/30 border border-calm-teal-500 flex items-center justify-center">
    <span className="text-[8px] text-calm-teal-400">✓</span>
  </span>
);
