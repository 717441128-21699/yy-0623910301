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
} from '../types';
import { evaluateResponse } from '../utils/scoringEngine';
import { mockCases } from '../data/cases';

const LS_CASES_KEY = 'prt_custom_cases_v1';
const LS_RECORDS_KEY = 'prt_training_records_v1';
const LS_TRAINEES_KEY = 'prt_trainees_v1';
const LS_CURR_TRAINEE_KEY = 'prt_current_trainee_v1';

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

interface TrainingStore extends TrainingState {
  customCases: CrisisCase[];
  allCases: CrisisCase[];
  records: TrainingRecord[];
  activePanel: 'case' | 'records';
  trainees: Trainee[];
  currentTraineeId: string | null;
  currentTrainee: Trainee | null;

  selectCase: (caseData: CrisisCase) => void;
  updateConfig: (config: Partial<TrainingConfig>) => void;
  startTraining: () => void;
  addOpinion: (opinion: OpinionItem) => void;
  setTimeRemaining: (time: number) => void;
  updateResponse: (response: Partial<TraineeResponse>) => void;
  submitResponse: () => ImprovementPlan | null;
  resetTraining: () => void;

  addCustomCase: (caseData: CrisisCase) => void;
  updateCustomCase: (caseData: CrisisCase) => void;
  deleteCustomCase: (id: string) => void;
  cloneCase: (source: CrisisCase) => CrisisCase;

  setActivePanel: (p: 'case' | 'records') => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;

  addTrainee: (t: Omit<Trainee, 'id' | 'createdAt'>) => Trainee;
  updateTrainee: (t: Trainee) => void;
  deleteTrainee: (id: string) => void;
  setCurrentTrainee: (id: string | null) => void;
  getRecordsByTrainee: (id: string) => TrainingRecord[];
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

  addCustomCase: (caseData) => {
    const withFlag: CrisisCase = {
      ...caseData,
      id: caseData.id || `custom-${Date.now()}`,
      origin: caseData.origin || (caseData.clonedFromId ? 'cloned' : 'custom'),
    };
    const next = [...get().customCases, withFlag];
    saveCustomCases(next);
    set({
      customCases: next,
      allCases: [...BUILTIN_CASES, ...next],
    });
    return withFlag;
  },

  updateCustomCase: (caseData) => {
    const next = get().customCases.map(c => c.id === caseData.id ? { ...caseData, origin: caseData.origin || c.origin || 'custom' } : c);
    saveCustomCases(next);
    set({
      customCases: next,
      allCases: [...BUILTIN_CASES, ...next],
    });
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
    const clone: CrisisCase = {
      ...JSON.parse(JSON.stringify(source)),
      id: `custom-${Date.now()}`,
      title: `${source.title}（企业定制版）`,
      origin: 'cloned',
      clonedFromId: source.id,
      clonedFromTitle: source.title,
    };
    return clone;
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
    set({
      trainees: next,
      currentTraineeId: get().currentTraineeId === id ? null : get().currentTraineeId,
      currentTrainee: get().currentTrainee?.id === id ? null : get().currentTrainee,
    });
    saveCurrentTraineeId(get().currentTraineeId);
  },

  setCurrentTrainee: (id) => {
    const t = id ? get().trainees.find(x => x.id === id) || null : null;
    saveCurrentTraineeId(id);
    set({ currentTraineeId: id, currentTrainee: t });
  },

  getRecordsByTrainee: (id) => get().records.filter(r => r.traineeId === id),
}));
