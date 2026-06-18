import type { TraineeResponse, ReviewResult, ScoreDimension, CrisisCase, CoachReview, SectionReview, PressureLevel } from '../types';
import { PRESSURE_LEVELS } from '../types';

const RISK_PHRASES: { pattern: RegExp; suggestion: string; severity: 'high' | 'medium' | 'low'; category: string }[] = [
  { pattern: /不是我们的问题|与我司无关|和我们没关系|我方没有任何责任/gi, suggestion: '建议改为"我们正在积极调查核实，将及时公布结果"，避免推卸责任感', severity: 'high', category: '推卸责任' },
  { pattern: /消费者使用不当|用户操作有误|顾客自己的问题/gi, suggestion: '建议避免将责任归咎于消费者，先表示关切和歉意', severity: 'high', category: '推卸责任' },
  { pattern: /无可奉告|不予评论|不方便透露/gi, suggestion: '建议改为"相关情况正在调查中，我们将第一时间公布进展"，避免态度生硬', severity: 'high', category: '态度傲慢' },
  { pattern: /你们不懂|外行|这是专业问题/gi, suggestion: '建议以通俗语言耐心解释，避免居高临下', severity: 'high', category: '态度傲慢' },
  { pattern: /这是行业惯例|大家都这样|行业通行做法/gi, suggestion: '建议避免拿行业惯例做挡箭牌，正面回应当前问题', severity: 'medium', category: '态度傲慢' },
  { pattern: /绝对安全|100%没问题|完全无害|永久保证|绝对没有/gi, suggestion: '建议避免使用绝对化表述，改为"符合国家相关标准""经检测合格"等可验证说法', severity: 'high', category: '过度承诺' },
  { pattern: /绝对不会|绝对不可能|保证不会/gi, suggestion: '建议避免绝对化承诺，可表述为"我们将尽全力避免类似问题"', severity: 'medium', category: '过度承诺' },
  { pattern: /可能|大概|也许|尽量|差不多|应该/gi, suggestion: '建议避免模糊表述，如信息暂不明确可说明"正在核实中，X小时内回复"', severity: 'low', category: '模糊表述' },
  { pattern: /造谣|诽谤|污蔑|恶意抹黑|带节奏/gi, suggestion: '在事实未完全清楚前避免使用此类表述，可改为"相关情况正在核实"', severity: 'high', category: '激化矛盾' },
  { pattern: /将追究法律责任|保留追究权利|告你诽谤/gi, suggestion: '在未核实事实前避免提及法律追责，以免激化公众情绪', severity: 'high', category: '激化矛盾' },
  { pattern: /水军|收了钱|黑公关/gi, suggestion: '避免质疑评论者动机，专注于回应事实本身', severity: 'medium', category: '激化矛盾' },
  { pattern: /临时工|外包人员|个人行为/gi, suggestion: '避免甩锅给个人或外包，先承担管理责任，再说明内部处理', severity: 'high', category: '推卸责任' },
  { pattern: /只有极少数|个别现象|概率很低/gi, suggestion: '即使是个案也应严肃对待，避免弱化问题严重性', severity: 'medium', category: '淡化问题' },
  { pattern: /大惊小怪|小题大做|过度解读/gi, suggestion: '避免贬低消费者的关切，表达理解和重视', severity: 'high', category: '态度傲慢' },
];

const POSITIVE_WORDS = [
  '深表歉意', '诚挚道歉', '对不起', '抱歉', '遗憾', '痛心', '愧疚',
  '高度重视', '第一时间', '立即', '紧急', '迅速', '即刻',
  '全面调查', '深刻反思', '认真检讨', '举一反三', '全面整改', '严肃处理',
  '承担责任', '负责到底', '全部费用', '全额退款', '无条件', '妥善安置',
  '感谢监督', '欢迎监督', '接受批评', '诚恳致歉', '虚心接受',
];

