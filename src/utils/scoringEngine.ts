import type { TraineeResponse, ReviewResult, ScoreDimension, CrisisCase } from '../types';

const RISK_PHRASES: { pattern: RegExp; suggestion: string; severity: 'high' | 'medium' | 'low'; category: string }[] = [
  { pattern: /不是我们的问题|与我司无关|和我们没关系|我方没有任何责任/gi, suggestion: '建议改为"我们正在积极调查核实，将及时公布结果"，避免推卸责任感', severity: 'high', category: '推卸责任' },
  { pattern: /消费者使用不当|用户操作有误|顾客自己的问题/gi, suggestion: '建议避免将责任归咎于消费者，先表示关切和歉意', severity: 'high', category: '推卸责任' },
  { pattern: /无可奉告|不予评论|不方便透露/gi, suggestion: '建议改为"相关情况正在调查中，我们将第一时间公布进展"，避免态度生硬', severity: 'high', category: '态度傲慢' },
  { pattern: /你们不懂|外行|这是专业问题/gi, suggestion: '建议以通俗语言耐心解释，避免居高临下', severity: 'high', category: '态度傲慢' },
  { pattern: /这是行业惯例|大家都这样|行业通行做法/gi, suggestion: '建议避免拿行业惯例做挡箭牌，正面回应当前问题', severity: 'medium', category: '态度傲慢' },
  { pattern: /绝对安全|100%没问题|完全无害|永久保证|绝对没有/gi, suggestion: '建议避免使用绝对化表述，改为"符合国家相关标准""经检测合格"等可验证说法', severity: 'high', category: '过度承诺' },
  { pattern: /绝对不会|绝对不可能|保证不会/gi, suggestion: '建议避免绝对化承诺，可表述为"我们将尽全力避免类似问题"', severity: 'medium', category: '过度承诺' },
  { pattern: /可能|大概|也许|尽量|差不多|应该/gi, suggestion: '建议避免模糊表述，如信息暂不明确可说明"正在核实中，X小时内回复"', severity: 'low', category: '模糊表述' },
  { pattern: /目前|暂时|一会儿|稍后/gi, suggestion: '建议给出具体时间节点，避免模糊的时间承诺', severity: 'low', category: '模糊表述' },
  { pattern: /造谣|诽谤|污蔑|恶意抹黑|带节奏/gi, suggestion: '在事实未完全清楚前避免使用此类表述，可改为"相关情况正在核实"', severity: 'high', category: '激化矛盾' },
  { pattern: /将追究法律责任|保留追究权利|告你诽谤/gi, suggestion: '在未核实事实前避免提及法律追责，以免激化公众情绪', severity: 'high', category: '激化矛盾' },
  { pattern: /水军|收了钱|黑公关/gi, suggestion: '避免质疑评论者动机，专注于回应事实本身', severity: 'medium', category: '激化矛盾' },
  { pattern: /临时工|外包人员|个人行为/gi, suggestion: '避免甩锅给个人或外包，先承担管理责任，再说明内部处理', severity: 'high', category: '推卸责任' },
  { pattern: /只有极少数|个别现象|概率很低/gi, suggestion: '即使是个案也应严肃对待，避免弱化问题严重性', severity: 'medium', category: '淡化问题' },
  { pattern: /大惊小怪|小题大做|过度解读/gi, suggestion: '避免贬低消费者的关切，表达理解和重视', severity: 'high', category: '态度傲慢' },
];

const POSITIVE_WORDS = [
  '深表歉意', '诚挚道歉', '对不起', '抱歉', '遗憾', '痛心',
  '高度重视', '第一时间', '立即', '紧急', '迅速',
  '全面调查', '深刻反思', '认真检讨', '举一反三', '全面整改',
  '承担责任', '负责到底', '全部费用', '全额退款', '无条件',
  '感谢监督', '欢迎监督', '接受批评', '诚恳致歉',
];

const FACT_KEYWORDS = [
  '时间', '地点', '人物', '原因', '结果', '措施', '步骤', '期限', '承诺',
  '具体', '明确', '数据', '金额', '数量', '批次', '范围',
  '第一时间', '24小时', '48小时', '72小时', '工作日',
];

function detectRiskPhrases(text: string): { text: string; suggestion: string; severity: 'high' | 'medium' | 'low' }[] {
  const results: { text: string; suggestion: string; severity: 'high' | 'medium' | 'low' }[] = [];
  if (!text) return results;
  const seen = new Set<string>();
  for (const { pattern, suggestion, severity } of RISK_PHRASES) {
    const matches = text.match(pattern);
    if (matches) {
      for (const m of matches) {
        const key = m.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ text: m, suggestion, severity });
        }
      }
    }
  }
  return results;
}

