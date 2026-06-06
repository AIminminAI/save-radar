<template>
  <view class="page">
    <!-- 深色渐变头部 -->
    <view class="header">
      <view class="header-top">
        <view>
          <text class="header-title">省钱雷达</text>
          <text class="header-subtitle">定期更新 · 只看跟你有关的</text>
        </view>
        <view class="header-avatar">
          <text class="avatar-icon">{{ currentPersona.icon }}</text>
        </view>
      </view>

      <!-- 雷达动画 -->
      <view class="radar-container">
        <view class="radar-ring radar-ring-1"></view>
        <view class="radar-ring radar-ring-2"></view>
        <view class="radar-ring radar-ring-3"></view>
        <view class="radar-dot"></view>
      </view>
    </view>

    <!-- 画像选择 -->
    <view class="persona-card">
      <view class="persona-header">
        <text class="persona-label">✨ 你是谁？选一个最像你的</text>
      </view>
      <scroll-view scroll-x class="persona-scroll">
        <view class="persona-list">
          <view
            v-for="p in personas"
            :key="p.id"
            class="persona-tag"
            :class="{ 'persona-tag-active': store.state.selectedPersona === p.id }"
            :style="store.state.selectedPersona === p.id ? { background: personaBgMap[p.id] } : {}"
            @tap="store.setPersona(p.id)"
          >
            <text class="persona-tag-text" :class="{ 'persona-tag-text-active': store.state.selectedPersona === p.id }">
              {{ p.icon }} {{ p.name }}
            </text>
          </view>
        </view>
      </scroll-view>
      <text class="persona-catchphrase">{{ currentPersona.catchphrase }}</text>
    </view>

    <!-- 补贴计算器入口 -->
    <view class="calculator-card" @tap="goToCalculator">
      <view class="calculator-info">
        <text class="calculator-title">🧮 补贴计算器</text>
        <text class="calculator-sub">看看你能领多少补贴</text>
      </view>
      <text class="calculator-arrow">›</text>
    </view>

    <!-- 每日挑战卡片 -->
    <view class="challenge-card" v-if="challengePolicy">
      <view class="challenge-header">
        <text class="challenge-badge">🎯 每日挑战</text>
        <text class="challenge-sub">3选1，看看这条政策跟你有关吗？</text>
      </view>
      <view class="challenge-content">
        <text class="challenge-title">{{ challengeInterp.plainTitle }}</text>
        <view class="challenge-impact" :class="challengeInterp.urgency === 'high' ? 'impact-high' : 'impact-low'">
          <text class="impact-label" :class="challengeInterp.urgency === 'high' ? 'label-high' : 'label-low'">
            {{ challengeInterp.urgency === 'high' ? '⚠️ 可能影响你' : '💰 跟你有关' }}
          </text>
          <text class="impact-text" :class="challengeInterp.urgency === 'high' ? 'text-high' : 'text-low'">
            {{ challengeInterp.impactOnYou }}
          </text>
        </view>
      </view>
      <view class="challenge-actions">
        <view class="challenge-btn challenge-btn-yes" @tap="onChallengeYes">
          <text class="challenge-btn-text-yes">跟我有关</text>
        </view>
        <view class="challenge-btn challenge-btn-no" @tap="onChallengeNo">
          <text class="challenge-btn-text-no">不太相关</text>
        </view>
      </view>
    </view>

    <!-- 额度提示 -->
    <view class="quota-card" :class="isQuotaExceeded ? 'quota-exceeded' : 'quota-ok'">
      <text class="quota-icon">{{ isQuotaExceeded ? '🔒' : '👁️' }}</text>
      <text class="quota-text" :class="isQuotaExceeded ? 'quota-text-exceeded' : 'quota-text-ok'">
        今日已看 {{ todayViewed }}/{{ totalLimitDisplay }} 条完整解读
      </text>
      <view v-if="isQuotaExceeded" class="quota-actions">
        <text class="quota-action" @tap="onWatchAd">📺 看广告解锁更多</text>
      </view>
      <text v-if="isPermanentlyUnlocked" class="quota-unlocked">✅ 已解锁全部</text>
    </view>

    <!-- 政策列表 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">{{ currentPersona.icon }} {{ currentPersona.name }}，这些跟你有关</text>
        <text class="section-more" @tap="goToPolicies">查看全部 ›</text>
      </view>

      <view v-if="store.state.loading && topPolicies.length === 0" class="loading-box">
        <text class="loading-text">正在获取政策数据...</text>
        <text class="loading-sub">数据来源于gov.cn等官方源</text>
      </view>

      <view v-else-if="topPolicies.length === 0" class="empty-box">
        <text class="empty-text">暂无与你相关的政策</text>
        <text class="empty-sub">试试切换其他画像</text>
      </view>

      <view v-else class="policy-list">
        <view
          v-for="policy in topPolicies"
          :key="policy.id"
          class="policy-card"
          @tap="onPolicyTap(policy)"
        >
          <view class="policy-meta">
            <text class="policy-cat">{{ getCategoryName(policy.category) }}</text>
            <text class="policy-dot">·</text>
            <text class="policy-source">{{ policy.source }}</text>
          </view>

          <view class="policy-impact-box" :class="getInterp(policy).urgency === 'high' ? 'impact-high' : 'impact-low'">
            <text class="impact-label" :class="getInterp(policy).urgency === 'high' ? 'label-high' : 'label-low'">
              {{ getInterp(policy).urgency === 'high' ? '⚠️ 可能影响你' : '💰 跟你有关' }}
            </text>
            <text class="impact-text" :class="getInterp(policy).urgency === 'high' ? 'text-high' : 'text-low'">
              {{ getInterp(policy).impactOnYou }}
            </text>
          </view>

          <text class="policy-desc">{{ getInterp(policy).whatChanged }}</text>

          <view class="policy-action-box">
            <text class="policy-action-arrow">›</text>
            <text class="policy-action-text">{{ getInterp(policy).whatToDo }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 政策分类入口 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">政策分类</text>
      </view>
      <view class="category-grid">
        <view
          v-for="cat in policyCategories"
          :key="cat.id"
          class="category-item"
          @tap="goToPolicies"
        >
          <text class="category-icon">{{ cat.icon }}</text>
          <text class="category-name">{{ cat.name }}</text>
        </view>
      </view>
    </view>

    <!-- 全部政策入口 -->
    <view class="all-policies-card" @tap="goToPolicies">
      <view class="all-policies-info">
        <text class="all-policies-title">全部政策一览</text>
        <text class="all-policies-sub">共 {{ store.state.policies.length }} 条政策 · 按画像筛选</text>
      </view>
      <text class="all-policies-arrow">›</text>
    </view>

    <!-- 底部banner广告 -->
    <!-- TODO: 在微信后台创建广告位后填入unit-id，否则不显示广告 -->
    <view class="ad-container">
      <!-- #ifdef MP-WEIXIN -->
      <ad unit-id="" ad-intervals="30" ad-type="banner" binderror="onAdError" bindload="onAdLoad"></ad>
      <!-- #endif -->
    </view>

    <view class="bottom-space"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { useStore } from '@/store'
import { personas, getPersona } from '@/data/personas'
import { policyCategories } from '@/data/policies'
import { filterPoliciesForPersona, sortPoliciesByRelevance, interpretPolicy } from '@/utils/policyInterpreter'
import { canViewFullInterpretation, getTodayViewedCount, getTotalLimit, addAdUnlock } from '@/utils/accessControl'
import { shareToFriend, shareToTimeline } from '@/utils/share'
import { showRewardedAd } from '@/services/adService'
import type { ScrapedCoupon } from '@/data/types'
import type { PolicyInterpretation } from '@/utils/policyInterpreter'
import couponsData from '@/static/data/coupons.json'

const store = useStore()

const personaBgMap: Record<string, string> = {
  'office-worker': 'linear-gradient(135deg, #1A1A2E, #2D3561)',
  'parent': 'linear-gradient(135deg, #FF6B9D, #C44569)',
  'student': 'linear-gradient(135deg, #4ECDC4, #2C7873)',
  'elderly': 'linear-gradient(135deg, #F9A825, #E65100)',
  'freelancer': 'linear-gradient(135deg, #7C4DFF, #4A148C)',
}

const CATEGORY_NAMES: Record<string, string> = {
  'gov-policy': '国家政策',
  'medical': '看病报销',
  'tax': '交税扣税',
  'social-insurance': '社保公积金',
  'housing': '买房租房',
  'pension': '养老金',
  'child': '子女教育',
  'elderly': '赡养老人',
}

const currentPersona = computed(() => getPersona(store.state.selectedPersona))

const topPolicies = computed(() => {
  const filtered = filterPoliciesForPersona(store.state.policies, currentPersona.value)
  return sortPoliciesByRelevance(filtered, currentPersona.value).slice(0, 5)
})

const todayViewed = computed(() => getTodayViewedCount())
const totalLimitDisplay = computed(() => {
  const limit = getTotalLimit(store.state.shareCount)
  return limit === Infinity ? '∞' : String(limit)
})
const isQuotaExceeded = computed(() => {
  const limit = getTotalLimit(store.state.shareCount)
  return limit !== Infinity && todayViewed.value >= limit
})
const isPermanentlyUnlocked = computed(() => {
  return getTotalLimit(store.state.shareCount) === Infinity
})

// 每日挑战
const challengeIndex = ref(0)
const challengePolicy = computed(() => {
  const allPolicies = store.state.policies
  if (allPolicies.length === 0) return null
  const today = new Date()
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate()
  challengeIndex.value = seed % allPolicies.length
  return allPolicies[challengeIndex.value]
})
const challengeInterp = computed(() => {
  if (!challengePolicy.value) return {} as PolicyInterpretation
  return interpretPolicy(challengePolicy.value, currentPersona.value)
})

function getInterp(policy: ScrapedCoupon): PolicyInterpretation {
  return interpretPolicy(policy, currentPersona.value)
}

function getCategoryName(category: string): string {
  return CATEGORY_NAMES[category] || category
}

function onChallengeYes() {
  if (challengePolicy.value) {
    store.toggleFavorite(challengePolicy.value.id)
    uni.showToast({ title: '已收藏！', icon: 'success' })
  }
}

function onChallengeNo() {
  uni.showToast({ title: '已跳过', icon: 'none' })
}

function onPolicyTap(policy: ScrapedCoupon) {
  const canView = canViewFullInterpretation(policy.id, store.state.favorites, store.state.shareCount)
  store.addRecentlyViewed(policy.id)
  if (!canView) {
    uni.showModal({
      title: '额度已用完',
      content: '今日免费解读额度已用完，看广告可解锁更多',
      confirmText: '看广告',
      cancelText: '稍后再说',
      success: (res) => {
        if (res.confirm) {
          onWatchAd()
        }
      }
    })
    return
  }
  // 跳转政策详情
  uni.navigateTo({
    url: `/pages/policies/index?id=${policy.id}`
  })
}

async function onWatchAd() {
  const success = await showRewardedAd()
  if (success) {
    addAdUnlock()
    uni.showToast({ title: '解锁成功！', icon: 'success' })
  }
}

function goToPolicies() {
  uni.switchTab({ url: '/pages/policies/index' })
}

function goToCalculator() {
  uni.navigateTo({ url: '/pages/calculator/index' })
}

// 加载数据
async function loadPolicies() {
  store.setLoading(true)
  try {
    // 优先使用远程数据
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
      // 使用打包进来的本地数据
      store.setPolicies(couponsData as unknown as ScrapedCoupon[])
    }
  } catch {
    // 使用本地数据
    store.setPolicies(couponsData as unknown as ScrapedCoupon[])
  } finally {
    store.setLoading(false)
  }
}

