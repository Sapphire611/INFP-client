# CLAUDE.md - 项目指南

## 项目概述

INFP 的小剧场是一个微信小程序，使用 Taro + React 开发，通过 AI 聊天陪伴帮助 INFP 人格类型用户。

## 技术栈

- **Taro 3.6.23** - 多端框架（微信小程序为主）
- **React 17** + **TypeScript**
- **MobX 6** - 状态管理
- **NutUI React Taro** - 组件库
- **TailwindCSS** + **SCSS** - 样式
- **Supabase** - 后端服务（数据库 + Storage + Edge Functions）
- **Deepseek API** - AI 对话

## 核心文件

| 文件 | 用途 |
|------|------|
| `src/app.config.ts` | 应用配置（页面路由、TabBar） |
| `src/components/CustomTabbar/index.tsx` | 自定义导航栏 |
| `src/shared/store/AuthStore/index.ts` | 用户认证状态 |
| `src/shared/store/ChatStore/index.ts` | AI 对话状态 |
| `src/shared/utils/supabase/index.ts` | Supabase HTTP 客户端 |
| `src/pages/home/index.tsx` | AI 对话首页 |

## 开发规范

1. **路径别名**：
   - `@shared/*` → `src/shared/*`
   - `@/components/*` → `src/components/*`

2. **样式单位**：
   - TailwindCSS 类名优先
   - 自定义样式使用 `rpx`（750px 设计稿）

3. **状态管理**：
   - 全局状态 → MobX Store
   - 页面状态 → React useState

## 注意事项

- 已隐藏心情记录功能（TabBar 和路由仍在）
- 头像上传到 Supabase Storage
- 微信临时文件路径需要先下载再处理