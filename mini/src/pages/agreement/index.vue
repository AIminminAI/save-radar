<template>
  <view class="page">
    <view class="header">
      <text class="header-title">用户协议</text>
      <text class="header-date">更新日期：2026年6月5日</text>
    </view>

    <view class="content">
      <!-- 服务内容 -->
      <view class="section">
        <text class="section-title">一、服务内容</text>
        <text class="section-text">"省钱雷达"（以下简称"本应用"）是一款为用户提供补贴政策查询、匹配和解读服务的微信小程序。主要服务内容包括：</text>
        <text class="section-text">1. 政策雷达：展示和推送与用户画像匹配的补贴政策信息；</text>
        <text class="section-text">2. 补贴计算器：根据用户输入的条件（城市、学历、就业状态、收入范围），估算可享受的补贴政策及金额；</text>
        <text class="section-text">3. 政策解读：基于政策标题自动推断生成政策解读，帮助用户快速理解政策要点；</text>
        <text class="section-text">4. 收藏功能：允许用户收藏感兴趣的政策，方便后续查看。</text>
        <text class="section-text">本应用保留随时修改、中断或终止部分或全部服务的权利，无需对用户或任何第三方承担责任。</text>
      </view>

      <!-- 使用规范 -->
      <view class="section">
        <text class="section-title">二、使用规范</text>
        <text class="section-text">用户在使用本应用时，应遵守以下规范：</text>
        <text class="section-text">1. 遵守中华人民共和国相关法律法规；</text>
        <text class="section-text">2. 不得利用本应用从事任何违法违规活动；</text>
        <text class="section-text">3. 不得通过任何方式破坏或试图破坏本应用的正常运行；</text>
        <text class="section-text">4. 不得对本应用进行反编译、反汇编或其他逆向工程；</text>
        <text class="section-text">5. 不得将本应用的内容用于商业竞争或商业牟利目的；</text>
        <text class="section-text">6. 不得冒充他人或虚构身份使用本应用。</text>
        <text class="section-text">如用户违反上述规范，本应用有权终止向该用户提供服务。</text>
      </view>

      <!-- 付费服务条款 -->
      <view class="section">
        <text class="section-title">三、付费服务条款</text>
        <text class="section-text">本应用提供以下付费服务：</text>
        <text class="section-subtitle">1. 补贴计算器完整结果解锁（9.9元）</text>
        <text class="section-text">用户可免费查看补贴计算器的前3条匹配结果。支付9.9元后，可解锁查看全部匹配结果及申请指南。该购买为一次性购买，解锁后永久有效。</text>
        <text class="section-subtitle">2. 省钱雷达月卡（19.9元）</text>
        <text class="section-text">用户支付19.9元购买月卡后，30天内可无限次查看所有政策解读内容。月卡到期后需重新购买。</text>
        <text class="section-subtitle">退款政策</text>
        <text class="section-text">（1）因本应用基于虚拟内容服务，购买后不支持无理由退款。</text>
        <text class="section-text">（2）如因系统故障导致付费功能无法正常使用，用户可联系客服申请退款。经核实后，我们将在7个工作日内原路退回支付金额。</text>
        <text class="section-text">（3）退款后，对应的付费功能权限将被收回。</text>
        <text class="section-subtitle">支付方式</text>
        <text class="section-text">所有付费服务均通过微信支付完成交易，支付过程由微信支付平台保障安全。</text>
      </view>

      <!-- 知识产权 -->
      <view class="section">
        <text class="section-title">四、知识产权</text>
        <text class="section-text">1. 本应用的软件设计、界面布局、代码、图标、文案等均受中华人民共和国知识产权法律保护，归本应用所有。</text>
        <text class="section-text">2. 本应用展示的政策数据来自政府官方网站公开信息，政策原文的版权归原作者/发布机构所有。</text>
        <text class="section-text">3. 本应用生成的政策解读内容基于算法自动推断，仅供参考，不构成原创作品。</text>
        <text class="section-text">4. 未经本应用书面许可，任何人不得以任何方式复制、转载、传播本应用的任何内容。</text>
      </view>

      <!-- 免责声明 -->
      <view class="section">
        <text class="section-title">五、免责声明</text>
        <text class="section-text">1. 本应用展示的政策信息来自政府官方网站的公开数据，我们尽力确保数据的准确性和时效性，但不对数据的完整性、准确性作出保证。</text>
        <text class="section-text">2. 政策解读基于算法自动推断生成，仅供参考，不构成法律或专业建议。具体政策内容以政府官方发布为准，如有疑问请咨询相关部门或专业人士。</text>
        <text class="section-text">3. 补贴计算器的估算结果基于政策标题匹配，实际补贴金额以当地政策执行为准，我们不对估算结果的准确性承担责任。</text>
        <text class="section-text">4. 因不可抗力（包括但不限于自然灾害、政策变化、网络故障等）导致服务中断或数据丢失，我们不承担责任。</text>
        <text class="section-text">5. 用户因使用本应用而导致的任何直接或间接损失，我们不承担赔偿责任。</text>
      </view>

      <!-- 服务变更/终止 -->
      <view class="section">
        <text class="section-title">六、服务变更与终止</text>
        <text class="section-text">1. 本应用有权根据业务发展需要，随时变更、暂停或终止部分或全部服务，并将通过应用内通知等方式告知用户。</text>
        <text class="section-text">2. 如本应用终止运营，我们将提前30日通知用户，并对已购买付费服务的用户进行妥善处理（包括但不限于退款）。</text>
        <text class="section-text">3. 用户可随时停止使用本应用，删除小程序即可终止服务关系。</text>
      </view>

      <!-- 争议解决 -->
      <view class="section">
        <text class="section-title">七、争议解决</text>
        <text class="section-text">1. 本协议的订立、执行和解释均适用中华人民共和国法律。</text>
        <text class="section-text">2. 如双方就本协议内容或其执行发生任何争议，双方应尽力友好协商解决；协商不成时，任何一方均可向本应用所在地有管辖权的人民法院提起诉讼。</text>
        <text class="section-text">3. 本协议中任何条款无论因何种原因完全或部分无效或不具有执行力，该条款的其余部分及本协议的其他条款仍然有效，对双方具有约束力。</text>
      </view>

      <!-- 联系方式 -->
      <view class="section">
        <text class="section-title">八、联系方式</text>
        <text class="section-text">如您对本用户协议有任何疑问或建议，请通过以下方式联系我们：</text>
        <text class="section-text">电子邮箱：privacy@save-radar-opal.vercel.app</text>
        <text class="section-text">我们将在收到您的反馈后15个工作日内回复。</text>
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

.section-subtitle {
  font-size: 26rpx;
  font-weight: 600;
  color: #444444;
  display: block;
  margin-top: 16rpx;
  margin-bottom: 8rpx;
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
