<template>
  <!-- 首次启动隐私政策弹窗 -->
  <view v-if="showPrivacyModal" class="privacy-modal-mask" @tap.stop>
    <view class="privacy-modal-content">
      <view class="privacy-modal-header">
        <text class="privacy-modal-title">用户隐私保护提示</text>
      </view>
      <scroll-view scroll-y class="privacy-modal-body">
        <text class="privacy-modal-text">感谢您使用省钱雷达！在使用前，请您仔细阅读并了解我们的隐私政策：</text>
        <text class="privacy-modal-text">1. 信息收集：我们仅收集您主动提供的画像选择和收藏数据，存储在本地设备上。</text>
        <text class="privacy-modal-text">2. 数据来源：所有政策数据来自政府官方网站公开信息。</text>
        <text class="privacy-modal-text">3. 数据安全：您的个人数据仅存储在本地，不会上传至任何服务器。</text>
        <text class="privacy-modal-text">4. 广告：我们使用微信小程序激励视频广告，广告由微信平台提供和管理。</text>
        <text class="privacy-modal-text">5. 分享：分享功能由微信平台提供，我们不会收集您的分享对象信息。</text>
        <text class="privacy-modal-text">6. 政策解读：AI解读仅供参考，不构成法律建议。</text>
        <text class="privacy-modal-text">7. 联系我们：如有疑问请通过小程序反馈功能联系。</text>
      </scroll-view>
      <view class="privacy-modal-actions">
        <view class="privacy-modal-btn privacy-modal-btn-reject" @tap="onRejectPrivacy">
          <text class="privacy-modal-btn-text-reject">拒绝</text>
        </view>
        <view class="privacy-modal-btn privacy-modal-btn-accept" @tap="onAcceptPrivacy">
          <text class="privacy-modal-btn-text-accept">同意</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app"
import { initAd } from "@/services/adService"

const showPrivacyModal = ref(false)

onLaunch(() => {
  console.log("App Launch")

  // 初始化微信云开发（可选，未配置时跳过）
  try {
    // @ts-expect-error wx.cloud
    if (typeof wx !== 'undefined' && wx.cloud) {
      // @ts-expect-error wx.cloud.init
      wx.cloud.init({
        env: 'cloud1-xxxx', // 运行 node scripts/setup-cloud.js 自动填入
        traceUser: true,
      })
      console.log('[Cloud] 云开发初始化成功')
    }
  } catch (e) {
    console.log('[Cloud] 云开发未配置，跳过（不影响基础功能）')
  }

  // 初始化广告（adUnitId 后续填写，空字符串时不初始化）
  const adUnitId = '' // 填写真实的广告位ID后即可启用
  if (adUnitId) {
    initAd(adUnitId)
  }

  // 检查是否首次启动，弹出隐私政策
  const privacyAccepted = uni.getStorageSync('privacy_accepted')
  if (!privacyAccepted) {
    showPrivacyModal.value = true
  }
})

onShow(() => {
  console.log("App Show")
})

onHide(() => {
  console.log("App Hide")
})

function onAcceptPrivacy() {
  uni.setStorageSync('privacy_accepted', 'true')
  showPrivacyModal.value = false
}

function onRejectPrivacy() {
  showPrivacyModal.value = false
  uni.showToast({ title: '拒绝隐私政策可能影响部分功能使用', icon: 'none' })
}
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.privacy-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.privacy-modal-content {
  width: 85%;
  max-height: 80vh;
  background: #ffffff;
  border-radius: 24rpx;
  overflow: hidden;
}

.privacy-modal-header {
  padding: 32rpx;
  text-align: center;
  border-bottom: 1rpx solid #f0f0f0;
}

.privacy-modal-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #333333;
}

.privacy-modal-body {
  padding: 24rpx 32rpx;
  max-height: 55vh;
}

.privacy-modal-text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.8;
  display: block;
  margin-bottom: 12rpx;
}

.privacy-modal-actions {
  display: flex;
  gap: 16rpx;
  padding: 24rpx 32rpx;
  border-top: 1rpx solid #f0f0f0;
}

.privacy-modal-btn {
  flex: 1;
  padding: 20rpx 0;
  border-radius: 16rpx;
  text-align: center;
}

.privacy-modal-btn-reject {
  background: #f5f5f5;
}

.privacy-modal-btn-accept {
  background: #FF6B35;
}

.privacy-modal-btn-text-reject {
  font-size: 28rpx;
  font-weight: 700;
  color: #999999;
}

.privacy-modal-btn-text-accept {
  font-size: 28rpx;
  font-weight: 700;
  color: #ffffff;
}
</style>
