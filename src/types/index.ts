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
  opinionStream: OpinionItem[];
  keywords: string[];
  idealResponse: {
    official: string;
    qa: string[];
    internal: string;
  };
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

export const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: '入门',
  medium: '进阶',
  hard: '困难',
  expert: '专家',
};

export const SOURCE_LABELS: Record<OpinionSource, string> = {
  news: '新闻媒体',
  social_media: '社交媒体',
  kol: 'KOL评论',
  customer_service: '客服截图',
  media: '自媒体',
};

export const OUTBREAK_SPEEDS = ['慢速发酵', '正常传播', '快速扩散', '极速爆发'];
export const MEDIA_ATTENTIONS = ['较低关注', '中等关注', '高度关注', '全网聚焦'];
