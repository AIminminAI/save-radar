## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "React + Vite + Tailwind CSS"
        "React Router DOM"
        "Zustand 状态管理"
    end
    subgraph "数据层"
        "Mock Data Engine"
        "优惠券数据集 (20+条)"
        "运营商配置数据"
    end
    subgraph "组件层"
        "页面组件 (4个)"
        "通用组件 (导航栏/卡片/动画)"
        "业务组件 (计算器/筛选器)"
    end
    "前端层" --> "组件层"
    "组件层" --> "数据层"
```

## 2. 技术说明
- 前端：React@18 + Tailwind CSS@3 + Vite
- 初始化工具：vite-init
- 后端：无（纯前端，使用Mock数据引擎）
- 状态管理：Zustand
- 路由：React Router DOM v6
- 图标：lucide-react
- 数据库：无（使用内存Mock数据）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 雷达首页 - AI扫描动画、今日最佳、热门优惠 |
| /coupons | 全部优惠券页 - 按运营商分类的完整优惠券列表 |
| /calculator | 省钱计算器页 - 输入话费智能匹配最优策略 |
| /profile | 我的页面 - 用户信息、收藏、AI对比说明 |

## 4. 数据模型

### 4.1 优惠券数据模型
```typescript
interface Coupon {
  id: string
  title: string
  carrier: 'mobile' | 'unicom' | 'telecom'
  carrierName: string
  discountAmount: number
  originalPrice?: number
  discountPrice?: number
  discountRate?: string
  expirationDate: string
  category: string
  region?: string
  guide: string[]
  claimUrl: string
  isHot: boolean
  isNew: boolean
  tags: string[]
}
```

### 4.2 运营商配置模型
```typescript
interface CarrierConfig {
  id: 'mobile' | 'unicom' | 'telecom'
  name: string
  color: string
  bgColor: string
  icon: string
}
```

### 4.3 计算结果模型
```typescript
interface SavingsResult {
  originalAmount: number
  totalSavings: number
  finalAmount: number
  savingsPercent: number
  appliedCoupons: Coupon[]
  strategy: string
}
```

## 5. 项目目录结构
```
src/
├── components/
│   ├── BottomNav.tsx          # 底部导航栏
│   ├── RadarAnimation.tsx     # 雷达扫描动画
│   ├── CouponCard.tsx         # 优惠券卡片
│   ├── CouponDetail.tsx       # 优惠券详情弹窗
│   ├── CarrierFilter.tsx      # 运营商筛选
│   └── SavingsResult.tsx      # 省钱结果展示
├── pages/
│   ├── Home.tsx               # 雷达首页
│   ├── Coupons.tsx            # 全部优惠券页
│   ├── Calculator.tsx         # 省钱计算器页
│   └── Profile.tsx            # 我的页面
├── store/
│   └── useAppStore.ts         # Zustand全局状态
├── data/
│   └── mockCoupons.ts         # Mock数据引擎(20+条优惠券)
├── utils/
│   └── calculator.ts          # 省钱计算逻辑
├── App.tsx
├── main.tsx
└── index.css
```
