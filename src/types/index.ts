export type CrisisCategory =
  | 'product_quality'
  | 'safety_incident'
  | 'employee_speech'
  | 'supply_chain'
  | 'other';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export type OpinionSource = 'news' | 'social_media' | 'kol' | 'customer_service' | 'media';

export type Sentiment = 'positive' | 'neutral' | 'negative';

export type TrainingPhase = 'idle' | 'configuring' | 'running' | 'submitted' | 'reviewing';

export interface TrainingConfig {
  outbreakSpeed: 1 | 2 | 3 | 4;
  mediaAttention: 1 | 2 | 3 | 4;
  duration: number;
}

export interface OpinionItem {
  id: string;
  source: OpinionSource;
  sourceName: string;
  content: string;
  timestamp: number;
  sentiment: Sentiment;
  isScreenshot?: boolean;
  screenshotMeta?: {
    platform: string;
    username: string;
  };
}

export type CaseOrigin = 'builtin' | 'custom' | 'cloned';

export interface Team {
  id: string;
  name: string;
  description?: string;
  department?: string;
  memberIds: string[];
  createdAt: number;
  updatedAt: number;
}

export interface CaseVersion {
  version: number;
  versionNote: string;
  updatedAt: number;
  snapshot: CrisisCase;
}

export interface CrisisCase {
  id: string;
  title: string;
  category: CrisisCategory;
  summary: string;
  difficulty: DifficultyLevel;
  estimatedDuration: number;
  background: string;
  stakeholders: string[];
  referenceCase?: string;
  origin?: CaseOrigin;
  clonedFromId?: string;
  clonedFromTitle?: string;
  currentVersion?: number;
  versionNote?: string;
  updatedAt?: number;
  versions?: CaseVersion[];
  opinionStream: OpinionItem[];
  keywords: string[];
  idealResponse: {
    official: string;
    qa: string[];
    internal: string;
  };
}

export interface Trainee {
  id: string;
  name: string;
  role?: string;
  department?: string;
  notes?: string;
  createdAt: number;
}

export interface TraineeResponse {
  officialResponse: string;
  qaPoints: string;
  internalNotice: string;
  submittedAt: number;
}

export interface ScoreDimension {
  name: string;
  score: number;
  maxScore: number;
  deductions: { reason: string; points: number }[];
  suggestions: string[];
}

export interface SectionReview {
  sectionName: string;
  score: number;
  maxScore: number;
  missingPoints: { point: string; importance: 'essential' | 'important' | 'nice_to_have' }[];
  strengths: string[];
  revisionAdvice: string;
  suggestedSnippet: string;
}

export interface CoachReview {
  official: SectionReview;
  qa: SectionReview;
  internal: SectionReview;
  overallFeedback: string;
  focusAreas: string[];
  overallGrade: 'excellent' | 'good' | 'pass' | 'needs_improvement';
}

export interface PressureLevel {
  level: 1 | 2 | 3 | 4;
  label: string;
  description: string;
  opinionMultiplier: number;
  visualTension: number;
}

export type PressureLevelInfo = PressureLevel;

export interface ReviewResult {
  speed: ScoreDimension;
  factuality: ScoreDimension;
  attitude: ScoreDimension;
  riskWords: ScoreDimension;
  totalScore: number;
  riskPhrases: { text: string; suggestion: string; severity: 'high' | 'medium' | 'low' }[];
  comparison: {
    bestScore: number;
    averageScore: number;
    percentile: number;
  };
  coachReview: CoachReview;
  pressureLevel: PressureLevel;
  improvementPlan?: ImprovementPlan;
}

export interface ImprovementPlan {
  overallGoal: string;
  focusPoints: {
    dimension: string;
    currentScore: number;
    gap: string;
    action: string;
    priority: 'high' | 'medium' | 'low';
  }[];
  nextPracticeSuggestion: string;
  sectionAdvice: {
    official: string[];
    qa: string[];
    internal: string[];
  };
}

export interface TrainingRecord {
  id: string;
  createdAt: number;
  traineeId?: string;
  traineeName?: string;
  caseId: string;
  caseTitle: string;
  caseCategory: CrisisCategory;
  difficulty: DifficultyLevel;
  config: TrainingConfig;
  pressureLevel: PressureLevel;
  response: TraineeResponse;
  totalScore: number;
  reviewResult: ReviewResult;
  improvementPlan?: ImprovementPlan;
}

export interface TrainingState {
  phase: TrainingPhase;
  selectedCase: CrisisCase | null;
  config: TrainingConfig;
  timeRemaining: number;
  currentOpinions: OpinionItem[];
  response: TraineeResponse;
  reviewResult: ReviewResult | null;
}

export const CATEGORY_LABELS: Record<CrisisCategory, string> = {
  product_quality: '产品质量',
  safety_incident: '安全事故',
  employee_speech: '员工言论',
  supply_chain: '供应链争议',
  other: '其他类型',
};

export const CASE_CATEGORIES: { key: CrisisCategory; label: string }[] = [
  { key: 'product_quality', label: '产品质量' },
  { key: 'safety_incident', label: '安全事故' },
  { key: 'employee_speech', label: '员工言论' },
  { key: 'supply_chain', label: '供应链争议' },
  { key: 'other', label: '其他类型' },
];

export type CaseCategory = CrisisCategory;

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: '入门',
  medium: '进阶',
  hard: '困难',
  expert: '专家',
};

export const DIFFICULTY_LEVELS: { key: DifficultyLevel; label: string }[] = [
  { key: 'easy', label: '入门' },
  { key: 'medium', label: '进阶' },
  { key: 'hard', label: '困难' },
  { key: 'expert', label: '专家' },
];

export const SOURCE_LABELS: Record<OpinionSource, string> = {
  news: '新闻媒体',
  social_media: '社交媒体',
  kol: 'KOL评论',
  customer_service: '客服截图',
  media: '自媒体',
};

export const OUTBREAK_SPEEDS = ['慢速发酵', '正常传播', '快速扩散', '极速爆发'];
export const MEDIA_ATTENTIONS = ['较低关注', '中等关注', '高度关注', '全网聚焦'];

export const PRESSURE_LEVELS: PressureLevel[] = [
  {
    level: 1,
    label: '低强度',
    description: '小范围发酵，节奏从容，适合新手熟悉流程',
    opinionMultiplier: 0.6,
    visualTension: 1,
  },
  {
    level: 2,
    label: '中强度',
    description: '常规危机传播节奏，需要合理分配时间',
    opinionMultiplier: 1.0,
    visualTension: 2,
  },
  {
    level: 3,
    label: '高强度',
    description: '媒体密集跟进，舆情快速升温，考验反应能力',
    opinionMultiplier: 1.6,
    visualTension: 3,
  },
  {
    level: 4,
    label: '极高强度',
    description: '全网聚焦级压迫感，多线同时爆发，模拟真实极限场景',
    opinionMultiplier: 2.4,
    visualTension: 4,
  },
];
