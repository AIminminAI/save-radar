<template>
  <view class="page">
    <!-- 自定义导航栏 -->
    <view class="nav-bar" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="nav-content">
        <view class="nav-left">
          <text class="nav-title">民生政策雷达</text>
          <text class="nav-sub">{{ currentPersona.icon }} {{ currentPersona.name }} · {{ displayPolicies.length }}条</text>
        </view>
      </view>
    </view>

    <!-- 画像筛选标签 -->
    <scroll-view scroll-x class="persona-filter">
      <view class="persona-filter-list">
        <view
          v-for="p in personas"
          :key="p.id"
          class="filter-tag"
          :class="{ 'filter-tag-active': store.state.selectedPersona === p.id }"
          @tap="onSelectPersona(p.id)"
        >
          <text class="filter-tag-text" :class="{ 'filter-tag-text-active': store.state.selectedPersona === p.id }">
            {{ p.icon }} {{ p.name }}
          </text>
        </view>
        <view
          class="filter-tag"
          :class="{ 'filter-tag-active-all': !usePersonaFilter }"
          @tap="usePersonaFilter = false"
        >
          <text class="filter-tag-text" :class="{ 'filter-tag-text-active': !usePersonaFilter }">
            📰 全部
          </text>
        </view>
      </view>
    </scroll-view>

    <!-- 分类筛选 -->
    <scroll-view scroll-x class="category-filter">
      <view class="category-filter-list">
        <view
          v-for="cat in allCategories"
          :key="cat.id"
          class="cat-tag"
          :class="{ 'cat-tag-active': activeCategory === cat.id }"
          :style="activeCategory === cat.id ? { backgroundColor: cat.color } : {}"
          @tap="activeCategory = cat.id"
        >
          <text class="cat-tag-text" :class="{ 'cat-tag-text-active': activeCategory === cat.id }">
            {{ cat.icon }} {{ cat.name }}
          </text>
        </view>
      </view>
    </scroll-view>

    <!-- 画像提示条 -->
    <view v-if="usePersonaFilter && displayPolicies.length > 0" class="persona-banner" :style="{ background: personaBgMap[store.state.selectedPersona] }">
      <text class="persona-banner-icon">{{ currentPersona.icon }}</text>
      <text class="persona-banner-text">{{ currentPersona.catchphrase }}</text>
      <text class="persona-banner-count">{{ displayPolicies.length }}条</text>
    </view>

    <!-- 政策列表 -->
    <view class="policy-list">
      <view v-if="store.state.loading && displayPolicies.length === 0" class="loading-box">
        <text class="loading-text">正在获取政策数据...</text>
        <text class="loading-sub">数据来源于政府官方网站</text>
      </view>

      <view v-else-if="displayPolicies.length === 0" class="empty-box">
        <text class="empty-text">暂无与你相关的政策</text>
        <text class="empty-sub">试试切换画像或点击"全部"查看</text>
      </view>

      <view v-else>
        <view
          v-for="policy in displayPolicies"
          :key="policy.id"
          class="policy-card"
          @tap="onPolicyTap(policy)"
        >
          <view class="policy-meta">
            <view class="policy-cat-badge" :style="{ backgroundColor: getCategoryColor(policy.category) }">
              <text class="policy-cat-badge-text">{{ getCategoryIcon(policy.category) }} {{ getCategoryName(policy.category) }}</text>
            </view>
            <view v-if="isPolicyNew(policy)" class="policy-new-badge">
              <text class="policy-new-badge-text">新</text>
            </view>
            <text class="policy-source">{{ policy.source }}</text>
          </view>

          <view class="policy-impact-box" :class="getInterp(policy).urgency === 'high' ? 'impact-high' : 'impact-low'">
            <view class="impact-header">
              <text class="impact-label" :class="getInterp(policy).urgency === 'high' ? 'label-high' : 'label-low'">
                {{ getInterp(policy).urgency === 'high' ? '⚠️ 可能影响你' : '💰 跟你有关' }}
              </text>
            </view>
            <text class="impact-text" :class="getInterp(policy).urgency === 'high' ? 'text-high' : 'text-low'">
              {{ getInterp(policy).impactOnYou }}
            </text>
            <text v-if="getInterp(policy).moneyImpact && !getInterp(policy).moneyImpact.startsWith('待确认')" class="money-impact">
              💰 {{ getInterp(policy).moneyImpact }}
            </text>
          </view>

          <text class="policy-desc">{{ getInterp(policy).whatChanged }}</text>

          <text class="policy-original-title" @tap.stop="expandedId = expandedId === policy.id ? '' : policy.id">
            政策原文：{{ getInterp(policy).plainTitle }}
          </text>

          <view class="policy-action-box">
            <text class="policy-action-arrow">›</text>
            <text class="policy-action-text">{{ getInterp(policy).whatToDo }}</text>
          </view>

          <!-- 展开详情 -->
          <view v-if="expandedId === policy.id" class="policy-detail">
            <view class="detail-section">
              <text class="detail-label">政策原文标题</text>
              <text class="detail-content">{{ policy.title }}</text>
            </view>

            <view v-if="policy.guide.length > 0" class="detail-section detail-guide">
              <text class="detail-label detail-label-blue">操作指南</text>
              <view class="guide-list">
                <view v-for="(step, i) in policy.guide" :key="i" class="guide-item">
                  <view class="guide-step">
                    <text class="guide-step-text">{{ i + 1 }}</text>
                  </view>
                  <text class="guide-step-content">{{ step }}</text>
                </view>
              </view>
            </view>

            <view class="detail-meta">
              <text class="detail-meta-text">🏢 {{ policy.source }}</text>
            </view>

            <view class="detail-tags">
              <text v-for="tag in policy.tags" :key="tag" class="detail-tag" :style="{ color: getCategoryColor(policy.category), backgroundColor: getCategoryColor(policy.category) + '10' }">
                #{{ tag }}
              </text>
            </view>

            <view class="detail-btn" @tap.stop="onViewOriginal(policy)">
              <text class="detail-btn-text">查看政策原文</text>
            </view>

            <view class="detail-disclaimer">
              <text class="disclaimer-text">{{ getInterp(policy).disclaimer }}</text>
            </view>
            <view class="detail-source">
              <text class="source-text">数据来源：{{ policy.source }} · 更新于{{ formatDate(policy.scrapedAt) }}</text>
            </view>
          </view>

          <!-- 收藏按钮 -->
          <view v-if="expandedId !== policy.id" class="policy-footer">
            <view class="fav-btn" @tap.stop="store.toggleFavorite(policy.id)">
              <text class="fav-icon">{{ store.state.favorites.includes(policy.id) ? '❤️' : '🤍' }}</text>
              <text class="fav-text">{{ store.state.favorites.includes(policy.id) ? '已收藏' : '收藏' }}</text>
            </view>
            <view class="expand-btn" @tap.stop="expandedId = policy.id">
              <text class="expand-text">展开详情</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- 详情弹窗（门禁） -->
    <view v-if="showAccessModal" class="modal-mask" @tap="showAccessModal = false">
      <view class="modal-content" @tap.stop>
        <view class="modal-header">
          <text class="modal-icon">🔒</text>
          <text class="modal-title">今日免费额度已用完</text>
        </view>
        <text class="modal-desc">看广告即可解锁更多政策解读</text>
        <view class="modal-actions">
          <view class="modal-btn modal-btn-ad" @tap="onWatchAd">
            <text class="modal-btn-text-ad">📺 看广告解锁</text>
          </view>
        </view>
        <view class="modal-close" @tap="showAccessModal = false">
          <text class="modal-close-text">稍后再说</text>
        </view>
      </view>
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
import { canViewFullInterpretation, addAdUnlock, getAccessStatus } from '@/utils/accessControl'
import { shareToFriend, shareToTimeline } from '@/utils/share'
import { showRewardedAd } from '@/services/adService'
import type { ScrapedCoupon } from '@/data/types'
import type { PolicyInterpretation } from '@/utils/policyInterpreter'
import couponsData from '@/static/data/coupons.json'