const FACT_KEYWORDS = [
  '时间', '地点', '人物', '原因', '结果', '措施', '步骤', '期限', '承诺',
  '具体', '明确', '数据', '金额', '数量', '批次', '范围', '涉及',
  '第一时间', '24小时', '48小时', '72小时', '工作日', 'X月X日', '小时内',
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

  if (!text) return {
    name: '态度温度', score: 0, maxScore: 100,
    deductions: [{ reason: '未提交回应内容', points: 100 }],
    suggestions: ['请填写回应内容'],
  };

  if (foundPositive.length < 2) { score -= 20; deductions.push({ reason: '致歉和关切表达不足', points: 20 }); suggestions.push('建议在开头明确表达歉意和对相关方的关切，可使用"深表歉意""高度重视"等表述'); }
  else if (foundPositive.length < 4) { score -= 10; deductions.push({ reason: '情感表达可以更充分', points: 10 }); suggestions.push('可适当增加承担责任、感谢监督等表述，传递诚恳态度'); }

  if (text.length < 80) { score -= 15; deductions.push({ reason: '回应篇幅过短，态度显敷衍', points: 15 }); suggestions.push('建议回应内容充实，体现对事件的重视程度'); }
  if (!lowerText.includes('歉') && !lowerText.includes('对不起') && !lowerText.includes('抱歉')) { score -= 25; deductions.push({ reason: '未包含明确的道歉表述', points: 25 }); suggestions.push('无论责任归属，建议先对事件造成的影响表示歉意'); }
  if (!lowerText.includes('重视') && !lowerText.includes('关注') && !lowerText.includes('关切')) { score -= 10; deductions.push({ reason: '未体现对事件的重视态度', points: 10 }); suggestions.push('建议使用"高度重视""密切关注"等词传递积极态度'); }

  score = Math.max(0, score);
  if (score >= 80) suggestions.push('整体态度诚恳，情感表达得当');
  return { name: '态度温度', score, maxScore: 100, deductions, suggestions };
}

function calculateFactualityScore(text: string, qa: string, internal: string, caseData: CrisisCase | null): ScoreDimension {
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];
  const suggestions: string[] = [];
  const fullText = (text + qa + internal).toLowerCase();

  if (!text && !qa && !internal) return {
    name: '事实完整度', score: 0, maxScore: 100,
    deductions: [{ reason: '未提交任何回应内容', points: 100 }],
    suggestions: ['请填写完整的回应方案'],
  };
  if (!text) { score -= 30; deductions.push({ reason: '未提交第一版官方回应', points: 30 }); suggestions.push('第一版官方回应是最核心的对外沟通文件，务必填写'); }
  if (!qa) { score -= 20; deductions.push({ reason: '未准备补充问答口径', points: 20 }); suggestions.push('建议预判媒体和消费者可能的问题，准备问答口径'); }
  if (!internal) { score -= 15; deductions.push({ reason: '未撰写内部通报', points: 15 }); suggestions.push('内部统一口径是危机处理的关键，建议补充内部通报'); }

  const foundFactKeywords = FACT_KEYWORDS.filter(k => fullText.includes(k));
  if (foundFactKeywords.length < 3) { score -= 20; deductions.push({ reason: '回应中具体事实要素不足', points: 20 }); suggestions.push('建议包含具体时间节点、事件原因、处理措施、责任人等事实要素'); }

  if (caseData) {
    const caseKeywordsLower = caseData.keywords.map(k => k.toLowerCase());
    const coveredKeywords = caseKeywordsLower.filter(k => fullText.includes(k));
    const coverageRate = coveredKeywords.length / caseKeywordsLower.length;
    if (coverageRate < 0.5) { score -= 15; deductions.push({ reason: '核心关键词覆盖不足', points: 15 }); suggestions.push(`建议回应覆盖核心关切点：${caseData.keywords.join('、')}`); }
  }

  if (!fullText.includes('措施') && !fullText.includes('整改') && !fullText.includes('处理') && !fullText.includes('行动')) {
    score -= 10; deductions.push({ reason: '未明确后续处理措施', points: 10 }); suggestions.push('建议明确具体的后续处理措施和时间节点');
  }

  score = Math.max(0, score);
  if (score >= 80) suggestions.push('事实要素较完整，回应覆盖面广');
  return { name: '事实完整度', score, maxScore: 100, deductions, suggestions };
}

