import { Shield, Database, FlaskConical, Link2, AlertTriangle, Mail } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] px-4 pt-6 pb-8">
        <h1 className="text-white text-lg font-bold">隐私政策</h1>
        <p className="text-gray-400 text-xs mt-1">最后更新：2026年6月</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-24">
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-gray-800">我们收集什么数据</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            我们不收集任何个人身份信息。应用仅使用浏览器 localStorage 存储您的偏好设置（如画像选择），这些数据完全保存在您的设备本地，不会上传到任何服务器。
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-[#00D68F]" />
            <h3 className="text-sm font-bold text-gray-800">数据来源</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            本应用展示的政策数据来自 gov.cn 等政府官方网站的公开信息，每条政策均附带原文链接可供验证。我们不编造、不篡改任何政策内容。
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-gray-800">A/B 测试说明</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            我们可能使用本地存储记录您的使用习惯，以优化应用体验和界面展示。这些数据仅存储在您的设备本地，不会上传到服务器，也不会用于任何商业目的。
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-gray-800">第三方链接</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            本应用可能包含淘宝联盟、京东联盟等推广链接，这些链接已标注"广告"字样。通过这些链接购买商品，我们可能获得少量佣金，不会增加您的购买成本。第三方网站有其独立的隐私政策，我们不对第三方网站的隐私做法负责。
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-yellow-500" />
            <h3 className="text-sm font-bold text-gray-800">免责声明</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            本应用中的政策解读基于政策标题自动推断生成，仅供参考，不构成法律或专业建议。具体政策内容以政府官方发布为准，如有疑问请咨询相关部门或专业人士。
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={16} className="text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-gray-800">联系我们</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            如您对本隐私政策有任何疑问或建议，请通过以下方式联系我们：
          </p>
          <p className="text-xs text-[#1A1A2E] font-bold mt-2">privacy@save-radar-opal.vercel.app</p>
        </div>
      </div>
    </div>
  )
}
