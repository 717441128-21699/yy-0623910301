import React, { useState } from 'react';
import {
  BarChart3,
  Award,
  AlertTriangle,
  TrendingUp,
  CheckCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Target,
  Clock,
  ShieldAlert,
  HeartHandshake,
  ScanLine,
  BookOpen,
  Users,
  PenLine,
  Copy,
  Flame,
  Gauge,
  AlertCircle,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useTrainingStore } from '../store/trainingStore';
import { WindowFrame } from './WindowFrame';
import type { ScoreDimension, SectionReview, CoachReview, PressureLevelInfo } from '../types';

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  '回应速度': <Clock size={12} />,
  '事实完整度': <Target size={12} />,
  '态度温度': <HeartHandshake size={12} />,
  '风险词使用': <ShieldAlert size={12} />,
};

const ScoreBar: React.FC<{ dimension: ScoreDimension; defaultOpen?: boolean }> = ({ dimension, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const percentage = (dimension.score / dimension.maxScore) * 100;
  const barColor = percentage >= 80 ? 'bg-calm-teal-500' : percentage >= 60 ? 'bg-terminal-amber' : 'bg-alert-red-500';
  const scoreColor = percentage >= 80 ? 'text-calm-teal-400' : percentage >= 60 ? 'text-terminal-amber' : 'text-alert-red-400';

  return (
    <div className="border border-deep-blue-500 rounded-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-deep-blue-800/50 hover:bg-deep-blue-700/50 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-pro-gold-400">{DIMENSION_ICONS[dimension.name]}</span>
          <span className="text-xs font-serif-cn text-deep-blue-100">{dimension.name}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-mono font-bold ${scoreColor}`}>
            {dimension.score}
            <span className="text-deep-blue-400 font-normal text-xs">/{dimension.maxScore}</span>
          </span>
          {isOpen ? <ChevronUp size={14} className="text-deep-blue-400" /> : <ChevronDown size={14} className="text-deep-blue-400" />}
        </div>
      </button>
      <div className="px-3 pb-3 bg-deep-blue-900/30">
        <div className="h-1.5 bg-deep-blue-700 rounded-full mt-2 overflow-hidden shadow-inset-deep">
          <div className={`h-full ${barColor} rounded-full transition-all duration-700`} style={{ width: `${percentage}%` }} />
        </div>
        {isOpen && (
          <div className="mt-3 space-y-3 animate-fadeIn">
            {dimension.deductions.length > 0 && (
              <div>
                <div className="text-[11px] font-mono text-alert-red-400 mb-1.5 flex items-center gap-1">
                  <XCircle size={11} />
                  扣分项
                </div>
                <ul className="space-y-1">
                  {dimension.deductions.map((d, i) => (
                    <li key={i} className="text-[11px] text-deep-blue-200 font-mono flex items-start gap-1.5">
                      <span className="text-alert-red-400 mt-0.5">-</span>
                      <span>{d.reason}</span>
                      <span className="text-alert-red-400 ml-auto">(-{d.points}分)</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {dimension.suggestions.length > 0 && (
              <div>
                <div className="text-[11px] font-mono text-calm-teal-400 mb-1.5 flex items-center gap-1">
                  <CheckCircle size={11} />
                  改进建议
                </div>
                <ul className="space-y-1">
                  {dimension.suggestions.map((s, i) => (
                    <li key={i} className="text-[11px] text-deep-blue-200 font-mono flex items-start gap-1.5">
                      <span className="text-calm-teal-400 mt-0.5">→</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const SEVERITY_STYLES = {
  high: { bg: 'bg-alert-red-500/15', border: 'border-alert-red-500/50', text: 'text-alert-red-400', label: '高危' },
  medium: { bg: 'bg-terminal-amber/15', border: 'border-terminal-amber/50', text: 'text-terminal-amber', label: '中危' },
  low: { bg: 'bg-deep-blue-500/30', border: 'border-deep-blue-400/50', text: 'text-deep-blue-300', label: '低危' },
};

function PressureCard({ level }: { level: PressureLevelInfo }) {
  const lvl = level.level;
  const colorMap: Record<number, { bg: string; border: string; text: string; bar: string; accent: string }> = {
    1: {
      bg: 'bg-calm-teal-500/8',
      border: 'border-calm-teal-500/40',
      text: 'text-calm-teal-400',
      bar: 'bg-calm-teal-500',
      accent: '#2a9d8f',
    },
    2: {
      bg: 'bg-pro-gold-500/8',
      border: 'border-pro-gold-500/40',
      text: 'text-pro-gold-400',
      bar: 'bg-pro-gold-500',
      accent: '#d4a373',
    },
    3: {
      bg: 'bg-terminal-amber/10',
      border: 'border-terminal-amber/50',
      text: 'text-terminal-amber',
      bar: 'bg-terminal-amber',
      accent: '#ffb000',
    },
    4: {
      bg: 'bg-alert-red-500/12',
      border: 'border-alert-red-500/60',
      text: 'text-alert-red-400',
      bar: 'bg-alert-red-500',
      accent: '#e63946',
    },
  };
  const c = colorMap[lvl] || colorMap[1];
  const flameCount = lvl;
  const pct = lvl * 25;

  return (
    <div className={`p-3 rounded-sm border ${c.bg} ${c.border}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Gauge size={14} style={{ color: c.accent }} />
          <span className="text-[11px] font-mono text-deep-blue-200">压力等级</span>
        </div>
        <span className={`px-2 py-0.5 rounded-sm border font-mono text-[11px] ${c.text} ${c.border}`}>
          Lv.{lvl} · {level.label}
        </span>
      </div>

      <div className="h-1.5 bg-deep-blue-800 rounded-full overflow-hidden mb-2">
        <div className={`h-full ${c.bar} transition-all`} style={{ width: `${pct}%` }} />
      </div>

      <p className="text-[11px] text-deep-blue-300 font-mono mb-2">{level.description}</p>

      <div className="flex items-center justify-between text-[10px] font-mono">
        <div className="flex items-center gap-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <Flame
              key={i}
              size={11}
              className={i < flameCount ? c.text : 'text-deep-blue-600'}
            />
          ))}
        </div>
        <div className="flex gap-2 text-deep-blue-400">
          <span>×{level.opinionMultiplier.toFixed(1)} 声量</span>
          <span>紧张度 {level.visualTension}/4</span>
        </div>
      </div>
    </div>
  );
}

