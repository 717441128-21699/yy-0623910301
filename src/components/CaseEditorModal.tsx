import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  FileText,
  BookOpen,
  Users,
  ChevronDown,
  ChevronUp,
  Type,
  Shield,
  Gauge,
  Sparkles,
  AlertTriangle,
  History,
} from 'lucide-react';
import type { CrisisCase, OpinionItem, CaseCategory, DifficultyLevel, OpinionSource, Sentiment } from '../types';
import { CASE_CATEGORIES, DIFFICULTY_LEVELS, SOURCE_LABELS, CATEGORY_LABELS, DIFFICULTY_LABELS } from '../types';
import { useTrainingStore } from '../store/trainingStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialCase?: CrisisCase | null;
  onAfterSave?: (c: CrisisCase) => void;
}

const SOURCE_OPTIONS: { key: OpinionSource; label: string }[] = [
  { key: 'news', label: SOURCE_LABELS.news },
  { key: 'social_media', label: SOURCE_LABELS.social_media },
  { key: 'kol', label: SOURCE_LABELS.kol },
  { key: 'customer_service', label: SOURCE_LABELS.customer_service },
  { key: 'media', label: SOURCE_LABELS.media },
];

const SENTIMENT_OPTIONS: { key: Sentiment; label: string; color: string }[] = [
  { key: 'negative', label: '负面', color: 'text-alert-red-400 border-alert-red-500 bg-alert-red-500/10' },
  { key: 'neutral', label: '中性', color: 'text-deep-blue-300 border-deep-blue-500 bg-deep-blue-500/20' },
  { key: 'positive', label: '正面', color: 'text-calm-teal-400 border-calm-teal-500 bg-calm-teal-500/10' },
];