const store = useStore()

const statusBarHeight = ref(0)
const activeCategory = ref('all')
const usePersonaFilter = ref(true)
const expandedId = ref('')
const showAccessModal = ref(false)

const personaBgMap: Record<string, string> = {
  'office-worker': 'linear-gradient(135deg, #1A1A2E, #2D3561)',
  'parent': 'linear-gradient(135deg, #FF6B9D, #C44569)',
  'student': 'linear-gradient(135deg, #4ECDC4, #2C7873)',
  'elderly': 'linear-gradient(135deg, #F9A825, #E65100)',
  'freelancer': 'linear-gradient(135deg, #7C4DFF, #4A148C)',
}

const CATEGORY_META: Record<string, { name: string; icon: string; color: string }> = {
  'gov-policy': { name: '国家政策', icon: '📋', color: '#1A1A2E' },
  'medical': { name: '看病报销', icon: '🏥', color: '#FF6B35' },
  'tax': { name: '交税扣税', icon: '💰', color: '#E4393C' },
  'social-insurance': { name: '社保公积金', icon: '🛡️', color: '#2B7A9B' },
  'housing': { name: '买房租房', icon: '🏠', color: '#00D68F' },
  'pension': { name: '养老金', icon: '👴', color: '#8B5CF6' },
  'child': { name: '子女教育', icon: '👶', color: '#FF8C00' },
  'elderly': { name: '赡养老人', icon: '🧓', color: '#8B5CF6' },
}

