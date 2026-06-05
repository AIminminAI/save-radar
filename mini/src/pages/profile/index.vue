<template>
  <view class="page">
    <!-- 头部 -->
    <view class="header" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="header-info">
        <view class="header-avatar">
          <text class="avatar-icon">{{ currentPersona.icon }}</text>
        </view>
        <view class="header-text">
          <text class="header-name">{{ currentPersona.name }}</text>
          <text class="header-desc">{{ currentPersona.description }}</text>
          <text class="header-fav">{{ store.state.favorites.length }} 收藏</text>
        </view>
      </view>

      <view class="header-stats">
        <view class="stat-item">
          <text class="stat-icon">❤️</text>
          <text class="stat-num">{{ store.state.favorites.length }}</text>
          <text class="stat-label">收藏</text>
        </view>
        <view class="stat-item">
          <text class="stat-icon">💰</text>
          <text class="stat-num">{{ store.state.shareCount }}</text>
          <text class="stat-label">分享</text>
        </view>
        <view class="stat-item">
          <text class="stat-icon">🛡️</text>
          <text class="stat-num">{{ store.state.policies.length }}</text>
          <text class="stat-label">政策数据</text>
        </view>
      </view>
    </view>

    <view class="content">
      <!-- 画像选择 -->
      <view class="card">
        <view class="card-header">
          <text class="card-icon">👤</text>
          <text class="card-title">选择你的身份</text>
        </view>
        <text class="card-desc">我们会根据你的身份，只展示跟你有关的政策</text>
        <view class="persona-grid">
          <view
            v-for="p in personas"
            :key="p.id"
            class="persona-card"
            :class="{ 'persona-card-active': store.state.selectedPersona === p.id }"
            @tap="store.setPersona(p.id)"
          >
            <text class="persona-card-icon">{{ p.icon }}</text>
            <view class="persona-card-info">
              <text class="persona-card-name" :class="{ 'persona-card-name-active': store.state.selectedPersona === p.id }">
                {{ p.name }}
              </text>
              <text class="persona-card-areas" :class="{ 'persona-card-areas-active': store.state.selectedPersona === p.id }">
                {{ p.concernAreas.slice(0, 2).join('·') }}
              </text>
            </view>
          </view>
        </view>
      </view>

      <!-- 政策推送 -->
      <view class="card">
        <view class="card-header">
          <text class="card-icon">🔔</text>
          <text class="card-title">政策推送</text>
        </view>
        <text class="card-desc">每天自动推送跟你有关的新政策</text>

        <!-- 未订阅状态 -->
        <view v-if="!subscription.subscribed" class="subscribe-action">
          <view class="subscribe-btn" @tap="onSubscribe">
            <text class="subscribe-btn-text">开启推送</text>
          </view>
        </view>

        <!-- 已订阅状态 -->
        <view v-else class="subscribe-active">
          <view class="subscribe-status">
            <text class="subscribe-status-text">已开启 ✓</text>
          </view>
          <view class="freq-selector">
            <view
              class="freq-tag"
              :class="{ 'freq-tag-active': subscription.frequency === 'daily' }"
              @tap="setFrequency('daily')"
            >
              <text class="freq-tag-text" :class="{ 'freq-tag-text-active': subscription.frequency === 'daily' }">每天</text>
            </view>
            <view
              class="freq-tag"
              :class="{ 'freq-tag-active': subscription.frequency === 'weekly' }"
              @tap="setFrequency('weekly')"
            >
              <text class="freq-tag-text" :class="{ 'freq-tag-text-active': subscription.frequency === 'weekly' }">每周</text>
            </view>
            <view
              class="freq-tag"
              :class="{ 'freq-tag-active': subscription.frequency === 'important-only' }"
              @tap="setFrequency('important-only')"
            >
              <text class="freq-tag-text" :class="{ 'freq-tag-text-active': subscription.frequency === 'important-only' }">仅重要</text>
            </view>
          </view>
        </view>

        <text class="subscribe-match">预计有 {{ matchedCount }} 条政策与你有关</text>
        <text class="subscribe-hint">推送需要授权订阅消息，你可以随时关闭</text>
      </view>

      <!-- 收藏列表 -->
      <view v-if="favoritePolicies.length > 0" class="card">
        <view class="card-header">
          <text class="card-icon">❤️</text>
          <text class="card-title">我的收藏</text>
        </view>
        <view class="fav-list">
          <view v-for="policy in favoritePolicies" :key="policy.id" class="fav-item">
            <view class="fav-icon-box" :style="{ backgroundColor: policy.carrier === 'policy' ? '#2B7A9B' : '#E4393C' }">
              <text class="fav-icon-text">{{ (policy.source || '').slice(0, 2) }}</text>
            </view>
            <view class="fav-info">
              <text class="fav-title">{{ policy.title }}</text>
              <text class="fav-date">{{ policy.source }}</text>
            </view>
            <view class="fav-remove" @tap="store.toggleFavorite(policy.id)">
              <text class="fav-remove-text">✕</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 排行榜 -->
      <view class="card">
        <view class="card-header">
          <text class="card-icon">🏆</text>
          <text class="card-title">热门政策排行</text>
        </view>
        <view class="rank-list">
          <view v-for="(policy, index) in hotPolicies" :key="policy.id" class="rank-item">
            <view class="rank-badge" :class="index < 3 ? 'rank-badge-top' : ''">
              <text class="rank-badge-text" :class="index < 3 ? 'rank-badge-text-top' : ''">{{ index + 1 }}</text>
            </view>
            <view class="rank-info">
              <text class="rank-title">{{ policy.title.length > 24 ? policy.title.substring(0, 24) + '...' : policy.title }}</text>
              <text class="rank-cat">{{ getCategoryName(policy.category) }}</text>
            </view>
          </view>
        </view>
      </view>

      <!-- 产品特色 -->
      <view class="card">
        <view class="card-header">
          <text class="card-icon">✨</text>
          <text class="card-title">产品特色</text>
        </view>
        <view class="feature-list">
          <view class="feature-item">
            <text class="feature-dot">✅</text>
            <text class="feature-text">政策来自政府官方网站，每条可验证原文</text>
          </view>
          <view class="feature-item">
            <text class="feature-dot">✅</text>
            <text class="feature-text">根据你的身份自动筛选相关政策</text>
          </view>
          <view class="feature-item">
            <text class="feature-dot">✅</text>
            <text class="feature-text">白话解读"可能影响你什么"+"你需要做什么"</text>
          </view>
          <view class="feature-item">
            <text class="feature-dot">✅</text>
            <text class="feature-text">定期更新政策数据</text>
          </view>
        </view>
      </view>

      <!-- 数据来源说明 -->
      <view class="card">
        <view class="card-header">
          <text class="card-icon">⏰</text>
          <text class="card-title">数据来源说明</text>
        </view>
        <view class="info-list">
          <view class="info-item">
            <text class="info-dot">🟢</text>
            <text class="info-text">所有政策来自政府官方网站定期抓取，每条附带原文链接可验证，绝不编造。政策解读基于标题自动推断，仅供参考，请以政策原文为准。</text>
          </view>
          <view class="info-item">
            <text class="info-dot">🟢</text>
            <text class="info-text">根据你的身份自动筛选相关政策，用白话解读"影响你什么"+"你需要做什么"。</text>
          </view>
        </view>
      </view>

      <!-- 法律信息 -->
      <view class="card">
        <view class="card-header">
          <text class="card-icon">📋</text>
          <text class="card-title">法律信息</text>
        </view>
        <view class="legal-list">
          <view class="legal-item" @tap="goToPrivacy">
            <text class="legal-text">隐私政策</text>
            <text class="legal-arrow">›</text>
          </view>
          <text class="disclaimer">本产品政策解读基于标题自动推断，仅供参考，不构成法律建议。请以政策原文为准。</text>
        </view>
      </view>
    </view>

    <view class="bottom-space"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useStore } from '@/store'
