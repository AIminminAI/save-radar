export interface ABTestConfig {
  id: string
  name: string
  hypothesis: string
  targetPersonas: string[]
  variants: ABVariant[]
  metrics: ABMetric[]
  duration: string
  sampleSize: string
  trackingEvents: TrackingEvent[]
}

export interface ABVariant {
  id: string
  label: string
  description: string
  changes: string[]
}

export interface ABMetric {
  id: string
  name: string
  description: string
  target: string
  measurement: string
}

export interface TrackingEvent {
  event: string
  properties: string[]
}

export const AB_TEST_IMPACT_AREA: ABTestConfig = {
  id: 'ab-impact-area-v1',
  name: '"影响你"区域点击转化率与留存率 A/B测试',
  hypothesis: '将"影响你"区域放在卡片最醒目位置（A组）比传统标题优先布局（B组）能提升30%以上的点击转化率和20%以上的7日留存率',
  targetPersonas: ['office-worker', 'parent'],
  variants: [
    {
      id: 'A',
      label: '影响你优先（当前版本）',
      description: '卡片顶部先展示"影响你"区域（橙色/绿色醒目框），政策原文标题放最下方灰色小字',
      changes: [
        '卡片第一屏：🔶 影响你 → "到手工资变了"（大字加粗橙色）',
        '金钱影响：💰 "每月可能多拿几十到几百元"',
        '变了什么：灰色说明文字',
        '政策原文：最小最淡，需展开',
        '行动指引：深色底条，具体操作步骤',
      ],
    },
    {
      id: 'B',
      label: '标题优先（对照版本）',
      description: '卡片顶部先展示政策原文标题，"影响你"区域放下方次要位置',
      changes: [
        '卡片第一屏：政策原文标题（大字加粗）',
        '来源标签：人社部/税务总局',
        '影响你区域：小绿框，放标题下方',
        '金钱影响：无独立展示',
        '行动指引：普通文字，非底条',
      ],
    },
  ],
  metrics: [
    {
      id: 'm1',
      name: '卡片点击率（CTR）',
      description: '看到卡片后点击"展开详情"或"查看原文"的比例',
      target: 'A组比B组高30%+',
      measurement: '点击次数 / 卡片曝光次数 × 100%',
    },
    {
      id: 'm2',
      name: '"影响你"区域停留时长',
      description: '用户在橙色/绿色影响区域上的视觉停留时间',
      target: 'A组平均停留 > 2秒',
      measurement: '元素进入视口到离开视口的时长',
    },
    {
      id: 'm3',
      name: '画像切换后首次点击时间',
      description: '切换画像后，用户多久点击第一条政策',
      target: 'A组 < 5秒，B组 < 10秒',
      measurement: '画像切换时间戳 → 首次点击时间戳',
    },
    {
      id: 'm4',
      name: '7日留存率',
      description: '首次访问后7天内再次访问的比例',
      target: 'A组比B组高20%+',
      measurement: '7日内回访用户数 / 首次访问用户数 × 100%',
    },
    {
      id: 'm5',
      name: '原文链接点击率',
      description: '点击"查看政策原文"外链的比例',
      target: 'A组比B组高15%+',
      measurement: '外链点击次数 / 展开详情次数 × 100%',
    },
    {
      id: 'm6',
      name: '行动指引执行率（自报）',
      description: '用户自报是否按指引操作了（如"打开个税APP"）',
      target: 'A组 > 40%',
      measurement: '自报执行人数 / 展开详情人数 × 100%',
    },
  ],
  duration: '14天（2周，覆盖完整工作日+周末周期）',
  sampleSize: '每组至少200用户（总计400+），按画像分层：上班族200+、宝妈200+',
  trackingEvents: [
    {
      event: 'card_impression',
      properties: ['policyId', 'personaId', 'variant', 'urgency', 'category'],
    },
    {
      event: 'card_click',
      properties: ['policyId', 'personaId', 'variant', 'clickTarget', 'timeToClick'],
    },
    {
      event: 'impact_area_view',
      properties: ['policyId', 'personaId', 'variant', 'urgency', 'viewDuration'],
    },
    {
      event: 'persona_switch',
      properties: ['fromPersona', 'toPersona', 'variant', 'timeToFirstClick'],
    },
    {
      event: 'sidebar_open',
      properties: ['variant', 'selectedPersona'],
    },
    {
      event: 'original_link_click',
      properties: ['policyId', 'personaId', 'variant', 'source'],
    },
    {
      event: 'guide_action',
      properties: ['policyId', 'personaId', 'variant', 'guideStep'],
    },
    {
      event: 'session_start',
      properties: ['personaId', 'variant', 'dayOfWeek', 'hourOfDay'],
    },
    {
      event: 'session_end',
      properties: ['personaId', 'variant', 'sessionDuration', 'cardsViewed'],
    },
  ],
}

export const AB_TEST_PERSONA_SIDEBAR: ABTestConfig = {
  id: 'ab-persona-sidebar-v1',
  name: '侧边栏"选角色"体验 vs 顶栏Tab筛选 A/B测试',
  hypothesis: '游戏化"选角色"侧边栏比传统Tab筛选能提升画像切换频率50%+和首次画像选择完成率20%+',
  targetPersonas: ['office-worker', 'parent'],
  variants: [
    {
      id: 'A',
      label: '游戏化侧边栏（当前版本）',
      description: '"你是谁？"侧边栏，渐变色角色卡片，口头禅，弹性动画',
      changes: [
        '侧边栏标题："你是谁？✨"',
        '渐变色角色卡片 + 口头禅',
        '匹配条数大数字',
        '弹性动画 cubic-bezier(0.34, 1.56, 0.64, 1)',
        '"我全都要看 · 不挑食"按钮',
      ],
    },
    {
      id: 'B',
      label: '传统Tab筛选（对照版本）',
      description: '顶部水平Tab栏切换画像，无侧边栏',
      changes: [
        '顶部Tab栏：💼上班族 | 👶宝妈 | 📚学生 | 👴老人 | 🎨自由职业',
        '无侧边栏',
        '无口头禅',
        '无匹配条数',
        '普通切换动画',
      ],
    },
  ],
  metrics: [
    {
      id: 'm1',
      name: '画像切换频率',
      description: '单次会话中切换画像的次数',
      target: 'A组比B组高50%+',
      measurement: '单次会话切换次数平均值',
    },
    {
      id: 'm2',
      name: '首次画像选择完成率',
      description: '打开页面后完成画像选择的比例',
      target: 'A组 > 90%',
      measurement: '完成选择人数 / 进入页面人数 × 100%',
    },
    {
      id: 'm3',
      name: '画像选择耗时',
      description: '从打开侧边栏/Tab到选择画像的时间',
      target: 'A组 < 3秒',
      measurement: '侧边栏打开 → 画像点击的时间差',
    },
    {
      id: 'm4',
      name: '3日回访率',
      description: '首次访问后3天内再次访问的比例',
      target: 'A组比B组高15%+',
      measurement: '3日内回访用户数 / 首次访问用户数 × 100%',
    },
  ],
  duration: '14天',
  sampleSize: '每组至少200用户（总计400+）',
  trackingEvents: [
    {
      event: 'persona_select',
      properties: ['personaId', 'variant', 'timeToSelect', 'switchCount'],
    },
    {
      event: 'sidebar_open',
      properties: ['variant', 'openDuration'],
    },
    {
      event: 'persona_switch',
      properties: ['fromPersona', 'toPersona', 'variant'],
    },
  ],
}

export const ALL_AB_TESTS = [AB_TEST_IMPACT_AREA, AB_TEST_PERSONA_SIDEBAR]
