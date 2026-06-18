import React, { useState, useMemo } from 'react';
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
  Users,
  Copy,
  UserPlus,
  X,
  Edit,
  FileText,
  Users2,
  UserMinus,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useTrainingStore } from '../store/trainingStore';
import { WindowFrame } from './WindowFrame';
import { CaseEditorModal } from './CaseEditorModal';
import type { CrisisCategory, CrisisCase, Trainee, Team } from '../types';
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

const ORIGIN_BADGES: Record<string, { label: string; cls: string }> = {
  builtin: { label: '内置', cls: 'text-deep-blue-200 border-deep-blue-500 bg-deep-blue-500/20' },
  custom: { label: '自定义', cls: 'text-calm-teal-400 border-calm-teal-500/40 bg-calm-teal-500/10' },
  cloned: { label: '模板复制', cls: 'text-terminal-amber border-terminal-amber/40 bg-terminal-amber/10' },
};

function computePressure(outbreak: number, media: number) {
  const avg = (outbreak + media) / 2;
  const level = Math.max(1, Math.min(4, Math.round(avg))) as 1 | 2 | 3 | 4;
  return PRESSURE_LEVELS[level - 1];
}

function Modal({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title: string }) {
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-deep-blue-950 border border-pro-gold-500/30 rounded shadow-glow-gold animate-fadeIn">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-deep-blue-600 bg-deep-blue-900/80">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-pro-gold-400" />
            <h3 className="text-sm font-serif-cn text-pro-gold-300">{title}</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-sm text-deep-blue-400 hover:text-deep-blue-100 hover:bg-deep-blue-700/50">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

const TraineeEditor: React.FC<{ initial?: Trainee | null; onSave: (t: Omit<Trainee, 'id' | 'createdAt'> & { id?: string }) => void; onClose: () => void }> = ({ initial, onSave, onClose }) => {
  const [name, setName] = useState(initial?.name || '');
  const [role, setRole] = useState(initial?.role || '');
  const [department, setDepartment] = useState(initial?.department || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) { setErr('请填写学员姓名'); return; }
    onSave({ id: initial?.id, name: name.trim(), role: role.trim() || undefined, department: department.trim() || undefined, notes: notes.trim() || undefined });
  };

  return (
    <div className="space-y-3">
      {err && <div className="text-[11px] font-mono text-alert-red-400 bg-alert-red-500/10 border border-alert-red-500/30 p-2 rounded-sm">{err}</div>}
      <label className="block space-y-1">
        <div className="text-[11px] font-mono text-pro-gold-300">学员姓名 <span className="text-alert-red-400">*</span></div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="如：张三"
          className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400 focus:shadow-glow-gold transition-all" />
      </label>
      <label className="block space-y-1">
        <div className="text-[11px] font-mono text-pro-gold-300">岗位/职务</div>
        <input value={role} onChange={e => setRole(e.target.value)} placeholder="如：公关专员 / 区域市场经理"
          className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400" />
      </label>
      <label className="block space-y-1">
        <div className="text-[11px] font-mono text-pro-gold-300">所属部门</div>
        <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="如：品牌部 / 客服部"
          className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400" />
      </label>
      <label className="block space-y-1">
        <div className="text-[11px] font-mono text-pro-gold-300">备注</div>
        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="培训背景、重点关注方向等"
          className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400 resize-none" />
      </label>
      <div className="pt-2 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded-sm border bg-deep-blue-700 hover:bg-deep-blue-600 border-deep-blue-500 text-deep-blue-200 text-xs font-mono">取消</button>
        <button onClick={submit} className="px-3 py-1.5 rounded-sm border bg-pro-gold-600 hover:bg-pro-gold-500 border-pro-gold-400 text-white text-xs font-mono shadow-glow-gold">保存</button>
      </div>
    </div>
  );
};

