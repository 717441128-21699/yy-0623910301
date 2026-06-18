import { create } from 'zustand';
import type {
  TrainingState,
  CrisisCase,
  TrainingConfig,
  TraineeResponse,
  OpinionItem,
  ReviewResult,
  TrainingRecord,
  Trainee,
  ImprovementPlan,
  CaseOrigin,
  Team,
  CaseVersion,
} from '../types';
import { evaluateResponse } from '../utils/scoringEngine';
import { mockCases } from '../data/cases';

const LS_CASES_KEY = 'prt_custom_cases_v1';
const LS_RECORDS_KEY = 'prt_training_records_v1';
const LS_TRAINEES_KEY = 'prt_trainees_v1';
const LS_CURR_TRAINEE_KEY = 'prt_current_trainee_v1';
const LS_TEAMS_KEY = 'prt_teams_v1';

const BUILTIN_CASES: CrisisCase[] = mockCases.map(c => ({ ...c, origin: 'builtin' as CaseOrigin }));

function loadCustomCases(): CrisisCase[] {
  try {
    const raw = localStorage.getItem(LS_CASES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCustomCases(cases: CrisisCase[]) {
  try {
    localStorage.setItem(LS_CASES_KEY, JSON.stringify(cases));
  } catch {}
}

function loadRecords(): TrainingRecord[] {
  try {
    const raw = localStorage.getItem(LS_RECORDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: TrainingRecord[]) {
  try {
    localStorage.setItem(LS_RECORDS_KEY, JSON.stringify(records.slice(0, 200)));
  } catch {}
}

function saveRecord(record: TrainingRecord) {
  const all = loadRecords();
  all.unshift(record);
  saveRecords(all);
}

function loadTrainees(): Trainee[] {
  try {
    const raw = localStorage.getItem(LS_TRAINEES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTrainees(trainees: Trainee[]) {
  try {
    localStorage.setItem(LS_TRAINEES_KEY, JSON.stringify(trainees));
  } catch {}
}

function loadCurrentTraineeId(): string | null {
  try {
    return localStorage.getItem(LS_CURR_TRAINEE_KEY);
  } catch {
    return null;
  }
}

function saveCurrentTraineeId(id: string | null) {
  try {
    if (id) localStorage.setItem(LS_CURR_TRAINEE_KEY, id);
    else localStorage.removeItem(LS_CURR_TRAINEE_KEY);
  } catch {}
}

function loadTeams(): Team[] {
  try {
    const raw = localStorage.getItem(LS_TEAMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTeams(teams: Team[]) {
  try {
    localStorage.setItem(LS_TEAMS_KEY, JSON.stringify(teams));
  } catch {}
}

interface TrainingStore extends TrainingState {
  customCases: CrisisCase[];
  allCases: CrisisCase[];
  records: TrainingRecord[];
  activePanel: 'case' | 'records';
  trainees: Trainee[];
  currentTraineeId: string | null;
  currentTrainee: Trainee | null;
  teams: Team[];
  currentTeamId: string | null;

  selectCase: (caseData: CrisisCase) => void;
  updateConfig: (config: Partial<TrainingConfig>) => void;
  startTraining: () => void;
  addOpinion: (opinion: OpinionItem) => void;
  setTimeRemaining: (time: number) => void;
  updateResponse: (response: Partial<TraineeResponse>) => void;
  submitResponse: () => ImprovementPlan | null;
  resetTraining: () => void;

  addCustomCase: (caseData: CrisisCase) => CrisisCase;
  updateCustomCase: (caseData: CrisisCase, versionNote?: string) => void;
  deleteCustomCase: (id: string) => void;
  cloneCase: (source: CrisisCase) => CrisisCase;
  upsertCustomCase: (caseData: CrisisCase, versionNote?: string) => CrisisCase;
  restoreCaseVersion: (caseId: string, versionIndex: number) => CrisisCase | null;

  setActivePanel: (p: 'case' | 'records') => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;

  addTrainee: (t: Omit<Trainee, 'id' | 'createdAt'>) => Trainee;
  updateTrainee: (t: Trainee) => void;
  deleteTrainee: (id: string) => void;
  setCurrentTrainee: (id: string | null) => void;
  getRecordsByTrainee: (id: string) => TrainingRecord[];

  addTeam: (t: Omit<Team, 'id' | 'createdAt' | 'updatedAt' | 'memberIds'> & { memberIds?: string[] }) => Team;
  updateTeam: (t: Team) => void;
  deleteTeam: (id: string) => void;
  setCurrentTeam: (id: string | null) => void;
  addMemberToTeam: (teamId: string, traineeId: string) => void;
  removeMemberFromTeam: (teamId: string, traineeId: string) => void;
  getTeamStats: (teamId: string) => {
    avgScore: number;
    memberCount: number;
    members: {
      trainee: Trainee;
      latestRecord: TrainingRecord | null;
      avgScore: number;
      scoreTrend: 'up' | 'down' | 'flat' | 'none';
      latestWeakness: string | null;
    }[];
  };
}

const defaultConfig: TrainingConfig = {
  outbreakSpeed: 2,
  mediaAttention: 2,
  duration: 15,
};

const defaultResponse: TraineeResponse = {
  officialResponse: '',
  qaPoints: '',
  internalNotice: '',
  submittedAt: 0,
};

const initialCustomCases = loadCustomCases();
const initialRecords = loadRecords();
const initialTrainees = loadTrainees();
const initialCurrentId = loadCurrentTraineeId();
const initialTeams = loadTeams();

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  phase: 'idle',
  selectedCase: null,
  config: defaultConfig,
  timeRemaining: defaultConfig.duration * 60,
  currentOpinions: [],
  response: defaultResponse,
  reviewResult: null,

  customCases: initialCustomCases,
  allCases: [...BUILTIN_CASES, ...initialCustomCases],
  records: initialRecords,
  activePanel: 'case',
  trainees: initialTrainees,
  currentTraineeId: initialCurrentId,
  currentTrainee: initialTrainees.find(t => t.id === initialCurrentId) || null,
  teams: initialTeams,
  currentTeamId: null,

  selectCase: (caseData) => set({
    selectedCase: caseData,
    phase: 'configuring',
    timeRemaining: caseData.estimatedDuration * 60,
    config: {
      ...defaultConfig,
      duration: caseData.estimatedDuration,
    },
  }),

  updateConfig: (config) => set((state) => ({
    config: { ...state.config, ...config },
  })),

  startTraining: () => set((state) => ({
    phase: 'running',
    timeRemaining: state.config.duration * 60,
    currentOpinions: [],
    response: defaultResponse,
    reviewResult: null,
  })),

  addOpinion: (opinion) => set((state) => ({
    currentOpinions: [...state.currentOpinions, opinion],
  })),

  setTimeRemaining: (time) => set({ timeRemaining: time }),

  updateResponse: (response) => set((state) => ({
    response: { ...state.response, ...response },
  })),

  submitResponse: () => {
    const state = get();
    const submittedResponse: TraineeResponse = {
      ...state.response,
      submittedAt: state.timeRemaining,
    };
    const result = evaluateResponse(
      submittedResponse,
      state.config.duration * 60,
      state.selectedCase,
      { outbreakSpeed: state.config.outbreakSpeed, mediaAttention: state.config.mediaAttention }
    );

    if (state.selectedCase) {
      const ct = state.currentTrainee;
      const record: TrainingRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        traineeId: ct?.id,
        traineeName: ct?.name,
        caseId: state.selectedCase.id,
        caseTitle: state.selectedCase.title,
        caseCategory: state.selectedCase.category,
        difficulty: state.selectedCase.difficulty,
        config: { ...state.config },
        pressureLevel: result.pressureLevel,
        response: submittedResponse,
        totalScore: result.totalScore,
        reviewResult: result,
        improvementPlan: result.improvementPlan,
      };
      saveRecord(record);
      set({ records: [record, ...state.records] });
    }

    set({
      response: submittedResponse,
      phase: 'reviewing',
      reviewResult: result,
    });

    return result.improvementPlan;
  },

  resetTraining: () => set({
    phase: 'idle',
    selectedCase: null,
    config: defaultConfig,
    timeRemaining: defaultConfig.duration * 60,
    currentOpinions: [],
    response: defaultResponse,
    reviewResult: null,
  }),

  upsertCustomCase: (caseData, versionNote) => {
    const state = get();
    const now = Date.now();
    const existing = state.customCases.find(c => c.id === caseData.id);
    let result: CrisisCase;

    if (existing) {
      const nextVersion = (existing.currentVersion || 1) + 1;
      const snapshot: CrisisCase = JSON.parse(JSON.stringify(existing));
      const newVersionEntry: CaseVersion = {
        version: existing.currentVersion || 1,
        versionNote: existing.versionNote || '初始版本',
        updatedAt: existing.updatedAt || now,
        snapshot,
      };
      const existingVersions = existing.versions || [];

      result = {
        ...caseData,
        id: existing.id,
        origin: caseData.origin || existing.origin || 'custom',
        clonedFromId: caseData.clonedFromId ?? existing.clonedFromId,
        clonedFromTitle: caseData.clonedFromTitle ?? existing.clonedFromTitle,
        currentVersion: nextVersion,
        versionNote: versionNote || `更新于 ${new Date(now).toLocaleString('zh-CN')}`,
        updatedAt: now,
        versions: [...existingVersions, newVersionEntry],
      };

      const next = state.customCases.map(c => c.id === existing.id ? result : c);
      saveCustomCases(next);
      set({
        customCases: next,
        allCases: [...BUILTIN_CASES, ...next],
        selectedCase: state.selectedCase?.id === existing.id ? result : state.selectedCase,
      });
    } else {
      result = {
        ...caseData,
        id: caseData.id || `custom-${now}`,
        origin: caseData.origin || (caseData.clonedFromId ? 'cloned' : 'custom'),
        currentVersion: 1,
        versionNote: versionNote || '初始版本',
        updatedAt: now,
        versions: [],
      };
      const next = [...state.customCases, result];
      saveCustomCases(next);
      set({
        customCases: next,
        allCases: [...BUILTIN_CASES, ...next],
      });
    }
    return result;
  },

  addCustomCase: (caseData) => {
    return get().upsertCustomCase(caseData);
  },

  updateCustomCase: (caseData, versionNote) => {
    get().upsertCustomCase(caseData, versionNote);
  },

  deleteCustomCase: (id) => {
    const next = get().customCases.filter(c => c.id !== id);
    saveCustomCases(next);
    const state = get();
    set({
      customCases: next,
      allCases: [...BUILTIN_CASES, ...next],
      selectedCase: state.selectedCase?.id === id ? null : state.selectedCase,
    });
  },

  cloneCase: (source: CrisisCase): CrisisCase => {
    const state = get();
    const existingClone = state.customCases.find(
      c => c.clonedFromId === source.id && c.origin === 'cloned'
    );
    if (existingClone) {
      return { ...existingClone };
    }
    const clone: CrisisCase = {
      ...JSON.parse(JSON.stringify(source)),
      id: `custom-${Date.now()}`,
      title: `${source.title}（企业定制版）`,
      origin: 'cloned',
      clonedFromId: source.id,
      clonedFromTitle: source.title,
      currentVersion: 1,
      versionNote: '模板复制',
      updatedAt: Date.now(),
      versions: [],
    };
    return clone;
  },

  restoreCaseVersion: (caseId, versionIndex) => {
    const state = get();
    const theCase = state.customCases.find(c => c.id === caseId);
    if (!theCase || !theCase.versions || !theCase.versions[versionIndex]) return null;

    const versionSnapshot = theCase.versions[versionIndex];
    const restored: CrisisCase = {
      ...JSON.parse(JSON.stringify(versionSnapshot.snapshot)),
      id: theCase.id,
      origin: theCase.origin,
      clonedFromId: theCase.clonedFromId,
      clonedFromTitle: theCase.clonedFromTitle,
      currentVersion: (theCase.currentVersion || 1) + 1,
      versionNote: `回退至 v${versionSnapshot.version}：${versionSnapshot.versionNote}`,
      updatedAt: Date.now(),
      versions: theCase.versions,
    };

    get().upsertCustomCase(restored, restored.versionNote);
    return restored;
  },

  setActivePanel: (p) => set({ activePanel: p }),

  deleteRecord: (id) => {
    const next = get().records.filter(r => r.id !== id);
    saveRecords(next);
    set({ records: next });
  },

  clearAllRecords: () => {
    saveRecords([]);
    set({ records: [] });
  },

  addTrainee: (t) => {
    const newTrainee: Trainee = {
      ...t,
      id: `trainee-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: Date.now(),
    };
    const next = [...get().trainees, newTrainee];
    saveTrainees(next);
    set({ trainees: next });
    return newTrainee;
  },

  updateTrainee: (t) => {
    const next = get().trainees.map(x => x.id === t.id ? t : x);
    saveTrainees(next);
    set({ trainees: next, currentTrainee: get().currentTrainee?.id === t.id ? t : get().currentTrainee });
  },

  deleteTrainee: (id) => {
    const next = get().trainees.filter(x => x.id !== id);
    saveTrainees(next);
    const newTeams = get().teams.map(team => ({
      ...team,
      memberIds: team.memberIds.filter(mid => mid !== id),
      updatedAt: Date.now(),
    }));
    saveTeams(newTeams);
    set({
      trainees: next,
      currentTraineeId: get().currentTraineeId === id ? null : get().currentTraineeId,
      currentTrainee: get().currentTrainee?.id === id ? null : get().currentTrainee,
      teams: newTeams,
    });
    saveCurrentTraineeId(get().currentTraineeId);
  },

  setCurrentTrainee: (id) => {
    const t = id ? get().trainees.find(x => x.id === id) || null : null;
    saveCurrentTraineeId(id);
    set({ currentTraineeId: id, currentTrainee: t });
  },

  getRecordsByTrainee: (id) => get().records.filter(r => r.traineeId === id),

  addTeam: (t) => {
    const now = Date.now();
    const newTeam: Team = {
      ...t,
      memberIds: t.memberIds || [],
      id: `team-${now}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: now,
      updatedAt: now,
    };
    const next = [...get().teams, newTeam];
    saveTeams(next);
    set({ teams: next });
    return newTeam;
  },

  updateTeam: (t) => {
    const updated = { ...t, updatedAt: Date.now() };
    const next = get().teams.map(x => x.id === t.id ? updated : x);
    saveTeams(next);
    set({ teams: next });
  },

  deleteTeam: (id) => {
    const next = get().teams.filter(x => x.id !== id);
    saveTeams(next);
    set({
      teams: next,
      currentTeamId: get().currentTeamId === id ? null : get().currentTeamId,
    });
  },

  setCurrentTeam: (id) => set({ currentTeamId: id }),

  addMemberToTeam: (teamId, traineeId) => {
    const state = get();
    const next = state.teams.map(t => {
      if (t.id !== teamId) return t;
      if (t.memberIds.includes(traineeId)) return t;
      return { ...t, memberIds: [...t.memberIds, traineeId], updatedAt: Date.now() };
    });
    saveTeams(next);
    set({ teams: next });
  },

  removeMemberFromTeam: (teamId, traineeId) => {
    const state = get();
    const next = state.teams.map(t => {
      if (t.id !== teamId) return t;
      return { ...t, memberIds: t.memberIds.filter(mid => mid !== traineeId), updatedAt: Date.now() };
    });
    saveTeams(next);
    set({ teams: next });
  },

  getTeamStats: (teamId) => {
    const state = get();
    const team = state.teams.find(t => t.id === teamId);
    const members = team?.memberIds || [];

    const memberStats = members.map(mid => {
      const trainee = state.trainees.find(t => t.id === mid)!;
      const records = state.records
        .filter(r => r.traineeId === mid)
        .sort((a, b) => a.createdAt - b.createdAt);
      const latestRecord = records.length > 0 ? records[records.length - 1] : null;
      const avg = records.length > 0
        ? Math.round(records.reduce((s, r) => s + r.totalScore, 0) / records.length)
        : 0;

      let trend: 'up' | 'down' | 'flat' | 'none' = 'none';
      if (records.length >= 2) {
        const recent = records.slice(-3);
        const first = recent[0].totalScore;
        const last = recent[recent.length - 1].totalScore;
        if (last - first >= 5) trend = 'up';
        else if (last - first <= -5) trend = 'down';
        else trend = 'flat';
      }

      let latestWeakness: string | null = null;
      if (latestRecord?.improvementPlan?.focusPoints?.[0]) {
        latestWeakness = latestRecord.improvementPlan.focusPoints[0].dimension;
      } else if (latestRecord?.reviewResult) {
        const dims = [
          { name: '回应速度', s: latestRecord.reviewResult.speed.score },
          { name: '事实完整度', s: latestRecord.reviewResult.factuality.score },
          { name: '态度温度', s: latestRecord.reviewResult.attitude.score },
          { name: '风险词使用', s: latestRecord.reviewResult.riskWords.score },
        ];
        dims.sort((a, b) => a.s - b.s);
        latestWeakness = dims[0].name;
      }

      return {
        trainee,
        latestRecord,
        avgScore: avg,
        scoreTrend: trend,
        latestWeakness,
      };
    }).filter(m => m.trainee);

    const validScores = memberStats.filter(m => m.latestRecord).map(m => m.latestRecord!.totalScore);
    const avgScore = validScores.length > 0
      ? Math.round(validScores.reduce((s, v) => s + v, 0) / validScores.length)
      : 0;

    return {
      avgScore,
      memberCount: memberStats.length,
      members: memberStats,
    };
  },
}));
