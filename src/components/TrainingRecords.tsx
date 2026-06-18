import React, { useState, useMemo } from 'react';
import {
  History,
  ChevronDown,
  ChevronUp,
  Trash2,
  AlertTriangle,
  TrendingUp,
  Clock,
  Target,
  HeartHandshake,
  ShieldAlert,
  FileText,
  BookOpen,
  Users,
  Gauge,
  Flame,
  BarChart3,
  Trash,
  AlertCircle,
  Sparkles,
  User,
  Target as TargetIcon,
  ArrowRight,
  Layers,
  Flag,
  CheckCircle,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useTrainingStore } from '../store/trainingStore';
import { WindowFrame } from './WindowFrame';
import type { TrainingRecord, ImprovementPlan, Team } from '../types';
import { SOURCE_LABELS } from '../types';

const DifficultyBadge: React.FC<{ level: string }> = ({ level }) => {
  const map: Record<string, { cls: string; label: string }> = {
    easy: { cls: 'text-calm-teal-400 border-calm-teal-500/50 bg-calm-teal-500/10', label: '入门' },
    medium: { cls: 'text-pro-gold-400 border-pro-gold-500/50 bg-pro-gold-500/10', label: '进阶' },
    hard: { cls: 'text-terminal-amber border-terminal-amber/50 bg-terminal-amber/10', label: '困难' },
    expert: { cls: 'text-alert-red-400 border-alert-red-500/50 bg-alert-red-500/10', label: '专家' },
  };
  const m = map[level] || map.medium;
  return <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm border ${m.cls}`}>{m.label}</span>;
};

const CategoryBadge: React.FC<{ cat: string }> = ({ cat }) => {
  const map: Record<string, { cls: string; label: string }> = {
    product_quality: { cls: 'text-terminal-amber border-terminal-amber/50 bg-terminal-amber/10', label: '产品质量' },
    safety_incident: { cls: 'text-alert-red-400 border-alert-red-500/50 bg-alert-red-500/10', label: '安全事故' },
    employee_speech: { cls: 'text-pro-gold-400 border-pro-gold-500/50 bg-pro-gold-500/10', label: '员工言论' },
    supply_chain: { cls: 'text-calm-teal-400 border-calm-teal-500/50 bg-calm-teal-500/10', label: '供应链' },
    other: { cls: 'text-deep-blue-300 border-deep-blue-500/50 bg-deep-blue-500/20', label: '其他' },
  };
  const m = map[cat] || map.other;
  return <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm border ${m.cls}`}>{m.label}</span>;
};