function calculateRiskWordsScore(fullText: string): ScoreDimension {
  const risks = detectRiskPhrases(fullText);
  let score = 100;
  const deductions: { reason: string; points: number }[] = [];
  const suggestions: string[] = [];

  if (!fullText) return {
    name: '风险词使用', score: 0, maxScore: 100,
    deductions: [{ reason: '未提交回应内容', points: 100 }],
    suggestions: ['请填写回应内容'],
  };

  const highRisks = risks.filter(r => r.severity === 'high');
  const mediumRisks = risks.filter(r => r.severity === 'medium');
  const lowRisks = risks.filter(r => r.severity === 'low');
  for (const risk of highRisks) { score -= 15; deductions.push({ reason: `高风险表述："${risk.text}"`, points: 15 }); }
  for (const risk of mediumRisks) { score -= 8; deductions.push({ reason: `中风险表述："${risk.text}"`, points: 8 }); }
  for (const risk of lowRisks) { score -= 4; deductions.push({ reason: `低风险表述："${risk.text}"`, points: 4 }); }

  if (highRisks.length > 0) suggestions.push(`检测到 ${highRisks.length} 处高风险表述，建议立即修改`);
  if (mediumRisks.length > 0) suggestions.push(`有 ${mediumRisks.length} 处中风险表述，可斟酌优化`);
  if (risks.length === 0) suggestions.push('未检测到明显风险表述，表达较规范');
  score = Math.max(0, score);
  return { name: '风险词使用', score, maxScore: 100, deductions, suggestions };
}

function calculateSpeedScore(submittedAt: number, totalDuration: number, pressure: PressureLevel): ScoreDimension {
  const deductions: { reason: string; points: number }[] = [];
  const suggestions: string[] = [];

  if (submittedAt <= 0) return {
    name: '回应速度', score: 0, maxScore: 100,
    deductions: [{ reason: '超时未提交', points: 100 }],
    suggestions: [`真实危机中（${pressure.label}），黄金四小时至关重要，请加快回应速度`],
  };

  const usedTime = totalDuration - submittedAt;
  const usedRatio = usedTime / totalDuration;
  let score = 100;

  const pressureBonus = pressure.level >= 3 ? 10 : 0;

  if (usedRatio <= 0.25) {
    suggestions.push(`回应速度极快，符合"黄金一小时"原则，面对${pressure.label}表现优秀！`);
    if (pressureBonus) suggestions.push(`高压力环境下仍能快速决策，这是专业公关的重要能力`);
  } else if (usedRatio <= 0.5) {
    score -= 15; deductions.push({ reason: '用时超过1/4', points: 15 });
    suggestions.push('回应速度良好，可进一步压缩至四分之一时间内');
  } else if (usedRatio <= 0.75) {
    score -= 35; deductions.push({ reason: '用时超过一半', points: 35 });
    suggestions.push(`${pressure.label}环境下可能错过最佳回应窗口，建议提高速度`);
  } else {
    score -= 60; deductions.push({ reason: '接近截止时间才提交', points: 60 });
    suggestions.push('回应过慢，舆情可能已经发酵到难以控制的程度');
  }

  score = Math.min(100, score + pressureBonus);
  return { name: '回应速度', score, maxScore: 100, deductions, suggestions };
}

function getPressureLevel(config: { outbreakSpeed: number; mediaAttention: number }): PressureLevel {
  const avg = (config.outbreakSpeed + config.mediaAttention) / 2;
  const level = Math.max(1, Math.min(4, Math.round(avg))) as 1 | 2 | 3 | 4;
  return PRESSURE_LEVELS[level - 1];
}

