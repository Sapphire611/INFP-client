# 项目技能

本项目是 INFP 的小剧场微信小程序，使用 Taro + React + MobX 开发。

## 常用命令

```bash
# 开发模式
npm run dev:weapp     # 微信小程序开发（带热更新）
npm run dev:h5        # H5 开发

# 构建生产
npm run build:weapp  # 构建微信小程序
npm run build:h5     # 构建 H5

# 测试
npm run test
```

## 技术栈

- **Taro 3.6.23** - 多端开发框架
- **React 17** - UI 框架
- **MobX 6** - 状态管理
- **NutUI** - 组件库
- **TailwindCSS** - 样式
- **Supabase** - 后端服务（用户数据、AI 对话）

## 项目结构

```
src/
├── pages/              # 页面
│   ├── home/          # AI 对话首页
│   ├── record/        # 心情记录（已隐藏）
│   ├── profile/       # 个人中心
│   ├── profile-edit/  # 编辑资料
│   ├── mbti-setting/  # MBTI 设置
│   └── login/         # 登录页
├── shared/
│   ├── store/         # MobX 状态（AuthStore, ChatStore）
│   ├── utils/         # 工具函数
│   │   └── supabase/ # Supabase HTTP 客户端
│   └── components/   # 公共组件
├── components/        # 全局组件
└── app.config.ts     # 应用配置
```

## 快速任务

### 添加新页面
1. 在 `src/pages/` 创建新页面目录
2. 在 `src/app.config.ts` 添加页面路由
3. 如需 TabBar 页面，更新 CustomTabbar 组件

### 修改 API
- AI 对话：`src/shared/store/ChatStore/index.ts`
- 用户认证：`src/shared/store/AuthStore/index.ts`
- Supabase 请求：`src/shared/utils/supabase/index.ts`

### 样式开发
- 优先使用 TailwindCSS 类名
- 自定义样式使用 SCSS，路径对应页面目录
- 设计稿 750px，使用 `rpx` 单位

### 环境变量
- `.env.development` - 开发环境
- `.env.production` - 生产环境
- 关键变量：`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `DEEPSEEK_API_KEY`