const importanceBadge = (importance: 'essential' | 'important' | 'nice_to_have') => {
  if (importance === 'essential') {
    return <span className="px-1 py-px text-[9px] font-mono rounded-sm border border-alert-red-500 text-alert-red-400 bg-alert-red-500/15">必答</span>;
  }
  if (importance === 'important') {
    return <span className="px-1 py-px text-[9px] font-mono rounded-sm border border-terminal-amber text-terminal-amber bg-terminal-amber/10">重要</span>;
  }
  return <span className="px-1 py-px text-[9px] font-mono rounded-sm border border-calm-teal-500 text-calm-teal-400 bg-calm-teal-500/10">加分</span>;
};

function copyText(text: string) {
  try {
    navigator.clipboard.writeText(text);
  } catch {}
}

function SectionReviewCard({
  title,
  icon,
  review,
  accentColor,
  accentBg,
}: {
  title: string;
  icon: React.ReactNode;
  review: SectionReview;
  accentColor: string;
  accentBg: string;
}) {
  const [open, setOpen] = useState(true);
  const pct = Math.max(0, Math.min(100, review.score));
  const scoreColor = pct >= 80 ? 'text-calm-teal-400' : pct >= 60 ? 'text-terminal-amber' : 'text-alert-red-400';

  return (
    <div className={`rounded-sm border overflow-hidden border-deep-blue-500 ${accentBg}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full px-3 py-2 bg-deep-blue-800/70 hover:bg-deep-blue-700/70 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: accentColor }}>{icon}</span>
          <span className="text-xs font-serif-cn text-deep-blue-100">{title}</span>
          {review.missingPoints.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-sm bg-alert-red-500/20 border border-alert-red-500/50 text-alert-red-400">
              缺{review.missingPoints.length}项
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-sm font-mono font-bold ${scoreColor}`}>
            {review.score.toFixed(0)}
            <span className="text-deep-blue-500 font-normal text-[10px]">/100</span>
          </span>
          {open ? <ChevronUp size={13} className="text-deep-blue-400" /> : <ChevronDown size={13} className="text-deep-blue-400" />}
        </div>
      </button>

      {open && (
        <div className="px-3 py-2.5 space-y-3 bg-deep-blue-900/30 animate-fadeIn">
          <div className="h-1.5 bg-deep-blue-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${pct >= 80 ? 'bg-calm-teal-500' : pct >= 60 ? 'bg-terminal-amber' : 'bg-alert-red-500'} transition-all`}
              style={{ width: `${pct}%` }}
            />
          </div>

          {review.strengths.length > 0 && (
            <div>
              <div className="text-[11px] font-mono text-calm-teal-400 mb-1.5 flex items-center gap-1">
                <CheckCircle size={11} />
                做得好的地方
              </div>
              <ul className="space-y-1">
                {review.strengths.map((s, i) => (
                  <li key={i} className="text-[11px] text-deep-blue-100 font-mono flex items-start gap-1.5">
                    <span className="text-calm-teal-400 mt-0.5">✓</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.missingPoints.length > 0 && (
            <div>
              <div className="text-[11px] font-mono text-alert-red-400 mb-1.5 flex items-center gap-1">
                <XCircle size={11} />
                缺失的关键点
              </div>
              <ul className="space-y-1.5">
                {review.missingPoints.map((m, i) => (
                  <li key={i} className="text-[11px] text-deep-blue-100 font-mono flex items-start gap-1.5 border-l-2 border-deep-blue-600 pl-2">
                    <span className="mt-0.5 flex-shrink-0">{importanceBadge(m.importance)}</span>
                    <span>{m.point}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {review.revisionAdvice && (
            <div>
              <div className="text-[11px] font-mono text-terminal-amber mb-1.5 flex items-center gap-1">
                <PenLine size={11} />
                修改建议
              </div>
              <p className="text-[11px] text-deep-blue-100 font-mono leading-relaxed">
                {review.revisionAdvice}
              </p>
            </div>
          )}

          {review.suggestedSnippet && (
            <div className="border border-deep-blue-500 rounded-sm overflow-hidden bg-deep-blue-900/80">
              <div className="flex items-center justify-between px-2 py-1 bg-deep-blue-800/80 border-b border-deep-blue-500">
                <span className="text-[10px] font-mono text-deep-blue-300 flex items-center gap-1">
                  <FileText size={10} />
                  可直接参考的修改片段
                </span>
                <button
                  onClick={() => copyText(review.suggestedSnippet as string)}
                  className="px-1.5 py-0.5 text-[9px] font-mono rounded-sm border border-calm-teal-500/50 text-calm-teal-400 hover:bg-calm-teal-500/10 flex items-center gap-0.5"
                >
                  <Copy size={9} />
                  复制
                </button>
              </div>
              <pre className="p-2 text-[11px] text-terminal-green font-mono whitespace-pre-wrap leading-relaxed max-h-40 overflow-y-auto">
                {review.suggestedSnippet}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CoachSummaryCard({ coach, pressure }: { coach: CoachReview; pressure: PressureLevelInfo }) {
  const pct = coach.overallGrade === 'excellent' ? 92 : coach.overallGrade === 'good' ? 78 : coach.overallGrade === 'pass' ? 62 : 45;
  const gradeMap = {
    excellent: { label: '优秀', text: 'text-calm-teal-400', border: 'border-calm-teal-500', bg: 'bg-calm-teal-500/15', bar: 'from-calm-teal-600 to-calm-teal-400' },
    good: { label: '良好', text: 'text-pro-gold-400', border: 'border-pro-gold-500', bg: 'bg-pro-gold-500/15', bar: 'from-pro-gold-600 to-pro-gold-400' },
    pass: { label: '及格', text: 'text-terminal-amber', border: 'border-terminal-amber', bg: 'bg-terminal-amber/15', bar: 'from-terminal-amber to-terminal-amber/70' },
    needs_improvement: { label: '待提升', text: 'text-alert-red-400', border: 'border-alert-red-500', bg: 'bg-alert-red-500/15', bar: 'from-alert-red-600 to-alert-red-400' },
  };
  const g = gradeMap[coach.overallGrade] || gradeMap.pass;

  return (
    <div className={`rounded-sm border ${g.border} ${g.bg} overflow-hidden`}>
      <div className="px-3 py-2.5 border-b border-deep-blue-500/60 bg-deep-blue-900/40 flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${g.bg} border ${g.border}`}>
          <Sparkles size={16} className={g.text} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`px-1.5 py-0.5 rounded-sm border font-mono text-[11px] ${g.bg} ${g.text} ${g.border}`}>
              教练总评 · {g.label}
            </span>
            {pressure.level >= 3 && (
              <span className="text-[10px] font-mono text-alert-red-400 flex items-center gap-0.5">
                <Flame size={10} />
                高压力环境
              </span>
            )}
          </div>
          <div className="h-1 mt-1.5 bg-deep-blue-800 rounded-full overflow-hidden">
            <div className={`h-full bg-gradient-to-r ${g.bar}`} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="px-3 py-2.5 space-y-2.5">
        <p className="text-[12px] text-deep-blue-100 font-serif-cn leading-relaxed">
          {coach.overallFeedback}
        </p>

        {coach.focusAreas.length > 0 && (
          <div>
            <div className="text-[11px] font-mono text-terminal-amber mb-1.5 flex items-center gap-1">
              <AlertCircle size={11} />
              下一轮强化训练重点
            </div>
            <ul className="space-y-1">
              {coach.focusAreas.map((a, i) => (
                <li key={i} className="text-[11px] text-deep-blue-100 font-mono flex items-start gap-1.5">
                  <span className="text-terminal-amber mt-0.5">{i + 1}.</span>
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export const ReviewPanel: React.FC = () => {
  const { phase, reviewResult, selectedCase, response } = useTrainingStore();
  const [showIdeal, setShowIdeal] = useState(false);
  const [idealTab, setIdealTab] = useState<'official' | 'qa' | 'internal'>('official');
  const [coachTab, setCoachTab] = useState<'summary' | 'sections'>('summary');

  const radarData = reviewResult
    ? [
        { subject: '回应速度', A: reviewResult.speed.score, fullMark: 100 },
        { subject: '事实完整', A: reviewResult.factuality.score, fullMark: 100 },
        { subject: '态度温度', A: reviewResult.attitude.score, fullMark: 100 },
        { subject: '风险规范', A: reviewResult.riskWords.score, fullMark: 100 },
      ]
    : [];

  const totalGrade = reviewResult
    ? reviewResult.totalScore >= 85
      ? { label: '优秀', color: 'text-calm-teal-400', bg: 'bg-calm-teal-500/20', border: 'border-calm-teal-400' }
      : reviewResult.totalScore >= 70
        ? { label: '良好', color: 'text-pro-gold-400', bg: 'bg-pro-gold-500/20', border: 'border-pro-gold-400' }
        : reviewResult.totalScore >= 60
          ? { label: '及格', color: 'text-terminal-amber', bg: 'bg-terminal-amber/20', border: 'border-terminal-amber' }
          : { label: '待提升', color: 'text-alert-red-400', bg: 'bg-alert-red-500/20', border: 'border-alert-red-400' }
    : null;

  const statusIndicator = phase === 'reviewing' ? 'success' : phase === 'running' ? 'warning' : 'idle';

  return (
    <WindowFrame
      title="复盘评分 / REVIEW PANEL"
      icon={<BarChart3 size={14} />}
      statusIndicator={statusIndicator as any}
      className="h-full"
    >
      <div className="flex flex-col h-full">
        {phase !== 'reviewing' && phase !== 'running' && (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto rounded-full bg-deep-blue-600 border border-deep-blue-500 flex items-center justify-center">
                <Award size={36} className="text-deep-blue-400" />
              </div>
              <h3 className="font-serif-cn text-deep-blue-200 text-sm">等待演练完成</h3>
              <p className="text-xs text-deep-blue-400 font-mono max-w-xs">
                完成回应方案提交后，此处将展示多维度评分、压力等级评估和教练式逐段点评
              </p>
            </div>
          </div>
        )}

        {phase === 'running' && (
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-4">
              <ScanLine size={48} className="text-terminal-amber mx-auto animate-pulse" />
              <div>
                <h3 className="font-serif-cn text-deep-blue-100 text-sm mb-2">演练进行中</h3>
                <p className="text-xs text-deep-blue-400 font-mono">
                  系统将在你提交回应后立即进行评分
                </p>
              </div>
              <div className="pt-4 space-y-2 text-left max-w-xs mx-auto">
                <div className="flex items-center gap-2 text-[11px] text-deep-blue-300 font-mono">
                  <Target size={12} className="text-pro-gold-400" />
                  <span>事实完整度：关键要素覆盖情况</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-deep-blue-300 font-mono">
                  <HeartHandshake size={12} className="text-pro-gold-400" />
                  <span>态度温度：致歉、关切、承担责任</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-deep-blue-300 font-mono">
                  <Clock size={12} className="text-pro-gold-400" />
                  <span>回应速度：越快得分越高</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-deep-blue-300 font-mono">
                  <ShieldAlert size={12} className="text-pro-gold-400" />
                  <span>风险词检测：避免违规表述</span>
                </div>
                <div className="mt-3 pt-2 border-t border-deep-blue-600 flex items-center gap-2 text-[11px] text-deep-blue-300 font-mono">
                  <Sparkles size={12} className="text-calm-teal-400" />
                  <span>新：提交后获得培训教练逐段点评</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {phase === 'reviewing' && reviewResult && totalGrade && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-3 border-b border-deep-blue-500 space-y-3">
              <PressureCard level={reviewResult.pressureLevel} />

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-deep-blue-400 font-mono mb-0.5">综合评分</div>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-mono font-bold text-pro-gold-400">{reviewResult.totalScore}</span>
                    <div className="flex flex-col">
                      <span className={`text-xs font-serif-cn px-2 py-0.5 rounded-sm border ${totalGrade.bg} ${totalGrade.color} ${totalGrade.border}`}>
                        {totalGrade.label}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <div className="flex items-center justify-end gap-1.5 text-[11px] font-mono">
                    <TrendingUp size={12} className="text-terminal-green" />
                    <span className="text-deep-blue-300">超过</span>
                    <span className="text-terminal-green font-bold">{reviewResult.comparison.percentile}%</span>
                    <span className="text-deep-blue-300">参训者</span>
                  </div>
                  <div className="text-[10px] text-deep-blue-400 font-mono">
                    最佳: {reviewResult.comparison.bestScore} / 平均: {reviewResult.comparison.averageScore}
                  </div>
                </div>
              </div>

              <div className="h-44 bg-deep-blue-900/40 rounded-sm border border-deep-blue-600">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="#2d4873" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: '#c5cfe3', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}
                    />
                    <PolarRadiusAxis
                      angle={30}
                      domain={[0, 100]}
                      tick={{ fill: '#4a6591', fontSize: 9 }}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#131d35',
                        border: '1px solid #d4a373',
                        borderRadius: '2px',
                        fontSize: '11px',
                        fontFamily: 'JetBrains Mono, monospace',
                      }}
                    />
                    <Radar
                      name="得分"
                      dataKey="A"
                      stroke="#d4a373"
                      fill="#d4a373"
                      fillOpacity={0.3}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {reviewResult.coachReview && (
              <div className="p-3 border-b border-deep-blue-500 space-y-2">
                <div className="flex border-b border-deep-blue-500">
                  <button
                    onClick={() => setCoachTab('summary')}
                    className={`flex-1 px-3 py-1.5 text-[11px] font-mono border-b-2 transition-colors flex items-center justify-center gap-1 ${
                      coachTab === 'summary'
                        ? 'border-calm-teal-400 text-calm-teal-400 bg-calm-teal-400/10'
                        : 'border-transparent text-deep-blue-300 hover:text-deep-blue-100'
                    }`}
                  >
                    <Sparkles size={11} />
                    教练总评
                  </button>
                  <button
                    onClick={() => setCoachTab('sections')}
                    className={`flex-1 px-3 py-1.5 text-[11px] font-mono border-b-2 transition-colors flex items-center justify-center gap-1 ${
                      coachTab === 'sections'
                        ? 'border-pro-gold-400 text-pro-gold-300 bg-pro-gold-500/10'
                        : 'border-transparent text-deep-blue-300 hover:text-deep-blue-100'
                    }`}
                  >
                    <BookOpen size={11} />
                    逐段点评
                  </button>
                </div>

                {coachTab === 'summary' && (
                  <CoachSummaryCard coach={reviewResult.coachReview} pressure={reviewResult.pressureLevel} />
                )}

                {coachTab === 'sections' && (
                  <div className="space-y-2">
                    <SectionReviewCard
                      title="第一版官方回应"
                      icon={<FileText size={13} />}
                      review={reviewResult.coachReview.official}
                      accentColor="#2a9d8f"
                      accentBg=""
                    />
                    <SectionReviewCard
                      title="媒体问答口径"
                      icon={<BookOpen size={13} />}
                      review={reviewResult.coachReview.qa}
                      accentColor="#d4a373"
                      accentBg=""
                    />
                    <SectionReviewCard
                      title="内部通报要点"
                      icon={<Users size={13} />}
                      review={reviewResult.coachReview.internal}
                      accentColor="#ffb000"
                      accentBg=""
                    />
                  </div>
                )}
              </div>
            )}

            <div className="p-3 space-y-2 border-b border-deep-blue-500">
              <div className="flex items-center gap-1.5 mb-2">
                <Sparkles size={13} className="text-pro-gold-400" />
                <span className="text-xs font-serif-cn text-pro-gold-300">四维评分明细</span>
              </div>
              <ScoreBar dimension={reviewResult.speed} />
              <ScoreBar dimension={reviewResult.factuality} defaultOpen />
              <ScoreBar dimension={reviewResult.attitude} />
              <ScoreBar dimension={reviewResult.riskWords} defaultOpen />
            </div>

            {reviewResult.riskPhrases.length > 0 && (
              <div className="p-3 border-b border-deep-blue-500 bg-alert-red-500/5">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle size={13} className="text-alert-red-400" />
                  <span className="text-xs font-serif-cn text-alert-red-400">
                    二次传播风险表述 ({reviewResult.riskPhrases.length}处)
                  </span>
                </div>
                <div className="space-y-1.5">
                  {reviewResult.riskPhrases.map((risk, i) => {
                    const style = SEVERITY_STYLES[risk.severity];
                    return (
                      <div key={i} className={`p-2 rounded-sm border ${style.bg} ${style.border}`}>
                        <div className="flex items-start gap-2 mb-1">
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-sm border ${style.border} ${style.text} whitespace-nowrap`}>
                            {style.label}
                          </span>
                          <span className={`text-xs font-mono ${style.text} font-bold`}>
                            "{risk.text}"
                          </span>
                        </div>
                        <p className="text-[11px] text-deep-blue-200 font-mono pl-6">
                          <Info size={10} className="inline mr-1 -mt-0.5 text-calm-teal-400" />
                          {risk.suggestion}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {selectedCase && (
              <div className="p-3">
                <button
                  onClick={() => setShowIdeal(!showIdeal)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-deep-blue-800/50 hover:bg-deep-blue-700/50 border border-deep-blue-500 rounded-sm transition-colors"
                >
                  <div className="flex items-center gap-1.5">
                    <FileText size={13} className="text-calm-teal-400" />
                    <span className="text-xs font-serif-cn text-calm-teal-400">查看优秀回应参考</span>
                  </div>
                  {showIdeal ? <ChevronUp size={14} className="text-deep-blue-400" /> : <ChevronDown size={14} className="text-deep-blue-400" />}
                </button>

                {showIdeal && (
                  <div className="mt-2 space-y-2">
                    <div className="flex border border-deep-blue-500 rounded-sm overflow-hidden">
                      {[
                        { k: 'official', l: '官方回应' },
                        { k: 'qa', l: '问答口径' },
                        { k: 'internal', l: '内部通报' },
                      ].map(t => (
                        <button
                          key={t.k}
                          onClick={() => setIdealTab(t.k as any)}
                          className={`flex-1 px-2 py-1.5 text-[11px] font-mono transition-colors ${
                            idealTab === t.k
                              ? 'bg-calm-teal-500/20 text-calm-teal-400'
                              : 'bg-deep-blue-800 text-deep-blue-300 hover:text-deep-blue-100'
                          }`}
                        >
                          {t.l}
                        </button>
                      ))}
                    </div>
                    <div className="p-3 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm max-h-64 overflow-y-auto">
                      {idealTab === 'official' && (
                        <pre className="text-xs text-deep-blue-100 font-mono whitespace-pre-wrap leading-relaxed">
                          {selectedCase.idealResponse.official}
                        </pre>
                      )}
                      {idealTab === 'qa' && (
                        <div className="space-y-2">
                          {selectedCase.idealResponse.qa.map((qa, i) => (
                            <div key={i} className="text-xs text-deep-blue-100 font-mono whitespace-pre-wrap leading-relaxed">
                              {qa}
                            </div>
                          ))}
                        </div>
                      )}
                      {idealTab === 'internal' && (
                        <pre className="text-xs text-deep-blue-100 font-mono whitespace-pre-wrap leading-relaxed">
                          {selectedCase.idealResponse.internal}
                        </pre>
                      )}
                    </div>

                    {response.officialResponse && (
                      <div className="mt-2 pt-2 border-t border-deep-blue-600">
                        <div className="text-[10px] text-deep-blue-400 font-mono mb-1">你的回应内容对比：</div>
                        <div className="text-[10px] text-deep-blue-300 font-mono line-clamp-3">
                          {response.officialResponse.substring(0, 200)}
                          {response.officialResponse.length > 200 && '...'}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </WindowFrame>
  );
};