function makeEmptyOpinion(): OpinionItem {
  return {
    id: `op-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    source: 'news',
    sourceName: '请填写来源账号/媒体名',
    content: '请填写舆情内容',
    timestamp: 0,
    sentiment: 'negative',
    isScreenshot: false,
    screenshotMeta: { platform: '', username: '' },
  };
}

function makeEmptyCase(): CrisisCase {
  return {
    id: `custom-${Date.now()}`,
    title: '',
    category: 'product_quality',
    summary: '',
    difficulty: 'medium',
    estimatedDuration: 15,
    background: '',
    stakeholders: ['公关部', '客服部', '管理层'],
    keywords: [],
    opinionStream: [
      { ...makeEmptyOpinion(), id: 'op-1', timestamp: 10, source: 'news', sourceName: '新闻媒体', content: '【突发】某事件引发关注...' },
      { ...makeEmptyOpinion(), id: 'op-2', timestamp: 45, source: 'social_media', sourceName: '微博评论', content: '网友讨论内容...', sentiment: 'negative' },
      { ...makeEmptyOpinion(), id: 'op-3', timestamp: 80, source: 'kol', sourceName: '行业大V', content: '专业分析或评论...', sentiment: 'neutral' },
      { ...makeEmptyOpinion(), id: 'op-4', timestamp: 120, source: 'customer_service', sourceName: '客服聊天截图', content: '用户投诉/咨询', isScreenshot: true, screenshotMeta: { platform: '微信', username: '用户' }, sentiment: 'negative' },
    ],
    idealResponse: {
      official: '',
      qa: [
        '问：事件真实情况是怎样的？\n答：我们正在调查，第一时间公开。',
      ],
      internal: '',
    },
  };
}

function Modal({ children, onClose, title, width = 'max-w-5xl' }: { children: React.ReactNode; onClose: () => void; title: string; width?: string }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className={`w-full ${width} max-h-[92vh] flex flex-col bg-deep-blue-950 border border-pro-gold-500/30 rounded shadow-glow-gold animate-fadeIn`}>
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-deep-blue-600 bg-deep-blue-900/80">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-pro-gold-400" />
            <h3 className="text-sm font-serif-cn text-pro-gold-300">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-sm text-deep-blue-400 hover:text-deep-blue-100 hover:bg-deep-blue-700/50 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}

const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string; icon?: React.ReactNode }> = ({ label, icon, className = '', ...p }) => (
  <label className="block space-y-1">
    <div className="text-[11px] font-mono text-pro-gold-300 flex items-center gap-1">
      {icon}
      {label}
    </div>
    <input
      {...p}
      className={`w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400 focus:shadow-glow-gold transition-all placeholder:text-deep-blue-500 ${className}`}
    />
  </label>
);

const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; icon?: React.ReactNode }> = ({ label, icon, className = '', ...p }) => (
  <label className="block space-y-1">
    <div className="text-[11px] font-mono text-pro-gold-300 flex items-center gap-1">
      {icon}
      {label}
    </div>
    <textarea
      {...p}
      className={`w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono leading-relaxed focus:outline-none focus:border-pro-gold-400 focus:shadow-glow-gold transition-all placeholder:text-deep-blue-500 resize-none ${className}`}
    />
  </label>
);

export const CaseEditorModal: React.FC<Props> = ({ isOpen, onClose, initialCase, onAfterSave }) => {
  const { upsertCustomCase, restoreCaseVersion } = useTrainingStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [caseData, setCaseData] = useState<CrisisCase>(() => (initialCase ? JSON.parse(JSON.stringify(initialCase)) : makeEmptyCase()));
  const [keywordInput, setKeywordInput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [versionNote, setVersionNote] = useState('');
  const [viewingVersion, setViewingVersion] = useState<number | null>(null);
  const [showDiff, setShowDiff] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCaseData(initialCase ? JSON.parse(JSON.stringify(initialCase)) : makeEmptyCase());
      setStep(1);
      setErrors([]);
      setKeywordInput('');
      setVersionNote('');
      setViewingVersion(null);
      setShowDiff(false);
    }
  }, [isOpen, initialCase]);

  if (!isOpen) return null;

  const updateField = <K extends keyof CrisisCase>(k: K, v: CrisisCase[K]) =>
    setCaseData((c) => ({ ...c, [k]: v }));

  const updateOpinion = (id: string, patch: Partial<OpinionItem>) =>
    setCaseData((c) => ({
      ...c,
      opinionStream: c.opinionStream.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));

  const addOpinion = () =>
    setCaseData((c) => ({
      ...c,
      opinionStream: [...c.opinionStream, { ...makeEmptyOpinion(), timestamp: (c.opinionStream.slice(-1)[0]?.timestamp || 0) + 30 }],
    }));

  const removeOpinion = (id: string) =>
    setCaseData((c) => ({ ...c, opinionStream: c.opinionStream.filter((o) => o.id !== id) }));

  const moveOpinion = (id: string, dir: -1 | 1) =>
    setCaseData((c) => {
      const idx = c.opinionStream.findIndex((o) => o.id === id);
      const newIdx = idx + dir;
      if (idx < 0 || newIdx < 0 || newIdx >= c.opinionStream.length) return c;
      const arr = c.opinionStream.slice();
      [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
      return { ...c, opinionStream: arr };
    });

  const addKeyword = () => {
    const kw = keywordInput.trim();
    if (!kw) return;
    if (caseData.keywords.includes(kw)) { setKeywordInput(''); return; }
    updateField('keywords', [...caseData.keywords, kw]);
    setKeywordInput('');
  };

  const removeKeyword = (kw: string) => updateField('keywords', caseData.keywords.filter((k) => k !== kw));

  const validateStep = (fullCheck = false): string[] => {
    const errs: string[] = [];
    const checkStep = (s: 1 | 2 | 3) => {
      if (s === 1) {
        if (!caseData.title.trim()) errs.push('【基本信息】请填写案例标题');
        else if (caseData.title.trim().length < 6) errs.push('【基本信息】案例标题建议至少6个字，能简洁概括场景');
        if (!caseData.background.trim()) errs.push('【基本信息】请填写案例背景描述');
        else if (caseData.background.trim().length < 50) errs.push('【基本信息】背景建议不少于50字，帮助培训者理解场景细节');
        if (!caseData.estimatedDuration || caseData.estimatedDuration < 5) errs.push('【基本信息】演练时长至少5分钟');
        if (caseData.keywords.length < 3) errs.push('【基本信息】关键词至少准备3个，用于事实完整度评分');
      }
      if (s === 2) {
        if (caseData.opinionStream.length < 5) errs.push('【舆情素材】建议至少准备5条舆情，覆盖新闻/社交/KOL/客服等多种来源');
        else if (caseData.opinionStream.length < 3) errs.push('【舆情素材】至少3条舆情');
        const hasNegative = caseData.opinionStream.some(o => o.sentiment === 'negative');
        if (!hasNegative) errs.push('【舆情素材】至少需要1条负面舆情，才能模拟真实危机');
        caseData.opinionStream.forEach((o, i) => {
          if (!o.sourceName.trim() || o.sourceName.trim() === '请填写来源账号/媒体名')
            errs.push(`【舆情素材】舆情#${i + 1}：请填写来源账号/媒体名`);
          if (!o.content.trim() || o.content.trim() === '请填写舆情内容')
            errs.push(`【舆情素材】舆情#${i + 1}：请填写舆情内容`);
          if (o.content.trim().length < 10 && !(o.content.trim() === '请填写舆情内容'))
            errs.push(`【舆情素材】舆情#${i + 1}：内容过短，建议至少10字`);
          if (o.isScreenshot && !o.screenshotMeta?.platform)
            errs.push(`【舆情素材】舆情#${i + 1}：截图需要填写平台名称`);
          if (o.timestamp < 0)
            errs.push(`【舆情素材】舆情#${i + 1}：T+秒数不能为负数`);
        });
      }
      if (s === 3) {
        if (!caseData.idealResponse.official.trim()) errs.push('【优秀回应】请填写官方回应参考');
        else if (caseData.idealResponse.official.trim().length < 80) errs.push('【优秀回应】官方回应参考建议至少80字，需包含完整应对结构');
        if (caseData.idealResponse.qa.length === 0 || caseData.idealResponse.qa.every(q => !q.trim()))
          errs.push('【优秀回应】请至少准备1条问答口径参考');
        else {
          caseData.idealResponse.qa.forEach((q, i) => {
            if (q.trim() && q.trim().length < 20) errs.push(`【优秀回应】问答口径#${i + 1}：过短，建议包含问题和完整回答`);
          });
        }
        if (!caseData.idealResponse.internal.trim()) errs.push('【优秀回应】请填写内部通报参考');
        else if (caseData.idealResponse.internal.trim().length < 60) errs.push('【优秀回应】内部通报建议至少60字，包含事件定级/口径/禁令/分工等要点');
      }
    };

    if (fullCheck) {
      checkStep(1);
      checkStep(2);
      checkStep(3);
    } else {
      checkStep(step);
    }
    return errs;
  };

  const nextStep = () => {
    const errs = validateStep(false);
    if (errs.length > 0) { setErrors(errs); return; }
    setErrors([]);
    if (step < 3) setStep((s) => (s + 1) as any);
    else submitCase();
  };

  const submitCase = () => {
    const finalErrs = validateStep(true);
    if (finalErrs.length > 0) { setErrors(finalErrs); return; }

    const cleaned: CrisisCase = {
      ...caseData,
      summary: caseData.summary && caseData.summary.trim().length > 10
        ? caseData.summary
        : caseData.background.slice(0, 100) + (caseData.background.length > 100 ? '...' : ''),
      stakeholders: caseData.stakeholders && caseData.stakeholders.length > 0
        ? caseData.stakeholders
        : ['公关部', '客服部', '管理层'],
      opinionStream: caseData.opinionStream.map((o) => ({
        ...o,
        timestamp: Math.max(0, Math.round(o.timestamp)),
        isScreenshot: !!o.isScreenshot,
        screenshotMeta: o.isScreenshot ? o.screenshotMeta : undefined,
      })).sort((a, b) => a.timestamp - b.timestamp),
      idealResponse: {
        official: caseData.idealResponse.official.trim(),
        qa: caseData.idealResponse.qa.map(s => s.trim()).filter(Boolean),
        internal: caseData.idealResponse.internal.trim(),
      },
    };

    const saved = upsertCustomCase(cleaned, versionNote.trim() || undefined);
    if (onAfterSave) onAfterSave(saved);
    onClose();
  };

  const stepsMeta = [
    { num: 1, title: '基本信息', icon: <Type size={12} /> },
    { num: 2, title: '舆情素材', icon: <Shield size={12} /> },
    { num: 3, title: '优秀回应参考', icon: <Sparkles size={12} /> },
  ];

  return (
    <Modal onClose={onClose} title={initialCase ? '编辑自定义案例' : '新建自定义危机案例'}>
      <div className="p-4">
        <div className="flex items-center gap-1 mb-4">
          {stepsMeta.map((s, i) => (
            <React.Fragment key={s.num}>
              <button
                onClick={() => setStep(s.num as any)}
                className={`px-3 py-1.5 rounded-sm flex items-center gap-1.5 text-xs font-mono transition-all ${
                  step === s.num
                    ? 'bg-pro-gold-500/20 text-pro-gold-300 border border-pro-gold-500/50 shadow-glow-gold'
                    : step > s.num
                      ? 'bg-calm-teal-500/10 text-calm-teal-400 border border-calm-teal-500/30'
                      : 'bg-deep-blue-800 text-deep-blue-400 border border-deep-blue-600'
                }`}
              >
                {step > s.num ? <span className="text-calm-teal-500">✓</span> : <span>{s.num}.</span>}
                {s.icon}
                {s.title}
              </button>
              {i < 2 && <div className="flex-1 h-px bg-deep-blue-600" />}
            </React.Fragment>
          ))}
        </div>

        {errors.length > 0 && (
          <div className="mb-4 p-3 rounded-sm border border-alert-red-500/40 bg-alert-red-500/10 space-y-1">
            <div className="text-[11px] font-mono text-alert-red-400 flex items-center gap-1">
              <AlertTriangle size={11} />
              请完善以下内容
            </div>
            <ul className="space-y-0.5">
              {errors.map((e, i) => (
                <li key={i} className="text-[11px] font-mono text-deep-blue-200 pl-4">• {e}</li>
              ))}
            </ul>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4 animate-fadeIn">
            <div className="grid grid-cols-2 gap-4">
              <Input label="案例标题" icon={<Type size={11} />} value={caseData.title} onChange={(e) => updateField('title', e.target.value)} placeholder="如：XX产品被曝使用禁用原料" />
              <div className="grid grid-cols-2 gap-3">
                <label className="block space-y-1">
                  <div className="text-[11px] font-mono text-pro-gold-300 flex items-center gap-1"><Shield size={11} />场景分类</div>
                  <select value={caseData.category} onChange={(e) => updateField('category', e.target.value as CaseCategory)}
                    className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400">
                    {CASE_CATEGORIES.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </label>
                <label className="block space-y-1">
                  <div className="text-[11px] font-mono text-pro-gold-300 flex items-center gap-1"><Gauge size={11} />难度等级</div>
                  <select value={caseData.difficulty} onChange={(e) => updateField('difficulty', e.target.value as DifficultyLevel)}
                    className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400">
                    {DIFFICULTY_LEVELS.map((c) => (
                      <option key={c.key} value={c.key}>{c.label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
            <Input label="演练时长（分钟）" icon={<Gauge size={11} />} type="number" min={5} max={60} step={1}
              value={caseData.estimatedDuration}
              onChange={(e) => updateField('estimatedDuration', Math.max(5, Math.min(60, parseInt(e.target.value) || 15)))}
            />
            <Textarea label="案例背景" icon={<AlertCircle size={11} />} rows={5}
              value={caseData.background}
              onChange={(e) => updateField('background', e.target.value)}
              placeholder={'介绍事件的起因、爆发时间、涉及产品/人员、当前已知事实等关键要素，帮助培训者快速进入情境。\n建议：3~5段，包含时间线。'}
            />
            <div className="space-y-1.5">
              <div className="text-[11px] font-mono text-pro-gold-300 flex items-center gap-1">
                <Shield size={11} />
                关键词（评分时用于检测事实完整度）
              </div>
              <div className="flex gap-2">
                <input
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                  placeholder="如：召回、第三方检测、全额退款，回车添加"
                  className="flex-1 px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400 placeholder:text-deep-blue-500"
                />
                <button
                  onClick={addKeyword}
                  className="px-3 py-1.5 rounded-sm border bg-calm-teal-600 hover:bg-calm-teal-500 border-calm-teal-400 text-white text-xs font-mono flex items-center gap-1"
                >
                  <Plus size={12} />
                  添加
                </button>
              </div>
              {caseData.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {caseData.keywords.map((k) => (
                    <span key={k} className="px-2 py-0.5 text-[11px] font-mono rounded-sm bg-terminal-amber/10 border border-terminal-amber/40 text-terminal-amber flex items-center gap-1">
                      #{k}
                      <button onClick={() => removeKeyword(k)} className="hover:text-alert-red-400 hover:bg-alert-red-500/10 rounded-sm px-0.5 -mr-1">
                        <X size={9} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] font-mono text-deep-blue-500">至少准备5个关键词，事实评分时将检测回应是否覆盖这些关键点。</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-mono text-deep-blue-300">
                按时间顺序添加舆情，T+X秒代表从事件爆发后多久出现。至少3条，建议10条左右。
              </p>
              <button
                onClick={addOpinion}
                className="px-3 py-1.5 rounded-sm border bg-calm-teal-600 hover:bg-calm-teal-500 border-calm-teal-400 text-white text-xs font-mono flex items-center gap-1"
              >
                <Plus size={12} />
                添加舆情
              </button>
            </div>

            <div className="space-y-2.5">
              {caseData.opinionStream.map((op, idx) => (
                <div key={op.id} className="p-3 rounded-sm border border-deep-blue-500 bg-deep-blue-900/30">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-sm text-[10px] font-mono bg-pro-gold-500/15 border border-pro-gold-500/40 text-pro-gold-300">
                        #{idx + 1}
                      </span>
                      <select value={op.source} onChange={(e) => updateOpinion(op.id, { source: e.target.value as OpinionSource })}
                        className="px-2 py-0.5 bg-deep-blue-800 border border-deep-blue-500 text-[11px] font-mono text-deep-blue-100 rounded-sm focus:outline-none">
                        {SOURCE_OPTIONS.map((s) => (
                          <option key={s.key} value={s.key}>{s.label}</option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-[10px] font-mono text-deep-blue-300">
                        <input type="checkbox" checked={op.isScreenshot || false}
                          onChange={(e) => updateOpinion(op.id, { isScreenshot: e.target.checked, screenshotMeta: e.target.checked ? { platform: op.screenshotMeta?.platform || '微信', username: op.screenshotMeta?.username || '用户' } : undefined })}
                          className="accent-pro-gold-400"
                        />
                        截图模式
                      </label>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <button onClick={() => moveOpinion(op.id, -1)}
                        className="p-1 text-deep-blue-400 hover:text-deep-blue-100 transition-colors" title="上移">
                        <ChevronUp size={12} />
                      </button>
                      <button onClick={() => moveOpinion(op.id, 1)}
                        className="p-1 text-deep-blue-400 hover:text-deep-blue-100 transition-colors" title="下移">
                        <ChevronDown size={12} />
                      </button>
                      <button onClick={() => removeOpinion(op.id)}
                        className="p-1 text-deep-blue-400 hover:text-alert-red-400 hover:bg-alert-red-500/10 transition-colors" title="删除">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <input
                      value={op.sourceName}
                      onChange={(e) => updateOpinion(op.id, { sourceName: e.target.value })}
                      placeholder="来源账号/媒体名"
                      className="px-2 py-1 bg-deep-blue-800 border border-deep-blue-500 text-[11px] font-mono text-deep-blue-100 rounded-sm focus:outline-none focus:border-pro-gold-400 placeholder:text-deep-blue-500"
                    />
                    <label className="flex items-center gap-1">
                      <span className="text-[10px] font-mono text-deep-blue-400 whitespace-nowrap">T+秒:</span>
                      <input type="number" min={0} value={op.timestamp}
                        onChange={(e) => updateOpinion(op.id, { timestamp: Math.max(0, parseInt(e.target.value) || 0) })}
                        className="w-full px-2 py-1 bg-deep-blue-800 border border-deep-blue-500 text-[11px] font-mono text-deep-blue-100 rounded-sm focus:outline-none focus:border-pro-gold-400"
                      />
                    </label>
                    <div className="flex gap-1">
                      {SENTIMENT_OPTIONS.map((s) => (
                        <button key={s.key} onClick={() => updateOpinion(op.id, { sentiment: s.key })}
                          className={`flex-1 px-1 py-1 rounded-sm text-[10px] font-mono border transition-colors ${
                            op.sentiment === s.key ? s.color : 'bg-deep-blue-800 text-deep-blue-400 border-deep-blue-600 hover:border-deep-blue-500'
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <textarea
                    value={op.content}
                    onChange={(e) => updateOpinion(op.id, { content: e.target.value })}
                    placeholder="填写舆情具体内容，模拟真实场景的语气/措辞..."
                    rows={op.isScreenshot ? 3 : 2}
                    className="w-full px-2 py-1.5 bg-deep-blue-800 border border-deep-blue-500 text-[11px] font-mono text-deep-blue-100 rounded-sm focus:outline-none focus:border-pro-gold-400 resize-none placeholder:text-deep-blue-500"
                  />

                  {op.isScreenshot && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      <input
                        value={op.screenshotMeta?.platform || ''}
                        onChange={(e) => updateOpinion(op.id, { screenshotMeta: { ...(op.screenshotMeta || { username: '用户' }), platform: e.target.value } })}
                        placeholder="平台（如 微博/微信群/小红书）"
                        className="px-2 py-1 bg-deep-blue-800 border border-deep-blue-500 text-[10px] font-mono text-deep-blue-100 rounded-sm focus:outline-none focus:border-pro-gold-400 placeholder:text-deep-blue-500"
                      />
                      <input
                        value={op.screenshotMeta?.username || ''}
                        onChange={(e) => updateOpinion(op.id, { screenshotMeta: { ...(op.screenshotMeta || { platform: '微信' }), username: e.target.value } })}
                        placeholder="发布者账号/用户名"
                        className="px-2 py-1 bg-deep-blue-800 border border-deep-blue-500 text-[10px] font-mono text-deep-blue-100 rounded-sm focus:outline-none focus:border-pro-gold-400 placeholder:text-deep-blue-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 animate-fadeIn">
            <p className="text-[11px] font-mono text-deep-blue-300 bg-deep-blue-800/40 border border-deep-blue-600 p-2 rounded-sm">
              培训教练模式会将学员回应与此处的优秀回应参考进行对比，指出缺失点并给出修改建议。请尽量填写完整、专业的参考范本。
            </p>
            <Textarea
              label="优秀官方回应参考（面向公众/新闻稿）"
              icon={<FileText size={11} />}
              rows={10}
              value={caseData.idealResponse.official}
              onChange={(e) => setCaseData({ ...caseData, idealResponse: { ...caseData.idealResponse, official: e.target.value } })}
              placeholder={'【标题】关于XX事件的情况说明\n\n尊敬的消费者：\n\n...\n'}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-[11px] font-mono text-pro-gold-300 flex items-center gap-1">
                  <BookOpen size={11} />
                  问答口径（Q&A）参考，每组「问：...\n答：...」
                </div>
                <button
                  onClick={() => setCaseData({
                    ...caseData,
                    idealResponse: {
                      ...caseData.idealResponse,
                      qa: [...caseData.idealResponse.qa, '问：\n答：'],
                    },
                  })}
                  className="px-2 py-0.5 rounded-sm border bg-calm-teal-600 hover:bg-calm-teal-500 border-calm-teal-400 text-white text-[11px] font-mono flex items-center gap-0.5"
                >
                  <Plus size={11} /> 添加Q&A
                </button>
              </div>
              {caseData.idealResponse.qa.map((qa, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="px-1.5 py-0.5 text-[10px] font-mono bg-deep-blue-700 border border-deep-blue-500 text-deep-blue-200 rounded-sm">Q&A #{i + 1}</span>
                    {caseData.idealResponse.qa.length > 1 && (
                      <button
                        onClick={() => setCaseData({
                          ...caseData,
                          idealResponse: {
                            ...caseData.idealResponse,
                            qa: caseData.idealResponse.qa.filter((_, j) => j !== i),
                          },
                        })}
                        className="text-[10px] font-mono text-deep-blue-400 hover:text-alert-red-400 flex items-center gap-0.5"
                      >
                        <Trash2 size={10} />
                        删除
                      </button>
                    )}
                  </div>
                  <textarea
                    value={qa}
                    rows={3}
                    onChange={(e) => setCaseData({
                      ...caseData,
                      idealResponse: {
                        ...caseData.idealResponse,
                        qa: caseData.idealResponse.qa.map((q, j) => j === i ? e.target.value : q),
                      },
                    })}
                    className="w-full px-2 py-1.5 bg-deep-blue-800 border border-deep-blue-500 text-[11px] font-mono text-deep-blue-100 rounded-sm focus:outline-none focus:border-pro-gold-400 resize-none placeholder:text-deep-blue-500"
                    placeholder={'问：（媒体/消费者高频问题）\n答：（标准回答）'}
                  />
                </div>
              ))}
            </div>
            <Textarea
              label="优秀内部通报参考（发给内部员工/管理层）"
              icon={<Users size={11} />}
              rows={8}
              value={caseData.idealResponse.internal}
              onChange={(e) => setCaseData({ ...caseData, idealResponse: { ...caseData.idealResponse, internal: e.target.value } })}
              placeholder={'【内部紧急通知】\n一、事件定级：\n二、对外统一口径（三句话版本）：\n三、绝对禁令：\n四、各部门任务：\n五、上报机制：'}
            />
          </div>
        )}

        {(initialCase || caseData.currentVersion) && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-mono text-calm-teal-400 flex items-center gap-1">
                <History size={11} />
                版本信息
                {caseData.currentVersion && (
                  <span className="px-1.5 py-0.5 rounded-sm bg-pro-gold-500/10 border border-pro-gold-500/30 text-pro-gold-300 ml-1">
                    v{caseData.currentVersion}
                  </span>
                )}
                {caseData.updatedAt && (
                  <span className="text-deep-blue-400 ml-1">
                    更新于 {new Date(caseData.updatedAt).toLocaleString('zh-CN')}
                  </span>
                )}
              </div>
            </div>
            <label className="block space-y-1">
              <div className="text-[10px] font-mono text-deep-blue-400">版本变更说明（可选）</div>
              <input
                type="text"
                value={versionNote}
                onChange={(e) => setVersionNote(e.target.value)}
                placeholder="如：新增了3条负面舆情素材，优化了官方回应参考"
                className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-xs text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400 placeholder:text-deep-blue-500"
              />
            </label>
            {caseData.versions && caseData.versions.length > 0 && (
              <div className="space-y-1">
                <div className="text-[10px] font-mono text-deep-blue-400">历史版本（点击可回看）</div>
                <div className="flex flex-wrap gap-1">
                  {caseData.versions.map((v, idx) => (
                    <button
                      key={idx}
                      onClick={() => setViewingVersion(viewingVersion === idx ? null : idx)}
                      className={`px-2 py-0.5 rounded-sm border text-[10px] font-mono transition-all ${
                        viewingVersion === idx
                          ? 'bg-pro-gold-500/20 border-pro-gold-500/50 text-pro-gold-300'
                          : 'bg-deep-blue-800 border-deep-blue-600 text-deep-blue-300 hover:border-deep-blue-500'
                      }`}
                    >
                      v{v.version} · {new Date(v.updatedAt).toLocaleDateString('zh-CN')}
                    </button>
                  ))}
                </div>
                {viewingVersion !== null && caseData.versions[viewingVersion] && (() => {
                  const snap = caseData.versions[viewingVersion].snapshot;
                  const ver = caseData.versions[viewingVersion];
                  const negCount = snap.opinionStream.filter(o => o.sentiment === 'negative').length;
                  const sentimentBadge = (s: Sentiment) => {
                    if (s === 'negative') return <span className="px-1 rounded-sm bg-alert-red-500/15 text-alert-red-400 text-[9px]">负面</span>;
                    if (s === 'positive') return <span className="px-1 rounded-sm bg-calm-teal-500/15 text-calm-teal-400 text-[9px]">正面</span>;
                    return <span className="px-1 rounded-sm bg-deep-blue-500/20 text-deep-blue-300 text-[9px]">中性</span>;
                  };
                  const diffRow = (label: string, oldVal: string | number, newVal: string | number, isText = false) => {
                    const changed = String(oldVal) !== String(newVal);
                    return (
                      <div className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-deep-blue-400 w-16 shrink-0">{label}</span>
                        <span className={changed ? 'text-alert-red-400' : 'text-deep-blue-300'}>{oldVal}</span>
                        {changed && (
                          <>
                            <span className="text-deep-blue-500">→</span>
                            <span className="text-calm-teal-400">{newVal}</span>
                          </>
                        )}
                        {!changed && <span className="text-deep-blue-600">无变化</span>}
                      </div>
                    );
                  };
                  return (
                    <div className="p-2.5 rounded-sm border border-deep-blue-600 bg-deep-blue-900/50 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-[10px] font-mono text-pro-gold-300">
                          v{ver.version} · {ver.versionNote}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setShowDiff(d => !d)}
                            className="px-2 py-0.5 rounded-sm bg-deep-blue-700/60 border border-deep-blue-500 text-deep-blue-200 text-[9px] font-mono hover:bg-deep-blue-600/60"
                          >
                            {showDiff ? '收起差异' : '查看与当前版差异'}
                          </button>
                          <button
                            onClick={() => {
                              const restored = restoreCaseVersion(caseData.id, viewingVersion);
                              if (restored) {
                                setCaseData(JSON.parse(JSON.stringify(restored)));
                                setVersionNote(`回退至 v${caseData.versions![viewingVersion].version}`);
                                setViewingVersion(null);
                                setShowDiff(false);
                              }
                            }}
                            className="px-2 py-0.5 rounded-sm bg-alert-red-500/10 border border-alert-red-500/30 text-alert-red-400 text-[9px] font-mono hover:bg-alert-red-500/20"
                          >
                            回退到此版本
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[10px] font-mono">
                        <div className="text-pro-gold-300/80 text-[9px] border-b border-deep-blue-700 pb-0.5 mb-1">基本信息</div>
                        <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                          <div><span className="text-deep-blue-400">标题：</span><span className="text-deep-blue-100">{snap.title}</span></div>
                          <div><span className="text-deep-blue-400">分类：</span><span className="text-deep-blue-100">{CATEGORY_LABELS[snap.category]}</span></div>
                          <div><span className="text-deep-blue-400">难度：</span><span className="text-deep-blue-100">{DIFFICULTY_LABELS[snap.difficulty]}</span></div>
                          <div><span className="text-deep-blue-400">关键词：</span><span className="text-deep-blue-100">{snap.keywords.join('、') || '—'}</span></div>
                        </div>
                        <div>
                          <span className="text-deep-blue-400">背景：</span>
                          <div className="mt-0.5 p-1.5 rounded-sm bg-deep-blue-800/60 text-deep-blue-200 max-h-40 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                            {snap.background || '—'}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[10px] font-mono">
                        <div className="text-pro-gold-300/80 text-[9px] border-b border-deep-blue-700 pb-0.5 mb-1">
                          舆情素材 · 共{snap.opinionStream.length}条
                          {negCount > 0 && <span className="text-alert-red-400 ml-1">（负面{negCount}条）</span>}
                        </div>
                        <div className="space-y-0.5 max-h-32 overflow-y-auto">
                          {snap.opinionStream.map(op => (
                            <div key={op.id} className="flex items-center gap-1.5 px-1 py-0.5 rounded-sm bg-deep-blue-800/40">
                              <span className="text-deep-blue-400 shrink-0">T+{op.timestamp}s</span>
                              <span className="text-deep-blue-300 shrink-0">·</span>
                              <span className="text-deep-blue-200 shrink-0">{op.sourceName}</span>
                              <span className="text-deep-blue-300 shrink-0">·</span>
                              {sentimentBadge(op.sentiment)}
                              <span className="text-deep-blue-400 shrink-0">·</span>
                              <span className="text-deep-blue-300 truncate">{op.content.slice(0, 40)}{op.content.length > 40 ? '…' : ''}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[10px] font-mono">
                        <div className="text-pro-gold-300/80 text-[9px] border-b border-deep-blue-700 pb-0.5 mb-1">参考回应</div>
                        <div><span className="text-deep-blue-400">官方回应：</span><span className="text-deep-blue-200">{snap.idealResponse.official.slice(0, 100)}{snap.idealResponse.official.length > 100 ? '…' : ''}</span></div>
                        <div><span className="text-deep-blue-400">Q&A：</span><span className="text-deep-blue-200">{snap.idealResponse.qa.length}条</span></div>
                        <div><span className="text-deep-blue-400">内部通报：</span><span className="text-deep-blue-200">{snap.idealResponse.internal.slice(0, 100)}{snap.idealResponse.internal.length > 100 ? '…' : ''}</span></div>
                      </div>

                      {showDiff && (() => {
                        const cur = caseData;
                        const old = snap;
                        return (
                          <div className="space-y-1 p-2 rounded-sm border border-pro-gold-500/20 bg-deep-blue-900/80">
                            <div className="text-[9px] font-mono text-pro-gold-300 mb-1">差异对比（v{ver.version} → 当前 v{cur.currentVersion ?? '草稿'}）</div>
                            {diffRow('标题', old.title, cur.title)}
                            {diffRow('分类', CATEGORY_LABELS[old.category], CATEGORY_LABELS[cur.category])}
                            {diffRow('难度', DIFFICULTY_LABELS[old.difficulty], DIFFICULTY_LABELS[cur.difficulty])}
                            {diffRow('背景字数', `${old.background.length}字`, `${cur.background.length}字`)}
                            {diffRow('舆情条数', `${old.opinionStream.length}条`, `${cur.opinionStream.length}条`)}
                            {diffRow('负面条数', `${old.opinionStream.filter(o => o.sentiment === 'negative').length}条`, `${cur.opinionStream.filter(o => o.sentiment === 'negative').length}条`)}
                            {diffRow('官方回应', `${old.idealResponse.official.length}字`, `${cur.idealResponse.official.length}字`)}
                            {diffRow('Q&A条数', `${old.idealResponse.qa.length}条`, `${cur.idealResponse.qa.length}条`)}
                            {diffRow('内部通报', `${old.idealResponse.internal.length}字`, `${cur.idealResponse.internal.length}字`)}
                          </div>
                        );
                      })()}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-deep-blue-600 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-sm border bg-deep-blue-700 hover:bg-deep-blue-600 border-deep-blue-500 text-deep-blue-200 text-xs font-mono flex items-center gap-1"
          >
            <X size={12} />
            取消
          </button>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={() => { setErrors([]); setStep((s) => (s - 1) as any); }}
                className="px-3 py-1.5 rounded-sm border bg-deep-blue-700 hover:bg-deep-blue-600 border-deep-blue-500 text-deep-blue-200 text-xs font-mono flex items-center gap-1"
              >
                ← 上一步
              </button>
            )}
            <button
              onClick={nextStep}
              className={`px-4 py-1.5 rounded-sm border text-xs font-mono flex items-center gap-1 ${
                step === 3
                  ? 'bg-calm-teal-600 hover:bg-calm-teal-500 border-calm-teal-400 text-white shadow-glow-teal'
                  : 'bg-pro-gold-600 hover:bg-pro-gold-500 border-pro-gold-400 text-white shadow-glow-gold'
              }`}
            >
              {step === 3 ? (<><Save size={12} />保存案例</>) : '下一步 →'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
