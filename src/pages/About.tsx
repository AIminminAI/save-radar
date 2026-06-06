import { Info, Target, Shield, Database, RefreshCw, Mail } from 'lucide-react'

export default function About() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] px-4 pt-6 pb-8">
        <h1 className="text-white text-lg font-bold">关于省钱雷达</h1>
        <p className="text-gray-400 text-xs mt-1">让每个人都能看懂影响自己的政策</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-24">
        {/* 我们是谁 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Info size={16} className="text-[#1A1A2E]" />
            <h3 className="text-sm font-bold text-gray-800">我们是谁</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            "省钱雷达"是一款专注于民生政策解读的免费工具。我们帮助普通老百姓快速了解国家最新政策，看懂政策对自己的影响，知道该怎么做。
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mt-2">
            我们深知，政府政策文件往往篇幅长、术语多，普通人很难快速抓住重点。省钱雷达的目标就是把这些复杂政策"翻译"成大白话，让你3秒看懂影响你的部分。
          </p>
        </div>

        {/* 我们做什么 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-gray-800">我们做什么</h3>
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="text-xs text-[#FF6B35] font-bold shrink-0">1.</span>
              <p className="text-xs text-gray-500 leading-relaxed">从中国政府网、国家医保局、国家税务总局、财政部、教育部等官方网站自动采集最新政策</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-[#FF6B35] font-bold shrink-0">2.</span>
              <p className="text-xs text-gray-500 leading-relaxed">根据你的身份（上班族、宝妈、学生、老人、自由职业）智能匹配相关政策</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-[#FF6B35] font-bold shrink-0">3.</span>
              <p className="text-xs text-gray-500 leading-relaxed">用通俗语言解读政策要点，告诉你可能的影响和建议操作</p>
            </div>
            <div className="flex gap-2">
              <span className="text-xs text-[#FF6B35] font-bold shrink-0">4.</span>
              <p className="text-xs text-gray-500 leading-relaxed">提供补贴计算器，帮你估算可能享受的补贴</p>
            </div>
          </div>
        </div>

        {/* 数据来源 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-[#00D68F]" />
            <h3 className="text-sm font-bold text-gray-800">数据来源</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            所有政策数据均来自政府官方网站的公开信息，包括但不限于：
          </p>
          <div className="mt-2 space-y-1">
            <p className="text-xs text-gray-500">• 中国政府网 (www.gov.cn)</p>
            <p className="text-xs text-gray-500">• 国家医保局 (www.nhsa.gov.cn)</p>
            <p className="text-xs text-gray-500">• 国家税务总局 (www.chinatax.gov.cn)</p>
            <p className="text-xs text-gray-500">• 财政部 (www.mof.gov.cn)</p>
            <p className="text-xs text-gray-500">• 教育部 (www.moe.gov.cn)</p>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mt-2">
            每条政策均附带原文链接，你可以直接跳转到政府网站查看原文验证。我们不编造、不篡改任何政策内容。
          </p>
        </div>

        {/* 更新频率 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-gray-800">更新频率</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            政策数据每30分钟自动从政府官网抓取更新，确保信息的时效性。我们使用自动化技术持续监控各政府网站，第一时间发现新发布的政策。
          </p>
        </div>

        {/* 免责声明 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-yellow-500" />
            <h3 className="text-sm font-bold text-gray-800">免责声明</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            本应用中的政策解读基于政策标题自动推断生成，仅供参考，不构成法律或专业建议。具体政策内容以政府官方发布为准。如有疑问，请咨询当地人社部门或专业人士。
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mt-2">
            补贴计算器的结果仅为估算，实际补贴金额以当地政府部门审核结果为准。
          </p>
        </div>

        {/* 联系我们 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={16} className="text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-gray-800">联系我们</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            如您对本应用有任何疑问、意见或建议，请通过以下方式联系我们：
          </p>
          <p className="text-xs text-[#1A1A2E] font-bold mt-2">GitHub: AIminminAI</p>
          <p className="text-xs text-gray-400 mt-1">我们将在收到您的反馈后15个工作日内回复。</p>
        </div>
      </div>
    </div>
  )
}