const TeamEditor: React.FC<{ initial?: Team | null; onSave: (t: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'memberIds'> & { id?: string }) => void; onClose: () => void }> = ({ initial, onSave, onClose }) => {
  const [name, setName] = useState(initial?.name || '');
  const [department, setDepartment] = useState(initial?.department || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [err, setErr] = useState('');

  const submit = () => {
    if (!name.trim()) { setErr('请填写小组名称'); return; }
    onSave({ id: initial?.id, name: name.trim(), department: department.trim() || undefined, description: description.trim() || undefined });
  };

  return (
    <div className="space-y-3">
      {err && <div className="text-[11px] font-mono text-alert-red-400 bg-alert-red-500/10 border border-alert-red-500/30 p-2 rounded-sm">{err}</div>}
      <label className="block space-y-1">
        <div className="text-[11px] font-mono text-pro-gold-300">小组名称 <span className="text-alert-red-400">*</span></div>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="如：公关危机应对A组"
          className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400 focus:shadow-glow-gold transition-all" />
      </label>
      <label className="block space-y-1">
        <div className="text-[11px] font-mono text-pro-gold-300">所属部门</div>
        <input value={department} onChange={e => setDepartment(e.target.value)} placeholder="如：品牌公关部 / 市场部"
          className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400" />
      </label>
      <label className="block space-y-1">
        <div className="text-[11px] font-mono text-pro-gold-300">小组描述</div>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} placeholder="小组职责、训练目标等"
          className="w-full px-2.5 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 rounded-sm text-sm text-deep-blue-50 font-mono focus:outline-none focus:border-pro-gold-400 resize-none" />
      </label>
      <div className="pt-2 flex justify-end gap-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded-sm border bg-deep-blue-700 hover:bg-deep-blue-600 border-deep-blue-500 text-deep-blue-200 text-xs font-mono">取消</button>
        <button onClick={submit} className="px-3 py-1.5 rounded-sm border bg-pro-gold-600 hover:bg-pro-gold-500 border-pro-gold-400 text-white text-xs font-mono shadow-glow-gold">保存</button>
      </div>
    </div>
  );
};

