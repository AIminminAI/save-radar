import { Persona, personas } from '@/data/personas'
import { ScrapedCoupon } from '@/data/types'

export interface PolicyInterpretation {
  plainTitle: string
  impactOnYou: string
  whatChanged: string
  whatToDo: string
  urgency: 'high' | 'medium' | 'low'
  relatedPersona: Persona
  moneyImpact: string
  disclaimer: string
}

const IMPACT_DB: Record<string, Record<string, {
  impact: string
  change: string
  action: string
  money: string
  urgency: 'high' | 'medium' | 'low'
}>> = {
  'tax': {
    '扣除': {
      impact: '个税可能少交',
      change: '个税专项扣除标准调整，你每月可以多扣一些钱再算税',
      action: '打开个税APP → 专项附加扣除 → 填报/更新信息',
      money: '到手收入可能变化，具体看扣除标准',
      urgency: 'high',
    },
    '减免': {
      impact: '可能少交税',
      change: '符合条件可享受税费减免，税负直接降低',
      action: '向单位财务或税务部门咨询减免条件并申请',
      money: '具体金额看减免幅度',
      urgency: 'high',
    },
    '优惠': {
      impact: '有税收优惠能享受',
      change: '新出了税收优惠政策，符合条件可以少交',
      action: '对照条件看自己是否符合，符合就申请',
      money: '看具体优惠力度',
      urgency: 'medium',
    },
    '调整': {
      impact: '交税金额可能变',
      change: '税率或起征点有变化，你的税负可能增减',
      action: '算一下新标准下自己多交还是少交',
      money: '需根据调整方向计算',
      urgency: 'medium',
    },
    '赡养': {
      impact: '赡养老人可能减税',
      change: '赡养老人可享个税专项扣除，每月定额减税',
      action: '个税APP → 专项附加扣除 → 赡养老人 → 填报',
      money: '具体扣除标准请查看政策原文',
      urgency: 'high',
    },
    '子女': {
      impact: '养孩子可能减税',
      change: '子女教育可享个税专项扣除，每月定额减税',
      action: '个税APP → 专项附加扣除 → 子女教育 → 填报',
      money: '具体扣除标准请查看政策原文',
      urgency: 'high',
    },
    '婴幼儿': {
      impact: '3岁以下宝宝可能减税',
      change: '婴幼儿照护可享个税专项扣除',
      action: '个税APP → 专项附加扣除 → 婴幼儿照护 → 填报',
      money: '具体扣除标准请查看政策原文',
      urgency: 'high',
    },
    '住房': {
      impact: '住房相关税费可能有变化',
      change: '住房相关的税收政策有调整',
      action: '看自己是否符合住房税收优惠条件',
      money: '看具体政策',
      urgency: 'medium',
    },
    'default': {
      impact: '可能影响你的税负',
      change: '税务政策有更新，可能影响你要交的税',
      action: '了解政策详情，看自己是否受影响',
      money: '待确认具体影响',
      urgency: 'medium',
    },
  },
  'social-insurance': {
    '社保': {
      impact: '社保缴费或待遇可能有变化',
      change: '五险一金缴纳标准或待遇有调整',
      action: '查社保APP看缴费基数是否变化',
      money: '到手工资可能增减',
      urgency: 'high',
    },
    '养老金': {
      impact: '退休后拿的钱可能有变化',
      change: '养老金计发办法或标准有调整',
      action: '查社保APP核算未来养老金变化',
      money: '养老金金额可能调整',
      urgency: 'high',
    },
    '医保': {
      impact: '看病报销可能有变化',
      change: '医保报销比例或范围有调整',
      action: '下次就医时注意报销变化，查医保APP',
      money: '看病自付部分可能增减',
      urgency: 'high',
    },
    '公积金': {
      impact: '公积金贷款或缴存可能有变化',
      change: '公积金缴存比例或贷款政策有变',
      action: '查公积金APP看贷款额度是否受影响',
      money: '月供可能变化',
      urgency: 'medium',
    },
    '缴费': {
      impact: '每月扣的社保费可能有变化',
      change: '社保缴费基数调整，每月扣的钱可能增减',
      action: '查工资条确认扣费变化',
      money: '缴费金额可能调整',
      urgency: 'high',
    },
    '退休': {
      impact: '退休时间或待遇可能有变化',
      change: '退休条件或待遇标准有变化',
      action: '确认自己的退休时间是否受影响',
      money: '退休金可能变化',
      urgency: 'high',
    },
    '失业': {
      impact: '失业能拿的钱可能有变化',
      change: '失业保险金或申领条件有调整',
      action: '了解失业保险最新标准',
      money: '失业金标准可能变化',
      urgency: 'medium',
    },
    '工伤': {
      impact: '工伤赔偿标准可能有变化',
      change: '工伤认定或赔偿标准有变化',
      action: '了解工伤保障新规定',
      money: '赔偿金额可能变化',
      urgency: 'medium',
    },
    'default': {
      impact: '社保权益可能有变化',
      change: '社保政策有更新，可能影响你的权益',
      action: '了解政策详情，确认自己权益',
      money: '待确认具体影响',
      urgency: 'medium',
    },
  },
  'pension': {
    '养老金': {
      impact: '退休后每月拿的钱可能有变化',
      change: '养老金计发办法或发放标准有调整',
      action: '查社保APP核算养老金变化',
      money: '每月养老金可能增减',
      urgency: 'high',
    },
    '退休': {
      impact: '退休条件或时间可能有变化',
      change: '退休年龄或条件有调整',
      action: '确认自己的退休时间是否受影响',
      money: '退休金领取时间可能变化',
      urgency: 'high',
    },
    '调整': {
      impact: '养老金标准有调整',
      change: '养老金发放标准或计算方式有变化',
      action: '关注养老金调整通知，核算变化',
      money: '养老金可能增减',
      urgency: 'high',
    },
    '提高': {
      impact: '养老金可能涨了',
      change: '养老金发放标准提高了',
      action: '查社保APP确认新的养老金金额',
      money: '每月可能多拿钱',
      urgency: 'high',
    },
    '补贴': {
      impact: '养老补贴有变化',
      change: '养老相关补贴标准有调整',
      action: '了解补贴申请条件和标准',
      money: '可能多拿补贴',
      urgency: 'medium',
    },
    'default': {
      impact: '养老金相关权益可能有变化',
      change: '养老政策有更新，可能影响你的养老待遇',
      action: '了解政策详情，确认自己权益',
      money: '待确认具体影响',
      urgency: 'medium',
    },
  },
  'child': {
    '教育': {
      impact: '孩子上学政策可能有变化',
      change: '子女教育相关政策有调整',
      action: '了解新政策对孩子入学升学的影响',
      money: '教育支出可能增减',
      urgency: 'high',
    },
    '扣除': {
      impact: '养孩子可能减税了',
      change: '子女教育专项扣除标准有调整',
      action: '个税APP → 专项附加扣除 → 子女教育 → 更新',
      money: '具体扣除标准请查看政策原文',
      urgency: 'high',
    },
    '补贴': {
      impact: '养育补贴有变化',
      change: '子女养育相关补贴标准有调整',
      action: '了解补贴申请条件和发放标准',
      money: '可能多拿补贴',
      urgency: 'medium',
    },
    '婴幼儿': {
      impact: '3岁以下宝宝有新政策',
      change: '婴幼儿照护相关政策有更新',
      action: '了解婴幼儿照护的新政策和补贴',
      money: '照护成本可能降低',
      urgency: 'high',
    },
    '入学': {
      impact: '孩子入学政策可能有变化',
      change: '入学条件或学区划分有调整',
      action: '关注当地教育局通知，确认入学条件',
      money: '学区房或择校费可能受影响',
      urgency: 'high',
    },
    'default': {
      impact: '子女相关权益可能有变化',
      change: '子女教育或养育政策有更新',
      action: '了解政策详情，确认对孩子的影响',
      money: '待确认具体影响',
      urgency: 'medium',
    },
  },
  'elderly': {
    '赡养': {
      impact: '赡养老人可能减税',
      change: '赡养老人专项扣除标准有调整',
      action: '个税APP → 专项附加扣除 → 赡养老人 → 更新',
      money: '具体扣除标准请查看政策原文',
      urgency: 'high',
    },
    '扣除': {
      impact: '赡养老人扣除可能有变化',
      change: '赡养老人专项扣除标准有调整',
      action: '个税APP → 专项附加扣除 → 赡养老人 → 更新',
      money: '每月应税额可能变化',
      urgency: 'high',
    },
    '高龄': {
      impact: '高龄津贴有变化',
      change: '高龄津贴发放标准或年龄条件有调整',
      action: '了解当地高龄津贴新标准',
      money: '可能多拿津贴',
      urgency: 'medium',
    },
    '护理': {
      impact: '老人护理保障可能有变化',
      change: '长期护理保险或居家养老服务有更新',
      action: '了解护理保险新政策和申请条件',
      money: '护理费用可能降低',
      urgency: 'medium',
    },
    '补贴': {
      impact: '老人补贴有变化',
      change: '养老相关补贴标准有调整',
      action: '了解补贴申请条件和发放标准',
      money: '可能多拿补贴',
      urgency: 'medium',
    },
    'default': {
      impact: '赡养老人相关权益可能有变化',
      change: '赡养老人政策有更新，可能影响你的扣除或补贴',
      action: '了解政策详情，确认自己权益',
      money: '待确认具体影响',
      urgency: 'medium',
    },
  },
  'medical': {
    '报销': {
      impact: '看病报销可能有变化',
      change: '报销比例或范围有调整，看病自付可能增减',
      action: '下次就医时注意报销变化',
      money: '自付部分可能增减',
      urgency: 'high',
    },
    '门诊': {
      impact: '门诊看病报销可能有变化',
      change: '门诊报销比例或起付线有调整',
      action: '了解门诊报销新政策',
      money: '看门诊可能少花钱',
      urgency: 'high',
    },
    '住院': {
      impact: '住院报销可能有变化',
      change: '住院报销比例或起付线有调整',
      action: '了解住院报销新标准',
      money: '住院自付可能变化',
      urgency: 'medium',
    },
    '药品': {
      impact: '买药能报销的可能有变化',
      change: '医保药品目录有更新，有些药新纳入医保',
      action: '查看常用药是否纳入医保',
      money: '常用药可能更便宜',
      urgency: 'high',
    },
    '异地': {
      impact: '外地看病更方便了',
      change: '异地就医可以直接结算，不用先垫钱再报销',
      action: '在医保APP备案异地就医，享受直接结算',
      money: '不用垫付全额了',
      urgency: 'medium',
    },
    '大病': {
      impact: '大病保险可能有变化',
      change: '大病保险保障有提升',
      action: '了解大病保险新标准',
      money: '大病自付可能减少',
      urgency: 'medium',
    },
    'default': {
      impact: '看病报销可能有变化',
      change: '医保政策有更新，可能影响你看病报销',
      action: '了解政策详情，关注报销变化',
      money: '待确认具体影响',
      urgency: 'medium',
    },
  },
  'housing': {
    '公积金': {
      impact: '公积金贷款或缴存可能有变化',
      change: '公积金贷款额度或利率有变化',
      action: '查公积金APP看贷款额度是否变化',
      money: '月供可能增减',
      urgency: 'high',
    },
    '租赁': {
      impact: '租房补贴可能变了',
      change: '租房补贴或保障有调整',
      action: '查看是否符合租房补贴条件',
      money: '可能每月多拿补贴',
      urgency: 'medium',
    },
    '保障': {
      impact: '保障房政策可能有变化',
      change: '保障性住房申请条件或配租有更新',
      action: '关注保障房申请时间和条件',
      money: '可能住上更便宜的房子',
      urgency: 'medium',
    },
    '补贴': {
      impact: '住房补贴可能有变化',
      change: '住房补贴标准有变化',
      action: '确认自己是否符合补贴条件',
      money: '可能多拿补贴',
      urgency: 'high',
    },
    '贷款': {
      impact: '房贷利率或首付可能有变化',
      change: '房贷利率或首付比例有调整',
      action: '咨询银行最新房贷政策',
      money: '月供可能变化',
      urgency: 'high',
    },
    'default': {
      impact: '住房成本可能变化',
      change: '住房政策有更新，可能影响你的住房开支',
      action: '了解政策详情，评估对自己影响',
      money: '待确认具体影响',
      urgency: 'medium',
    },
  },
  'gov-policy': {
    '调整': {
      impact: '相关标准有调整',
      change: '政策标准有调整，具体影响看调整方向',
      action: '关注具体调整方案和实施时间',
      money: '待确认具体影响',
      urgency: 'medium',
    },
    '提高': {
      impact: '待遇标准提高了',
      change: '相关待遇或标准提高了，你可能多拿钱',
      action: '确认自己是否能享受新标准',
      money: '可能多拿钱',
      urgency: 'high',
    },
    '降低': {
      impact: '费用或门槛降低了',
      change: '相关费用或门槛降低了，你可能少花钱',
      action: '确认自己是否受益',
      money: '可能少花钱',
      urgency: 'high',
    },
    '保障': {
      impact: '保障范围扩大了',
      change: '保障范围或力度有提升',
      action: '了解保障新政策，看自己是否被覆盖',
      money: '可能新增保障',
      urgency: 'medium',
    },
    'default': {
      impact: '可能跟你有关',
      change: '有新的政策出台，可能影响你的权益',
      action: '了解政策详情，判断是否影响自己',
      money: '待确认具体影响',
      urgency: 'low',
    },
  },
  'education': {
    '高考': {
      impact: '高考政策有变化',
      change: '高考相关规则有调整，影响考试和录取',
      action: '关注本省教育考试院通知',
      money: '升学路径可能变化',
      urgency: 'high',
    },
    '招生': {
      impact: '招生政策有变化',
      change: '招生计划或规则有调整',
      action: '关注目标学校招生简章变化',
      money: '录取机会可能变化',
      urgency: 'high',
    },
    '助学': {
      impact: '助学政策有变化',
      change: '助学贷款或资助标准有调整',
      action: '向学校资助中心咨询新标准',
      money: '贷款额度或利率可能变化',
      urgency: 'high',
    },
    '奖学金': {
      impact: '奖学金政策有变化',
      change: '奖学金评定标准或金额有调整',
      action: '向学校了解新评定标准',
      money: '奖学金额度可能变化',
      urgency: 'high',
    },
    '考研': {
      impact: '考研政策有变化',
      change: '研究生招生或考试规则有调整',
      action: '关注研招网和目标院校通知',
      money: '报考成本可能变化',
      urgency: 'high',
    },
    '学费': {
      impact: '学费标准有变化',
      change: '学费收费标准有调整',
      action: '确认新学费标准和减免条件',
      money: '学费支出可能增减',
      urgency: 'high',
    },
    '培训': {
      impact: '培训补贴有变化',
      change: '职业培训补贴或政策有调整',
      action: '了解培训补贴申请条件',
      money: '培训费用可能降低',
      urgency: 'medium',
    },
    '技能': {
      impact: '技能认证政策有变化',
      change: '职业技能评价或资格证政策有调整',
      action: '了解资格证考试新规定',
      money: '考证费用可能变化',
      urgency: 'medium',
    },
    'default': {
      impact: '教育政策有变化',
      change: '教育相关政策有更新，可能影响学业',
      action: '关注学校和教育部门通知',
      money: '教育支出可能变化',
      urgency: 'medium',
    },
  },
  'employment': {
    '就业见习': {
      impact: '见习补贴有变化',
      change: '就业见习政策或补贴有调整',
      action: '关注见习岗位发布和补贴申请',
      money: '见习期收入可能变化',
      urgency: 'medium',
    },
    '就业': {
      impact: '就业政策有变化',
      change: '就业扶持或保障政策有调整',
      action: '关注学校就业信息网和人社部门通知',
      money: '就业补贴可能变化',
      urgency: 'high',
    },
    '创业': {
      impact: '创业扶持有变化',
      change: '创业补贴或扶持政策有调整',
      action: '向当地人社部门咨询创业扶持',
      money: '创业补贴可能增加',
      urgency: 'high',
    },
    '见习': {
      impact: '见习补贴有变化',
      change: '就业见习政策或补贴有调整',
      action: '关注见习岗位发布和补贴申请',
      money: '见习期收入可能变化',
      urgency: 'medium',
    },
    '应届': {
      impact: '应届生政策有变化',
      change: '应届毕业生就业扶持有调整',
      action: '向学校就业指导中心咨询',
      money: '应届生补贴可能变化',
      urgency: 'high',
    },
    '补贴': {
      impact: '就业补贴有变化',
      change: '就业相关补贴标准有调整',
      action: '确认自己是否符合补贴条件',
      money: '可能多拿补贴',
      urgency: 'high',
    },
    '人才': {
      impact: '人才政策有变化',
      change: '人才引进或落户政策有调整',
      action: '了解人才引进新条件和待遇',
      money: '人才补贴可能变化',
      urgency: 'medium',
    },
    '培训': {
      impact: '就业培训有变化',
      change: '就业培训补贴或政策有调整',
      action: '了解培训报名和补贴申请方式',
      money: '培训费用可能降低',
      urgency: 'medium',
    },
    'default': {
      impact: '就业政策有变化',
      change: '就业相关政策有更新，可能影响求职',
      action: '关注人社部门和学校就业通知',
      money: '就业补贴可能变化',
      urgency: 'medium',
    },
  },
}