const OFFICIAL_CHECKPOINTS: { point: string; pattern: RegExp; importance: 'essential' | 'important' | 'nice_to_have' }[] = [
  { point: '清晰的标题（如"关于XX事件的情况说明"）', pattern: /关于.{2,20}(?:事件|问题|情况|说明|声明|致歉)/, importance: 'important' },
  { point: '明确的称呼对象（消费者/公众/用户等）', pattern: /尊敬的|亲爱的|各位|广大/, importance: 'important' },
  { point: '开篇承认问题存在，不回避', pattern: /关注到|注意到|获悉|了解到|针对|就.*事件/, importance: 'essential' },
  { point: '表达歉意或遗憾', pattern: /歉|抱歉|对不起|遗憾|痛心|愧疚/, importance: 'essential' },
  { point: '陈述已采取的行动（调查/停售/配合等）', pattern: /调查|核实|停售|下架|召回|配合|成立|启动|暂停/, importance: 'essential' },
  { point: '明确后续措施和时间节点', pattern: /小时内|工作日内|将.*公布|将.*处理|后续|整改方案/, importance: 'essential' },
  { point: '对受影响方的补偿/安置承诺', pattern: /退款|赔偿|承担|费用|补偿|安置|退换/, importance: 'important' },
  { point: '提供联系渠道（客服热线/对接人）', pattern: /\d{3}[-—]\d{4}[-—]\d{4}|客服.*热线|联系方式|联系我们/, importance: 'nice_to_have' },
  { point: '公司署名和日期', pattern: /公司|集团|有限公司|20\d{2}年\d{1,2}月/, importance: 'important' },
  { point: '体现高度重视的态度', pattern: /高度重视|第一时间|紧急|立即|深刻|严肃/, importance: 'important' },
];

const QA_CHECKPOINTS: { point: string; importance: 'essential' | 'important' | 'nice_to_have' }[] = [
  { point: '至少3个以上预判问题', importance: 'essential' },
  { point: '包含"事件原因/情况"类问题', importance: 'essential' },
  { point: '包含"后续措施/整改"类问题', importance: 'important' },
  { point: '包含"消费者权益/赔偿"类问题', importance: 'essential' },
  { point: '每个回答具体明确，不含糊', importance: 'important' },
  { point: '包含"时间节点/进展公布"类问题', importance: 'nice_to_have' },
];

const INTERNAL_CHECKPOINTS: { point: string; pattern: RegExp; importance: 'essential' | 'important' | 'nice_to_have' }[] = [
  { point: '事件定级/等级说明', pattern: /一级|二级|三级|重大|较大|一般|紧急|定级/, importance: 'essential' },
  { point: '对外口径统一要求', pattern: /统一口径|不得擅自|对外.*统一|未经授权|任何人不得/, importance: 'essential' },
  { point: '明确媒体/问询对接渠道', pattern: /公关部|统一.*接待|指定.*对接|转至.*部门/, importance: 'important' },
  { point: '各部门分工和具体任务', pattern: /客服部|销售部|供应链|法务|人力|HR|公关|各部门.*要求|工作要求/, importance: 'essential' },
  { point: '社交平台发布禁令', pattern: /朋友圈|微博|社交平台|不得.*发布|不得.*评论|不得.*转发/, importance: 'important' },
  { point: '信息上报机制', pattern: /上报|汇报|第一时间.*报告|及时.*反馈/, importance: 'nice_to_have' },
  { point: '事件基本情况复述', pattern: /今日|事件|关于.*发生|情况.*如下/, importance: 'important' },
];

