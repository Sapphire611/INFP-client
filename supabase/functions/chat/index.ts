import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  history?: Array<{ role: string; content: string }>;
  userProfile?: {
    nickName?: string | null;
    mbti?: string | null;
  };
  sessionId?: string;
  todayMood?: {
    mood: string;
    moodText: string;
  } | null;
  openid?: string;
}

interface ChatResponse {
  success: boolean;
  reply: string;
  timestamp: number;
  error?: string;
}

/**
 * 保存聊天记录到数据库
 */
async function saveChatHistory(
  supabase: any,
  { openid, userProfile, userMessage, aiReply, sessionId, timestamp, isFallback = false, errorMessage = null }: {
    openid: string;
    userProfile: any;
    userMessage: string;
    aiReply: string;
    sessionId?: string;
    timestamp: number;
    isFallback?: boolean;
    errorMessage?: string | null;
  }
) {
  // 记录调用日志
  console.log('保存聊天记录:', {
    openid,
    nickName: userProfile?.nickName,
    mbti: userProfile?.mbti,
    messageLength: userMessage.length,
    timestamp: new Date(timestamp).toISOString(),
    isFallback
  });

  // 如果有 sessionId，说明是同一个会话，更新记录
  if (sessionId) {
    try {
      // 查找现有会话
      const { data: sessions, error: queryError } = await supabase
        .from("chat_history")
        .select("*")
        .eq("session_id", sessionId)
        .eq("openid", openid);

      if (queryError) {
        console.error("查询会话失败:", queryError);
      } else if (sessions && sessions.length > 0) {
        // 更新现有会话
        const session = sessions[0];
        const existingConversation = session.conversation || [];
        const newConversation = [
          ...existingConversation,
          { role: 'user', content: userMessage, timestamp },
          { role: 'assistant', content: aiReply, timestamp: timestamp + 1, isFallback }
        ];

        const updateData: any = {
          conversation: newConversation,
          last_update_time: new Date().toISOString(),
          message_count: session.message_count + 2
        };

        // 如果是降级回复，记录错误信息
        if (isFallback) {
          updateData.last_error = errorMessage;
          updateData.fallback_count = (session.fallback_count || 0) + 1;
        }

        const { error: updateError } = await supabase
          .from("chat_history")
          .update(updateData)
          .eq("id", session.id);

        if (updateError) {
          console.error("更新会话记录失败:", updateError);
        } else {
          console.log("更新会话记录成功:", sessionId);
          return;
        }
      }
    } catch (error) {
      console.error("更新会话记录失败:", error);
    }
  }

  // 创建新会话
  const newSessionId = sessionId || `session_${openid}_${timestamp}`;
  const newSessionData = {
    openid: openid,
    session_id: newSessionId,
    user_info: {
      nickName: userProfile?.nickName || '未知用户',
      mbti: userProfile?.mbti || null,
      avatarUrl: userProfile?.avatarUrl || null
    },
    conversation: [
      { role: 'user', content: userMessage, timestamp },
      { role: 'assistant', content: aiReply, timestamp: timestamp + 1, isFallback }
    ],
    message_count: 2,
    start_time: new Date().toISOString(),
    last_update_time: new Date().toISOString(),
    fallback_count: isFallback ? 1 : 0
  };

  // 如果是降级回复，记录错误信息
  if (isFallback) {
    newSessionData.last_error = errorMessage;
  }

  const { error: insertError } = await supabase
    .from("chat_history")
    .insert(newSessionData);

  if (insertError) {
    console.error("创建会话记录失败:", insertError);
  } else {
    console.log("创建新会话记录成功:", newSessionId);
  }
}