function findBestMatch(
  title: string,
  templates: Record<string, { impact: string; change: string; action: string; money: string; urgency: 'high' | 'medium' | 'low' }>
) {
  // 优先匹配更长的关键词（更精确）
  const entries = Object.entries(templates)
    .filter(([kw]) => kw !== 'default')
    .sort(([a], [b]) => b.length - a.length)

  for (const [keyword, template] of entries) {
    if (title.includes(keyword)) {
      return template
    }
  }
  return templates['default']
}

function simplifyTitle(title: string): string {
  let s = title
  s = s.replace(/关于/g, '')
  s = s.replace(/印发/g, '发布')
  s = s.replace(/的通知$/g, '')
  s = s.replace(/的公告$/g, '')
  s = s.replace(/的指导意见$/g, '意见')
  s = s.replace(/实施方案$/g, '方案')
  if (s.length > 22) s = s.substring(0, 22) + '...'
  return s
}

export function interpretPolicy(policy: ScrapedCoupon, persona: Persona): PolicyInterpretation {
  // 如果有AI解读，优先使用
  if (policy.aiInterpretation) {
    const ai = policy.aiInterpretation
    const personaId = persona.id
    return {
      plainTitle: simplifyTitle(policy.title),
      impactOnYou: ai.impactOnYou[personaId] || ai.impactOnYou['office-worker'],
      whatChanged: ai.summary,
      whatToDo: ai.whatToDo[personaId] || ai.whatToDo['office-worker'],
      urgency: ai.urgency,
      relatedPersona: persona,
      moneyImpact: ai.moneyImpact,
      disclaimer: '以上解读由AI生成，仅供参考，不构成法律或专业建议。具体政策内容以政府官方发布为准，如有疑问请咨询相关部门。',
    }
  }

  const title = policy.title
  const category = policy.category

  const db = IMPACT_DB[category] || IMPACT_DB['gov-policy']
  const match = findBestMatch(title, db)

  const personaKw = persona.keywords.find(kw => title.includes(kw))

  let impactOnYou = match.impact
  let whatChanged = match.change
  let whatToDo = match.action
  let moneyImpact = match.money

  if (persona.id === 'office-worker') {
    if (category === 'tax') {
      impactOnYou = match.impact
    } else if (category === 'social-insurance') {
      impactOnYou = `你的${match.impact}`
    } else if (category === 'housing') {
      impactOnYou = `住房开支：${match.impact}`
    } else if (category === 'medical') {
      impactOnYou = `看病花销：${match.impact}`
    }
    whatToDo = match.urgency === 'high' ? `⚠️ ${match.action}` : match.action
  } else if (persona.id === 'parent') {
    if (personaKw) {
      impactOnYou = `${personaKw}相关：${match.impact}`
    } else {
      impactOnYou = `家庭影响：${match.impact}`
    }
    whatChanged = `跟家里有关——${match.change}`
  } else if (persona.id === 'elderly') {
    impactOnYou = `您的${match.impact}`
    const actionPrefix = match.action.includes('了解') ? '了解' : match.action.includes('查') ? '查询' : '办理'
    whatToDo = `建议让子女帮忙${actionPrefix}，${match.action}`
  } else if (persona.id === 'student') {
    if (category === 'education') {
      impactOnYou = `学业影响：${match.impact}`
    } else if (category === 'employment') {
      impactOnYou = `求职影响：${match.impact}`
    } else if (category === 'tax') {
      impactOnYou = `家里交税有变化，间接影响生活费`
    } else if (category === 'gov-policy') {
      if (personaKw) {
        impactOnYou = `${personaKw}相关：${match.impact}`
      } else {
        impactOnYou = match.impact
      }
    } else {
      impactOnYou = match.impact
    }
  } else if (persona.id === 'freelancer') {
    if (category === 'social-insurance') {
      impactOnYou = `自己交的社保：${match.impact}`
    } else if (category === 'tax') {
      impactOnYou = `自己申报的税：${match.impact}`
    }
    whatToDo = `自行${match.action}`
  }

  return {
    plainTitle: simplifyTitle(title),
    impactOnYou,
    whatChanged,
    whatToDo,
    urgency: match.urgency,
    relatedPersona: persona,
    moneyImpact,
    disclaimer: '以上解读基于政策标题自动推断，仅供参考，不构成法律或专业建议。具体政策内容以政府官方发布为准，如有疑问请咨询相关部门。',
  }
}

export function filterPoliciesForPersona(policies: ScrapedCoupon[], persona: Persona): ScrapedCoupon[] {
  return policies.filter(policy => {
    const categoryMatch = persona.categories.includes(policy.category)
    const keywordMatch = persona.keywords.some(kw => policy.title.includes(kw))
    const tagMatch = policy.tags.some(tag => persona.keywords.some(kw => tag.includes(kw) || kw.includes(tag)))
    return categoryMatch || keywordMatch || tagMatch
  })
}

export function sortPoliciesByRelevance(policies: ScrapedCoupon[], persona: Persona): ScrapedCoupon[] {
  return [...policies].sort((a, b) => {
    const scoreA = getRelevanceScore(a, persona)
    const scoreB = getRelevanceScore(b, persona)
    return scoreB - scoreA
  })
}

function getRelevanceScore(policy: ScrapedCoupon, persona: Persona): number {
  let score = 0
  if (persona.categories.includes(policy.category)) score += 10
  for (const kw of persona.keywords) {
    if (policy.title.includes(kw)) score += 5
  }
  if (policy.isHot) score += 3
  if (policy.isNew) score += 2
  return score
}