function reviewOfficialSection(text: string, caseData: CrisisCase | null): SectionReview {
  const missing: { point: string; importance: 'essential' | 'important' | 'nice_to_have' }[] = [];
  const strengths: string[] = [];
  const lowerText = text.toLowerCase();

  if (!text) {
    return {
      sectionName: '第一版官方回应',
      score: 0,
      maxScore: 100,
      missingPoints: [{ point: '未提交内容', importance: 'essential' }],
      strengths: [],
      revisionAdvice: '官方回应是对外沟通的核心文件，必须撰写。建议按照"致歉-说明-措施-承诺"的四段式结构组织。',
      suggestedSnippet: `【标题】关于XX事件的情况说明\n\n尊敬的消费者：\n\n我们高度关注近日关于XX事件的讨论，对此深表歉意。经初步核实，...\n\n目前我们已采取以下措施：\n1. 成立专项调查组，全面彻查\n2. 第一时间向相关部门报告，配合调查\n3. ...\n\n后续我们将在XX小时内公布调查结论，并对受影响的消费者提供XX方案。\n24小时客服热线：XXX-XXXX-XXXX\n\nXX公司\n2024年X月X日`,
    };
  }

  let totalEssential = 0;
  let hitEssential = 0;

  for (const cp of OFFICIAL_CHECKPOINTS) {
    if (cp.importance === 'essential') totalEssential++;
    if (cp.pattern.test(text)) {
      if (cp.importance === 'essential') hitEssential++;
      strengths.push(`✓ ${cp.point}`);
    } else {
      missing.push({ point: cp.point, importance: cp.importance });
    }
  }

  if (text.length >= 150) strengths.push('✓ 内容篇幅充实，信息量足够');
  else missing.push({ point: '篇幅偏短，建议补充更详细的事实描述和措施说明', importance: 'important' });

  const essentialRate = hitEssential / totalEssential;
  let score = Math.round(40 + essentialRate * 40 + (strengths.length / OFFICIAL_CHECKPOINTS.length) * 20);
  score = Math.min(100, Math.max(20, score));

  const missEssential = missing.filter(m => m.importance === 'essential');
  const revisionAdvice = missEssential.length > 0
    ? `官方回应存在${missEssential.length}项核心缺失：${missEssential.map(m => m.point).slice(0, 3).join('；')}。建议采用"致歉-情况-措施-承诺-联系"的经典五段结构，开头必致歉、中间必给方案、结尾必给渠道。`
    : '结构完整，核心要素齐全，可在细节和温度上继续打磨。';

  const keywordsHint = caseData ? `核心关切可重点呼应：${caseData.keywords.slice(0, 4).join('、')}` : '';

  return {
    sectionName: '第一版官方回应',
    score,
    maxScore: 100,
    missingPoints: missing,
    strengths,
    revisionAdvice,
    suggestedSnippet: keywordsHint + `\n\n参考结构：\n【标题】关于[事件]的[说明/致歉声明]\n【称呼】尊敬的[对象]：\n【第一段】承认问题+致歉（2-3句）\n【第二段】说明事实和已采取行动（3-4点）\n【第三段】后续措施和时间承诺（2-3条）\n【第四段】补偿方案+联系方式\n【署名】公司 + 日期`,
  };
}

