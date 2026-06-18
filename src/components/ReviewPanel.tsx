import React, { useState, useCallback } from 'react';
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
  Target as TargetIcon,
  ArrowRight,
  Flag,
  FileDown,
  Printer,
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
import type { ScoreDimension, SectionReview, CoachReview, PressureLevelInfo, ImprovementPlan, ReviewResult, CrisisCase, Trainee, TrainingConfig } from '../types';
import { CATEGORY_LABELS, DIFFICULTY_LABELS, OUTBREAK_SPEEDS, MEDIA_ATTENTIONS } from '../types';

const DIMENSION_ICONS: Record<string, React.ReactNode> = {
  '回应速度': <Clock size={12} />,
  '事实完整度': <Target size={12} />,
  '态度温度': <HeartHandshake size={12} />,
  '风险词使用': <ShieldAlert size={12} />,
};

function scoreClass(s: number): string {
  if (s >= 85) return 'text-calm-teal-400';
  if (s >= 70) return 'text-pro-gold-400';
  if (s >= 60) return 'text-terminal-amber';
  return 'text-alert-red-400';
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

function formatDate(timestamp: number): string {
  const d = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function countChars(text: string): number {
  return text?.replace(/\s/g, '').length || 0;
}

function getScoreLabel(score: number): string {
  if (score >= 85) return '优秀';
  if (score >= 70) return '良好';
  if (score >= 60) return '及格';
  return '需加强';
}

interface ReportData {
  reviewResult: ReviewResult;
  selectedCase: CrisisCase;
  currentTrainee: Trainee | null;
  config: TrainingConfig;
  createdAt: number;
  response: {
    officialResponse: string;
    qaPoints: string;
    internalNotice: string;
  };
}

function generateTextReport(data: ReportData): string {
  const { reviewResult, selectedCase, currentTrainee, config, createdAt, response } = data;
  const lines: string[] = [];
  const sep = '═══════════════════════════════════════════════════════════';
  const subSep = '───────────────────────────────────────────────────────────';

  lines.push(sep);
  lines.push('        企业品牌公关危机回应演练训练报告');
  lines.push(sep);
  lines.push('');

  lines.push('【一、基础信息】');
  lines.push(subSep);
  lines.push(`  学员姓名：${currentTrainee?.name || '匿名训练'}`);
  if (currentTrainee?.role || currentTrainee?.department) {
    const roleDept = [currentTrainee.department, currentTrainee.role].filter(Boolean).join(' / ');
    lines.push(`  学员岗位/部门：${roleDept}`);
  }
  lines.push(`  训练案例：${selectedCase.title}`);
  lines.push(`  案例分类/难度：${CATEGORY_LABELS[selectedCase.category]} / ${DIFFICULTY_LABELS[selectedCase.difficulty]}`);
  lines.push(`  训练参数：爆发速度${OUTBREAK_SPEEDS[config.outbreakSpeed - 1]} · 媒体关注度${MEDIA_ATTENTIONS[config.mediaAttention - 1]} · 时长${config.duration}分钟`);
  lines.push(`  压力等级：Lv.${reviewResult.pressureLevel.level} - ${reviewResult.pressureLevel.label}`);
  lines.push(`  训练时间：${formatDate(createdAt)}`);
  lines.push('');

  lines.push('【二、整体评分】');
  lines.push(subSep);
  lines.push(`  总分：${reviewResult.totalScore}/100（${getScoreLabel(reviewResult.totalScore)}）`);
  lines.push(`  击败同场景 ${reviewResult.comparison.percentile}% 的训练者`);
  lines.push(`  （最佳: ${reviewResult.comparison.bestScore} / 平均: ${reviewResult.comparison.averageScore}）`);
  lines.push('');
  lines.push('  四维分数：');
  const dims = [
    { name: '回应速度', score: reviewResult.speed.score },
    { name: '事实完整度', score: reviewResult.factuality.score },
    { name: '态度温度', score: reviewResult.attitude.score },
    { name: '风险词使用', score: reviewResult.riskWords.score },
  ];
  dims.forEach((d, i) => {
    lines.push(`    ${i + 1}. ${d.name}：${d.score}/100（${getScoreLabel(d.score)}）`);
  });
  lines.push('');

  lines.push('【三、学员提交内容】');
  lines.push(subSep);
  lines.push('');
  lines.push(`  3.1 第一版官方回应（${countChars(response.officialResponse)}字）`);
  lines.push('');
  lines.push(response.officialResponse.split('\n').map(l => `    ${l}`).join('\n'));
  lines.push('');
  lines.push(`  3.2 媒体问答口径（${countChars(response.qaPoints)}字）`);
  lines.push('');
  lines.push(response.qaPoints.split('\n').map(l => `    ${l}`).join('\n'));
  lines.push('');
  lines.push(`  3.3 内部通报要点（${countChars(response.internalNotice)}字）`);
  lines.push('');
  lines.push(response.internalNotice.split('\n').map(l => `    ${l}`).join('\n'));
  lines.push('');

  if (reviewResult.coachReview) {
    lines.push('【四、教练点评】');
    lines.push(subSep);
    lines.push('');
    lines.push('  ▶ 教练总评');
    lines.push(`  ${reviewResult.coachReview.overallFeedback}`);
    lines.push('');

    const sections: { key: 'official' | 'qa' | 'internal'; title: string; num: string }[] = [
      { key: 'official', title: '第一版官方回应', num: '4.1' },
      { key: 'qa', title: '媒体问答口径', num: '4.2' },
      { key: 'internal', title: '内部通报要点', num: '4.3' },
    ];

    sections.forEach(s => {
      const rev = reviewResult.coachReview![s.key];
      lines.push(`  ▶ ${s.num} ${s.title}【得分：${rev.score.toFixed(0)}/100】`);
      if (rev.strengths.length > 0) {
        lines.push(`    · 亮点：`);
        rev.strengths.forEach(st => lines.push(`      - ${st}`));
      }
      if (rev.missingPoints.length > 0) {
        lines.push(`    · 缺失点：`);
        rev.missingPoints.forEach(mp => {
          const imp = mp.importance === 'essential' ? '【必答】' : mp.importance === 'important' ? '【重要】' : '【加分】';
          lines.push(`      - ${imp} ${mp.point}`);
        });
      }
      if (rev.revisionAdvice) {
        lines.push(`    · 修改建议：${rev.revisionAdvice}`);
      }
      if (rev.suggestedSnippet) {
        lines.push(`    · 参考片段：`);
        lines.push(rev.suggestedSnippet.split('\n').map(l => `      ${l}`).join('\n'));
      }
      lines.push('');
    });
  }

  if (reviewResult.improvementPlan) {
    const plan = reviewResult.improvementPlan;
    lines.push('【五、改进计划】');
    lines.push(subSep);
    lines.push('');
    lines.push('  ▶ 总体目标');
    lines.push(`  ${plan.overallGoal}`);
    lines.push('');
    lines.push('  ▶ 重点突破方向');
    plan.focusPoints.forEach((p, i) => {
      const pri = p.priority === 'high' ? '【高】' : p.priority === 'medium' ? '【中】' : '【低】';
      lines.push(`    ${i + 1}. ${pri} ${p.dimension}`);
      lines.push(`       当前分：${p.currentScore} / 差距：${p.gap}`);
      lines.push(`       行动：${p.action}`);
    });
    lines.push('');
    lines.push('  ▶ 三段回应具体建议');
    lines.push('    · 官方回应：');
    plan.sectionAdvice.official.forEach(a => lines.push(`      - ${a}`));
    lines.push('    · 问答口径：');
    plan.sectionAdvice.qa.forEach(a => lines.push(`      - ${a}`));
    lines.push('    · 内部通报：');
    plan.sectionAdvice.internal.forEach(a => lines.push(`      - ${a}`));
    lines.push('');
    lines.push('  ▶ 下一次练习建议');
    lines.push(`  ${plan.nextPracticeSuggestion}`);
    lines.push('');
  }

  if (reviewResult.riskPhrases.length > 0) {
    lines.push('【六、风险表述提醒】');
    lines.push(subSep);
    lines.push('');
    reviewResult.riskPhrases.forEach((r, i) => {
      const sev = r.severity === 'high' ? '【高危】' : r.severity === 'medium' ? '【中危】' : '【低危】';
      lines.push(`  ${i + 1}. ${sev} "${r.text}"`);
      lines.push(`     建议：${r.suggestion}`);
    });
    lines.push('');
  }

  lines.push(sep);
  lines.push(`  报告生成时间：${formatDate(Date.now())}`);
  lines.push(sep);

  return lines.join('\n');
}

function generateHTMLReport(data: ReportData): string {
  const { reviewResult, selectedCase, currentTrainee, config, createdAt, response } = data;
  const scoreLabel = getScoreLabel(reviewResult.totalScore);

  const sections: { key: 'official' | 'qa' | 'internal'; title: string; num: string }[] = [
    { key: 'official', title: '第一版官方回应', num: '4.1' },
    { key: 'qa', title: '媒体问答口径', num: '4.2' },
    { key: 'internal', title: '内部通报要点', num: '4.3' },
  ];

  const dims = [
    { name: '回应速度', score: reviewResult.speed.score },
    { name: '事实完整度', score: reviewResult.factuality.score },
    { name: '态度温度', score: reviewResult.attitude.score },
    { name: '风险词使用', score: reviewResult.riskWords.score },
  ];

  const scoreColor = (s: number) => s >= 85 ? '#2a9d8f' : s >= 70 ? '#d4a373' : s >= 60 ? '#ffb000' : '#e63946';
  const sevColor = (s: string) => s === 'high' ? '#e63946' : s === 'medium' ? '#ffb000' : '#4a6591';
  const sevLabel = (s: string) => s === 'high' ? '高危' : s === 'medium' ? '中危' : '低危';
  const impLabel = (i: string) => i === 'essential' ? '必答' : i === 'important' ? '重要' : '加分';
  const priLabel = (p: string) => p === 'high' ? '高' : p === 'medium' ? '中' : '低';

  const sectionsHtml = reviewResult.coachReview ? sections.map(s => {
    const rev = reviewResult.coachReview![s.key];
    return `
    <div class="section-card">
      <h3>${s.num} ${s.title} <span class="score-badge" style="color: ${scoreColor(rev.score)}">得分：${rev.score.toFixed(0)}/100</span></h3>
      ${rev.strengths.length > 0 ? `
        <div class="sub-section">
          <h4 class="tag-green">✓ 亮点</h4>
          <ul>${rev.strengths.map(x => `<li>${escapeHtml(x)}</li>`).join('')}</ul>
        </div>` : ''}
      ${rev.missingPoints.length > 0 ? `
        <div class="sub-section">
          <h4 class="tag-red">✗ 缺失点</h4>
          <ul>${rev.missingPoints.map(x => `<li><span class="imp-tag" style="color: ${x.importance === 'essential' ? '#e63946' : x.importance === 'important' ? '#ffb000' : '#2a9d8f'}">【${impLabel(x.importance)}】</span>${escapeHtml(x.point)}</li>`).join('')}</ul>
        </div>` : ''}
      ${rev.revisionAdvice ? `
        <div class="sub-section">
          <h4 class="tag-amber">✎ 修改建议</h4>
          <p>${escapeHtml(rev.revisionAdvice)}</p>
        </div>` : ''}
      ${rev.suggestedSnippet ? `
        <div class="sub-section">
          <h4>↳ 参考片段</h4>
          <pre class="code-block">${escapeHtml(rev.suggestedSnippet)}</pre>
        </div>` : ''}
    </div>`;
  }).join('') : '';

  const planHtml = reviewResult.improvementPlan ? `
    <div class="main-section">
      <h2>五、改进计划</h2>
      <div class="section-card">
        <h3>总体目标</h3>
        <p>${escapeHtml(reviewResult.improvementPlan.overallGoal)}</p>
      </div>
      <div class="section-card">
        <h3>重点突破方向</h3>
        <table class="data-table">
          <thead><tr><th>序号</th><th>优先级</th><th>维度</th><th>当前分</th><th>差距</th><th>行动</th></tr></thead>
          <tbody>
            ${reviewResult.improvementPlan.focusPoints.map((p, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><span style="color:${p.priority === 'high' ? '#e63946' : p.priority === 'medium' ? '#ffb000' : '#2a9d8f'}">${priLabel(p.priority)}</span></td>
                <td>${escapeHtml(p.dimension)}</td>
                <td style="color:${scoreColor(p.currentScore)};font-weight:bold">${p.currentScore}</td>
                <td>${escapeHtml(p.gap)}</td>
                <td>${escapeHtml(p.action)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="section-card">
        <h3>三段回应具体建议</h3>
        <div class="three-col">
          <div>
            <h4 class="tag-teal">官方回应</h4>
            <ul>${reviewResult.improvementPlan.sectionAdvice.official.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
          </div>
          <div>
            <h4 class="tag-gold">问答口径</h4>
            <ul>${reviewResult.improvementPlan.sectionAdvice.qa.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
          </div>
          <div>
            <h4 class="tag-amber">内部通报</h4>
            <ul>${reviewResult.improvementPlan.sectionAdvice.internal.map(a => `<li>${escapeHtml(a)}</li>`).join('')}</ul>
          </div>
        </div>
      </div>
      <div class="section-card highlight-card">
        <h3>✨ 下一次练习建议</h3>
        <p>${escapeHtml(reviewResult.improvementPlan.nextPracticeSuggestion)}</p>
      </div>
    </div>` : '';

  const riskHtml = reviewResult.riskPhrases.length > 0 ? `
    <div class="main-section">
      <h2>六、风险表述提醒</h2>
      <div class="section-card">
        <table class="data-table">
          <thead><tr><th>序号</th><th>风险等级</th><th>风险表述</th><th>修改建议</th></tr></thead>
          <tbody>
            ${reviewResult.riskPhrases.map((r, i) => `
              <tr>
                <td>${i + 1}</td>
                <td><span style="color:${sevColor(r.severity)};font-weight:bold">${sevLabel(r.severity)}</span></td>
                <td class="mono-bold" style="color:${sevColor(r.severity)}">"${escapeHtml(r.text)}"</td>
                <td>${escapeHtml(r.suggestion)}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>` : '';

  const traineeRoleDept = [currentTrainee?.department, currentTrainee?.role].filter(Boolean).join(' / ');

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>训练报告 - ${escapeHtml(selectedCase.title)}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, "PingFang SC", "Microsoft YaHei", "Segoe UI", sans-serif;
    background: #f5f7fa;
    color: #1a2540;
    line-height: 1.6;
    padding: 24px;
  }
  .container { max-width: 960px; margin: 0 auto; background: #fff; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
  .header-bar {
    background: linear-gradient(135deg, #0f1e3d 0%, #1a3a6e 100%);
    color: #fff;
    padding: 32px 40px;
  }
  .header-bar h1 { font-size: 22px; font-weight: 600; letter-spacing: 2px; margin-bottom: 4px; }
  .header-bar .subtitle { opacity: 0.75; font-size: 13px; }
  .print-bar {
    background: #eef2f8;
    padding: 12px 40px;
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid #d8e0ec;
  }
  .print-btn {
    background: #1a3a6e;
    color: #fff;
    border: none;
    padding: 8px 18px;
    border-radius: 4px;
    font-size: 13px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }
  .print-btn:hover { background: #254a8a; }
  .content { padding: 32px 40px; }
  .main-section { margin-bottom: 28px; }
  .main-section > h2 {
    font-size: 17px;
    color: #0f1e3d;
    padding-bottom: 10px;
    margin-bottom: 16px;
    border-bottom: 2px solid #1a3a6e;
  }
  .section-card {
    background: #fafbfd;
    border: 1px solid #e4e9f2;
    border-radius: 6px;
    padding: 18px 20px;
    margin-bottom: 14px;
  }
  .section-card h3 { font-size: 14px; color: #0f1e3d; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; }
  .section-card h4 { font-size: 13px; color: #4a6591; margin: 10px 0 6px; }
  .section-card p { font-size: 13px; color: #2d3a54; }
  .sub-section { margin: 10px 0; }
  .sub-section h4 { font-size: 13px; margin-bottom: 6px; }
  .tag-green { color: #2a9d8f; }
  .tag-red { color: #e63946; }
  .tag-amber { color: #c68900; }
  .tag-teal { color: #2a9d8f; }
  .tag-gold { color: #a67835; }
  .score-badge { font-size: 13px; font-weight: 600; }
  .imp-tag { font-weight: 600; margin-right: 6px; }
  .mono-bold { font-family: "JetBrains Mono", "SF Mono", Consolas, monospace; }
  .code-block {
    font-family: "JetBrains Mono", "SF Mono", Consolas, monospace;
    background: #131d35;
    color: #e0ebff;
    padding: 12px 14px;
    border-radius: 4px;
    font-size: 12px;
    white-space: pre-wrap;
    line-height: 1.55;
  }
  ul { list-style: none; padding-left: 0; }
  ul li {
    font-size: 13px;
    color: #2d3a54;
    padding: 3px 0 3px 18px;
    position: relative;
  }
  ul li::before {
    content: "·";
    position: absolute;
    left: 6px;
    color: #4a6591;
    font-weight: bold;
  }
  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 8px 24px;
  }
  .info-row {
    display: flex;
    font-size: 13px;
    padding: 4px 0;
    border-bottom: 1px dashed #e4e9f2;
  }
  .info-label {
    color: #6b7a99;
    width: 110px;
    flex-shrink: 0;
  }
  .info-value {
    color: #1a2540;
    font-weight: 500;
  }
  .score-hero {
    display: flex;
    align-items: center;
    gap: 32px;
    margin-bottom: 16px;
  }
  .score-circle {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    background: conic-gradient(${scoreColor(reviewResult.totalScore)} ${reviewResult.totalScore}%, #e4e9f2 0);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .score-circle-inner {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
  .score-num { font-size: 32px; font-weight: 700; color: ${scoreColor(reviewResult.totalScore)}; line-height: 1; }
  .score-label-text { font-size: 12px; color: #6b7a99; margin-top: 4px; }
  .score-summary { flex: 1; }
  .score-summary-row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; border-bottom: 1px dashed #e4e9f2; }
  .dim-bar-wrap { margin: 8px 0; }
  .dim-bar-label { display: flex; justify-content: space-between; font-size: 13px; margin-bottom: 4px; }
  .dim-bar { height: 10px; background: #e4e9f2; border-radius: 5px; overflow: hidden; }
  .dim-bar-fill { height: 100%; border-radius: 5px; transition: width 0.4s; }
  .three-col { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .three-col > div { padding: 12px; background: #fff; border: 1px solid #e4e9f2; border-radius: 4px; }
  .highlight-card {
    background: linear-gradient(135deg, #fff8e8 0%, #fdf1d1 100%);
    border-color: #f0d78c;
  }
  .response-text {
    font-family: "JetBrains Mono", "SF Mono", Consolas, monospace;
    font-size: 12px;
    background: #f7f9fc;
    border: 1px solid #e4e9f2;
    padding: 12px 14px;
    border-radius: 4px;
    white-space: pre-wrap;
    line-height: 1.6;
    color: #1a2540;
  }
  .data-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .data-table th, .data-table td {
    padding: 8px 12px;
    border: 1px solid #e4e9f2;
    text-align: left;
    vertical-align: top;
  }
  .data-table th {
    background: #eef2f8;
    color: #0f1e3d;
    font-weight: 600;
    font-size: 12px;
  }
  .data-table tr:nth-child(even) td { background: #fafbfd; }
  .footer {
    background: #0f1e3d;
    color: rgba(255,255,255,0.6);
    padding: 14px 40px;
    font-size: 12px;
    text-align: center;
  }
  @media print {
    body { background: #fff; padding: 0; }
    .container { box-shadow: none; }
    .print-bar { display: none; }
    .header-bar { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .highlight-card { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .score-circle { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .dim-bar-fill { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .code-block { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .section-card { break-inside: avoid; }
    .main-section { break-inside: avoid; }
  }
</style>
</head>
<body>
<div class="container">
  <div class="header-bar">
    <h1>企业品牌公关危机回应演练训练报告</h1>
    <div class="subtitle">PR Crisis Response Training Report · 企业内部培训专用</div>
  </div>
  <div class="print-bar">
    <span style="font-size:12px;color:#6b7a99">报告编号：RPT-${Date.now()}</span>
    <button class="print-btn" onclick="window.print()">🖨️ 打印此页</button>
  </div>
  <div class="content">

    <div class="main-section">
      <h2>一、基础信息</h2>
      <div class="section-card">
        <div class="info-grid">
          <div class="info-row"><span class="info-label">学员姓名</span><span class="info-value">${escapeHtml(currentTrainee?.name || '匿名训练')}</span></div>
          ${traineeRoleDept ? `<div class="info-row"><span class="info-label">岗位/部门</span><span class="info-value">${escapeHtml(traineeRoleDept)}</span></div>` : '<div></div>'}
          <div class="info-row"><span class="info-label">训练案例</span><span class="info-value">${escapeHtml(selectedCase.title)}</span></div>
          <div class="info-row"><span class="info-label">分类/难度</span><span class="info-value">${CATEGORY_LABELS[selectedCase.category]} / ${DIFFICULTY_LABELS[selectedCase.difficulty]}</span></div>
          <div class="info-row"><span class="info-label">爆发速度</span><span class="info-value">${OUTBREAK_SPEEDS[config.outbreakSpeed - 1]}</span></div>
          <div class="info-row"><span class="info-label">媒体关注度</span><span class="info-value">${MEDIA_ATTENTIONS[config.mediaAttention - 1]}</span></div>
          <div class="info-row"><span class="info-label">训练时长</span><span class="info-value">${config.duration} 分钟</span></div>
          <div class="info-row"><span class="info-label">压力等级</span><span class="info-value" style="color:${scoreColor(100 - reviewResult.pressureLevel.level * 20)}">Lv.${reviewResult.pressureLevel.level} - ${escapeHtml(reviewResult.pressureLevel.label)}</span></div>
          <div class="info-row" style="grid-column: 1 / -1"><span class="info-label">训练时间</span><span class="info-value">${formatDate(createdAt)}</span></div>
        </div>
      </div>
    </div>

    <div class="main-section">
      <h2>二、整体评分</h2>
      <div class="section-card">
        <div class="score-hero">
          <div class="score-circle">
            <div class="score-circle-inner">
              <div class="score-num">${reviewResult.totalScore}</div>
              <div class="score-label-text">${scoreLabel}</div>
            </div>
          </div>
          <div class="score-summary" style="flex:1">
            <div class="score-summary-row"><span>击败同场景训练者</span><strong style="color:#2a9d8f">${reviewResult.comparison.percentile}%</strong></div>
            <div class="score-summary-row"><span>最佳分数</span><strong>${reviewResult.comparison.bestScore}</strong></div>
            <div class="score-summary-row"><span>平均分数</span><strong>${reviewResult.comparison.averageScore}</strong></div>
          </div>
        </div>
        <div style="margin-top:12px">
          <h4 style="font-size:13px;color:#4a6591;margin-bottom:10px">四维分数明细</h4>
          ${dims.map(d => `
            <div class="dim-bar-wrap">
              <div class="dim-bar-label">
                <span>${d.name}</span>
                <span style="font-weight:600;color:${scoreColor(d.score)}">${d.score}/100 · ${getScoreLabel(d.score)}</span>
              </div>
              <div class="dim-bar"><div class="dim-bar-fill" style="width:${d.score}%;background:${scoreColor(d.score)}"></div></div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="main-section">
      <h2>三、学员提交内容</h2>
      <div class="section-card">
        <h3>3.1 第一版官方回应 <span class="score-badge" style="color:#4a6591;font-weight:500">${countChars(response.officialResponse)} 字</span></h3>
        <div class="response-text">${escapeHtml(response.officialResponse)}</div>
      </div>
      <div class="section-card">
        <h3>3.2 媒体问答口径 <span class="score-badge" style="color:#4a6591;font-weight:500">${countChars(response.qaPoints)} 字</span></h3>
        <div class="response-text">${escapeHtml(response.qaPoints)}</div>
      </div>
      <div class="section-card">
        <h3>3.3 内部通报要点 <span class="score-badge" style="color:#4a6591;font-weight:500">${countChars(response.internalNotice)} 字</span></h3>
        <div class="response-text">${escapeHtml(response.internalNotice)}</div>
      </div>
    </div>

    ${reviewResult.coachReview ? `
    <div class="main-section">
      <h2>四、教练点评</h2>
      <div class="section-card highlight-card">
        <h3>教练总评</h3>
        <p style="font-size:14px">${escapeHtml(reviewResult.coachReview.overallFeedback)}</p>
        ${reviewResult.coachReview.focusAreas.length > 0 ? `
          <div class="sub-section">
            <h4 class="tag-amber">下一轮强化训练重点</h4>
            <ol style="padding-left:20px">
              ${reviewResult.coachReview.focusAreas.map(a => `<li style="padding:2px 0;font-size:13px">${escapeHtml(a)}</li>`).join('')}
            </ol>
          </div>` : ''}
      </div>
      ${sectionsHtml}
    </div>` : ''}

    ${planHtml}
    ${riskHtml}

  </div>
  <div class="footer">
    本报告由企业品牌公关危机回应演练系统自动生成 · 生成时间 ${formatDate(Date.now())} · 仅供内部培训参考
  </div>
</div>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

interface ExportReportProps {
  reviewResult: ReviewResult;
  selectedCase: CrisisCase;
  currentTrainee: Trainee | null;
  config: TrainingConfig;
  createdAt: number;
  response: {
    officialResponse: string;
    qaPoints: string;
    internalNotice: string;
  };
}

const ExportReportButtons: React.FC<ExportReportProps> = (props) => {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success'>('idle');

  const buildData = (): ReportData => ({
    reviewResult: props.reviewResult,
    selectedCase: props.selectedCase,
    currentTrainee: props.currentTrainee,
    config: props.config,
    createdAt: props.createdAt,
    response: props.response,
  });

  const handleCopy = useCallback(() => {
    try {
      const text = generateTextReport(buildData());
      navigator.clipboard.writeText(text).then(() => {
        setCopyStatus('success');
        setTimeout(() => setCopyStatus('idle'), 2000);
      });
    } catch {}
  }, [props]);

  const handlePreview = useCallback(() => {
    try {
      const html = generateHTMLReport(buildData());
      const w = window.open('', '_blank', 'width=980,height=800');
      if (w) {
        w.document.open();
        w.document.write(html);
        w.document.close();
      }
    } catch {}
  }, [props]);

  return (
    <div className="rounded-sm border border-calm-teal-500/40 bg-calm-teal-500/8 overflow-hidden">
      <div className="px-3 py-2 bg-deep-blue-900/50 border-b border-deep-blue-500 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <FileDown size={12} className="text-calm-teal-400" />
          <span className="text-[11px] font-serif-cn text-calm-teal-300">训练报告导出</span>
        </div>
        <span className="text-[9px] font-mono text-deep-blue-400">EXPORT</span>
      </div>
      <div className="p-2 flex gap-2">
        <button
          onClick={handleCopy}
          className={`flex-1 px-3 py-2 rounded-sm border text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all ${
            copyStatus === 'success'
              ? 'border-terminal-green text-terminal-green bg-terminal-green/10'
              : 'border-deep-blue-500 text-deep-blue-200 bg-deep-blue-900/50 hover:border-calm-teal-500/50 hover:text-calm-teal-400 hover:bg-calm-teal-500/10'
          }`}
        >
          <Copy size={12} />
          {copyStatus === 'success' ? '✓ 已复制' : '复制为文本报告'}
        </button>
        <button
          onClick={handlePreview}
          className="flex-1 px-3 py-2 rounded-sm border border-deep-blue-500 text-deep-blue-200 bg-deep-blue-900/50 hover:border-pro-gold-500/50 hover:text-pro-gold-400 hover:bg-pro-gold-500/10 text-[11px] font-mono flex items-center justify-center gap-1.5 transition-all"
        >
          <Printer size={12} />
          生成报告（预览）
        </button>
      </div>
    </div>
  );
};

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
  const { phase, reviewResult, selectedCase, response, currentTrainee, config, records } = useTrainingStore();
  const [showIdeal, setShowIdeal] = useState(false);
  const [idealTab, setIdealTab] = useState<'official' | 'qa' | 'internal'>('official');
  const [coachTab, setCoachTab] = useState<'summary' | 'sections'>('summary');

  const trainingCreatedAt = (() => {
    if (!selectedCase || !reviewResult) return Date.now();
    const match = records.find(r =>
      r.caseId === selectedCase.id &&
      r.totalScore === reviewResult.totalScore &&
      r.traineeId === currentTrainee?.id
    );
    return match?.createdAt || Date.now();
  })();

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
                  <div className="space-y-2">
                    <CoachSummaryCard coach={reviewResult.coachReview} pressure={reviewResult.pressureLevel} />
                    {reviewResult.improvementPlan && (
                      <ImprovementPlanPanel plan={reviewResult.improvementPlan} />
                    )}
                  </div>
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

            {selectedCase && (
              <div className="p-3 border-b border-deep-blue-500 space-y-2">
                <ExportReportButtons
                  reviewResult={reviewResult}
                  selectedCase={selectedCase}
                  currentTrainee={currentTrainee}
                  config={config}
                  createdAt={trainingCreatedAt}
                  response={{
                    officialResponse: response.officialResponse,
                    qaPoints: response.qaPoints,
                    internalNotice: response.internalNotice,
                  }}
                />
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
