# Supabase 部署指南

本文件说明如何将 Edge Functions 部署到 Supabase 并配置环境变量。

## 1. 配置 Supabase 环境变量

在部署 Edge Functions 之前，需要在 Supabase Dashboard 中配置以下 Secrets：

### 通过 CLI 配置

```bash
# 登录 Supabase
supabase login

# 链接到项目
supabase link --project-ref <your-project-ref>

# 设置 Secrets
supabase secrets set SUPABASE_URL=https://lwkeudywhmvlimsasixo.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
supabase secrets set WECHAT_APPID_2=<your-wechat-appid>
supabase secrets set WECHAT_SECRET_2=<your-wechat-secret>
supabase secrets set DEEPSEEK_API_KEY=<your-deepseek-api-key>
```

### 通过 Dashboard 配置

1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 进入 **Settings** → **Edge Functions**
4. 添加以下 Secrets：

| Key | Value | 说明 |
|-----|-------|------|
| `SUPABASE_URL` | `https://lwkeudywhmvlimsasixo.supabase.co` | 项目 URL |
| `SUPABASE_SERVICE_ROLE_KEY` | `<your-service-role-key>` | 服务角色密钥 |
| `WECHAT_APPID_2` | `<your-wechat-appid>` | 微信小程序 AppID (INFP Chat) |
| `WECHAT_SECRET_2` | `<your-wechat-secret>` | 微信小程序 AppSecret |
| `DEEPSEEK_API_KEY` | `<your-deepseek-api-key>` | DeepSeek API Key |

## 2. 部署 Edge Functions

### 方式一：使用 Supabase CLI

```bash
# 部署所有 Edge Functions
supabase functions deploy

# 或部署单个函数
supabase functions deploy login
supabase functions deploy chat
supabase functions deploy mood
supabase functions deploy updateProfile
```

### 方式二：使用 Dashboard

1. 进入 **Edge Functions** 页面
2. 点击 **New Edge Function**
3. 选择 `supabase/functions/login/index.ts` 并命名为 `login`
4. 重复以上步骤部署其他函数：
   - `chat` → `supabase/functions/chat/index.ts`
   - `mood` → `supabase/functions/mood/index.ts`
   - `updateProfile` → `supabase/functions/updateProfile/index.ts`

## 3. 运行数据库迁移

在 Supabase Dashboard 的 **SQL Editor** 中运行 `supabase/migrations/001_create_tables.sql`：

```bash
# 使用 CLI 运行迁移
supabase db push

# 或直接在 Dashboard SQL Editor 中粘贴并运行 SQL
```

## 4. 验证部署

### 检查 Edge Functions

```bash
# 列出所有部署的函数
supabase functions list
```

### 测试登录函数

```bash
# 测试微信登录（需要替换 <code>）
curl -X POST https://lwkeudywhmvlimsasixo.supabase.co/functions/v1/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code": "<wechat-code>", "appNumber": "2"}'
```

## 5. 配置小程序环境变量

在项目的 `.env.development` 和 `.env.production` 文件中确保有以下配置：

```env
VITE_SUPABASE_URL=https://lwkeudywhmvlimsasixo.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_APP_NUMBER=2
```

## 注意事项

1. **WECHAT_APPID_1 / WECHAT_SECRET_1** - 用于 INFP Notebook (appNumber=1)
2. **WECHAT_APPID_2 / WECHAT_SECRET_2** - 用于 INFP Chat (appNumber=2)
3. **DEEPSEEK_API_KEY** - 用于 chat Edge Function，保护 API Key 不暴露在客户端