export const CaseLibrary: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<CrisisCategory | 'all'>('all');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingCase, setEditingCase] = useState<CrisisCase | null>(null);
  const [traineeModal, setTraineeModal] = useState<null | { mode: 'add' | 'edit'; trainee?: Trainee | null }>(null);
  const [teamTab, setTeamTab] = useState<'trainee' | 'team'>('trainee');
  const [teamModal, setTeamModal] = useState<null | { mode: 'add' | 'edit'; team?: Team | null }>(null);
  const [addMemberModal, setAddMemberModal] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

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
    trainees,
    currentTrainee,
    currentTraineeId,
    addTrainee,
    updateTrainee,
    deleteTrainee,
    setCurrentTrainee,
    cloneCase,
    teams,
    currentTeamId,
    setCurrentTeam,
    addTeam,
    updateTeam,
    deleteTeam,
    addMemberToTeam,
    removeMemberFromTeam,
    getTeamStats,
  } = useTrainingStore();

  const currentTeam = useMemo(() => teams.find(t => t.id === currentTeamId) || null, [teams, currentTeamId]);
  const teamStats = useMemo(() => currentTeamId ? getTeamStats(currentTeamId) : null, [currentTeamId, getTeamStats]);

  const filteredCases = activeCategory === 'all'
    ? allCases
    : allCases.filter(c => c.category === activeCategory);

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

  const handleCloneCase = (c: CrisisCase) => {
    const cloned = cloneCase(c);
    setEditingCase(cloned);
    setEditorOpen(true);
  };

  const handleSaveClone = () => {
  };

  const previewPressure = computePressure(config.outbreakSpeed, config.mediaAttention);

  const traineeRecordCount = currentTraineeId ? records.filter(r => r.traineeId === currentTraineeId).length : 0;

  return (
    <>
      <CaseEditorModal
        isOpen={editorOpen}
        onClose={() => { setEditorOpen(false); setEditingCase(null); }}
        initialCase={editingCase}
        onAfterSave={handleSaveClone}
      />

      {traineeModal && (
        <Modal
          title={traineeModal.mode === 'add' ? '新建学员档案' : '编辑学员档案'}
          onClose={() => setTraineeModal(null)}
        >
          <TraineeEditor
            initial={traineeModal.trainee || null}
            onClose={() => setTraineeModal(null)}
            onSave={(t) => {
              if (t.id) updateTrainee({ ...t, id: t.id, createdAt: (trainees.find(x => x.id === t.id)?.createdAt) || Date.now() } as Trainee);
              else {
                const nt = addTrainee({ name: t.name, role: t.role, department: t.department, notes: t.notes });
                setCurrentTrainee(nt.id);
              }
              setTraineeModal(null);
            }}
          />
        </Modal>
      )}

      {teamModal && (
        <Modal
          title={teamModal.mode === 'add' ? '新建小组' : '编辑小组'}
          onClose={() => setTeamModal(null)}
        >
          <TeamEditor
            initial={teamModal.team || null}
            onClose={() => setTeamModal(null)}
            onSave={(t) => {
              if (t.id) {
                const existing = teams.find(x => x.id === t.id)!;
                updateTeam({ ...existing, ...t });
              } else {
                const nt = addTeam({ name: t.name, department: t.department, description: t.description });
                setCurrentTeam(nt.id);
              }
              setTeamModal(null);
            }}
          />
        </Modal>
      )}

      {addMemberModal && currentTeam && (
        <Modal
          title={`向「${currentTeam.name}」添加成员`}
          onClose={() => { setAddMemberModal(false); setSelectedMemberIds([]); }}
        >
          <div className="space-y-3">
            <div className="text-[11px] font-mono text-deep-blue-300">
              选择要添加到小组的学员（多选）：
            </div>
            {trainees.length === 0 ? (
              <div className="p-3 rounded-sm bg-deep-blue-800/40 border border-deep-blue-600 text-[11px] font-mono text-deep-blue-400 flex items-center gap-1">
                <UserPlus size={10} className="text-calm-teal-400" />
                学员库为空，请先在「学员」Tab中创建学员档案
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto space-y-1 border border-deep-blue-600 rounded-sm p-1.5 bg-deep-blue-900/30">
                {trainees.map(t => {
                  const isInTeam = currentTeam.memberIds.includes(t.id);
                  const isSelected = selectedMemberIds.includes(t.id);
                  const disabled = isInTeam;
                  return (
                    <label
                      key={t.id}
                      className={`flex items-center gap-2 p-2 rounded-sm cursor-pointer transition-colors ${
                        disabled ? 'bg-deep-blue-700/30 opacity-60 cursor-not-allowed' :
                        isSelected ? 'bg-calm-teal-500/15 border border-calm-teal-500/40' :
                        'hover:bg-deep-blue-700/50 border border-transparent'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={disabled || isSelected}
                        disabled={disabled}
                        onChange={(e) => {
                          if (disabled) return;
                          if (e.target.checked) {
                            setSelectedMemberIds([...selectedMemberIds, t.id]);
                          } else {
                            setSelectedMemberIds(selectedMemberIds.filter(id => id !== t.id));
                          }
                        }}
                        className="accent-pro-gold-400"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-mono text-deep-blue-100 truncate">
                          {t.name}
                          {t.department && <span className="text-deep-blue-400 ml-1">（{t.department}）</span>}
                          {t.role && <span className="text-deep-blue-400 ml-1">- {t.role}</span>}
                        </div>
                        {disabled && (
                          <div className="text-[9px] font-mono text-calm-teal-400">已在小组中</div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
            <div className="pt-2 flex justify-end gap-2">
              <button
                onClick={() => { setAddMemberModal(false); setSelectedMemberIds([]); }}
                className="px-3 py-1.5 rounded-sm border bg-deep-blue-700 hover:bg-deep-blue-600 border-deep-blue-500 text-deep-blue-200 text-xs font-mono"
              >
                取消
              </button>
              <button
                onClick={() => {
                  selectedMemberIds.forEach(id => addMemberToTeam(currentTeam.id, id));
                  setAddMemberModal(false);
                  setSelectedMemberIds([]);
                }}
                disabled={selectedMemberIds.length === 0}
                className="px-3 py-1.5 rounded-sm border bg-pro-gold-600 hover:bg-pro-gold-500 border-pro-gold-400 text-white text-xs font-mono shadow-glow-gold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                确认添加 ({selectedMemberIds.length})
              </button>
            </div>
          </div>
        </Modal>
      )}

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
          <div className="px-3 py-2 border-b border-deep-blue-500 bg-deep-blue-800/50">
            <div className="flex items-center gap-1 mb-2 border-b border-deep-blue-600/60 pb-2">
              <button
                onClick={() => setTeamTab('trainee')}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-sm border flex items-center gap-1 transition-all ${
                  teamTab === 'trainee'
                    ? 'bg-calm-teal-500/20 border-calm-teal-500/50 text-calm-teal-400'
                    : 'border-deep-blue-500 text-deep-blue-300 hover:text-deep-blue-100 hover:bg-deep-blue-700/50'
                }`}
              >
                <User size={10} />
                学员
              </button>
              <button
                onClick={() => setTeamTab('team')}
                className={`px-2.5 py-1 text-[10px] font-mono rounded-sm border flex items-center gap-1 transition-all ${
                  teamTab === 'team'
                    ? 'bg-calm-teal-500/20 border-calm-teal-500/50 text-calm-teal-400'
                    : 'border-deep-blue-500 text-deep-blue-300 hover:text-deep-blue-100 hover:bg-deep-blue-700/50'
                }`}
              >
                <Users2 size={10} />
                小组
              </button>
            </div>

            {teamTab === 'trainee' && (
              <>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <Users size={11} className="text-calm-teal-400" />
                    <span className="text-deep-blue-300">培训学员</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setTraineeModal({ mode: 'add' })}
                      className="p-1 text-[9px] font-mono text-calm-teal-400 hover:bg-calm-teal-500/10 rounded-sm flex items-center gap-0.5"
                      title="新建学员"
                    >
                      <UserPlus size={11} />
                      新建
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={currentTraineeId || ''}
                    onChange={(e) => setCurrentTrainee(e.target.value || null)}
                    className="flex-1 px-2 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 text-[11px] font-mono text-deep-blue-100 rounded-sm focus:outline-none focus:border-calm-teal-400"
                  >
                    <option value="">— 未指定学员（匿名训练）—</option>
                    {trainees.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.department ? `（${t.department}）` : ''}{t.role ? ` - ${t.role}` : ''}
                      </option>
                    ))}
                  </select>
                  {currentTrainee && (
                    <>
                      <button
                        onClick={() => setTraineeModal({ mode: 'edit', trainee: currentTrainee })}
                        className="p-1 text-deep-blue-400 hover:text-pro-gold-400 hover:bg-pro-gold-500/10 rounded-sm transition-colors"
                        title="编辑学员"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定删除学员「${currentTrainee.name}」？该学员的训练记录不会被删除。`)) {
                            deleteTrainee(currentTrainee.id);
                          }
                        }}
                        className="p-1 text-deep-blue-400 hover:text-alert-red-400 hover:bg-alert-red-500/10 rounded-sm transition-colors"
                        title="删除学员"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>

                {currentTrainee && (
                  <div className="mt-2 text-[10px] font-mono text-deep-blue-300 flex items-center gap-2 flex-wrap">
                    {currentTrainee.role && <span className="px-1.5 py-0.5 rounded-sm bg-deep-blue-700/60 border border-deep-blue-600">岗位: {currentTrainee.role}</span>}
                    {currentTrainee.department && <span className="px-1.5 py-0.5 rounded-sm bg-deep-blue-700/60 border border-deep-blue-600">部门: {currentTrainee.department}</span>}
                    <span className="px-1.5 py-0.5 rounded-sm bg-terminal-green/10 border border-terminal-green/30 text-terminal-green">
                      <FileText size={9} className="inline -mt-0.5 mr-0.5" />
                      已完成 {traineeRecordCount} 次训练
                    </span>
                    {currentTrainee.notes && <span className="text-deep-blue-500 w-full truncate">备注：{currentTrainee.notes}</span>}
                  </div>
                )}

                {!currentTrainee && trainees.length === 0 && (
                  <div className="mt-2 p-1.5 rounded-sm bg-deep-blue-800/40 border border-deep-blue-600 text-[10px] font-mono text-deep-blue-400 flex items-center gap-1">
                    <UserPlus size={10} className="text-calm-teal-400" />
                    点击「新建」建立学员档案，训练记录将按学员归档
                  </div>
                )}
              </>
            )}

            {teamTab === 'team' && (
              <>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-mono">
                    <Users2 size={11} className="text-calm-teal-400" />
                    <span className="text-deep-blue-300">培训小组</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button
                      onClick={() => setTeamModal({ mode: 'add' })}
                      className="p-1 text-[9px] font-mono text-calm-teal-400 hover:bg-calm-teal-500/10 rounded-sm flex items-center gap-0.5"
                      title="新建小组"
                    >
                      <UserPlus size={11} />
                      新建
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <select
                    value={currentTeamId || ''}
                    onChange={(e) => setCurrentTeam(e.target.value || null)}
                    className="flex-1 px-2 py-1.5 bg-deep-blue-900/60 border border-deep-blue-500 text-[11px] font-mono text-deep-blue-100 rounded-sm focus:outline-none focus:border-calm-teal-400"
                  >
                    <option value="">— 请选择小组 —</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name}{t.department ? `（${t.department}）` : ''} · {t.memberIds.length}人
                      </option>
                    ))}
                  </select>
                  {currentTeam && (
                    <>
                      <button
                        onClick={() => setTeamModal({ mode: 'edit', team: currentTeam })}
                        className="p-1 text-deep-blue-400 hover:text-pro-gold-400 hover:bg-pro-gold-500/10 rounded-sm transition-colors"
                        title="编辑小组"
                      >
                        <Edit size={12} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`确定删除小组「${currentTeam.name}」？小组成员档案不会被删除。`)) {
                            deleteTeam(currentTeam.id);
                          }
                        }}
                        className="p-1 text-deep-blue-400 hover:text-alert-red-400 hover:bg-alert-red-500/10 rounded-sm transition-colors"
                        title="删除小组"
                      >
                        <Trash2 size={12} />
                      </button>
                    </>
                  )}
                </div>

                {!currentTeam && teams.length === 0 && (
                  <div className="mt-2 p-1.5 rounded-sm bg-deep-blue-800/40 border border-deep-blue-600 text-[10px] font-mono text-deep-blue-400 flex items-center gap-1">
                    <UserPlus size={10} className="text-calm-teal-400" />
                    点击「新建」创建培训小组，便于统一管理团队训练
                  </div>
                )}

                {currentTeam && teamStats && (
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-mono flex-wrap">
                      {currentTeam.department && <span className="px-1.5 py-0.5 rounded-sm bg-deep-blue-700/60 border border-deep-blue-600">部门: {currentTeam.department}</span>}
                      <span className="px-1.5 py-0.5 rounded-sm bg-terminal-green/10 border border-terminal-green/30 text-terminal-green">
                        <Users size={9} className="inline -mt-0.5 mr-0.5" />
                        总人数: {teamStats.memberCount}
                      </span>
                      <span className="px-1.5 py-0.5 rounded-sm bg-pro-gold-500/10 border border-pro-gold-500/30 text-pro-gold-300">
                        <Target size={9} className="inline -mt-0.5 mr-0.5" />
                        小组平均分: {teamStats.avgScore || '—'}
                      </span>
                      {currentTeam.description && <span className="text-deep-blue-500 w-full truncate">描述：{currentTeam.description}</span>}
                    </div>

                    <div className="pt-2 border-t border-deep-blue-600/50">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="text-[10px] font-mono text-deep-blue-400">小组成员</div>
                        <button
                          onClick={() => setAddMemberModal(true)}
                          className="px-1.5 py-0.5 text-[9px] font-mono text-calm-teal-400 hover:bg-calm-teal-500/10 rounded-sm flex items-center gap-0.5 border border-calm-teal-500/30"
                        >
                          <UserPlus size={9} />
                          添加成员
                        </button>
                      </div>

                      {teamStats.members.length === 0 ? (
                        <div className="p-2 rounded-sm bg-deep-blue-800/30 border border-deep-blue-600/50 text-[10px] font-mono text-deep-blue-500 text-center">
                          暂无成员，点击「添加成员」从学员库中选择
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
                          {teamStats.members.map(({ trainee, latestRecord, avgScore, scoreTrend, latestWeakness }) => {
                            const traineeRecCount = records.filter(r => r.traineeId === trainee.id).length;
                            return (
                              <div
                                key={trainee.id}
                                className="p-2 rounded-sm border border-deep-blue-600/50 bg-deep-blue-900/30 flex items-start gap-2"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="text-[11px] font-mono text-deep-blue-100 font-medium">{trainee.name}</span>
                                    {trainee.role && <span className="text-[9px] font-mono text-deep-blue-400">· {trainee.role}</span>}
                                    {trainee.department && <span className="text-[9px] font-mono text-deep-blue-400">· {trainee.department}</span>}
                                  </div>
                                  <div className="flex items-center gap-2 mt-1 text-[9px] font-mono flex-wrap">
                                    <span className="text-deep-blue-400">训练 {traineeRecCount} 次</span>
                                    <span className="text-pro-gold-300">均分 {avgScore || '—'}</span>
                                    {scoreTrend === 'up' && <span className="text-terminal-green flex items-center gap-0.5"><TrendingUp size={8} />进步</span>}
                                    {scoreTrend === 'down' && <span className="text-alert-red-400 flex items-center gap-0.5"><TrendingDown size={8} />退步</span>}
                                    {scoreTrend === 'flat' && <span className="text-deep-blue-400 flex items-center gap-0.5"><Minus size={8} />平稳</span>}
                                    {latestWeakness && <span className="text-terminal-amber">短板: {latestWeakness}</span>}
                                  </div>
                                </div>
                                <button
                                  onClick={() => {
                                    if (confirm(`将「${trainee.name}」从小组中移除？`)) {
                                      removeMemberFromTeam(currentTeam.id, trainee.id);
                                    }
                                  }}
                                  className="p-0.5 text-deep-blue-500 hover:text-alert-red-400 hover:bg-alert-red-500/10 rounded-sm transition-colors flex-shrink-0 mt-0.5"
                                  title="移出小组"
                                >
                                  <UserMinus size={10} />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="px-3 py-2 border-b border-deep-blue-500 bg-deep-blue-800/30">
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
              const origin = caseData.origin || (caseData.id.startsWith('case-') ? 'builtin' : 'custom');
              const originBadge = ORIGIN_BADGES[origin] || ORIGIN_BADGES.custom;
              const showEdit = caseData.origin !== 'builtin';
              const isCustom = origin !== 'builtin';

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
                    <div className="flex items-start gap-2 min-w-0 flex-1">
                      <span className="text-pro-gold-400 flex-shrink-0 mt-0.5">{CATEGORY_ICONS[caseData.category]}</span>
                      <div className="min-w-0">
                        <h3 className="font-serif-cn text-sm text-deep-blue-50 font-semibold leading-snug break-all">{caseData.title}</h3>
                        {caseData.clonedFromTitle && (
                          <div className="text-[10px] font-mono text-deep-blue-500 mt-0.5 flex items-center gap-0.5">
                            <Copy size={9} />
                            源自模板：{caseData.clonedFromTitle}
                          </div>
                        )}
                        {isCustom && (
                          <div className="mt-0.5 text-[9px] font-mono text-terminal-amber flex items-center gap-1">
                            {caseData.versionNote && (
                              <span className="truncate" title={caseData.versionNote}>
                                {caseData.versionNote.slice(0, 30)}{caseData.versionNote.length > 30 ? '...' : ''}
                              </span>
                            )}
                            {caseData.updatedAt && (
                              <span className="text-deep-blue-500 ml-auto flex-shrink-0">
                                {new Date(caseData.updatedAt).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 flex-wrap justify-end">
                      <span className={`px-1.5 py-0.5 text-[9px] font-mono rounded-sm border ${originBadge.cls}`}>
                        {originBadge.label}
                      </span>
                      {isCustom && caseData.currentVersion && (
                        <span className="px-1.5 py-0.5 text-[9px] font-mono rounded-sm border border-terminal-amber/50 bg-terminal-amber/10 text-terminal-amber whitespace-nowrap">
                          v{caseData.currentVersion}
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
                      <span className="flex items-center gap-1"><Clock size={11} />约{caseData.estimatedDuration}分钟</span>
                      <span className="flex items-center gap-1"><Target size={11} />{caseData.keywords.length}个关键词</span>
                      <span className="flex items-center gap-1"><Radio size={11} />{caseData.opinionStream.length}条舆情</span>
                    </div>
                    {phase !== 'running' && phase !== 'reviewing' && (
                      <div className="flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleCloneCase(caseData); }}
                          className="p-1 rounded-sm text-deep-blue-400 hover:text-terminal-amber hover:bg-terminal-amber/10 transition-colors"
                          title="复制为企业定制版"
                        >
                          <Copy size={12} />
                        </button>
                        {showEdit && (
                          <>
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
                          </>
                        )}
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
                {currentTrainee ? `${currentTrainee.name} · 启动危机演练` : '启动危机演练（未指定学员）'}
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
