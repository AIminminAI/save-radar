<template>
  <view class="page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="nav-left">
          <text class="nav-title">补贴计算器</text>
          <text class="nav-sub">看看你能领多少补贴</text>
        </view>
      </view>
    </view>

    <!-- 输入区域 -->
    <view class="input-section">
      <!-- 城市选择 -->
      <view class="input-group">
        <text class="input-label">📍 所在城市</text>
        <scroll-view scroll-x class="option-scroll">
          <view class="option-list">
            <view
              v-for="city in cities"
              :key="city"
              class="option-tag"
              :class="{ 'option-tag-active': selectedCity === city }"
              @tap="selectedCity = city"
            >
              <text class="option-tag-text" :class="{ 'option-tag-text-active': selectedCity === city }">{{ city }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 学历 -->
      <view class="input-group">
        <text class="input-label">🎓 学历</text>
        <scroll-view scroll-x class="option-scroll">
          <view class="option-list">
            <view
              v-for="edu in educations"
              :key="edu"
              class="option-tag"
              :class="{ 'option-tag-active': selectedEducation === edu }"
              @tap="selectedEducation = edu"
            >
              <text class="option-tag-text" :class="{ 'option-tag-text-active': selectedEducation === edu }">{{ edu }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 就业状态 -->
      <view class="input-group">
        <text class="input-label">💼 就业状态</text>
        <scroll-view scroll-x class="option-scroll">
          <view class="option-list">
            <view
              v-for="emp in employments"
              :key="emp"
              class="option-tag"
              :class="{ 'option-tag-active': selectedEmployment === emp }"
              @tap="selectedEmployment = emp"
            >
              <text class="option-tag-text" :class="{ 'option-tag-text-active': selectedEmployment === emp }">{{ emp }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 收入范围 -->
      <view class="input-group">
        <text class="input-label">💰 年收入范围</text>
        <scroll-view scroll-x class="option-scroll">
          <view class="option-list">
            <view
              v-for="inc in incomes"
              :key="inc"
              class="option-tag"
              :class="{ 'option-tag-active': selectedIncome === inc }"
              @tap="selectedIncome = inc"
            >
              <text class="option-tag-text" :class="{ 'option-tag-text-active': selectedIncome === inc }">{{ inc }}</text>
            </view>
          </view>
        </scroll-view>
      </view>

      <!-- 开始估算按钮 -->
      <view class="calc-btn" @tap="onCalculate">
        <text class="calc-btn-text">开始估算</text>
      </view>
    </view>

    <!-- 结果区域 -->
    <view v-if="hasCalculated" class="result-section">
      <!-- 汇总 -->
      <view class="result-summary">
        <text class="result-summary-text">根据您的条件，预计可享受</text>
        <text class="result-summary-count">{{ matchedPolicies.length }}</text>
        <text class="result-summary-text">项政策扶持</text>
      </view>

      <!-- 政策结果卡片 -->
      <view v-if="matchedPolicies.length === 0" class="empty-box">
        <text class="empty-text">暂无匹配的政策</text>
        <text class="empty-sub">试试调整筛选条件</text>
      </view>

      <view v-else>
        <view
          v-for="(policy, index) in displayedPolicies"
          :key="policy.id"
          class="result-card"
        >
          <view class="result-card-header">
            <view class="result-cat-badge" :style="{ backgroundColor: getCategoryColor(policy.category) }">
              <text class="result-cat-badge-text">{{ getCategoryIcon(policy.category) }} {{ getCategoryName(policy.category) }}</text>
            </view>
            <view v-if="getInterp(policy).urgency === 'high'" class="result-urgency-badge">
              <text class="result-urgency-text">高</text>
            </view>
            <view v-else class="result-urgency-badge result-urgency-medium">
              <text class="result-urgency-text result-urgency-text-medium">中</text>
            </view>
          </view>

          <text class="result-title">{{ getInterp(policy).plainTitle }}</text>

          <view class="result-impact-box" :class="getInterp(policy).urgency === 'high' ? 'impact-high' : 'impact-low'">
            <text class="result-impact-text" :class="getInterp(policy).urgency === 'high' ? 'text-high' : 'text-low'">
              {{ getInterp(policy).impactOnYou }}
            </text>
          </view>

          <view v-if="extractEstimatedAmount(getInterp(policy).moneyImpact)" class="result-amount">
            <text class="result-amount-label">{{ /^\d/.test(extractEstimatedAmount(getInterp(policy).moneyImpact)) ? '预估金额' : '影响说明' }}</text>
            <text class="result-amount-value">{{ extractEstimatedAmount(getInterp(policy).moneyImpact) }}</text>
          </view>

          <view class="result-action-box">
            <text class="result-action-arrow">›</text>
            <text class="result-action-text">{{ getInterp(policy).whatToDo }}</text>
          </view>
        </view>

        <!-- 解锁全部结果 -->
        <view v-if="!isUnlocked && matchedPolicies.length > 3" class="unlock-card" @tap="onUnlock">
          <view class="unlock-header">
            <text class="unlock-icon">🔒</text>
            <text class="unlock-title">解锁全部结果</text>
          </view>
          <text class="unlock-desc">9.9元查看全部匹配结果及申请指南</text>
          <view class="unlock-btn">
            <text class="unlock-btn-text">立即解锁</text>
          </view>
          <text class="unlock-terms">支付即表示同意《用户协议》和《隐私政策》</text>
        </view>

        <!-- 看广告解锁 -->
        <view v-if="!isUnlocked && matchedPolicies.length > 3" class="ad-unlock-btn" @tap="onUnlockByAd">
          <text class="ad-unlock-btn-text">看广告免费解锁</text>
        </view>
        <text v-if="!isUnlocked && matchedPolicies.length > 3" class="ad-unlock-hint">看一次广告可解锁全部结果24小时</text>

        <!-- 订阅推送提示 -->
        <view v-if="matchedPolicies.length > 0 && !subscription.subscribed" class="subscribe-card">
          <text class="subscribe-icon">🔔</text>
          <text class="subscribe-title">不想错过新补贴？</text>
          <text class="subscribe-desc">开启推送，有新政策自动提醒你</text>
          <view class="subscribe-btn" @tap="onSubscribeFromCalc">
            <text class="subscribe-btn-text">开启政策推送</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 免责声明 -->
    <view v-if="hasCalculated" class="disclaimer-section">
      <text class="disclaimer-text">以上估算基于政策标题匹配，实际补贴金额以当地政策为准。建议咨询当地人社部门确认。</text>
      <text class="disclaimer-source">数据来源：政府官方网站 · 每日自动更新</text>
    </view>

    <view class="bottom-space"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useStore } from '@/store'
import { getPersona } from '@/data/personas'
import type { Persona } from '@/data/personas'
import { filterPoliciesForPersona, sortPoliciesByRelevance, interpretPolicy } from '@/utils/policyInterpreter'
import { shareToFriend, shareToTimeline } from '@/utils/share'
import { requestPayment, PRODUCTS, isSubsidyUnlocked, savePurchase } from '@/services/paymentService'
import { initAd, showRewardedAd } from '@/services/adService'
import { getSubscriptionConfig } from '@/services/subscriptionService'
import type { ScrapedCoupon } from '@/data/types'
import type { PolicyInterpretation } from '@/utils/policyInterpreter'
import couponsData from '@/static/data/coupons.json'

const store = useStore()

const statusBarHeight = ref(0)
const hasCalculated = ref(false)

// TODO: 在微信后台创建激励视频广告位后填入
const REWARDED_AD_UNIT_ID = '' // 填入激励视频广告位ID

function checkUnlockExpiry(): boolean {
  // Check payment unlock
  if (isSubsidyUnlocked()) return true
  // Check ad unlock (24 hour)
  const expiry = uni.getStorageSync('subsidy_unlock_expiry')
  if (expiry && new Date(expiry) > new Date()) return true
  return false
}

const isUnlocked = ref(checkUnlockExpiry())

const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '武汉', '南京', '重庆', '西安', '其他']
const educations = ['高中及以下', '大专', '本科', '硕士', '博士']
const employments = ['在校学生', '应届毕业生', '在职', '自由职业', '退休']
const incomes = ['5万以下', '5-10万', '10-20万', '20万以上']

const CITY_PROVINCE: Record<string, string> = {
  '北京': '北京', '上海': '上海', '广州': '广东', '深圳': '广东',
  '杭州': '浙江', '成都': '四川', '武汉': '湖北', '南京': '江苏',
  '重庆': '重庆', '西安': '陕西', '其他': '',
}

const EDUCATION_KEYWORDS: Record<string, string[]> = {
  '高中及以下': ['义务教育', '中职', '技校', '职业'],
  '大专': ['高职', '专科', '大专', '职业'],
  '本科': ['本科', '高校', '大学', '学士'],
  '硕士': ['研究生', '硕士', '博士', '学位'],
  '博士': ['研究生', '博士', '学位', '科研', '人才'],
}

const INCOME_CATEGORIES: Record<string, string[]> = {
  '5万以下': ['social-insurance', 'medical', 'pension', 'education'],
  '5-10万': ['social-insurance', 'tax', 'medical', 'housing'],
  '10-20万': ['tax', 'social-insurance', 'housing'],
  '20万以上': ['tax', 'housing'],
}

const selectedCity = ref('北京')
const selectedEducation = ref('本科')
const selectedEmployment = ref('在职')
const selectedIncome = ref('10-20万')

const CATEGORY_META: Record<string, { name: string; icon: string; color: string }> = {
  'gov-policy': { name: '国家政策', icon: '📋', color: '#1A1A2E' },
  'medical': { name: '看病报销', icon: '🏥', color: '#FF6B35' },
  'tax': { name: '交税扣税', icon: '💰', color: '#E4393C' },
  'social-insurance': { name: '社保公积金', icon: '🛡️', color: '#2B7A9B' },
  'housing': { name: '买房租房', icon: '🏠', color: '#00D68F' },
  'pension': { name: '养老金', icon: '👴', color: '#8B5CF6' },
  'child': { name: '子女教育', icon: '👶', color: '#FF8C00' },
  'elderly': { name: '赡养老人', icon: '🧓', color: '#8B5CF6' },
  'education': { name: '教育', icon: '📚', color: '#4ECDC4' },
  'employment': { name: '就业', icon: '💼', color: '#7C4DFF' },
}

function mapEmploymentToPersona(employment: string): string {
  const map: Record<string, string> = {
    '在校学生': 'student',
    '应届毕业生': 'student',
    '在职': 'office-worker',
    '自由职业': 'freelancer',
    '退休': 'elderly',
  }
  return map[employment] || 'office-worker'
}

function extractEstimatedAmount(text: string): string {
  if (!text) return ''
  const rangeMatch = text.match(/(\d+)[-~—](\d+)\s*元/)
  if (rangeMatch) {
    return `${rangeMatch[1]}-${rangeMatch[2]}元`
  }
  const singleMatch = text.match(/(\d+)\s*元/)
  if (singleMatch) {
    return `${singleMatch[1]}元`
  }
  return ''
}

function getBoostedRelevanceScore(
  policy: ScrapedCoupon,
  persona: Persona,
  education: string,
  income: string
): number {
  let score = 0
  if (persona.categories.includes(policy.category)) score += 10
  for (const kw of persona.keywords) {
    if (policy.title.includes(kw)) score += 5
  }
  if (policy.isHot) score += 3
  if (policy.isNew) score += 2

  // Education boost
  if (education && EDUCATION_KEYWORDS[education]) {
    const eduKws = EDUCATION_KEYWORDS[education]
    for (const kw of eduKws) {
      if (policy.title.includes(kw)) {
        score += 4
        break
      }
    }
  }

  // Income boost
  if (income && INCOME_CATEGORIES[income]) {
    const incomeCats = INCOME_CATEGORIES[income]
    if (incomeCats.includes(policy.category)) {
      score += 3
    }
  }

  return score
}

const matchedPolicies = computed(() => {
  if (!hasCalculated.value) return []
  const personaId = mapEmploymentToPersona(selectedEmployment.value)
  const persona = getPersona(personaId)
  let filtered = filterPoliciesForPersona(store.state.policies, persona)

  // City filtering: show national policies + province-matching policies
  const city = selectedCity.value
  if (city) {
    const province = CITY_PROVINCE[city] || ''
    filtered = filtered.filter((p: ScrapedCoupon) => {
      const title = p.title || ''
      const hasRegionPrefix = /【[^】]+】/.test(title)
      if (!hasRegionPrefix) return true
      if (province && title.includes(`【${province}】`)) return true
      return false
    })
  }

  // Sort with education/income boosts
  return [...filtered].sort((a: ScrapedCoupon, b: ScrapedCoupon) => {
    const scoreA = getBoostedRelevanceScore(a, persona, selectedEducation.value, selectedIncome.value)
    const scoreB = getBoostedRelevanceScore(b, persona, selectedEducation.value, selectedIncome.value)
    return scoreB - scoreA
  })
})

const displayedPolicies = computed(() => {
  if (isUnlocked.value) return matchedPolicies.value
  return matchedPolicies.value.slice(0, 3)
})

function getInterp(policy: ScrapedCoupon): PolicyInterpretation {
  const personaId = mapEmploymentToPersona(selectedEmployment.value)
  const persona = getPersona(personaId)
  return interpretPolicy(policy, persona)
}

function getCategoryName(category: string): string {
  return CATEGORY_META[category]?.name || category
}

function getCategoryIcon(category: string): string {
  return CATEGORY_META[category]?.icon || '📄'
}

function getCategoryColor(category: string): string {
  return CATEGORY_META[category]?.color || '#666666'
}

function onCalculate() {
  hasCalculated.value = true
}

async function onUnlock() {
  if (isUnlocked.value) return
  const result = await requestPayment(PRODUCTS.SUBSIDY_FULL)
  if (result.success && result.orderId) {
    savePurchase(PRODUCTS.SUBSIDY_FULL, result.orderId)
    isUnlocked.value = true
    store.unlockSubsidy(result.orderId)
    uni.showToast({ title: '解锁成功', icon: 'success' })
  } else {
    uni.showToast({ title: result.errorMsg || '支付失败', icon: 'none' })
  }
}

async function onUnlockByAd() {
  try {
    const rewarded = await showRewardedAd()
    if (rewarded) {
      // 看完广告，解锁24小时
      const unlockExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      uni.setStorageSync('subsidy_unlock_expiry', unlockExpiry)
      isUnlocked.value = true
      uni.showToast({ title: '已解锁全部结果', icon: 'success' })
    } else {
      uni.showToast({ title: '需要看完广告才能解锁', icon: 'none' })
    }
  } catch {
    uni.showToast({ title: '广告加载失败，请稍后重试', icon: 'none' })
  }
}

const subscription = computed(() => store.state.subscription)

async function onSubscribeFromCalc() {
  // 先保存用户输入到订阅配置
  store.updateSubscription({
    city: selectedCity.value,
    education: selectedEducation.value,
    employment: selectedEmployment.value,
  })
  await store.subscribeToNotifications()
}

async function loadPolicies() {
  if (store.state.policies.length > 0) return
  store.setLoading(true)
  try {
    const res = await new Promise<ScrapedCoupon[]>((resolve) => {
      uni.request({
        url: 'https://save-radar-opal.vercel.app/data/coupons.json',
        method: 'GET',
        timeout: 5000,
        success: (res) => {
          if (res.statusCode === 200 && Array.isArray(res.data)) {
            resolve(res.data as ScrapedCoupon[])
          } else {
            resolve([])
          }
        },
        fail: () => resolve([])
      })
    })
    if (res.length > 0) {
      store.setPolicies(res)
    } else {
      store.setPolicies(couponsData as unknown as ScrapedCoupon[])
    }
  } catch {
    store.setPolicies(couponsData as unknown as ScrapedCoupon[])
  } finally {
    store.setLoading(false)
  }
}

onMounted(() => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44
  // 初始化激励视频广告
  if (REWARDED_AD_UNIT_ID) {
    initAd(REWARDED_AD_UNIT_ID)
  }
  loadPolicies()
})