function calculateAttitudeScore(text: string): ScoreDimension {
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];
  const suggestions: string[] = [];

  const lowerText = text.toLowerCase();
  const foundPositive = POSITIVE_WORDS.filter(w => lowerText.includes(w));

  if (!text) {
    return {
      name: '态度温度',
      score: 0,
      maxScore: 100,
      deductions: [{ reason: '未提交回应内容', points: 100 }],
      suggestions: ['请填写回应内容'],
    };
  }

  if (foundPositive.length < 2) {
    score -= 20;
    deductions.push({ reason: '致歉和关切表达不足', points: 20 });
    suggestions.push('建议在开头明确表达歉意和对相关方的关切，可使用"深表歉意""高度重视"等表述');
  }

  if (foundPositive.length >= 2 && foundPositive.length < 4) {
    score -= 10;
    deductions.push({ reason: '情感表达可以更充分', points: 10 });
    suggestions.push('可适当增加承担责任、感谢监督等表述，传递诚恳态度');
  }

  if (text.length < 80) {
    score -= 15;
    deductions.push({ reason: '回应篇幅过短，态度显敷衍', points: 15 });
    suggestions.push('建议回应内容充实，体现对事件的重视程度');
  }

  if (!lowerText.includes('歉') && !lowerText.includes('对不起') && !lowerText.includes('抱歉')) {
    score -= 25;
    deductions.push({ reason: '未包含明确的道歉表述', points: 25 });
    suggestions.push('无论责任归属，建议先对事件造成的影响表示歉意');
  }

  if (!lowerText.includes('重视') && !lowerText.includes('关注') && !lowerText.includes('关切')) {
    score -= 10;
    deductions.push({ reason: '未体现对事件的重视态度', points: 10 });
    suggestions.push('建议使用"高度重视""密切关注"等词传递积极态度');
  }

  score = Math.max(0, score);
  if (score >= 80) {
    suggestions.push('整体态度诚恳，情感表达得当');
  }

  return {
    name: '态度温度',
    score,
    maxScore: 100,
    deductions,
    suggestions,
  };
}

function calculateFactualityScore(text: string, qa: string, internal: string, caseData: CrisisCase | null): ScoreDimension {
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];
  const suggestions: string[] = [];

  const fullText = (text + qa + internal).toLowerCase();

  if (!text && !qa && !internal) {
    return {
      name: '事实完整度',
      score: 0,
      maxScore: 100,
      deductions: [{ reason: '未提交任何回应内容', points: 100 }],
      suggestions: ['请填写完整的回应方案'],
    };
  }

  if (!text) {
    score -= 30;
    deductions.push({ reason: '未提交第一版官方回应', points: 30 });
    suggestions.push('第一版官方回应是最核心的对外沟通文件，务必填写');
  }

  if (!qa) {
    score -= 20;
    deductions.push({ reason: '未准备补充问答口径', points: 20 });
    suggestions.push('建议预判媒体和消费者可能的问题，准备问答口径');
  }

  if (!internal) {
    score -= 15;
    deductions.push({ reason: '未撰写内部通报', points: 15 });
    suggestions.push('内部统一口径是危机处理的关键，建议补充内部通报');
  }

  const foundFactKeywords = FACT_KEYWORDS.filter(k => fullText.includes(k));
  if (foundFactKeywords.length < 3) {
    score -= 20;
    deductions.push({ reason: '回应中具体事实要素不足', points: 20 });
    suggestions.push('建议包含具体时间节点、事件原因、处理措施、责任人等事实要素');
  }

  if (caseData) {
    const caseKeywordsLower = caseData.keywords.map(k => k.toLowerCase());
    const coveredKeywords = caseKeywordsLower.filter(k => fullText.includes(k));
    const coverageRate = coveredKeywords.length / caseKeywordsLower.length;
    if (coverageRate < 0.5) {
      score -= 15;
      deductions.push({ reason: '核心关键词覆盖不足', points: 15 });
      suggestions.push(`建议回应覆盖核心关切点：${caseData.keywords.join('、')}`);
    }
  }

  if (!fullText.includes('措施') && !fullText.includes('整改') && !fullText.includes('处理') && !fullText.includes('行动')) {
    score -= 10;
    deductions.push({ reason: '未明确后续处理措施', points: 10 });
    suggestions.push('建议明确具体的后续处理措施和时间节点');
  }

  score = Math.max(0, score);
  if (score >= 80) {
    suggestions.push('事实要素较完整，回应覆盖面广');
  }

  return {
    name: '事实完整度',
    score,
    maxScore: 100,
    deductions,
    suggestions,
  };
}

