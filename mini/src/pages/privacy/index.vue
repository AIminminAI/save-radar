<template>
  <view class="page">
    <view class="header">
      <text class="header-title">隐私政策</text>
      <text class="header-date">更新日期：2026年6月</text>
    </view>

    <view class="content">
      <view class="section">
        <text class="section-title">一、信息收集</text>
        <text class="section-text">我们仅收集您主动提供的画像选择和收藏数据，所有数据存储在本地设备上，不会上传至任何服务器。</text>
      </view>

      <view class="section">
        <text class="section-title">二、数据来源</text>
        <text class="section-text">所有政策数据来自政府官方网站公开信息，我们定期抓取并更新，确保数据的准确性和时效性。</text>
      </view>

      <view class="section">
        <text class="section-title">三、数据安全</text>
        <text class="section-text">您的个人数据仅存储在本地设备上，不会上传至任何服务器。我们不会收集、存储或传输您的任何个人身份信息。</text>
      </view>

      <view class="section">
        <text class="section-title">四、广告</text>
        <text class="section-text">我们使用微信小程序激励视频广告，广告由微信平台提供和管理。广告展示过程中，我们不会收集您的任何个人信息。</text>
      </view>

      <view class="section">
        <text class="section-title">五、分享</text>
        <text class="section-text">分享功能由微信平台提供，我们不会收集您的分享对象信息。分享行为完全出于用户自愿。</text>
      </view>

      <view class="section">
        <text class="section-title">六、政策解读</text>
        <text class="section-text">AI解读仅供参考，不构成法律建议。请以政策原文为准，如有疑问请咨询相关部门。</text>
      </view>

      <view class="section">
        <text class="section-title">七、联系我们</text>
        <text class="section-text">如有疑问请通过小程序反馈功能联系，我们将尽快回复。</text>
      </view>

      <view class="section">
        <text class="section-title">八、隐私政策更新</text>
        <text class="section-text">我们可能会不时更新本隐私政策，更新后将在本页面发布最新版本。继续使用本应用即表示您同意更新后的隐私政策。</text>
      </view>
    </view>

    <view class="bottom-space"></view>
  </view>
</template>

<script setup lang="ts">
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f5f5f5;
}

.header {
  background: linear-gradient(135deg, #1A1A2E, #16213E);
  padding: 48rpx 32rpx;
}

.header-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #ffffff;
  display: block;
}

.header-date {
  font-size: 22rpx;
  color: #999999;
  margin-top: 8rpx;
  display: block;
}

.content {
  padding: 24rpx 32rpx;
}

.section {
  background: #ffffff;
  border-radius: 24rpx;
  padding: 28rpx;
  margin-bottom: 24rpx;
  box-shadow: 0 4rpx 16rpx rgba(0,0,0,0.04);
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #333333;
  display: block;
  margin-bottom: 16rpx;
}

.section-text {
  font-size: 24rpx;
  color: #666666;
  line-height: 1.8;
  display: block;
}

.bottom-space {
  height: 100rpx;
}
</style>