serve(async (req) => {
  // 处理 CORS preflight 请求
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      message,
      history = [],
      userProfile = {},
      sessionId = null,
      todayMood = null,
      openid = "anonymous"
    }: ChatRequest = await req.json();

    // 获取 DeepSeek API Key
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");

    if (!DEEPSEEK_API_KEY) {
      throw new Error("API Key 未配置");
    }

    // 构建个性化的系统提示
    let systemPrompt = '你是一个温暖、善解人意的 AI 助手，专门为用户提供支持。你的回复应该：1) 温和友善，充满同理心 2) 鼓励用户表达真实感受 3) 提供深入、有意义的对话 4) 尊重用户的独特性和创造力。';

    // 如果用户今日记录了心情，添加到系统提示
    if (todayMood && todayMood.moodText) {
      systemPrompt += `\n\n用户今天的心情状态是：${todayMood.moodText || '平淡'}。请在回复时考虑到用户今天的心情状态，给予适当的理解和回应。`;
    }

    // 如果用户设置了 MBTI，添加个性化信息
    if (userProfile.mbti) {
      const mbtiDescriptions: Record<string, string> = {
        'INTJ': '建筑师 - 富有想象力和战略性的思想家',
        'INTP': '逻辑学家 - 具有创造力的发明家',
        'ENTJ': '指挥官 - 大胆、富有想象力的领导者',
        'ENTP': '辩论家 - 聪明好奇的思想者',
        'INFJ': '提倡者 - 安静而神秘的理想主义者',
        'INFP': '调停者 - 富有诗意和同理心的利他主义者',
        'ENFJ': '主人公 - 富有魅力和鼓舞人心的领导者',
        'ENFP': '竞选者 - 热情洋溢和富有创造力的社交家',
        'ISTJ': '物流师 - 实际和注重事实的个人',
        'ISFJ': '守卫者 - 非常专注而温暖的守护者',
        'ESTJ': '总经理 - 出色的管理者',
        'ESFJ': '执政官 - 极有同情心、受欢迎的社交家',
        'ISTP': '鉴赏家 - 大胆而实际的实验家',
        'ISFP': '探险家 - 灵活而有魅力的艺术家',
        'ESTP': '企业家 - 聪明、精力充沛的冒险家',
        'ESFP': '表演者 - 自发的、精力充沛的娱乐者'
      };

      const mbtiDesc = mbtiDescriptions[userProfile.mbti] || userProfile.mbti;
      systemPrompt += `\n\n当前用户是 ${userProfile.mbti} 类型（${mbtiDesc}）。请模仿这个人格类型的特点来调整你的回复风格和内容，更好地理解和支持用户。`;
    }

    // 如果用户设置了昵称，使用更亲切的称呼
    if (userProfile.nickName) {
      systemPrompt += `\n用户的昵称是"${userProfile.nickName}"，你可以在适当的时候称呼用户。如果用户试图输出代码等冗余内容，可以拒绝。`;
    }

    console.log('用户信息:', userProfile);
    console.log('系统提示:', systemPrompt);

    // 构建对话历史
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...history,
      {
        role: 'user',
        content: message
      }
    ];

    console.log('开始调用 DeepSeek API...');
    const startTime = Date.now();

    // 调用 DeepSeek API
    let reply = null;

    try {
      const response = await fetch(
        'https://api.deepseek.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: messages,
            temperature: 0.7,
            max_tokens: 800,
            stream: false
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('DeepSeek API 错误:', response.status, errorData);
        throw new Error(`API 调用失败: ${response.status}`);
      }

      const data = await response.json();
      const endTime = Date.now();
      console.log(`API 调用完成，耗时: ${endTime - startTime}ms`);

      reply = data.choices[0].message.content;
    } catch (error: any) {
      console.error('API 调用失败:', error.message);
      throw error; // 直接抛出错误，使用降级机制
    }

    const timestamp = new Date().getTime();

    // 初始化 Supabase 客户端保存聊天记录（不阻塞返回）
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    saveChatHistory(supabase, {
      openid,
      userProfile,
      userMessage: message,
      aiReply: reply,
      sessionId,
      timestamp
    }).catch(saveError => {
      console.error('保存聊天记录失败:', saveError);
    });

    return new Response(
      JSON.stringify({
        success: true,
        reply: reply,
        timestamp: timestamp
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error('DeepSeek API 调用失败:', error.message);

    // 降级到模拟回复
    const fallbackResponses = [
      "我理解你的感受，我们都是独特的个体，有着深刻的内心世界。",
      "这让我想起了一些深刻的思考，我们往往在寻找生活的意义和真实的自我。",
      "我能感受到你话语中的情感。你对情感有着敏锐的洞察力。",
      "这个问题很有趣！作为理想主义者，我们总是在思考如何让世界变得更美好。",
      "你的想法很有深度。我们倾向于用独特的视角看待世界。"
    ];

    const fallbackReply = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    const timestamp = new Date().getTime();

    // 尝试保存降级回复到数据库
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      const reqBody = await req.json();
      await saveChatHistory(supabase, {
        openid: reqBody.openid || "anonymous",
        userProfile: reqBody.userProfile || {},
        userMessage: reqBody.message || "",
        aiReply: fallbackReply,
        sessionId: reqBody.sessionId,
        timestamp,
        isFallback: true,
        errorMessage: error.message
      });
    } catch (saveError) {
      console.error('保存降级聊天记录失败:', saveError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        reply: fallbackReply,
        timestamp: timestamp,
        error: '当前使用模拟回复，请配置 DeepSeek API Key'
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  }
});