function formatDate(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function scoreClass(s: number): string {
  if (s >= 85) return 'text-calm-teal-400';
  if (s >= 70) return 'text-pro-gold-400';
  if (s >= 60) return 'text-terminal-amber';
  return 'text-alert-red-400';
}

function RecordMiniChart({ records }: { records: TrainingRecord[] }) {
  if (records.length === 0) return null;
  const data = [...records].reverse().map((r, i) => ({
    no: `#${i + 1}`,
    score: r.totalScore,
    speed: r.reviewResult?.speed.score || 0,
    fact: r.reviewResult?.factuality.score || 0,
    attitude: r.reviewResult?.attitude.score || 0,
    risk: r.reviewResult?.riskWords.score || 0,
    pressure: r.pressureLevel?.level ? r.pressureLevel.level * 25 : 0,
  }));

  return (
    <div className="h-40 bg-deep-blue-900/40 rounded-sm border border-deep-blue-600 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d4873" />
          <XAxis
            dataKey="no"
            tick={{ fill: '#4a6591', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: '#2d4873' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#4a6591', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: '#2d4873' }}
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
          <Legend
            wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' }}
          />
          <Line
            type="monotone"
            dataKey="score"
            name="总分"
            stroke="#d4a373"
            strokeWidth={2.2}
            dot={{ r: 3, fill: '#d4a373' }}
          />
          <Line
            type="monotone"
            dataKey="fact"
            name="事实"
            stroke="#2a9d8f"
            strokeWidth={1.2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="attitude"
            name="态度"
            stroke="#ffb000"
            strokeWidth={1.2}
            dot={{ r: 2 }}
          />
          <Line
            type="monotone"
            dataKey="pressure"
            name="压力等级(%)"
            stroke="#e63946"
            strokeWidth={1.0}
            strokeDasharray="4 3"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

const TEAM_MEMBER_COLORS = [
  '#2a9d8f',
  '#e9c46a',
  '#f4a261',
  '#e76f51',
  '#457b9d',
  '#a8dadc',
  '#ffd166',
  '#ef476f',
  '#118ab2',
  '#06d6a0',
];

function TeamMiniChart({ teamRecordsByMember, teamAvgRecords }: {
  teamRecordsByMember: { name: string; records: TrainingRecord[] }[];
  teamAvgRecords: TrainingRecord[];
}) {
  const maxLen = Math.max(
    teamAvgRecords.length,
    ...teamRecordsByMember.map(m => Math.min(m.records.length, 3))
  );
  if (maxLen === 0) return null;

  const labels: string[] = [];
  for (let i = 0; i < maxLen; i++) labels.push(`#${i + 1}`);

  const data = labels.map((label, idx) => {
    const row: Record<string, any> = { no: label };
    const teamIdx = teamAvgRecords.length - maxLen + idx;
    if (teamIdx >= 0 && teamAvgRecords[teamIdx]) {
      row['小组均分'] = teamAvgRecords[teamIdx].totalScore;
    }
    teamRecordsByMember.forEach((member, mi) => {
      const recent = member.records.slice(-3);
      const mIdx = recent.length - maxLen + idx;
      if (mIdx >= 0 && recent[mIdx]) {
        row[member.name] = recent[mIdx].totalScore;
      }
    });
    return row;
  });

  return (
    <div className="h-40 bg-deep-blue-900/40 rounded-sm border border-deep-blue-600 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2d4873" />
          <XAxis
            dataKey="no"
            tick={{ fill: '#4a6591', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: '#2d4873' }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: '#4a6591', fontSize: 9, fontFamily: 'JetBrains Mono, monospace' }}
            axisLine={{ stroke: '#2d4873' }}
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
          <Legend
            wrapperStyle={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace' }}
          />
          <Line
            type="monotone"
            dataKey="小组均分"
            name="小组均分"
            stroke="#d4a373"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#d4a373' }}
            connectNulls
          />
          {teamRecordsByMember.map((member, mi) => (
            <Line
              key={member.name}
              type="monotone"
              dataKey={member.name}
              name={member.name}
              stroke={TEAM_MEMBER_COLORS[mi % TEAM_MEMBER_COLORS.length]}
              strokeWidth={1.3}
              dot={{ r: 2, fill: TEAM_MEMBER_COLORS[mi % TEAM_MEMBER_COLORS.length] }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function ImprovementPlanPanel({ plan }: { plan: ImprovementPlan }) {
  const priorityBadge = (p: 'high' | 'medium' | 'low') => {
    if (p === 'high') return <span className="px-1 py-px text-[9px] font-mono rounded-sm border border-alert-red-500 text-alert-red-400 bg-alert-red-500/15">高</span>;
    if (p === 'medium') return <span className="px-1 py-px text-[9px] font-mono rounded-sm border border-terminal-amber text-terminal-amber bg-terminal-amber/10">中</span>;
    return <span className="px-1 py-px text-[9px] font-mono rounded-sm border border-calm-teal-500 text-calm-teal-400 bg-calm-teal-500/10">低</span>;
  };

  return (
    <div className="space-y-3 p-2 rounded-sm border border-pro-gold-500/30 bg-pro-gold-500/5">
      <div className="flex items-center gap-1.5">
        <TargetIcon size={12} className="text-pro-gold-400" />
        <span className="text-[11px] font-serif-cn text-pro-gold-300">本次训练改进计划</span>
      </div>

      <div className="p-2 rounded-sm bg-deep-blue-900/50 border border-deep-blue-600">
        <div className="text-[10px] font-mono text-deep-blue-400 mb-0.5">总体目标</div>
        <div className="text-[11px] font-serif-cn text-deep-blue-100 leading-relaxed">{plan.overallGoal}</div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[10px] font-mono text-calm-teal-400 flex items-center gap-1">
          <Flag size={10} />
          重点突破方向
        </div>
        {plan.focusPoints.map((p, i) => (
          <div key={i} className="p-2 rounded-sm bg-deep-blue-900/50 border border-deep-blue-600 space-y-0.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {priorityBadge(p.priority)}
                <span className="text-[11px] font-mono text-deep-blue-100">{p.dimension}</span>
              </div>
              <span className={`text-[11px] font-mono font-bold ${scoreClass(p.currentScore)}`}>
                当前 {p.currentScore}
              </span>
            </div>
            <div className="text-[10px] font-mono text-terminal-amber pl-3 flex items-start gap-1">
              <ArrowRight size={9} className="mt-0.5 flex-shrink-0" />
              <span>差距：{p.gap}</span>
            </div>
            <div className="text-[10px] font-mono text-calm-teal-400 pl-3 flex items-start gap-1">
              <CheckCircle size={9} className="mt-0.5 flex-shrink-0" />
              <span>行动：{p.action}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1">
        <div className="p-1.5 rounded-sm bg-deep-blue-900/50 border border-deep-blue-600">
          <div className="text-[9px] font-mono text-deep-blue-400 mb-0.5 flex items-center gap-0.5">
            <FileText size={9} />官方回应
          </div>
          <ul className="space-y-0.5">
            {plan.sectionAdvice.official.map((a, i) => (
              <li key={i} className="text-[9px] font-mono text-deep-blue-200 pl-2">· {a}</li>
            ))}
          </ul>
        </div>
        <div className="p-1.5 rounded-sm bg-deep-blue-900/50 border border-deep-blue-600">
          <div className="text-[9px] font-mono text-deep-blue-400 mb-0.5 flex items-center gap-0.5">
            <BookOpen size={9} />问答口径
          </div>
          <ul className="space-y-0.5">
            {plan.sectionAdvice.qa.map((a, i) => (
              <li key={i} className="text-[9px] font-mono text-deep-blue-200 pl-2">· {a}</li>
            ))}
          </ul>
        </div>
        <div className="p-1.5 rounded-sm bg-deep-blue-900/50 border border-deep-blue-600">
          <div className="text-[9px] font-mono text-deep-blue-400 mb-0.5 flex items-center gap-0.5">
            <Users size={9} />内部通报
          </div>
          <ul className="space-y-0.5">
            {plan.sectionAdvice.internal.map((a, i) => (
              <li key={i} className="text-[9px] font-mono text-deep-blue-200 pl-2">· {a}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="p-2 rounded-sm bg-terminal-amber/5 border border-terminal-amber/30">
        <div className="text-[10px] font-mono text-terminal-amber mb-0.5 flex items-center gap-1">
          <Sparkles size={10} />
          下一次练习建议
        </div>
        <div className="text-[10px] font-serif-cn text-deep-blue-100 leading-relaxed">
          {plan.nextPracticeSuggestion}
        </div>
      </div>
    </div>
  );
}

function RecordDetail({ record }: { record: TrainingRecord }) {
  const rr = record.reviewResult;
  const radarData = rr
    ? [
        { subject: '回应速度', A: rr.speed.score, fullMark: 100 },
        { subject: '事实完整', A: rr.factuality.score, fullMark: 100 },
        { subject: '态度温度', A: rr.attitude.score, fullMark: 100 },
        { subject: '风险规范', A: rr.riskWords.score, fullMark: 100 },
      ]
    : [];

  return (
    <div className="space-y-3">
      {rr?.coachReview && (
        <div className={`p-2 rounded-sm border ${
          rr.coachReview.overallGrade === 'excellent' ? 'border-calm-teal-500/40 bg-calm-teal-500/10'
            : rr.coachReview.overallGrade === 'good' ? 'border-pro-gold-500/40 bg-pro-gold-500/10'
              : rr.coachReview.overallGrade === 'pass' ? 'border-terminal-amber/40 bg-terminal-amber/10'
                : 'border-alert-red-500/40 bg-alert-red-500/10'
        }`}>
          <div className="text-[11px] font-serif-cn text-deep-blue-100 leading-relaxed">
            <Sparkles size={10} className="inline mr-1 -mt-0.5 text-pro-gold-400" />
            教练总评：{rr.coachReview.overallFeedback}
          </div>
        </div>
      )}

      {record.improvementPlan && <ImprovementPlanPanel plan={record.improvementPlan} />}

      <div className="h-44 bg-deep-blue-900/40 rounded-sm border border-deep-blue-600">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData}>
            <PolarGrid stroke="#2d4873" />
            <PolarAngleAxis
              dataKey="subject"
              tick={{ fill: '#c5cfe3', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' }}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={{ fill: '#4a6591', fontSize: 8 }}
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

      <div className="grid grid-cols-4 gap-2">
        {rr && [
          { name: '速度', icon: <Clock size={10} />, score: rr.speed.score, color: '#2a9d8f' },
          { name: '事实', icon: <Target size={10} />, score: rr.factuality.score, color: '#d4a373' },
          { name: '态度', icon: <HeartHandshake size={10} />, score: rr.attitude.score, color: '#ffb000' },
          { name: '风险', icon: <ShieldAlert size={10} />, score: rr.riskWords.score, color: '#e63946' },
        ].map((d) => (
          <div key={d.name} className="p-2 rounded-sm bg-deep-blue-900/60 border border-deep-blue-600 text-center">
            <div className="flex items-center justify-center gap-1 mb-1" style={{ color: d.color }}>
              {d.icon}
              <span className="text-[10px] font-mono text-deep-blue-300">{d.name}</span>
            </div>
            <div className={`text-sm font-mono font-bold ${scoreClass(d.score)}`}>{d.score}</div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-mono text-pro-gold-300 flex items-center gap-1">
          <FileText size={11} />
          官方回应（{record.response.officialResponse.length}字）
        </div>
        <pre className="p-2 text-[11px] text-deep-blue-100 font-mono whitespace-pre-wrap leading-relaxed bg-deep-blue-900/60 border border-deep-blue-600 rounded-sm max-h-32 overflow-y-auto">
          {record.response.officialResponse || '（未填写）'}
        </pre>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-mono text-pro-gold-300 flex items-center gap-1">
          <BookOpen size={11} />
          问答口径（{record.response.qaPoints.length}字）
        </div>
        <pre className="p-2 text-[11px] text-deep-blue-100 font-mono whitespace-pre-wrap leading-relaxed bg-deep-blue-900/60 border border-deep-blue-600 rounded-sm max-h-32 overflow-y-auto">
          {record.response.qaPoints || '（未填写）'}
        </pre>
      </div>

      <div className="space-y-2">
        <div className="text-[11px] font-mono text-pro-gold-300 flex items-center gap-1">
          <Users size={11} />
          内部通报（{record.response.internalNotice.length}字）
        </div>
        <pre className="p-2 text-[11px] text-deep-blue-100 font-mono whitespace-pre-wrap leading-relaxed bg-deep-blue-900/60 border border-deep-blue-600 rounded-sm max-h-32 overflow-y-auto">
          {record.response.internalNotice || '（未填写）'}
        </pre>
      </div>

      {rr && rr.riskPhrases.length > 0 && (
        <div className="space-y-1.5 p-2 rounded-sm bg-alert-red-500/5 border border-alert-red-500/30">
          <div className="text-[11px] font-mono text-alert-red-400 flex items-center gap-1">
            <AlertTriangle size={11} />
            风险表述（{rr.riskPhrases.length}处）
          </div>
          <div className="space-y-1">
            {rr.riskPhrases.slice(0, 5).map((r, i) => (
              <div key={i} className="text-[10px] font-mono text-deep-blue-200 pl-4">
                • "{r.text}" — {r.suggestion}
              </div>
            ))}
            {rr.riskPhrases.length > 5 && (
              <div className="text-[10px] font-mono text-deep-blue-500 pl-4">
                还有 {rr.riskPhrases.length - 5} 处...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

const RecordRow: React.FC<{ record: TrainingRecord; onDelete: () => void }> = ({ record, onDelete }) => {
  const [expanded, setExpanded] = useState(false);
  const pressure = record.pressureLevel;
  const pressureColorMap: Record<number, string> = {
    1: 'text-calm-teal-400 border-calm-teal-500/40 bg-calm-teal-500/10',
    2: 'text-pro-gold-400 border-pro-gold-500/40 bg-pro-gold-500/10',
    3: 'text-terminal-amber border-terminal-amber/50 bg-terminal-amber/10',
    4: 'text-alert-red-400 border-alert-red-500/60 bg-alert-red-500/15',
  };

  return (
    <div className="border border-deep-blue-500 rounded-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full px-3 py-2 bg-deep-blue-800/50 hover:bg-deep-blue-700/50 transition-colors text-left"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className={`text-sm font-mono font-bold ${scoreClass(record.totalScore)}`}>{record.totalScore}</span>
              <CategoryBadge cat={record.caseCategory} />
              <DifficultyBadge level={record.difficulty} />
              <span className={`px-1.5 py-0.5 text-[10px] font-mono rounded-sm border flex items-center gap-0.5 ${pressureColorMap[pressure.level] || ''}`}>
                <Flame size={9} />
                {pressure.label}
              </span>
              {record.traineeName && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-sm bg-calm-teal-500/10 border border-calm-teal-500/30 text-calm-teal-400 flex items-center gap-0.5">
                  <User size={9} />
                  {record.traineeName}
                </span>
              )}
              {record.improvementPlan && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono rounded-sm bg-terminal-green/10 border border-terminal-green/30 text-terminal-green flex items-center gap-0.5">
                  <Target size={9} />
                  已生成改进计划
                </span>
              )}
            </div>
            <div className="text-xs font-serif-cn text-deep-blue-100 truncate">{record.caseTitle}</div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-deep-blue-500 mt-0.5">
              <Clock size={9} />
              {formatDate(record.createdAt)}
              <TrendingUp size={9} className="ml-1" />
              爆发{record.config.outbreakSpeed}
              <ShieldAlert size={9} />
              关注{record.config.mediaAttention}
            </div>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm('确定删除该条训练记录吗？')) onDelete(); }}
              className="p-1 rounded-sm text-deep-blue-400 hover:text-alert-red-400 hover:bg-alert-red-500/10 transition-colors"
              title="删除记录"
            >
              <Trash2 size={13} />
            </button>
            {expanded ? <ChevronUp size={14} className="text-deep-blue-400" /> : <ChevronDown size={14} className="text-deep-blue-400" />}
          </div>
        </div>
      </button>
      {expanded && (
        <div className="p-3 bg-deep-blue-900/30 border-t border-deep-blue-500 animate-fadeIn">
          <RecordDetail record={record} />
        </div>
      )}
    </div>
  );
};

function TrendIndicator({ trend }: { trend: 'up' | 'down' | 'flat' | 'none' }) {
  if (trend === 'up') {
    return (
      <span className="flex items-center gap-0.5 text-calm-teal-400 text-[10px] font-mono">
        <TrendingUp size={10} />
        上升
      </span>
    );
  }
  if (trend === 'down') {
    return (
      <span className="flex items-center gap-0.5 text-alert-red-400 text-[10px] font-mono">
        <AlertTriangle size={10} />
        下降
      </span>
    );
  }
  if (trend === 'flat') {
    return (
      <span className="flex items-center gap-0.5 text-deep-blue-300 text-[10px] font-mono">
        <ArrowRight size={10} />
        持平
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-deep-blue-500 text-[10px] font-mono">
      · 无数据
    </span>
  );
}

interface TeamStatsMembers {
  trainee: { id: string; name: string; role?: string; department?: string; notes?: string; createdAt: number };
  latestRecord: TrainingRecord | null;
  avgScore: number;
  scoreTrend: 'up' | 'down' | 'flat' | 'none';
  latestWeakness: string | null;
  recordCount: number;
}

function TeamStatsPanel({ teamMembers }: { teamMembers: TeamStatsMembers[] }) {
  return (
    <div className="rounded-sm border border-calm-teal-500/30 bg-calm-teal-500/5 overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-calm-teal-500/20 bg-calm-teal-500/10">
        <Users size={12} className="text-calm-teal-400" />
        <span className="text-[12px] font-serif-cn text-calm-teal-300 font-bold">小组训练概况</span>
      </div>
      <div className="divide-y divide-deep-blue-600/50">
        {teamMembers.map((m, idx) => (
          <div key={m.trainee.id} className="px-3 py-2 hover:bg-deep-blue-800/30 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-6 h-6 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${TEAM_MEMBER_COLORS[idx % TEAM_MEMBER_COLORS.length]}20`, border: `1px solid ${TEAM_MEMBER_COLORS[idx % TEAM_MEMBER_COLORS.length]}50` }}>
                  <User size={11} style={{ color: TEAM_MEMBER_COLORS[idx % TEAM_MEMBER_COLORS.length] }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-deep-blue-100 font-medium">{m.trainee.name}</span>
                    {!m.latestRecord && (
                      <span className="px-1 py-px text-[9px] font-mono rounded-sm bg-deep-blue-600/50 text-deep-blue-400 border border-deep-blue-500/50">
                        未开始训练
                      </span>
                    )}
                  </div>
                  {m.latestWeakness && (
                    <div className="flex items-center gap-1 mt-0.5">
                      <AlertTriangle size={8} className="text-terminal-amber flex-shrink-0" />
                      <span className="text-[9px] font-mono text-terminal-amber truncate">
                        短板：{m.latestWeakness}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="text-center">
                  <div className="text-[8px] font-mono text-deep-blue-500">次数</div>
                  <div className="text-[11px] font-mono text-deep-blue-200 font-bold">
                    {m.recordCount}
                  </div>
                </div>
                <div className="text-center w-14">
                  <div className="text-[8px] font-mono text-deep-blue-500">平均分</div>
                  <div className={`text-[11px] font-mono font-bold ${m.avgScore > 0 ? scoreClass(m.avgScore) : 'text-deep-blue-500'}`}>
                    {m.avgScore > 0 ? m.avgScore : '-'}
                  </div>
                </div>
                <div className="text-center w-14">
                  <div className="text-[8px] font-mono text-deep-blue-500">最近</div>
                  <div className={`text-[11px] font-mono font-bold ${m.latestRecord ? scoreClass(m.latestRecord.totalScore) : 'text-deep-blue-500'}`}>
                    {m.latestRecord ? m.latestRecord.totalScore : '-'}
                  </div>
                </div>
                <div className="w-14 flex justify-center">
                  <TrendIndicator trend={m.scoreTrend} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export const TrainingRecords: React.FC = () => {
  const {
    records,
    deleteRecord,
    clearAllRecords,
    setActivePanel,
    trainees,
    currentTraineeId,
    setCurrentTrainee,
    teams,
    getTeamStats,
  } = useTrainingStore();
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterTraineeId, setFilterTraineeId] = useState<string>(currentTraineeId || 'all');
  const [filterTeamId, setFilterTeamId] = useState<string>('all');
  const [teamViewMode, setTeamViewMode] = useState<'summary' | 'member'>('summary');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');

  const categories = useMemo(() => {
    const set = new Set(records.map(r => r.caseCategory));
    return Array.from(set);
  }, [records]);

  const selectedTeam = useMemo(() => {
    if (filterTeamId === 'all') return null;
    return teams.find(t => t.id === filterTeamId) || null;
  }, [filterTeamId, teams]);

  const teamMemberIds = useMemo(() => {
    if (!selectedTeam) return [];
    return selectedTeam.memberIds;
  }, [selectedTeam]);

  const teamMemberTrainees = useMemo(() => {
    return trainees.filter(t => teamMemberIds.includes(t.id));
  }, [trainees, teamMemberIds]);

  const teamStats = useMemo(() => {
    if (!selectedTeam) return null;
    return getTeamStats(selectedTeam.id);
  }, [selectedTeam, getTeamStats]);

  const traineeRecordCount = (id: string) => records.filter(r => r.traineeId === id).length;
  const teamRecordCount = () => records.filter(r => r.traineeId && teamMemberIds.includes(r.traineeId)).length;
  const anonymousCount = records.filter(r => !r.traineeId).length;

  const displayTrainees = useMemo(() => {
    if (selectedTeam) {
      return teamMemberTrainees;
    }
    return trainees;
  }, [selectedTeam, teamMemberTrainees, trainees]);

  const filteredSorted = useMemo(() => {
    let list = records.slice();
    if (filterCategory !== 'all') list = list.filter(r => r.caseCategory === filterCategory);

    if (filterTraineeId !== 'all') {
      if (filterTraineeId === 'anonymous') list = list.filter(r => !r.traineeId);
      else list = list.filter(r => r.traineeId === filterTraineeId);
    } else if (selectedTeam) {
      if (teamViewMode === 'summary') {
        list = list.filter(r => r.traineeId && teamMemberIds.includes(r.traineeId));
      }
    }

    if (sortBy === 'date') list.sort((a, b) => b.createdAt - a.createdAt);
    else list.sort((a, b) => b.totalScore - a.totalScore);
    return list;
  }, [records, filterCategory, sortBy, filterTraineeId, selectedTeam, teamMemberIds, teamViewMode]);

  const statsRecords = useMemo(() => {
    if (!selectedTeam) return filteredSorted;
    if (teamViewMode === 'summary') {
      return records.filter(r => r.traineeId && teamMemberIds.includes(r.traineeId));
    }
    return filteredSorted;
  }, [selectedTeam, filteredSorted, records, teamMemberIds, teamViewMode]);

  const avgScore = statsRecords.length > 0
    ? Math.round(statsRecords.reduce((s, r) => s + r.totalScore, 0) / statsRecords.length)
    : 0;
  const bestScore = statsRecords.length > 0
    ? Math.max(...statsRecords.map(r => r.totalScore))
    : 0;

  const showTeamPanel = selectedTeam && teamViewMode === 'summary' && teamStats;

  const teamRecordsForChart = useMemo(() => {
    if (!selectedTeam) return { members: [] as { name: string; records: TrainingRecord[] }[], teamAvg: [] as TrainingRecord[] };
    const memberRecords = teamMemberIds.map(mid => {
      const t = trainees.find(tr => tr.id === mid);
      return {
        name: t?.name || '未知',
        records: records.filter(r => r.traineeId === mid).sort((a, b) => a.createdAt - b.createdAt),
      };
    }).filter(m => m.records.length > 0);

    const allTeamRecords = records
      .filter(r => r.traineeId && teamMemberIds.includes(r.traineeId))
      .sort((a, b) => a.createdAt - b.createdAt);

    const teamAvg: TrainingRecord[] = [];
    const dateBuckets = new Map<number, TrainingRecord[]>();
    allTeamRecords.forEach(r => {
      const key = r.createdAt;
      if (!dateBuckets.has(key)) dateBuckets.set(key, []);
      dateBuckets.get(key)!.push(r);
    });
    const sortedKeys = Array.from(dateBuckets.keys()).sort((a, b) => a - b);
    sortedKeys.forEach(key => {
      const bucket = dateBuckets.get(key)!;
      const avgS = Math.round(bucket.reduce((s, r) => s + r.totalScore, 0) / bucket.length);
      teamAvg.push({ ...bucket[0], totalScore: avgS });
    });

    return { members: memberRecords, teamAvg };
  }, [selectedTeam, teamMemberIds, trainees, records]);

  const handleTeamChange = (teamId: string) => {
    setFilterTeamId(teamId);
    setFilterTraineeId('all');
    setTeamViewMode('summary');
  };

  return (
    <WindowFrame
      title="训练记录 / TRAINING HISTORY"
      icon={<History size={14} />}
      statusIndicator={records.length > 0 ? 'active' : 'idle'}
      className="h-full"
      extraHeader={
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActivePanel('case')}
            className="px-2 py-0.5 text-[10px] font-mono rounded-sm border border-deep-blue-500 text-deep-blue-300 hover:text-deep-blue-100 hover:bg-deep-blue-700/50 transition-colors"
          >
            ← 返回案例库
          </button>
        </div>
      }
    >
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-deep-blue-500 space-y-3 bg-gradient-to-b from-deep-blue-800/60 to-deep-blue-800/30">
          {records.length > 0 ? (
            <>
              {teams.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-1.5 text-[10px] font-mono text-deep-blue-300">
                    <Users size={10} className="text-pro-gold-400" />
                    <span>小组视图</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={filterTeamId}
                      onChange={(e) => handleTeamChange(e.target.value)}
                      className="bg-deep-blue-900/60 border border-deep-blue-500 text-deep-blue-100 text-[10px] font-mono rounded-sm px-2 py-1 focus:outline-none focus:border-pro-gold-400"
                    >
                      <option value="all">全部记录</option>
                      {teams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} · {t.memberIds.length}人
                        </option>
                      ))}
                    </select>
                    {selectedTeam && (
                      <span className="text-[10px] font-mono text-deep-blue-400">
                        {selectedTeam.department || ''}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-deep-blue-300">
                  <Users size={10} className="text-calm-teal-400" />
                  <span>{selectedTeam ? '小组成员筛选' : '按学员筛选'}</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {selectedTeam && (
                    <button
                      onClick={() => { setFilterTraineeId('all'); setTeamViewMode('summary'); }}
                      className={`px-2 py-1 text-[10px] font-mono rounded-sm border transition-all flex items-center gap-1 ${
                        filterTraineeId === 'all' && teamViewMode === 'summary'
                          ? 'bg-pro-gold-500/20 border-pro-gold-400 text-pro-gold-300'
                          : 'bg-deep-blue-700 border-deep-blue-500 text-deep-blue-200 hover:border-deep-blue-400'
                      }`}
                    >
                      <Users size={9} />
                      全组汇总 ({teamRecordCount()})
                    </button>
                  )}
                  {!selectedTeam && (
                    <button
                      onClick={() => setFilterTraineeId('all')}
                      className={`px-2 py-1 text-[10px] font-mono rounded-sm border transition-all ${
                        filterTraineeId === 'all'
                          ? 'bg-pro-gold-500/20 border-pro-gold-400 text-pro-gold-300'
                          : 'bg-deep-blue-700 border-deep-blue-500 text-deep-blue-200 hover:border-deep-blue-400'
                      }`}
                    >
                      全部学员 ({records.length})
                    </button>
                  )}
                  {displayTrainees.map(t => {
                    const c = traineeRecordCount(t.id);
                    const isSelected = filterTraineeId === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => { setFilterTraineeId(t.id); setTeamViewMode('member'); }}
                        className={`px-2 py-1 text-[10px] font-mono rounded-sm border transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-calm-teal-500/20 border-calm-teal-400 text-calm-teal-300'
                            : 'bg-deep-blue-700 border-deep-blue-500 text-deep-blue-200 hover:border-deep-blue-400'
                        }`}
                      >
                        <User size={9} />
                        {t.name}{selectedTeam ? ` (${c})` : ` (${c})`}
                      </button>
                    );
                  })}
                  {anonymousCount > 0 && (
                    <button
                      onClick={() => setFilterTraineeId('anonymous')}
                      className={`px-2 py-1 text-[10px] font-mono rounded-sm border transition-all ${
                        filterTraineeId === 'anonymous'
                          ? 'bg-deep-blue-500/30 border-deep-blue-400 text-deep-blue-100'
                          : 'bg-deep-blue-700 border-deep-blue-500 text-deep-blue-200 hover:border-deep-blue-400'
                      }`}
                    >
                      匿名训练 ({anonymousCount})
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2 rounded-sm bg-deep-blue-900/60 border border-deep-blue-600 text-center">
                  <div className="text-[10px] font-mono text-deep-blue-400 mb-1">
                    {showTeamPanel ? '小组训练次数' : '训练次数'}
                  </div>
                  <div className="text-xl font-mono font-bold text-terminal-green">{statsRecords.length}</div>
                </div>
                <div className="p-2 rounded-sm bg-deep-blue-900/60 border border-deep-blue-600 text-center">
                  <div className="text-[10px] font-mono text-deep-blue-400 mb-1">
                    {showTeamPanel ? '小组平均分' : '平均分'}
                  </div>
                  <div className={`text-xl font-mono font-bold ${scoreClass(avgScore)}`}>{avgScore}</div>
                </div>
                <div className="p-2 rounded-sm bg-deep-blue-900/60 border border-deep-blue-600 text-center">
                  <div className="text-[10px] font-mono text-deep-blue-400 mb-1">
                    {showTeamPanel ? '小组最高分' : '最高分'}
                  </div>
                  <div className={`text-xl font-mono font-bold ${scoreClass(bestScore)}`}>{bestScore}</div>
                </div>
              </div>

              {showTeamPanel && (
                <TeamMiniChart
                  teamRecordsByMember={teamRecordsForChart.members}
                  teamAvgRecords={teamRecordsForChart.teamAvg}
                />
              )}
              {!showTeamPanel && statsRecords.length >= 2 && <RecordMiniChart records={statsRecords} />}

              {showTeamPanel && teamStats && (
                <TeamStatsPanel
                  teamMembers={teamStats.members.map(m => ({
                    ...m,
                    recordCount: records.filter(r => r.traineeId === m.trainee.id).length,
                  }))}
                />
              )}

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <span className="text-deep-blue-400">分类</span>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="bg-deep-blue-900/60 border border-deep-blue-500 text-deep-blue-100 text-[10px] font-mono rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-pro-gold-400"
                  >
                    <option value="all">全部</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <span className="text-deep-blue-400">排序</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="bg-deep-blue-900/60 border border-deep-blue-500 text-deep-blue-100 text-[10px] font-mono rounded-sm px-1.5 py-0.5 focus:outline-none focus:border-pro-gold-400"
                  >
                    <option value="date">按时间倒序</option>
                    <option value="score">按分数倒序</option>
                  </select>
                </div>
                {filteredSorted.length > 0 && (
                  <button
                    onClick={() => { if (confirm('确定清空全部训练记录？此操作不可恢复。')) clearAllRecords(); }}
                    className="ml-auto px-2 py-0.5 text-[10px] font-mono rounded-sm border border-alert-red-500/50 text-alert-red-400 hover:bg-alert-red-500/10 flex items-center gap-0.5 transition-colors"
                  >
                    <Trash size={10} />
                    清空
                  </button>
                )}
              </div>
            </>
          ) : null}
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {records.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 mx-auto rounded-full bg-deep-blue-600 border border-deep-blue-500 flex items-center justify-center">
                  <History size={28} className="text-deep-blue-400" />
                </div>
                <h3 className="font-serif-cn text-deep-blue-200 text-sm">暂无训练记录</h3>
                <p className="text-xs text-deep-blue-400 font-mono max-w-xs">
                  完成一次危机演练并提交回应方案后，此处将自动保存训练记录，便于对比新员工多次训练的变化
                </p>
                <button
                  onClick={() => setActivePanel('case')}
                  className="px-3 py-1.5 text-xs font-mono rounded-sm border bg-calm-teal-600 hover:bg-calm-teal-500 border-calm-teal-400 text-white flex items-center justify-center gap-1.5 mx-auto"
                >
                  <BarChart3 size={12} />
                  开始第一次训练
                </button>
              </div>
            </div>
          ) : filteredSorted.length === 0 ? (
            <div className="flex items-center justify-center h-full p-4">
              <div className="text-center text-xs text-deep-blue-400 font-mono">
                <Layers size={20} className="mx-auto mb-2 text-deep-blue-500" />
                该筛选条件下暂无记录
              </div>
            </div>
          ) : (
            filteredSorted.map((r) => (
              <RecordRow
                key={r.id}
                record={r}
                onDelete={() => deleteRecord(r.id)}
              />
            ))
          )}
        </div>
      </div>
    </WindowFrame>
  );
};