function reviewQaSection(text: string): SectionReview {
  if (!text) {
    return {
      sectionName: '问答口径（Q&A）',
      score: 0,
      maxScore: 100,
      missingPoints: QA_CHECKPOINTS.map(cp => ({ point: cp.point, importance: cp.importance })),
      strengths: [],
      revisionAdvice: 'Q&A是应对媒体追问的弹药库，必须提前预判。建议至少准备5个高频问题，覆盖事实、措施、赔偿、时间四类。',
      suggestedSnippet: `问：事件的具体情况是什么？\n答：[清晰说明时间、地点、涉及范围，不回避不夸大]\n\n问：公司目前采取了哪些措施？\n答：[列出3-4项具体行动，说明执行状态]\n\n问：受影响的用户该怎么办？\n答：[明确渠道、流程、补偿方案，越具体越好]\n\n问：什么时候能有最终结果？\n答：[给出具体时间节点，如"48小时内公布初步调查结论"]\n\n问：如何避免类似问题再次发生？\n答：[说明长远整改措施，如流程优化、增加审核等]`,
    };
  }

  const missing: { point: string; importance: 'essential' | 'important' | 'nice_to_have' }[] = [];
  const strengths: string[] = [];

  const questionCount = (text.match(/问[：:]/g) || []).length;
  if (questionCount >= 5) strengths.push(`✓ 准备了${questionCount}个问题，覆盖较全面`);
  else if (questionCount >= 3) strengths.push(`✓ 准备了${questionCount}个问题`);
  else missing.push({ point: `仅${questionCount}个问题，建议至少5个`, importance: 'essential' });

  const hasReason = /原因|情况|怎么回事|什么问题|发生了什么/.test(text);
  const hasAction = /措施|处理|整改|行动|做了什么/.test(text);
  const hasCompensate = /赔偿|退款|补偿|退换|维权|怎么办/.test(text);
  const hasTime = /时间|什么时候|多久|公布|进展|节点/.test(text);

  if (hasReason) strengths.push('✓ 包含"事件情况"类问题');
  else missing.push({ point: '缺少"事件原因/情况说明"类问题', importance: 'essential' });
  if (hasAction) strengths.push('✓ 包含"后续措施"类问题');
  else missing.push({ point: '缺少"公司采取什么措施"类问题', importance: 'important' });
  if (hasCompensate) strengths.push('✓ 包含"消费者权益"类问题');
  else missing.push({ point: '缺少"赔偿/维权渠道"类问题', importance: 'essential' });
  if (hasTime) strengths.push('✓ 包含"时间节点"类问题');
  else missing.push({ point: '缺少"何时公布进展"类问题', importance: 'nice_to_have' });

  const vagueAnswers = (text.match(/答[：:].{0,20}(可能|大概|尽量|暂时|目前|稍后)/g) || []).length;
  if (vagueAnswers === 0) strengths.push('✓ 回答具体明确，无模糊表述');
  else missing.push({ point: `${vagueAnswers}处回答较含糊，建议给出具体方案`, importance: 'important' });

  const missEssential = missing.filter(m => m.importance === 'essential').length;
  const score = Math.min(100, Math.max(20, 80 - missEssential * 20 - missing.filter(m => m.importance === 'important').length * 10 + Math.min(20, questionCount * 3)));

  return {
    sectionName: '问答口径（Q&A）',
    score,
    maxScore: 100,
    missingPoints: missing,
    strengths,
    revisionAdvice: missEssential > 0
      ? `Q&A还有${missEssential}个关键问题未覆盖。好的口径=预判所有尖锐问题+给出可落地的具体回答，绝对不能"无可奉告"或顾左右而言他。`
      : 'Q&A覆盖面较好，建议按"越尖锐越优先"的原则排序，将最难回答的问题放在最前面反复打磨。',
    suggestedSnippet: `核心问题清单（建议逐一检查）：\n1. 事件情况说明（必答）\n2. 涉事范围/批次（必答）\n3. 已采取措施（必答）\n4. 消费者赔偿/维权方案（必答）\n5. 何时公布结论（必答）\n6. 根本原因调查进展\n7. 内部责任人处理\n8. 未来如何避免\n\n格式建议：每个Q不超过30字，每个A不超过150字，口语化便于转述。`,
  };
}