function calculateRiskWordsScore(fullText: string): ScoreDimension {
  const risks = detectRiskPhrases(fullText);
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];
  const suggestions: string[] = [];

  if (!fullText) {
    return {
      name: '风险词使用',
      score: 0,
      maxScore: 100,
      deductions: [{ reason: '未提交回应内容', points: 100 }],
      suggestions: ['请填写回应内容'],
    };
  }

  const highRisks = risks.filter(r => r.severity === 'high');
  const mediumRisks = risks.filter(r => r.severity === 'medium');
  const lowRisks = risks.filter(r => r.severity === 'low');

  for (const risk of highRisks) {
    score -= 15;
    deductions.push({ reason: `高风险表述："${risk.text}"`, points: 15 });
  }
  for (const risk of mediumRisks) {
    score -= 8;
    deductions.push({ reason: `中风险表述："${risk.text}"`, points: 8 });
  }
  for (const risk of lowRisks) {
    score -= 4;
    deductions.push({ reason: `低风险表述："${risk.text}"`, points: 4 });
  }

  if (highRisks.length > 0) {
    suggestions.push(`检测到 ${highRisks.length} 处高风险表述，建议立即修改`);
  }
  if (mediumRisks.length > 0) {
    suggestions.push(`有 ${mediumRisks.length} 处中风险表述，可斟酌优化`);
  }
  if (risks.length === 0) {
    suggestions.push('未检测到明显风险表述，表达较规范');
  }

  score = Math.max(0, score);
  return {
    name: '风险词使用',
    score,
    maxScore: 100,
    deductions,
    suggestions,
  };
}

function calculateSpeedScore(submittedAt: number, totalDuration: number): ScoreDimension {
  const deductions: { reason: string; points: number }[] = [];
  const suggestions: string[] = [];

  if (submittedAt <= 0) {
    return {
      name: '回应速度',
      score: 0,
      maxScore: 100,
      deductions: [{ reason: '超时未提交', points: 100 }],
      suggestions: ['真实危机中，黄金四小时至关重要，请加快回应速度'],
    };
  }

  const usedTime = totalDuration - submittedAt;
  const usedRatio = usedTime / totalDuration;

  let score = 100;

  if (usedRatio <= 0.25) {
    suggestions.push('回应速度极快，符合"黄金一小时"原则，优秀！');
  } else if (usedRatio <= 0.5) {
    score -= 15;
    deductions.push({ reason: '用时超过1/4', points: 15 });
    suggestions.push('回应速度良好，可进一步压缩至四分之一时间内');
  } else if (usedRatio <= 0.75) {
    score -= 35;
    deductions.push({ reason: '用时超过一半', points: 35 });
    suggestions.push('真实危机中可能错过最佳回应窗口，建议提高速度');
  } else {
    score -= 60;
    deductions.push({ reason: '接近截止时间才提交', points: 60 });
    suggestions.push('回应过慢，舆情可能已经发酵到难以控制的程度');
  }

  return {
    name: '回应速度',
    score,
    maxScore: 100,
    deductions,
    suggestions,
  };
}

export function evaluateResponse(
  response: TraineeResponse,
  totalDuration: number,
  caseData: CrisisCase | null
): ReviewResult {
  const fullText = response.officialResponse + response.qaPoints + response.internalNotice;

  const speed = calculateSpeedScore(response.submittedAt, totalDuration);
  const factuality = calculateFactualityScore(response.officialResponse, response.qaPoints, response.internalNotice, caseData);
  const attitude = calculateAttitudeScore(response.officialResponse);
  const riskWords = calculateRiskWordsScore(fullText);

  const totalScore = Math.round(
    speed.score * 0.25 + factuality.score * 0.30 + attitude.score * 0.25 + riskWords.score * 0.20
  );

  const riskPhrases = detectRiskPhrases(fullText);

  const bestScore = 92;
  const averageScore = 68;
  const percentile = Math.min(99, Math.max(1, Math.round((totalScore / 100) * 90 + 5)));

  return {
    speed,
    factuality,
    attitude,
    riskWords,
    totalScore,
    riskPhrases,
    comparison: {
      bestScore,
      averageScore,
      percentile,
    },
  };
}