onMounted(() => {
  loadPolicies()
})

// 分享
onShareAppMessage(() => {
  store.incrementShare()
  return shareToFriend('省钱雷达 - 看看哪些政策跟你有关')
})

onShareTimeline(() => {
  store.incrementShare()
  return shareToTimeline('省钱雷达 - 看看哪些政策跟你有关')
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 头部 */
.header {
  background: linear-gradient(180deg, #1A1A2E 0%, #1A1A2E 70%, #f5f5f5 100%);
  padding: 0 32rpx 80rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40rpx;
}

.header-title {
  font-size: 44rpx;
  font-weight: 900;
  color: #ffffff;
  display: block;
}

.header-subtitle {
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
  display: block;
}

.header-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255,255,255,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-icon {
  font-size: 40rpx;
}

/* 雷达动画 */
.radar-container {
  width: 200rpx;
  height: 200rpx;
  margin: 0 auto;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.radar-ring {
  position: absolute;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 107, 53, 0.3);
}

.radar-ring-1 {
  width: 200rpx;
  height: 200rpx;
  animation: radar-pulse 2s ease-out infinite;
}

.radar-ring-2 {
  width: 140rpx;
  height: 140rpx;
  animation: radar-pulse 2s ease-out infinite 0.5s;
}

.radar-ring-3 {
  width: 80rpx;
  height: 80rpx;
  animation: radar-pulse 2s ease-out infinite 1s;
}

.radar-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #FF6B35;
  position: relative;
  z-index: 1;
}

@keyframes radar-pulse {
  0% { opacity: 1; transform: scale(0.8); }
  100% { opacity: 0; transform: scale(1.2); }
}

/* 画像选择 */
.persona-card {
  margin: -40rpx 32rpx 0;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
  position: relative;
  z-index: 2;
}

.persona-header {
  margin-bottom: 16rpx;
}

.persona-label {
  font-size: 24rpx;
  font-weight: 900;
  color: #333333;
}

.persona-scroll {
  white-space: nowrap;
}

.persona-list {
  display: flex;
  gap: 12rpx;
  padding-bottom: 8rpx;
}

.persona-tag {
  flex-shrink: 0;
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  background: #f5f5f5;
}

.persona-tag-active {
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
}

.persona-tag-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #999999;
}

.persona-tag-text-active {
  color: #ffffff;
}

.persona-catchphrase {
  font-size: 20rpx;
  color: #cccccc;
  margin-top: 12rpx;
  display: block;
}

/* 补贴计算器入口 */
.calculator-card {
  margin: 24rpx 32rpx 0;
  background: linear-gradient(135deg, #FF6B35, #FF8C00);
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 8rpx 24rpx rgba(255,107,53,0.25);
}

.calculator-title {
  font-size: 30rpx;
  font-weight: 900;
  color: #ffffff;
  display: block;
}

.calculator-sub {
  font-size: 22rpx;
  color: rgba(255,255,255,0.7);
  margin-top: 8rpx;
  display: block;
}

.calculator-arrow {
  font-size: 44rpx;
  color: rgba(255,255,255,0.5);
}

/* 每日挑战 */
.challenge-card {
  margin: 24rpx 32rpx 0;
  background: #ffffff;
  border-radius: 24rpx;
  padding: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.challenge-header {
  margin-bottom: 16rpx;
}

.challenge-badge {
  font-size: 24rpx;
  font-weight: 900;
  color: #FF6B35;
}

.challenge-sub {
  font-size: 20rpx;
  color: #999999;
  display: block;
  margin-top: 4rpx;
}

.challenge-content {
  margin-bottom: 20rpx;
}

.challenge-title {
  font-size: 26rpx;
  font-weight: 700;
  color: #333333;
  margin-bottom: 16rpx;
  display: block;
}

.challenge-impact {
  border-radius: 16rpx;
  padding: 20rpx;
}

.impact-high {
  background: linear-gradient(135deg, #FFF5F0, #FFF0E8);
  border: 1rpx solid rgba(255,107,53,0.15);
}

.impact-low {
  background: #F0F9F4;
  border: 1rpx solid rgba(0,214,143,0.1);
}

.impact-label {
  font-size: 22rpx;
  font-weight: 900;
  display: block;
  margin-bottom: 8rpx;
}

.label-high { color: #FF6B35; }
.label-low { color: #00D68F; }

.impact-text {
  font-size: 24rpx;
  font-weight: 900;
  display: block;
  line-height: 1.4;
}

.text-high { color: #CC4400; }
.text-low { color: #2D6A4F; }

.challenge-actions {
  display: flex;
  gap: 16rpx;
}

.challenge-btn {
  flex: 1;
  padding: 16rpx 0;
  border-radius: 16rpx;
  text-align: center;
}

.challenge-btn-yes {
  background: #FF6B35;
}

.challenge-btn-no {
  background: #f5f5f5;
}

.challenge-btn-text-yes {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.challenge-btn-text-no {
  font-size: 24rpx;
  font-weight: 700;
  color: #999999;
}

/* 额度提示 */
.quota-card {
  margin: 24rpx 32rpx 0;
  border-radius: 24rpx;
  padding: 20rpx 24rpx;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.quota-ok {
  background: rgba(255,255,255,0.8);
  border: 1rpx solid rgba(0,214,143,0.2);
}

.quota-exceeded {
  background: #FFF5F0;
  border: 1rpx solid rgba(255,107,53,0.2);
}

.quota-icon {
  font-size: 28rpx;
  margin-right: 12rpx;
}

.quota-text {
  font-size: 24rpx;
  font-weight: 700;
}

.quota-text-ok { color: #666666; }
.quota-text-exceeded { color: #FF6B35; }

.quota-actions {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.quota-action {
  font-size: 20rpx;
  font-weight: 700;
  color: #FF6B35;
}

.quota-divider {
  font-size: 20rpx;
  color: #dddddd;
}

.quota-unlocked {
  margin-left: auto;
  font-size: 20rpx;
  font-weight: 700;
  color: #00D68F;
}

/* 政策列表 */
.section {
  margin: 32rpx 32rpx 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #333333;
}

.section-more {
  font-size: 24rpx;
  font-weight: 700;
  color: #FF6B35;
}

.policy-list {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.policy-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.policy-meta {
  display: flex;
  align-items: center;
  gap: 8rpx;
  margin-bottom: 16rpx;
}

.policy-cat {
  font-size: 20rpx;
  color: #999999;
  font-weight: 700;
}

.policy-dot {
  font-size: 20rpx;
  color: #dddddd;
}

.policy-source {
  font-size: 20rpx;
  color: #cccccc;
}

.policy-impact-box {
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 16rpx;
}

.policy-desc {
  font-size: 22rpx;
  color: #999999;
  line-height: 1.5;
  margin-bottom: 12rpx;
  display: block;
}

.policy-action-box {
  display: flex;
  align-items: center;
  gap: 12rpx;
  background: rgba(26,26,46,0.05);
  border-radius: 12rpx;
  padding: 16rpx 20rpx;
}

.policy-action-arrow {
  font-size: 28rpx;
  color: #1A1A2E;
  font-weight: 700;
}

.policy-action-text {
  font-size: 22rpx;
  color: #1A1A2E;
  font-weight: 700;
  flex: 1;
}

/* 分类网格 */
.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.category-item {
  width: calc(25% - 12rpx);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12rpx;
  padding: 24rpx 0;
  background: #ffffff;
  border-radius: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.category-icon {
  font-size: 40rpx;
}

.category-name {
  font-size: 20rpx;
  font-weight: 700;
  color: #666666;
}

/* 全部政策入口 */
.all-policies-card {
  margin: 32rpx 32rpx 0;
  background: linear-gradient(135deg, #2B7A9B, #1A5276);
  border-radius: 24rpx;
  padding: 32rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.all-policies-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
  display: block;
}

.all-policies-sub {
  font-size: 22rpx;
  color: rgba(255,255,255,0.6);
  margin-top: 8rpx;
  display: block;
}

.all-policies-arrow {
  font-size: 40rpx;
  color: rgba(255,255,255,0.5);
}

/* 加载和空状态 */
.loading-box, .empty-box {
  text-align: center;
  padding: 80rpx 0;
}

.loading-text, .empty-text {
  font-size: 28rpx;
  color: #999999;
  display: block;
}

.loading-sub, .empty-sub {
  font-size: 22rpx;
  color: #cccccc;
  margin-top: 8rpx;
  display: block;
}

.ad-container {
  position: fixed;
  bottom: 100rpx; /* above tab bar */
  left: 0;
  right: 0;
  background: #fff;
  padding: 10rpx 0;
  z-index: 10;
}

.bottom-space {
  height: 200rpx;
}
</style>
