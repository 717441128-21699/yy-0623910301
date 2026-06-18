import { create } from 'zustand';
import type {
  TrainingState,
  CrisisCase,
  TrainingConfig,
  TraineeResponse,
  OpinionItem,
  ReviewResult,
  TrainingRecord,
} from '../types';
import { evaluateResponse } from '../utils/scoringEngine';
import { mockCases } from '../data/cases';

const LS_CASES_KEY = 'prt_custom_cases_v1';
const LS_RECORDS_KEY = 'prt_training_records_v1';

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

function saveRecord(record: TrainingRecord) {
  try {
    const all = loadRecords();
    all.unshift(record);
    localStorage.setItem(LS_RECORDS_KEY, JSON.stringify(all.slice(0, 100)));
  } catch {}
}

interface TrainingStore extends TrainingState {
  customCases: CrisisCase[];
  allCases: CrisisCase[];
  records: TrainingRecord[];
  activePanel: 'case' | 'records';

  selectCase: (caseData: CrisisCase) => void;
  updateConfig: (config: Partial<TrainingConfig>) => void;
  startTraining: () => void;
  addOpinion: (opinion: OpinionItem) => void;
  setTimeRemaining: (time: number) => void;
  updateResponse: (response: Partial<TraineeResponse>) => void;
  submitResponse: () => void;
  resetTraining: () => void;

  addCustomCase: (caseData: CrisisCase) => void;
  updateCustomCase: (caseData: CrisisCase) => void;
  deleteCustomCase: (id: string) => void;

  setActivePanel: (p: 'case' | 'records') => void;
  deleteRecord: (id: string) => void;
  clearAllRecords: () => void;
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

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  phase: 'idle',
  selectedCase: null,
  config: defaultConfig,
  timeRemaining: defaultConfig.duration * 60,
  currentOpinions: [],
  response: defaultResponse,
  reviewResult: null,

  customCases: initialCustomCases,
  allCases: [...mockCases, ...initialCustomCases],
  records: initialRecords,
  activePanel: 'case',

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
      const record: TrainingRecord = {
        id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        createdAt: Date.now(),
        caseId: state.selectedCase.id,
        caseTitle: state.selectedCase.title,
        caseCategory: state.selectedCase.category,
        difficulty: state.selectedCase.difficulty,
        config: { ...state.config },
        pressureLevel: result.pressureLevel,
        response: submittedResponse,
        totalScore: result.totalScore,
        reviewResult: result,
      };
      saveRecord(record);
      set({ records: [record, ...state.records] });
    }

    set({
      response: submittedResponse,
      phase: 'reviewing',
      reviewResult: result,
    });
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
    const withCustomFlag: CrisisCase = {
      ...caseData,
      id: caseData.id || `custom-${Date.now()}`,
    };
    const next = [...get().customCases, withCustomFlag];
    saveCustomCases(next);
    set({
      customCases: next,
      allCases: [...mockCases, ...next],
    });
  },

  updateCustomCase: (caseData) => {
    const next = get().customCases.map(c => c.id === caseData.id ? caseData : c);
    saveCustomCases(next);
    set({
      customCases: next,
      allCases: [...mockCases, ...next],
    });
  },

  deleteCustomCase: (id) => {
    const next = get().customCases.filter(c => c.id !== id);
    saveCustomCases(next);
    const state = get();
    set({
      customCases: next,
      allCases: [...mockCases, ...next],
      selectedCase: state.selectedCase?.id === id ? null : state.selectedCase,
    });
  },

  setActivePanel: (p) => set({ activePanel: p }),

  deleteRecord: (id) => {
    const next = get().records.filter(r => r.id !== id);
    try {
      localStorage.setItem(LS_RECORDS_KEY, JSON.stringify(next));
    } catch {}
    set({ records: next });
  },

  clearAllRecords: () => {
    try {
      localStorage.removeItem(LS_RECORDS_KEY);
    } catch {}
    set({ records: [] });
  },
}));
