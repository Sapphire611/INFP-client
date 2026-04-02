-- ============================================
-- AI Chat Conversations & Summaries Schema
-- 适配 INFP 小程序（使用 openid 作为 user_id）
-- ============================================

-- ========================================
-- 1. 创建 conversations 表（会话元数据）
-- ========================================
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,  -- 对应 wechat_users.openid
  title TEXT NOT NULL,
  model TEXT DEFAULT 'deepseek-chat',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_at ON conversations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);

-- 创建更新时间自动更新的触发器
CREATE TRIGGER update_conversations_updated_at
    BEFORE UPDATE ON conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用 RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许用户访问自己的会话
CREATE POLICY "允许用户访问自己的会话" ON conversations
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- 授权
GRANT ALL ON conversations TO anon;
GRANT ALL ON conversations TO authenticated;
GRANT ALL ON conversations TO service_role;

-- ========================================
-- 2. 创建 conversation_summaries 表（对话摘要）
-- ========================================
CREATE TABLE IF NOT EXISTS conversation_summaries (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  summary_text TEXT NOT NULL,
  message_count_summary INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_summaries_conversation_id ON conversation_summaries(conversation_id);
CREATE INDEX IF NOT EXISTS idx_summaries_created_at ON conversation_summaries(created_at DESC);

-- 启用 RLS
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;

-- 创建策略：允许用户访问自己会话的摘要
CREATE POLICY "允许用户访问自己会话的摘要" ON conversation_summaries
    FOR ALL
    USING (
      EXISTS (
        SELECT 1
        FROM conversations
        WHERE conversations.id = conversation_summaries.conversation_id
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1
        FROM conversations
        WHERE conversations.id = conversation_summaries.conversation_id
      )
    );

-- 授权
GRANT ALL ON conversation_summaries TO anon;
GRANT ALL ON conversation_summaries TO authenticated;
GRANT ALL ON conversation_summaries TO service_role;

-- 打印成功消息
DO $$
BEGIN
    RAISE NOTICE 'Conversations & Summaries 表创建成功！';
END $$;