function reviewInternalSection(text: string): SectionReview {
  const missing: { point: string; importance: 'essential' | 'important' | 'nice_to_have' }[] = [];
  const strengths: string[] = [];

  if (!text) {
    return {
      sectionName: '内部通报',
      score: 0,
      maxScore: 100,
      missingPoints: INTERNAL_CHECKPOINTS.map(cp => ({ point: cp.point, importance: cp.importance })),
      strengths: [],
      revisionAdvice: '内部通报是避免"神回复"二次危机的防火墙。所有员工必须收到一致的信息和行为约束。',
      suggestedSnippet: `【内部紧急通知】\n\n各位同事：\n\n今日[时间]发生[事件简述]，现将有关事项通知如下：\n\n一、事件定级：[一级重大/二级/三级]危机事件，已启动应急预案\n二、对外统一口径：\n   - 所有媒体、客户、家人问询一律转至公关部XXX对接\n   - 任何人不得擅自接受采访、发朋友圈/微博/抖音评论或转发相关内容\n   - 统一话术：[可对外说的3句话版本]\n三、各部门任务分工：\n   - 客服部：[具体要求，如按话术回复、登记信息、24小时值守]\n   - 销售部：[通知渠道、暂停销售等]\n   - 供应链/生产：[排查、整改等]\n   - 法务：[合规审核、应对调查]\n四、信息上报：发现新情况第一时间上报至[联系人/群]，不得私自处理\n\n请各部门负责人传达到每一位员工并严格执行。\n\n危机管理小组\nXXXX年X月X日`,
    };
  }

  let totalEssential = 0;
  let hitEssential = 0;

  for (const cp of INTERNAL_CHECKPOINTS) {
    if (cp.importance === 'essential') totalEssential++;
    if (cp.pattern.test(text)) {
      if (cp.importance === 'essential') hitEssential++;
      strengths.push(`✓ ${cp.point}`);
    } else {
      missing.push({ point: cp.point, importance: cp.importance });
    }
  }

  if (text.length >= 120) strengths.push('✓ 内容充实，指令清晰');
  else missing.push({ point: '内容偏短，建议补充具体任务和处罚条款', importance: 'important' });

  const essentialRate = hitEssential / totalEssential;
  const score = Math.min(100, Math.max(20, Math.round(40 + essentialRate * 40 + (strengths.length / INTERNAL_CHECKPOINTS.length) * 20)));

  const missEssential = missing.filter(m => m.importance === 'essential').length;
  return {
    sectionName: '内部通报',
    score,
    maxScore: 100,
    missingPoints: missing,
    strengths,
    revisionAdvice: missEssential > 0
      ? `内部通报有${missEssential}项核心缺失，最危险的是口径不统一导致的"神回复"二次危机。记住：对外的每一句话都是公关部审核过的版本，对内每个人都必须知道什么不能说。`
      : '内部管控措施较完整。建议增加"违反规定的后果"条款，强化执行约束力。',
    suggestedSnippet: `必含要素检查清单：\n☑ 事件级别定性（让所有人知道严重性）\n☑ 对外三句话口径（前台/客服也能说的版本）\n☑ 绝对禁令（朋友圈、自媒体、擅自采访）\n☑ 对接人/部门（所有问询转到哪里）\n☑ 各部门的具体任务（不是空话，要有动作）\n☑ 违反纪律的后果（让大家知道不是开玩笑）\n☑ 上报机制（异常情况找谁）`,
  };
}