import { personas, getPersona } from '@/data/personas'
import { getSubscriptionConfig, getMatchedPolicyCount } from '@/services/subscriptionService'
import type { ScrapedCoupon } from '@/data/types'
import type { Persona } from '@/data/personas'
import couponsData from '@/static/data/coupons.json'

const store = useStore()

const statusBarHeight = ref(0)

const currentPersona = computed(() => getPersona(store.state.selectedPersona))

const favoritePolicies = computed(() => {
  return store.state.policies.filter(p => store.state.favorites.includes(p.id))
})

function isPolicyNew(policy: ScrapedCoupon): boolean {
  if (!policy.scrapedAt) return false
  const scrapedDate = new Date(policy.scrapedAt)
  const now = new Date()
  const diffDays = (now.getTime() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}

function getRelevanceScore(policy: ScrapedCoupon, persona: Persona): number {
  let score = 0
  if (persona.categories.includes(policy.category)) score += 10
  for (const kw of persona.keywords) {
    if (policy.title.includes(kw)) score += 5
  }
  if (policy.isHot) score += 3
  if (isPolicyNew(policy)) score += 2
  return score
}

const hotPolicies = computed(() => {
  const persona = currentPersona.value
  return [...store.state.policies]
    .sort((a, b) => {
      const scoreA = getRelevanceScore(a, persona)
      const scoreB = getRelevanceScore(b, persona)
      return scoreB - scoreA
    })
    .slice(0, 10)
})

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

function getCategoryName(category: string): string {
  return CATEGORY_NAMES[category] || category
}

function goToPrivacy() {
  uni.navigateTo({ url: '/pages/privacy/index' })
}

const subscription = computed(() => store.state.subscription)
const matchedCount = computed(() => getMatchedPolicyCount(store.state.policies, store.state.selectedPersona))

async function onSubscribe() {
  await store.subscribeToNotifications()
}

function setFrequency(freq: 'daily' | 'weekly' | 'important-only') {
  store.updateSubscription({ frequency: freq })
}

onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44

  if (store.state.policies.length === 0) {
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
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

/* 头部 */
.header {
  background: linear-gradient(135deg, #1A1A2E, #16213E);
  padding: 0 32rpx 48rpx;
}

.header-info {
  display: flex;
  align-items: center;
  gap: 24rpx;
  margin-bottom: 32rpx;
}

.header-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: linear-gradient(135deg, #FF6B35, #FF8F5E);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 24rpx rgba(255,107,53,0.3);
}

.avatar-icon {
  font-size: 56rpx;
}

.header-text {
  flex: 1;
}

.header-name {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  display: block;
}

.header-desc {
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
  display: block;
}

.header-fav {
  font-size: 36rpx;
  font-weight: 900;
  color: #00D68F;
  margin-top: 4rpx;
  display: block;
}

.header-stats {
  display: flex;
  gap: 16rpx;
}

.stat-item {
  flex: 1;
  background: rgba(255,255,255,0.1);
  border-radius: 16rpx;
  padding: 20rpx;
  text-align: center;
}

.stat-icon {
  font-size: 32rpx;
  display: block;
  margin-bottom: 8rpx;
}

.stat-num {
  font-size: 36rpx;
  font-weight: 900;
  color: #ffffff;
  display: block;
}

.stat-label {
  font-size: 20rpx;
  color: #999999;
  display: block;
}

/* 内容区 */
.content {
  padding: 0 32rpx;
  margin-top: -24rpx;
  position: relative;
  z-index: 2;
}

.card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.card-icon {
  font-size: 32rpx;
}

.card-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #333333;
}

.card-desc {
  font-size: 22rpx;
  color: #999999;
  margin-bottom: 20rpx;
  display: block;
}

/* 画像选择 */
.persona-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.persona-card {
  width: calc(50% - 8rpx);
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 20rpx;
  border-radius: 16rpx;
  background: #f8f8f8;
}

.persona-card-active {
  background: #1A1A2E;
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
}

.persona-card-icon {
  font-size: 40rpx;
}

.persona-card-info {
  flex: 1;
}

.persona-card-name {
  font-size: 24rpx;
  font-weight: 700;
  color: #333333;
  display: block;
}

.persona-card-name-active {
  color: #ffffff;
}

.persona-card-areas {
  font-size: 18rpx;
  color: #999999;
  margin-top: 4rpx;
  display: block;
}

.persona-card-areas-active {
  color: rgba(255,255,255,0.6);
}

/* 收藏列表 */
.fav-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.fav-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  padding: 12rpx 0;
}

.fav-icon-box {
  width: 56rpx;
  height: 56rpx;
  border-radius: 12rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.fav-icon-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

.fav-info {
  flex: 1;
  min-width: 0;
}

.fav-title {
  font-size: 24rpx;
  font-weight: 700;
  color: #333333;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  display: block;
}

.fav-date {
  font-size: 20rpx;
  color: #999999;
  display: block;
}

.fav-remove {
  width: 48rpx;
  height: 48rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fav-remove-text {
  font-size: 24rpx;
  color: #cccccc;
}

/* 排行榜 */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.rank-badge {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.rank-badge-top {
  background: #FF6B35;
}

.rank-badge-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #999999;
}

.rank-badge-text-top {
  color: #ffffff;
}

.rank-info {
  flex: 1;
  min-width: 0;
}

.rank-title {
  font-size: 22rpx;
  color: #333333;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.rank-cat {
  font-size: 18rpx;
  color: #999999;
  display: block;
  margin-top: 4rpx;
}

/* 产品特色 */
.feature-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.feature-dot {
  font-size: 20rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.feature-text {
  font-size: 22rpx;
  color: #999999;
  line-height: 1.5;
}

/* 数据来源说明 */
.info-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.info-dot {
  font-size: 20rpx;
  flex-shrink: 0;
  margin-top: 4rpx;
}

.info-text {
  font-size: 22rpx;
  color: #999999;
  line-height: 1.5;
}

/* 法律信息 */
.legal-list {
  display: flex;
  flex-direction: column;
  gap: 12rpx;
}

.legal-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 24rpx;
  background: #f8f8f8;
  border-radius: 16rpx;
}

.legal-text {
  font-size: 24rpx;
  color: #666666;
  font-weight: 500;
}

.legal-arrow {
  font-size: 28rpx;
  color: #cccccc;
}

.disclaimer {
  font-size: 20rpx;
  color: #cccccc;
  line-height: 1.5;
  margin-top: 8rpx;
  display: block;
}

/* 政策推送 */
.subscribe-action {
  margin-top: 16rpx;
}

.subscribe-btn {
  background: linear-gradient(135deg, #FF6B35, #FF8C00);
  border-radius: 40rpx;
  padding: 16rpx 0;
  text-align: center;
}

.subscribe-btn-text {
  font-size: 26rpx;
  font-weight: 900;
  color: #ffffff;
}

.subscribe-active {
  margin-top: 16rpx;
}

.subscribe-status {
  margin-bottom: 16rpx;
}

.subscribe-status-text {
  font-size: 26rpx;
  font-weight: 700;
  color: #00D68F;
}

.freq-selector {
  display: flex;
  gap: 12rpx;
}

.freq-tag {
  flex: 1;
  padding: 12rpx 0;
  border-radius: 40rpx;
  background: #f8f8f8;
  text-align: center;
}

.freq-tag-active {
  background: #1A1A2E;
}

.freq-tag-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #999999;
}

.freq-tag-text-active {
  color: #ffffff;
}

.subscribe-match {
  font-size: 22rpx;
  color: #FF6B35;
  font-weight: 700;
  margin-top: 16rpx;
  display: block;
}

.subscribe-hint {
  font-size: 18rpx;
  color: #cccccc;
  margin-top: 8rpx;
  display: block;
}

.bottom-space {
  height: 200rpx;
}
</style>
