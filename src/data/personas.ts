export interface Persona {
  id: string
  name: string
  icon: string
  description: string
  catchphrase: string
  scene: string
  categories: string[]
  keywords: string[]
  concernAreas: string[]
}

export const personas: Persona[] = [
  {
    id: 'office-worker',
    name: '上班族',
    icon: '💼',
    description: '关注五险一金、个税、住房等与工作生活相关的政策',
    catchphrase: '打工人的钱袋子，一个都不能少',
    scene: '每月工资到账那一刻',
    categories: ['social-insurance', 'tax', 'housing'],
    keywords: ['社保', '公积金', '个税', '租房', '房贷', '医保', '缴费', '扣除', '工资', '劳动', '加班', '休假', '产假', '年假', '失业', '工伤'],
    concernAreas: ['五险一金缴纳', '个税专项扣除', '住房公积金贷款', '医保报销', '租房补贴'],
  },
  {
    id: 'parent',
    name: '宝妈/家长',
    icon: '👶',
    description: '关注子女教育、养育补贴、疫苗等与孩子成长相关的政策',
    catchphrase: '娃的事就是天大的事',
    scene: '半夜哄娃睡觉的时候',
    categories: ['medical', 'tax', 'social-insurance'],
    keywords: ['教育', '子女', '养育', '补贴', '入学', '疫苗', '婴幼儿', '托育', '幼儿园', '学区', '招生', '高考', '中考', '义务教育', '学前', '儿童', '母婴', '生育'],
    concernAreas: ['子女教育专项扣除', '婴幼儿照护', '疫苗免费接种', '入学政策', '生育津贴'],
  },
  {
    id: 'student',
    name: '学生/考生',
    icon: '📚',
    description: '关注升学、考试、助学贷款等与学业相关的政策',
    catchphrase: '读书改变命运，政策帮你省钱',
    scene: '填志愿选学校的时候',
    categories: ['tax', 'social-insurance'],
    keywords: ['高考', '中考', '招生', '助学', '奖学金', '贷款', '义务教育', '学费', '考试', '录取', '加分', '保送', '毕业', '就业'],
    concernAreas: ['高考改革政策', '助学贷款申请', '奖学金评定', '招生计划', '就业扶持'],
  },
  {
    id: 'elderly',
    name: '老年人',
    icon: '👴',
    description: '关注养老金、医疗、高龄补贴等与晚年生活相关的政策',
    catchphrase: '退休生活也要精打细算',
    scene: '每月查养老金到账的时候',
    categories: ['social-insurance', 'medical', 'housing'],
    keywords: ['养老金', '退休', '医保', '赡养', '高龄', '养老', '护理', '居家', '社区养老', '老年', '长寿', '津贴', '补贴', '保障'],
    concernAreas: ['养老金调整', '医保报销比例', '高龄津贴', '居家养老服务', '赡养老人扣除'],
  },
  {
    id: 'freelancer',
    name: '自由职业',
    icon: '🎨',
    description: '关注灵活就业社保、个税申报、创业扶持等政策',
    catchphrase: '自己当老板，政策自己找',
    scene: '每年自己申报个税的时候',
    categories: ['social-insurance', 'tax'],
    keywords: ['灵活就业', '社保', '个税', '创业', '自雇', '个体', '缴费', '补贴', '申报', '小微企业', '营业执照'],
    concernAreas: ['灵活就业社保缴纳', '个税自行申报', '创业补贴', '小微企业优惠', '医保参保'],
  },
]

export function getPersona(id: string): Persona {
  return personas.find(p => p.id === id) || personas[0]
}

export function matchPersonaForPolicy(policy: { title: string; category: string; tags: string[] }): Persona[] {
  const matched: Persona[] = []
  const text = policy.title.toLowerCase()

  for (const persona of personas) {
    const categoryMatch = persona.categories.includes(policy.category)
    const keywordMatch = persona.keywords.some(kw => text.includes(kw))
    const tagMatch = policy.tags.some(tag => persona.keywords.some(kw => tag.includes(kw)))

    if (categoryMatch || keywordMatch || tagMatch) {
      matched.push(persona)
    }
  }

  return matched.length > 0 ? matched : personas
}
