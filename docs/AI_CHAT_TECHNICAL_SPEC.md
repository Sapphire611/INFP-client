---
marp: true
theme: default
paginate: true
---

<!-- _class: lead -->

# INFP小程序 AI对话功能技术方案

## 智能对话系统的完整实现架构

---

# 目录

1. [功能概述](#功能概述)
2. [技术架构](#技术架构)
3. [数据库设计](#数据库设计)
4. [前端实现](#前端实现)
5. [后端服务](#后端服务)
6. [安全机制](#安全机制)
7. [部署配置](#部署配置)

---

# 功能概述

## 核心功能

- **🤖 AI智能对话** - 基于DeepSeek大模型的智能对话
- **💾 会话管理** - 单会话管理，支持清空/重置（每次清空生成新 conversationId）
- **📱 微信小程序** - 原生小程序体验，适配各尺寸设备
- **🔄 打字机效果** - 流畅的逐字显示AI回复体验
- **📊 智能摘要** - 自动生成对话摘要，历史消息为空时注入上下文

---

# 功能特性

### 用户体验优化

- **持久化存储** - 对话记录保存在 Taro Storage（微信小程序本地存储）
- **自动保存** - 消息自动同步到本地存储
- **错误处理** - 友好的错误提示，AI 异常时有降级兜底回复
- **加载状态** - 清晰的"思考中..."状态显示
- **发送频率限制** - 5秒防抖，避免重复发送

### 技术亮点

- **前端直接操作 Supabase** - conversations/summaries 由前端通过 REST API 操作，无需 Edge Function 中转
- **Edge Function 最小化** - 只负责 DeepSeek 调用（密钥安全）+ chat_history 存储 + 摘要生成
- **智能摘要上下文注入** - 本地历史为空时，自动从 Supabase 查摘要补充上下文

---

# 技术架构

## 系统架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌────────────────────────┐
│   用户界面层      │    │    状态管理层    │    │    数据层               │
│                 │    │                 │    │                        │
│  • Home Page    │────│  • ChatStore    │────│  Supabase REST API     │
│  • Components   │    │  • AuthStore    │    │  • conversations       │
└─────────────────┘    └─────────────────┘    │  • conv_summaries      │
                               │               └────────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐    ┌──────────────┐
                    │  Supabase Edge Func │────│  DeepSeek    │
                    │  • chat             │    │  Chat API    │
                    │    - DeepSeek调用   │    └──────────────┘
                    │    - chat_history   │
                    │    - 摘要生成       │
                    └─────────────────────┘
```

---

# 技术栈

### 前端技术栈

- **框架**: Taro 3.6.23 + React 17（微信小程序）
- **UI组件**: NutUI React Taro
- **状态管理**: MobX 6
- **样式**: TailwindCSS + SCSS（rpx 单位，750px 设计稿）
- **类型安全**: TypeScript

### 后端技术栈

- **Edge Functions**: Supabase Edge Functions（Deno 运行时）
- **数据库**: Supabase (PostgreSQL) — 前端直接通过 REST API 操作
- **AI模型**: DeepSeek Chat API（密钥仅在 Edge Function 使用）
- **认证**: 微信 openid + 自定义用户体系

---

# 数据库设计

## 表结构概览

```sql
-- conversations 表（前端直接操作）
CREATE TABLE conversations (
  id TEXT PRIMARY KEY,          -- conversationId（前端生成）
  user_id TEXT NOT NULL,        -- wechat_users.openid
  title TEXT NOT NULL,          -- 首条消息前20字
  model TEXT DEFAULT 'deepseek-chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- conversation_summaries 表（Edge Function 写入，前端只读）
CREATE TABLE conversation_summaries (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  summary_text TEXT NOT NULL,
  message_count_summary INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

# 数据库设计特点

## 存储策略（三层）

### 本地存储（Taro Storage）
- **实时消息**: 完整对话内容，Key: `infp_chat_messages`
- **用户信息**: Key: `infp_user_info`

### Supabase（前端直接操作）
- **conversations**: 会话元数据（标题、时间、模型）
- **conversation_summaries**: 历史摘要（只读，由 Edge Function 写入）

### Supabase（Edge Function 操作）
- **chat_history**: 完整对话记录（openid 维度，用于数据分析）
- **conversation_summaries**: 摘要写入（需要调用 DeepSeek，密钥保护）

---

# 前端实现

## 组件架构

```
src/
├── pages/home/
│   ├── index.tsx           # 主对话页面（消息列表 + 输入框）
│   └── index.scss          # 样式文件
├── shared/
│   ├── store/
│   │   ├── ChatStore/      # AI对话状态管理（含 Supabase 直接操作）
│   │   └── AuthStore/      # 用户认证状态管理
│   └── utils/
│       └── supabase/       # 自定义 Supabase HTTP 客户端（Taro.request 封装）
└── components/
    └── CustomTabbar/       # 自定义导航栏
```

---

### 状态管理（ChatStore）

```typescript
class _ChatStore {
  messages: Message[] = [];     // 当前消息列表
  isLoading = false;            // 加载状态
  lastSendTime = 0;             // 最后发送时间（5秒防抖）
  conversationId: string = "";  // 当前会话ID（每次清空重新生成）

  // 核心方法
  sendMessage(content: string): Promise<void>;
  ensureConversation(firstMessage: string): Promise<void>;  // 直接写 Supabase
  getLatestSummary(): Promise<string | null>;               // 直接读 Supabase
  streamText(id, fullText, speed): Promise<void>;           // 打字机效果
  clearMessages(): Promise<void>;                           // 清空 + 新 conversationId
}
```

---

# 前端实现细节

## 完整消息发送流程

1. **防抖检查** → 5秒内只能发送一次
2. **显示用户消息** → 立即更新 UI
3. **ensureConversation** → 直接调 Supabase REST API，创建或更新会话记录（异步，不阻塞）
4. **摘要注入** → 本地历史 ≤2条时，查 `conversation_summaries` 注入上下文
5. **获取今日心情** → 调 `mood` Edge Function（失败不阻塞）
6. **调用 chat Edge Function** → 发送消息 + 历史 + 摘要上下文 + 心情
7. **打字机效果** → 收到完整回复后逐字渐显（每3字暂停 20ms）
8. **本地持久化** → 自动保存到 Taro Storage

---

## 摘要上下文注入

```typescript
// 本地历史不足时，从 Supabase 读取摘要注入上下文
if (localHistory.length <= 2 && AuthStore.userInfo?.openid) {
  const summary = await this.getLatestSummary();
  if (summary) {
    history = [
      { role: "assistant", content: `[历史对话摘要]: ${summary}` },
      ...history,
    ];
  }
}
```

## 会话管理（直接操作 Supabase）

```typescript
// conversations 表 - 前端直接写
await supabase.from("conversations").insert({
  id: this.conversationId,
  user_id: openid,
  title: firstMessage.slice(0, 20),
  model: "deepseek-chat",
});
```

---

# 后端服务

## Edge Function 职责（最小化原则）

```
supabase/functions/
├── chat          # 核心：DeepSeek调用 + chat_history存储 + 摘要生成
├── wechat-login  # 微信登录（code换openid，查/建用户记录）
├── mood          # 心情记录（获取今日心情传给 AI 作上下文）
└── updateProfile # 更新用户资料
```

## chat Edge Function 请求体

```typescript
{
  message: string,             // 用户当前消息
  history: ChatHistory[],      // 最近10条 + 可能含摘要
  userProfile: { nickName, mbti },
  conversationId: string,      // 用于 chat_history 关联 + 触发摘要生成
  todayMood: TodayMood | null,
  openid: string,
}
```

---

# chat Edge Function 核心逻辑

```
Edge Function 做的事：
1. 验证入参（message 非空）
2. 构建 systemPrompt（MBTI + 心情 + 昵称）
3. 调用 DeepSeek API
4. 异步（不阻塞响应）：
   a. 写入/更新 chat_history（openid 维度）
   b. 检查 history.length >= 20，触发摘要生成并写 conversation_summaries
5. 返回 { success, reply, timestamp }

前端做的事（直接调 Supabase REST API）：
1. 写入/更新 conversations（标题、updated_at）
2. 读取 conversation_summaries（注入上下文）
```

---

# 智能摘要系统

## 摘要触发与存储

```typescript
// Edge Function 内部（history.length >= 20 触发）
async function checkAndSummarizeIfNeeded(
  supabase, conversationId, history, apiKey
) {
  if (history.length < 20) return;

  const messagesToSummarize = history.slice(0, Math.floor(history.length / 2));

  // 调用 DeepSeek 生成中文摘要
  const summaryText = await callDeepSeekForSummary(messagesToSummarize, apiKey);

  // 写入 conversation_summaries
  await supabase.from("conversation_summaries").insert({
    id: crypto.randomUUID(),
    conversation_id: conversationId,
    summary_text: summaryText,
    message_count_summary: messagesToSummarize.length,
  });
}
```

---

# 安全机制

## 密钥隔离

| 内容 | 存放位置 | 原因 |
|------|---------|------|
| DEEPSEEK_API_KEY | Supabase Edge Function Secrets | 不能暴露给小程序客户端 |
| SUPABASE_SERVICE_ROLE_KEY | Supabase Edge Function Secrets | 绕过 RLS，仅服务端使用 |
| SUPABASE_ANON_KEY | 小程序 .env | 公开可用，RLS 控制权限 |

## 身份验证流程

```typescript
// 微信登录
Taro.login() → 获取 code
→ wechat-login Edge Function → 用 code 换 openid
→ 返回用户信息 → 存 Taro Storage
→ 后续请求携带 openid
```

---

# 安全机制（续）

### Supabase RLS 策略

```sql
-- conversations：允许匿名访问（openid 由业务逻辑控制）
CREATE POLICY "允许用户访问自己的会话" ON conversations
  FOR ALL USING (true) WITH CHECK (true);

-- conversation_summaries：只能访问存在的会话的摘要
CREATE POLICY "允许用户访问自己会话的摘要" ON conversation_summaries
  FOR ALL USING (
    EXISTS (SELECT 1 FROM conversations WHERE id = conversation_id)
  );
```

### 输入验证（Edge Function 层）
```typescript
if (!message || message.trim().length === 0) {
  return Response.json({ error: "message is required" }, { status: 400 });
}
```

---

# 性能优化

## 前端优化

- **MobX observer**: 精准订阅，只有相关组件重渲染
- **异步不阻塞**: `ensureConversation` 不等待，不影响消息发送体验
- **打字机节奏**: 每3字暂停，减少 setState 频率

## 后端优化

- **历史消息截断**: 只发送最近 10 条（含摘要），控制 Token
- **摘要压缩**: 超过 20 条触发摘要，避免上下文爆炸
- **异步存储**: chat_history 写入和摘要生成不阻塞 API 响应

---

# 部署配置

## 环境变量

```bash
# .env（Taro 项目）
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
APP_NUMBER="2"
```

```bash
# Supabase Edge Functions Secrets（Dashboard > Settings > Secrets）
DEEPSEEK_API_KEY="your-deepseek-api-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
WECHAT_APP_ID="your-wechat-appid"
WECHAT_APP_SECRET="your-wechat-secret"
```

---

## 部署步骤

1. **数据库初始化**: 在 Supabase SQL Editor 执行：
   - `supabase/migrations/001_create_tables.sql`（wechat_users, chat_history, mood_records）
   - `supabase/migrations/002_create_conversations.sql`（conversations, conversation_summaries）
2. **Edge Functions 部署**:
   ```bash
   supabase functions deploy chat
   supabase functions deploy wechat-login
   supabase functions deploy mood
   supabase functions deploy updateProfile
   ```
3. **Secrets 配置**: Supabase Dashboard > Edge Functions > Secrets
4. **微信域名白名单**: 开发者工具 > 项目设置 > 添加 `SUPABASE_URL` 域名
5. **本地调试**: `npm run dev:weapp`

---

# 技术亮点总结

## ✅ 架构优势

- **前端直接操作 Supabase**: conversations/summaries 由 ChatStore 直接通过 REST API 读写，减少 Edge Function 复杂度
- **Edge Function 最小化**: 只处理需要保护密钥的操作（DeepSeek + 摘要生成）
- **小程序原生适配**: 自定义 Supabase HTTP 客户端，无 Node.js 依赖

## ✅ 用户体验

- **打字机效果**: 拟真的 AI 回复呈现体验（非真实 streaming）
- **摘要上下文续接**: 清空本地历史后仍能基于摘要继续对话
- **离线可读**: 本地 Taro Storage 确保断网后仍可查看

---

<!-- _class: lead -->

# 谢谢！

## INFP小程序 AI对话功能技术方案

**Taro + MobX + Supabase REST API + Edge Functions + DeepSeek**
