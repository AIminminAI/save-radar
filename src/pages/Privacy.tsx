import { Shield, Database, FlaskConical, Link2, AlertTriangle, Mail, Lock, CreditCard, Baby, RefreshCw } from 'lucide-react'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-[#f5f5f5]">
      <div className="bg-gradient-to-br from-[#1A1A2E] to-[#16213E] px-4 pt-6 pb-8">
        <h1 className="text-white text-lg font-bold">隐私政策</h1>
        <p className="text-gray-400 text-xs mt-1">最后更新：2026年6月5日</p>
      </div>

      <div className="px-4 -mt-4 space-y-4 pb-24">
        {/* 概述 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-gray-800">一、概述</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            "省钱雷达"（以下简称"本应用"）是一款为用户提供补贴政策查询、匹配和解读服务的H5应用。我们深知个人信息对您的重要性，并将按照法律法规的规定，保护您的个人信息及隐私安全。
          </p>
          <p className="text-xs text-gray-500 leading-relaxed mt-2">
            本隐私政策将帮助您了解：我们如何收集和使用您的个人信息、我们如何存储和保护您的个人信息、我们如何共享和转让您的个人信息，以及您如何管理您的个人信息。请您在使用本应用前，仔细阅读并充分理解本隐私政策。
          </p>
        </div>

        {/* 信息收集 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-[#00D68F]" />
            <h3 className="text-sm font-bold text-gray-800">二、信息收集</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed mb-2">
            本应用会收集和使用以下信息，以保障服务的正常运行和功能实现：
          </p>
          <div className="space-y-2">
            <div>
              <p className="text-xs text-gray-700 font-bold">1. 用户画像选择</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                当您选择画像类型（上班族、家长、学生、老年人、自由职业）时，我们会记录您的选择，以便为您提供个性化的政策推荐。该信息仅存储在您的设备本地。
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-700 font-bold">2. 补贴计算器输入信息</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                当您使用补贴计算器功能时，我们会收集您输入的以下信息：所在城市、学历、就业状态、年收入范围。这些信息仅用于为您匹配适用的补贴政策，不会上传至服务器。
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-700 font-bold">3. 收藏记录</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                当您收藏某条政策时，我们会记录收藏的政策ID，以便您后续查看。该信息仅存储在您的设备本地。
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-700 font-bold">4. 广告观看记录</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                当您观看激励视频广告以解锁功能时，我们会记录广告观看状态，以判断是否发放奖励。该信息仅存储在您的设备本地。
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-700 font-bold">5. 支付记录</p>
              <p className="text-xs text-gray-500 leading-relaxed">
                当您购买付费功能时，我们会记录您的购买信息（产品ID、订单号、购买时间、到期时间），以便确认您的购买状态和权益。支付记录存储在您的设备本地。
              </p>
            </div>
          </div>
        </div>

        {/* 信息使用 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-gray-800">三、信息使用</h3>
          </div>
          <div className="text-xs text-gray-500 leading-relaxed space-y-1">
            <p>我们收集的信息将用于以下目的：</p>
            <p>1. 为您提供个性化的政策推荐和匹配服务；</p>
            <p>2. 计算和展示您可能享受的补贴金额；</p>
            <p>3. 保存您的收藏和偏好设置；</p>
            <p>4. 管理您的付费功能和权益；</p>
            <p>5. 判断广告观看状态以发放奖励；</p>
            <p>6. 优化应用功能和用户体验。</p>
            <p>我们不会将您的信息用于上述目的以外的其他用途。</p>
          </div>
        </div>

        {/* 信息存储 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Lock size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-gray-800">四、信息存储</h3>
          </div>
          <div className="text-xs text-gray-500 leading-relaxed space-y-2">
            <p>1. 存储方式：您的所有个人信息（画像选择、计算器输入、收藏记录、广告观看记录、支付记录）均存储在您的设备本地（浏览器localStorage），不会上传至我们的服务器。</p>
            <p>2. 存储期限：在您使用本应用期间，信息会持续保存在您的设备上。当您清除浏览器数据或本地存储时，相关信息将被删除。</p>
            <p>3. 存储安全：我们采用本地存储方式，数据仅存在于您的设备上，降低了数据泄露的风险。</p>
          </div>
        </div>

        {/* 信息共享 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Link2 size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-gray-800">五、信息共享</h3>
          </div>
          <div className="text-xs text-gray-500 leading-relaxed space-y-2">
            <p>我们不会将您的个人信息共享给任何第三方，但以下情况除外：</p>
            <p>1. 微信支付：当您使用微信支付购买付费功能时，我们需要向微信支付平台发送必要的订单信息（商品名称、金额），以完成支付流程。微信支付有其独立的隐私政策，请您仔细阅读。</p>
            <p>2. 法律法规要求：在法律法规要求、法律程序、诉讼或政府主管部门强制性要求的情况下，我们可能会共享您的个人信息。</p>
          </div>
        </div>

        {/* 数据来源 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Database size={16} className="text-[#00D68F]" />
            <h3 className="text-sm font-bold text-gray-800">六、数据来源</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            本应用展示的政策数据来自政府官方网站（如gov.cn等）的公开信息，每条政策均附带原文链接可供验证。我们不编造、不篡改任何政策内容。政策数据每日自动更新，确保信息的时效性。
          </p>
        </div>

        {/* 广告说明 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <FlaskConical size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-gray-800">七、广告说明</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            本应用使用穿山甲H5激励视频广告组件提供广告服务。广告内容由广告平台提供和管理，我们不会在广告展示过程中收集您的任何个人信息。广告收益用于支持本应用的持续运营和维护。本应用可能包含淘宝联盟、京东联盟等推广链接，这些链接已标注"广告"字样。通过这些链接购买商品，我们可能获得少量佣金，不会增加您的购买成本。
          </p>
        </div>

        {/* 支付说明 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <CreditCard size={16} className="text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-gray-800">八、支付说明</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            本应用的付费功能通过微信支付完成交易。支付过程由微信支付平台处理，我们不存储您的支付密码、银行卡信息等敏感支付数据。我们仅记录订单号和购买状态，用于确认您的付费权益。
          </p>
        </div>

        {/* 政策解读免责 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-yellow-500" />
            <h3 className="text-sm font-bold text-gray-800">九、政策解读免责</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            本应用中的政策解读基于政策标题自动推断生成，仅供参考，不构成法律或专业建议。具体政策内容以政府官方发布为准。如有疑问，请咨询当地人社部门或专业人士。我们不因解读内容的准确性承担任何法律责任。
          </p>
        </div>

        {/* 未成年人保护 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Baby size={16} className="text-pink-400" />
            <h3 className="text-sm font-bold text-gray-800">十、未成年人保护</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            我们非常重视对未成年人个人信息的保护。本应用不会主动收集14岁以下儿童的个人信息。如果您是14岁以下的未成年人，请在监护人的陪同和指导下使用本应用。如果我们发现在未事先获得监护人同意的情况下收集了未成年人的个人信息，我们将尽快删除相关信息。
          </p>
        </div>

        {/* 隐私政策更新 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw size={16} className="text-blue-400" />
            <h3 className="text-sm font-bold text-gray-800">十一、隐私政策更新</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            我们可能会不时更新本隐私政策。更新后的隐私政策将在本页面发布，并更新"更新日期"。重大变更时，我们会通过应用内通知等方式提醒您。继续使用本应用即表示您同意更新后的隐私政策。
          </p>
        </div>

        {/* 联系我们 */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3">
            <Mail size={16} className="text-[#FF6B35]" />
            <h3 className="text-sm font-bold text-gray-800">十二、联系我们</h3>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            如您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：
          </p>
          <p className="text-xs text-[#1A1A2E] font-bold mt-2">privacy@save-radar-opal.vercel.app</p>
          <p className="text-xs text-gray-400 mt-1">我们将在收到您的反馈后15个工作日内回复。</p>
        </div>
      </div>
    </div>
  )
}
