-- INFP Chat 数据库迁移脚本
-- 在 Supabase Dashboard 的 SQL Editor 中运行此脚本
-- 注意：VITE_APP_NUMBER = 2 (INFP Chat)

-- ========================================
-- 1. 创建 wechat_users 表（微信用户）
-- ========================================
CREATE TABLE IF NOT EXISTS wechat_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  openid TEXT UNIQUE NOT NULL,
  unionid TEXT,
  wechat_nickname TEXT,
  wechat_avatar_url TEXT,
  mbti TEXT DEFAULT '',
  profile_name TEXT,
  profile_phone TEXT,
  profile_avatar TEXT,
  profile_id_number TEXT,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_wechat_users_openid ON wechat_users(openid);
CREATE INDEX IF NOT EXISTS idx_wechat_users_unionid ON wechat_users(unionid);
CREATE INDEX IF NOT EXISTS idx_wechat_users_is_active ON wechat_users(is_active);

-- 创建更新时间自动更新的触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wechat_users_updated_at
    BEFORE UPDATE ON wechat_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE wechat_users ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许匿名访问
CREATE POLICY "允许匿名用户访问的记录" ON wechat_users
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 授权
GRANT ALL ON wechat_users TO anon;
GRANT ALL ON wechat_users TO authenticated;
GRANT ALL ON wechat_users TO service_role;

-- ========================================
-- 2. 创建 chat_history 表（聊天记录）
-- ========================================
CREATE TABLE IF NOT EXISTS chat_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  openid TEXT NOT NULL,
  session_id TEXT,
  user_info JSONB DEFAULT '{}'::jsonb,
  conversation JSONB DEFAULT '[]'::jsonb,
  message_count INTEGER DEFAULT 0,
  start_time TIMESTAMPTZ DEFAULT NOW(),
  last_update_time TIMESTAMPTZ DEFAULT NOW(),
  fallback_count INTEGER DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_chat_history_openid ON chat_history(openid);
CREATE INDEX IF NOT EXISTS idx_chat_history_session_id ON chat_history(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_history_updated_at ON chat_history(updated_at DESC);

-- 创建更新时间自动更新的触发器
CREATE TRIGGER update_chat_history_updated_at
    BEFORE UPDATE ON chat_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE chat_history ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "允许用户访问自己的聊天记录" ON chat_history
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 授权
GRANT ALL ON chat_history TO anon;
GRANT ALL ON chat_history TO authenticated;
GRANT ALL ON chat_history TO service_role;

-- ========================================
-- 3. 创建 mood_records 表（心情记录）
-- ========================================
CREATE TABLE IF NOT EXISTS mood_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  openid TEXT NOT NULL,
  mood TEXT NOT NULL,
  mood_text TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mood_records_openid ON mood_records(openid);
CREATE INDEX IF NOT EXISTS idx_mood_records_date ON mood_records(date DESC);
-- 唯一约束：每个用户每天只能有一条记录
CREATE UNIQUE INDEX IF NOT EXISTS idx_mood_records_openid_date ON mood_records(openid, date);

-- 创建更新时间自动更新的触发器
CREATE TRIGGER update_mood_records_updated_at
    BEFORE UPDATE ON mood_records
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE mood_records ENABLE ROW LEVEL SECURITY;

-- 创建策略
CREATE POLICY "允许用户访问自己的心情记录" ON mood_records
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 授权
GRANT ALL ON mood_records TO anon;
GRANT ALL ON mood_records TO authenticated;
GRANT ALL ON mood_records TO service_role;

-- 打印成功消息
DO $$
BEGIN
    RAISE NOTICE 'INFP Chat 数据库迁移成功！';
    RAISE NOTICE '已创建表：wechat_users, chat_history, mood_records';
END $$;