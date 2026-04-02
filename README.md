# INFP 的生活日记 🦋

> 一个专为 INFP 量身打造的微信小程序，AI 聊天陪伴 + 心情记录，做你自己就好。

## 简介

INFP 的生活日记是一款基于微信小程序开发的个人成长助手应用。通过 AI 聊天陪伴，结合每日心情记录打卡功能，帮助用户更好地了解自己、记录生活。

### 核心功能

- 🤖 **AI 智能对话** - 接入 Deepseek API，提供个性化的 AI 聊天体验
- 📝 **心情记录打卡** - 每日心情记录，追踪情绪变化
- 👤 **个人档案** - 支持修改昵称、MBTI 等个性化信息
- 🎨 **MBTI 主题** - 根据 MBTI 类型展示专属颜色和 emoji
- 💬 **对话历史** - 本地存储聊天记录，随时回顾
- 🔐 **微信登录** - 一键微信授权登录

## 技术栈

### 前端框架
- **Taro 3.6.23** - 多端开发框架
- **React 17** - UI 框架
- **TypeScript** - 类型安全
- **MobX 6** - 状态管理

### UI & 样式
- **NutUI React Taro** - 组件库
- **TailwindCSS** - 原子化 CSS
- **weapp-tailwindcss** - 小程序 Tailwind 适配
- **SCSS** - CSS 预处理器

### 后端服务
- **微信云开发** - 云函数、云数据库
- **Deepseek API** - AI 对话服务

### 开发工具
- **Webpack 5** - 构建工具
- **Jest + Enzyme** - 单元测试

## 项目结构

```
INFP-client/
├── src/
│   ├── pages/                  # 页面目录
│   │   ├── home/              # 首页 - AI 对话
│   │   ├── record/            # 记录 - 心情打卡
│   │   ├── profile/           # 我的 - 个人中心
│   │   ├── profile-edit/      # 编辑个人资料
│   │   ├── mbti-setting/      # MBTI 设置
│   │   └── login/             # 登录页
│   ├── shared/                # 共享资源
│   │   ├── components/        # 公共组件
│   │   ├── store/            # MobX 状态管理
│   │   ├── server/           # API 接口封装
│   │   └── utils/            # 工具函数
│   ├── components/            # 全局组件
│   ├── custom-tab-bar/        # 自定义 TabBar
│   ├── app.tsx                # 应用入口
│   └── app.config.ts          # 应用配置
├── cloudfunctions/            # 云函数
│   ├── chat/                  # AI 对话云函数
│   ├── mood/                  # 心情记录云函数
│   ├── login/                 # 登录云函数
│   └── updateProfile/         # 更新个人资料云函数
└── config/                    # Taro 配置
```

## 页面功能

### 1. 首页 (AI 对话)
- AI 智能对话，支持上下文理解
- 携带用户信息（昵称、MBTI）提供个性化回复
- 结合今日心情提供更有针对性的建议
- 对话记录本地持久化存储
- 支持清空对话历史

### 2. 记录页 (心情打卡)
- 5 种心情选项：开心、兴奋、平淡、难过、生气
- 每日只能记录一次
- 查看历史心情记录
- 今日记录高亮显示

### 3. 我的 (个人中心)
- 显示用户头像、昵称
- MBTI 类型展示（专属颜色和 emoji）
- 快速跳转到编辑页面

### 4. 编辑页
- 修改昵称
- 选择 MBTI 类型（16 种类型可选）
- 实时预览主题颜色变化

## 运行环境

- Node.js >= 16.14.2
- pnpm 8+ (推荐) 或 npm

## 快速开始

### 1. 安装依赖

```bash
# 使用 pnpm（推荐）
pnpm install

# 或使用 npm
npm install
```

### 2. 配置环境变量

在项目根目录创建 `.env` 文件：

```env
# Deepseek API 配置
DEEPSEEK_API_KEY=your_api_key_here
```

### 3. 配置云开发

1. 在微信开发者工具中打开项目
2. 开通云开发服务
3. 创建云环境并记录环境 ID
4. 上传云函数（`cloudfunctions/` 目录下）
5. 在 `project.config.json` 中配置云环境 ID

### 4. 启动开发

```bash
# 微信小程序开发
npm run dev:weapp

# H5 开发
npm run dev:h5

# 支付宝小程序开发
npm run dev:alipay
```

### 5. 构建生产

```bash
# 构建微信小程序
npm run build:weapp

# 构建 H5
npm run build:h5
```

## 云函数说明

### chat 云函数
AI 对话核心服务，调用 Deepseek API：
- 支持对话上下文
- 携带用户画像信息
- 结合今日心情提供个性化回复

### mood 云函数
心情记录的增删查：
- `get`: 获取用户心情记录
- `add`: 添加今日心情记录
- `update`: 更新心情记录

### login 云函数
微信登录鉴权：
- 获取用户 openid
- 创建或更新用户信息

### updateProfile 云函数
更新用户个人资料：
- 更新昵称
- 更新 MBTI

## MBTI 主题配色

项目支持 16 种 MBTI 类型，分为 4 大角色，每种角色有独特的配色方案：

| 角色 | MBTI 类型 | 主题色 | Emoji |
|------|-----------|--------|-------|
| 外交家 (NF) | INFJ, INFP, ENFJ, ENFP | 绿色 #66bb6a | 🦋🌟😊🗡️ |
| 分析家 (NT) | INTJ, INTP, ENTJ, ENTP | 紫色 #9c27b0 | 🏛️🧪🪄💡 |
| 守护者 (SJ) | ISTJ, ISFJ, ESTJ, ESFJ | 蓝色 #2196f3 | 👓👩‍⚕️📏🤝 |
| 探险家 (SP) | ISTP, ISFP, ESTP, ESFP | 黄色 #ff9800 | 🔧🎨🎯🪇 |

## 开发建议

### 样式开发
- 优先使用 TailwindCSS 类名
- NutUI 组件使用 375px 设计稿
- 自定义样式使用 `rpx` 单位（750px 设计稿）

### 状态管理
- 全局状态使用 MobX Store
- 页面本地状态使用 React useState
- 持久化数据使用 Taro.Storage

### 路径别名
```typescript
import { ChatStore } from "@shared/store";
import IconFont from "@/shared/components/IconFont";
```

## 注意事项

1. **API 密钥安全** - 请勿将 API Key 提交到代码仓库
2. **云函数上传** - 修改云函数后需重新上传部署
3. **微信登录** - 需要在微信公众平台配置 AppID
4. **聊天频率限制** - 当前设置为 5 秒内只能发送一次消息

## 待优化功能

- [ ] 添加骨架屏加载效果
- [ ] 支持对话记录导出
- [ ] 增加心情数据分析图表
- [ ] 支持自定义 AI 对话角色
- [ ] 添加消息通知功能

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提 Issue 📮