function buildCoachReview(response: TraineeResponse, caseData: CrisisCase | null, totalScore: number, pressure: PressureLevel): CoachReview {
  const official = reviewOfficialSection(response.officialResponse, caseData);
  const qa = reviewQaSection(response.qaPoints);
  const internal = reviewInternalSection(response.internalNotice);

  const avgSection = (official.score + qa.score + internal.score) / 3;
  let overallFeedback = '';
  const focusAreas: string[] = [];

  if (totalScore >= 85) {
    overallFeedback = `整体表现优秀！在${pressure.label}的压力下保持了专业应对水平。三段回应均完成度较高，说明团队已形成良好的危机反应肌肉记忆。可作为团队内部范例分享。`;
    focusAreas.push('可挑战更高难度案例或更短时间限制');
    focusAreas.push('重点打磨语气温度和人文关怀，追求"专业+真诚"的更高境界');
  } else if (totalScore >= 70) {
    overallFeedback = `表现良好，核心回应框架已建立。但在${pressure.label}环境下仍有可提升空间，主要短板在于细节完整度和关键要素覆盖。距离"金牌公关"还差临门一脚。`;
    const weakest = [official, qa, internal].sort((a, b) => a.score - b.score)[0];
    focusAreas.push(`重点强化：${weakest.sectionName}（得分${weakest.score}）`);
    focusAreas.push('训练"30秒开场版本"，确保第一句话永远是道歉+关切');
  } else if (totalScore >= 60) {
    overallFeedback = `及格线水平，基础框架有但漏洞较多。${pressure.label}压力下暴露出经验不足的问题。建议先从低强度案例反复练习，固化回应模板和检查清单。`;
    focusAreas.push('优先补全所有"必答"类核心要素，不求文采但求无过');
    focusAreas.push('使用"三段回应检查清单"在提交前逐一勾选项');
    focusAreas.push('背诵并默写优秀回应参考，形成肌肉记忆');
  } else {
    overallFeedback = `本次训练结果有待提升。在${pressure.label}压力下暴露出较多问题，核心回应不完整、关键要素大量缺失是主要扣分原因。这在真实危机中会造成严重后果，建议认真对待。`;
    focusAreas.push('【紧急】对照优秀回应参考，逐句学习模仿重写三遍');
    focusAreas.push('【紧急】消除所有高风险表述，建立"提交前先过风险词"的肌肉记忆');
    focusAreas.push('建议从"较低关注"压力等级开始，完成5次及格以上训练后再提升难度');
  }

  const allRisks = detectRiskPhrases(response.officialResponse + response.qaPoints + response.internalNotice);
  if (allRisks.filter(r => r.severity === 'high').length > 0) {
    focusAreas.push(`⚠ 存在高风险表述，提交前必须用"风险词检查"过一遍，一次疏忽可能造成二次危机`);
  }

  const overallGrade: CoachReview['overallGrade'] = totalScore >= 85 ? 'excellent'
    : totalScore >= 70 ? 'good'
    : totalScore >= 60 ? 'pass'
    : 'needs_improvement';

  return { official, qa, internal, overallFeedback, focusAreas, overallGrade };
}

export function evaluateResponse(
  response: TraineeResponse,
  totalDuration: number,
  caseData: CrisisCase | null,
  config?: { outbreakSpeed: number; mediaAttention: number }
): ReviewResult {
  const fullText = response.officialResponse + response.qaPoints + response.internalNotice;
  const pressureLevel = getPressureLevel(config || { outbreakSpeed: 2, mediaAttention: 2 });

  const speed = calculateSpeedScore(response.submittedAt, totalDuration, pressureLevel);
  const factuality = calculateFactualityScore(response.officialResponse, response.qaPoints, response.internalNotice, caseData);
  const attitude = calculateAttitudeScore(response.officialResponse);
  const riskWords = calculateRiskWordsScore(fullText);
  const coachReviewNoScore = buildCoachReview(response, caseData, 0, pressureLevel);

  const totalScore = Math.round(
    speed.score * 0.20 + factuality.score * 0.30 + attitude.score * 0.20 + riskWords.score * 0.15
    + (coachReviewNoScore.official.score * 0.05 + coachReviewNoScore.qa.score * 0.05 + coachReviewNoScore.internal.score * 0.05)
  );

  const coachReview = buildCoachReview(response, caseData, totalScore, pressureLevel);

  const riskPhrases = detectRiskPhrases(fullText);
  const bestScore = 92;
  const averageScore = 68;
  const percentile = Math.min(99, Math.max(1, Math.round((totalScore / 100) * 85 + (5 - pressureLevel.level) * 2)));

  return {
    speed, factuality, attitude, riskWords, totalScore, riskPhrases,
    comparison: { bestScore, averageScore, percentile },
    coachReview,
    pressureLevel,
  };
}

export { getPressureLevel };