const allCategories = computed(() => [
  { id: 'all', name: '全部', icon: '📰', color: '#1A1A2E' },
  ...Object.entries(CATEGORY_META).map(([id, meta]) => ({ id, ...meta })),
])

const currentPersona = computed(() => getPersona(store.state.selectedPersona))

const displayPolicies = computed(() => {
  let result = activeCategory.value === 'all'
    ? store.state.policies
    : store.state.policies.filter(p => p.category === activeCategory.value)

  if (usePersonaFilter.value) {
    result = filterPoliciesForPersona(result, currentPersona.value)
    result = sortPoliciesByRelevance(result, currentPersona.value)
  }
  return result
})

function getInterp(policy: ScrapedCoupon): PolicyInterpretation {
  return interpretPolicy(policy, currentPersona.value)
}

function isPolicyNew(policy: ScrapedCoupon): boolean {
  if (!policy.scrapedAt) return false
  const scrapedDate = new Date(policy.scrapedAt)
  const now = new Date()
  const diffDays = (now.getTime() - scrapedDate.getTime()) / (1000 * 60 * 60 * 24)
  return diffDays <= 7
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '未知'
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}月${d.getDate()}日`
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

function onSelectPersona(id: string) {
  store.setPersona(id)
  usePersonaFilter.value = true
}

function onPolicyTap(policy: ScrapedCoupon) {
  const canView = canViewFullInterpretation(policy.id, store.state.favorites, store.state.shareCount)
  store.addRecentlyViewed(policy.id)
  if (!canView) {
    showAccessModal.value = true
    return
  }
  expandedId.value = expandedId.value === policy.id ? '' : policy.id
}

function onViewOriginal(policy: ScrapedCoupon) {
  // 微信小程序中复制链接或提示
  uni.setClipboardData({
    data: policy.claimUrl,
    success: () => {
      uni.showToast({ title: '链接已复制，可在浏览器打开', icon: 'none' })
    }
  })
}

async function onWatchAd() {
  const success = await showRewardedAd()
  if (success) {
    addAdUnlock()
    showAccessModal.value = false
    uni.showToast({ title: '解锁成功！', icon: 'success' })
  }
}

onMounted(async () => {
  const sysInfo = uni.getSystemInfoSync()
  statusBarHeight.value = sysInfo.statusBarHeight || 44

  // 如果 store 中没有数据则加载
  if (store.state.policies.length === 0) {
    store.setLoading(true)
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
    store.setLoading(false)
  }
})

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

/* 导航栏 */
.nav-bar {
  background: #ffffff;
}

.nav-content {
  padding: 16rpx 32rpx;
}

.nav-title {
  font-size: 40rpx;
  font-weight: 900;
  color: #333333;
  display: block;
}

.nav-sub {
  font-size: 22rpx;
  color: #999999;
  margin-top: 4rpx;
  display: block;
}

/* 画像筛选 */
.persona-filter {
  white-space: nowrap;
  background: #ffffff;
  padding: 0 32rpx 16rpx;
}

.persona-filter-list {
  display: flex;
  gap: 12rpx;
}

.filter-tag {
  flex-shrink: 0;
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  background: #f5f5f5;
}

.filter-tag-active {
  background: #1A1A2E;
}

.filter-tag-active-all {
  background: #FF6B35;
}

.filter-tag-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #999999;
}

.filter-tag-text-active {
  color: #ffffff;
}

/* 分类筛选 */
.category-filter {
  white-space: nowrap;
  background: #ffffff;
  padding: 0 32rpx 20rpx;
}

.category-filter-list {
  display: flex;
  gap: 12rpx;
}

.cat-tag {
  flex-shrink: 0;
  padding: 12rpx 24rpx;
  border-radius: 40rpx;
  background: #f5f5f5;
}

.cat-tag-active {
  box-shadow: 0 4rpx 12rpx rgba(0,0,0,0.15);
}

.cat-tag-text {
  font-size: 22rpx;
  font-weight: 700;
  color: #999999;
}

.cat-tag-text-active {
  color: #ffffff;
}

/* 画像提示条 */
.persona-banner {
  margin: 16rpx 32rpx;
  border-radius: 16rpx;
  padding: 16rpx 24rpx;
  display: flex;
  align-items: center;
  gap: 12rpx;
}

.persona-banner-icon {
  font-size: 36rpx;
}

.persona-banner-text {
  flex: 1;
  font-size: 22rpx;
  color: rgba(255,255,255,0.8);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.persona-banner-count {
  font-size: 20rpx;
  color: rgba(255,255,255,0.5);
  flex-shrink: 0;
}

/* 政策列表 */
.policy-list {
  padding: 16rpx 32rpx;
}

.policy-card {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.policy-meta {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.policy-cat-badge {
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.policy-cat-badge-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

.policy-new-badge {
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
  background: #00D68F;
}

.policy-new-badge-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #ffffff;
}

.policy-source {
  font-size: 20rpx;
  color: #cccccc;
  margin-left: auto;
}

/* 影响区域 */
.policy-impact-box {
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.impact-high {
  background: linear-gradient(135deg, #FFF5F0, #FFF0E8);
  border: 1rpx solid rgba(255,107,53,0.15);
}

.impact-low {
  background: #F0F9F4;
  border: 1rpx solid rgba(0,214,143,0.1);
}

.impact-header {
  margin-bottom: 8rpx;
}

.impact-label {
  font-size: 22rpx;
  font-weight: 900;
}

.label-high { color: #FF6B35; }
.label-low { color: #00D68F; }

.impact-text {
  font-size: 26rpx;
  font-weight: 900;
  display: block;
  line-height: 1.4;
}

.text-high { color: #CC4400; }
.text-low { color: #2D6A4F; }

.money-impact {
  font-size: 22rpx;
  color: #FF6B35;
  font-weight: 700;
  margin-top: 8rpx;
  display: block;
}

.policy-desc {
  font-size: 22rpx;
  color: #999999;
  line-height: 1.5;
  margin-bottom: 16rpx;
  display: block;
}

.policy-original-title {
  font-size: 22rpx;
  color: #cccccc;
  line-height: 1.4;
  margin-bottom: 16rpx;
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

/* 展开详情 */
.policy-detail {
  margin-top: 24rpx;
  padding-top: 24rpx;
  border-top: 1rpx solid #f0f0f0;
}

.detail-section {
  background: #f8f8f8;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
}

.detail-guide {
  background: #EBF5FF;
}

.detail-label {
  font-size: 20rpx;
  color: #999999;
  font-weight: 700;
  margin-bottom: 8rpx;
  display: block;
}

.detail-label-blue {
  color: #2B7A9B;
}

.detail-content {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.5;
}

.guide-list {
  display: flex;
  flex-direction: column;
  gap: 16rpx;
}

.guide-item {
  display: flex;
  align-items: flex-start;
  gap: 12rpx;
}

.guide-step {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  background: #DBEAFE;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.guide-step-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #2B7A9B;
}

.guide-step-content {
  font-size: 24rpx;
  color: #2B7A9B;
  line-height: 1.5;
  padding-top: 4rpx;
}

.detail-meta {
  margin-bottom: 16rpx;
}

.detail-meta-text {
  font-size: 20rpx;
  color: #cccccc;
}

.detail-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-bottom: 20rpx;
}

.detail-tag {
  font-size: 20rpx;
  font-weight: 500;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
}

.detail-btn {
  padding: 20rpx;
  border-radius: 16rpx;
  text-align: center;
  margin-bottom: 16rpx;
}

.detail-btn-text {
  font-size: 24rpx;
  font-weight: 700;
  color: #ffffff;
}

.detail-disclaimer {
  text-align: center;
}

.disclaimer-text {
  font-size: 18rpx;
  color: #cccccc;
}

.detail-source {
  margin-top: 4rpx;
}
.source-text {
  font-size: 18rpx;
  color: #cccccc;
}

/* 底部操作 */
.policy-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 16rpx;
}

.fav-btn {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.fav-icon {
  font-size: 28rpx;
}

.fav-text {
  font-size: 20rpx;
  color: #999999;
}

.expand-btn {
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  background: #f5f5f5;
}

.expand-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #999999;
}

/* 弹窗 */
.modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.modal-content {
  width: 100%;
  background: #ffffff;
  border-radius: 32rpx 32rpx 0 0;
  padding: 40rpx 32rpx;
  padding-bottom: calc(40rpx + env(safe-area-inset-bottom));
}

.modal-header {
  text-align: center;
  margin-bottom: 16rpx;
}

.modal-icon {
  font-size: 64rpx;
  display: block;
  margin-bottom: 16rpx;
}

.modal-title {
  font-size: 32rpx;
  font-weight: 900;
  color: #333333;
  display: block;
}

.modal-desc {
  font-size: 26rpx;
  color: #999999;
  text-align: center;
  margin-bottom: 32rpx;
  display: block;
}

.modal-actions {
  display: flex;
  gap: 16rpx;
  margin-bottom: 16rpx;
}

.modal-btn {
  flex: 1;
  padding: 24rpx 0;
  border-radius: 16rpx;
  text-align: center;
}

.modal-btn-ad {
  background: #FF6B35;
}

.modal-btn-text-ad {
  font-size: 26rpx;
  font-weight: 700;
  color: #ffffff;
}

.modal-close {
  text-align: center;
  padding: 20rpx 0;
}

.modal-close-text {
  font-size: 24rpx;
  color: #cccccc;
  font-weight: 700;
}

/* 加载和空状态 */
.loading-box, .empty-box {
  text-align: center;
  padding: 120rpx 0;
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

.bottom-space {
  height: 200rpx;
}
</style>