onShareAppMessage(() => {
  store.incrementShare()
  return shareToFriend('补贴计算器 - 看看你能领多少补贴')
})

onShareTimeline(() => {
  store.incrementShare()
  return shareToTimeline('补贴计算器 - 看看你能领多少补贴')
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 导航栏 */
.nav-bar {
  background: linear-gradient(135deg, #1A1A2E, #16213E);
}

.nav-content {
  padding: 16rpx 32rpx;
}

.nav-title {
  font-size: 40rpx;
  font-weight: 900;
  color: #ffffff;
  display: block;
}

.nav-sub {
  font-size: 22rpx;
  color: rgba(255,255,255,0.5);
  margin-top: 4rpx;
  display: block;
}

/* 输入区域 */
.input-section {
  background: linear-gradient(135deg, #1A1A2E, #16213E);
  padding: 0 32rpx 40rpx;
}

.input-group {
  margin-bottom: 24rpx;
}

.input-label {
  font-size: 24rpx;
  font-weight: 700;
  color: rgba(255,255,255,0.8);
  margin-bottom: 12rpx;
  display: block;
}

.option-scroll {
  white-space: nowrap;
}

.option-list {
  display: flex;
  gap: 12rpx;
}

.option-tag {
  flex-shrink: 0;
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  background: rgba(255,255,255,0.1);
}

.option-tag-active {
  background: #FF6B35;
  box-shadow: 0 4rpx 12rpx rgba(255,107,53,0.3);
}

.option-tag-text {
  font-size: 22rpx;
  font-weight: 700;
  color: rgba(255,255,255,0.6);
}

.option-tag-text-active {
  color: #ffffff;
}

.calc-btn {
  margin-top: 16rpx;
  background: linear-gradient(135deg, #FF6B35, #FF8C00);
  border-radius: 48rpx;
  padding: 24rpx 0;
  text-align: center;
  box-shadow: 0 8rpx 24rpx rgba(255,107,53,0.3);
}

.calc-btn-text {
  font-size: 30rpx;
  font-weight: 900;
  color: #ffffff;
}

/* 结果区域 */
.result-section {
  padding: 24rpx 32rpx 0;
}

.result-summary {
  display: flex;
  align-items: baseline;
  margin-bottom: 24rpx;
}

.result-summary-text {
  font-size: 26rpx;
  color: #666666;
  font-weight: 700;
}

.result-summary-count {
  font-size: 48rpx;
  font-weight: 900;
  color: #FF6B35;
  margin: 0 8rpx;
}

/* 结果卡片 */
.result-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.result-card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.result-cat-badge {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.result-cat-badge-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

.result-urgency-badge {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  background: #FF6B35;
}

.result-urgency-medium {
  background: #FFB800;
}

.result-urgency-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

.result-urgency-text-medium {
  color: #ffffff;
}

.result-title {
  font-size: 28rpx;
  font-weight: 900;
  color: #333333;
  margin-bottom: 16rpx;
  display: block;
  line-height: 1.4;
}

.result-impact-box {
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.impact-high {
  background: linear-gradient(135deg, #FFF5F0, #FFF0E8);
  border: 1rpx solid rgba(255,107,53,0.15);
}

.impact-low {
  background: #F0F9F4;
  border: 1rpx solid rgba(0,214,143,0.1);
}

.result-impact-text {
  font-size: 24rpx;
  font-weight: 700;
  display: block;
  line-height: 1.4;
}

.text-high { color: #CC4400; }
.text-low { color: #2D6A4F; }

.result-amount {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
  background: rgba(255,107,53,0.06);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.result-amount-label {
  font-size: 22rpx;
  color: #999999;
  font-weight: 700;
}

.result-amount-value {
  font-size: 28rpx;
  font-weight: 900;
  color: #FF6B35;
}

.result-action-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: rgba(26,26,46,0.05);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.result-action-arrow {
  font-size: 28rpx;
  color: #1A1A2E;
  font-weight: 700;
}

.result-action-text {
  font-size: 22rpx;
  color: #1A1A2E;
  font-weight: 700;
  flex: 1;
}

/* 解锁卡片 */
.unlock-card {
  background: linear-gradient(135deg, #2B7A9B, #1A5276);
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 24rpx;
}

.unlock-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 12rpx;
}

.unlock-icon {
  font-size: 32rpx;
}

.unlock-title {
  font-size: 30rpx;
  font-weight: 900;
  color: #ffffff;
}

.unlock-desc {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
  margin-bottom: 24rpx;
  display: block;
}

.unlock-btn {
  background: linear-gradient(135deg, #FF6B35, #FF8C00);
  border-radius: 40rpx;
  padding: 16rpx 0;
  text-align: center;
  margin-bottom: 16rpx;
}

.unlock-btn-text {
  font-size: 26rpx;
  font-weight: 900;
  color: #ffffff;
}

.unlock-terms {
  font-size: 18rpx;
  color: rgba(255,255,255,0.4);
  text-align: center;
  display: block;
}

/* 空状态 */
.empty-box {
  text-align: center;
  padding: 80rpx 0;
}

.empty-text {
  font-size: 28rpx;
  color: #999999;
  display: block;
}

.empty-sub {
  font-size: 22rpx;
  color: #cccccc;
  margin-top: 8rpx;
  display: block;
}

/* 免责声明 */
.disclaimer-section {
  padding: 32rpx;
  text-align: center;
}

.disclaimer-text {
  font-size: 20rpx;
  color: #cccccc;
  line-height: 1.6;
  display: block;
  margin-bottom: 8rpx;
}

.disclaimer-source {
  font-size: 18rpx;
  color: #dddddd;
  display: block;
}

/* 订阅推送卡片 */
.subscribe-card {
  background: linear-gradient(135deg, #1A1A2E, #16213E);
  border-radius: 24rpx;
  padding: 32rpx 28rpx;
  margin-bottom: 24rpx;
  text-align: center;
}

.subscribe-icon {
  font-size: 40rpx;
  display: block;
  margin-bottom: 12rpx;
}

.subscribe-title {
  font-size: 28rpx;
  font-weight: 900;
  color: #ffffff;
  display: block;
  margin-bottom: 8rpx;
}

.subscribe-desc {
  font-size: 22rpx;
  color: rgba(255,255,255,0.6);
  display: block;
  margin-bottom: 24rpx;
}

.subscribe-btn {
  background: linear-gradient(135deg, #FF6B35, #FF8C00);
  border-radius: 40rpx;
  padding: 16rpx 0;
  text-align: center;
  display: inline-block;
  padding-left: 48rpx;
  padding-right: 48rpx;
}

.subscribe-btn-text {
  font-size: 26rpx;
  font-weight: 900;
  color: #ffffff;
}

.ad-unlock-btn {
  margin-top: 12rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  border: 2rpx dashed #FF6B35;
  text-align: center;
}

.ad-unlock-btn-text {
  font-size: 26rpx;
  color: #FF6B35;
  font-weight: 600;
}

.ad-unlock-hint {
  font-size: 20rpx;
  color: #999;
  text-align: center;
  margin-top: 8rpx;
  display: block;
}

.bottom-space {
  height: 200rpx;
}
</style>
