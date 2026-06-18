import { create } from 'zustand';
import type { TrainingState, CrisisCase, TrainingConfig, TraineeResponse, OpinionItem, ReviewResult } from '../types';
import { evaluateResponse } from '../utils/scoringEngine';

interface TrainingStore extends TrainingState {
  selectCase: (caseData: CrisisCase) => void;
  updateConfig: (config: Partial<TrainingConfig>) => void;
  startTraining: () => void;
  addOpinion: (opinion: OpinionItem) => void;
  setTimeRemaining: (time: number) => void;
  updateResponse: (response: Partial<TraineeResponse>) => void;
  submitResponse: () => void;
  setReviewResult: (result: ReviewResult) => void;
  resetTraining: () => void;
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

export const useTrainingStore = create<TrainingStore>((set, get) => ({
  phase: 'idle',
  selectedCase: null,
  config: defaultConfig,
  timeRemaining: defaultConfig.duration * 60,
  currentOpinions: [],
  response: defaultResponse,
  reviewResult: null,

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
      state.selectedCase
    );
    set({
      response: submittedResponse,
      phase: 'reviewing',
      reviewResult: result,
    });
  },

  setReviewResult: (result) => set({ reviewResult: result }),

  resetTraining: () => set({
    phase: 'idle',
    selectedCase: null,
    config: defaultConfig,
    timeRemaining: defaultConfig.duration * 60,
    currentOpinions: [],
    response: defaultResponse,
    reviewResult: null,
  }),
}));
