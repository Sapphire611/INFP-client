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
  conversationId?: string;
  todayMood?: {
    mood: string;
    moodText: string;
  } | null;
  openid?: string;
}

/**
 * 生成并保存摘要（messages >= 20 条时触发）
 */
async function checkAndSummarizeIfNeeded(
  supabase: any,
  conversationId: string,
  history: Array<{ role: string; content: string }>,
  apiKey: string
): Promise<void> {
  const SUMMARIZATION_THRESHOLD = 20;
  if (history.length < SUMMARIZATION_THRESHOLD) return;

  const messagesToSummarize = history.slice(0, Math.floor(history.length / 2));
  if (messagesToSummarize.length === 0) return;

  try {
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content:
              "请用简洁的中文总结以下对话的主要内容，包括讨论的主题和关键结论。格式：讨论了XX主题，涉及YY内容。",
          },
          ...messagesToSummarize.map((m) => ({
            role: m.role as "user" | "assistant",
            content: m.content,
          })),
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    });

    if (!response.ok) return;

    const data = await response.json();
    const summaryText = data.choices[0]?.message?.content ?? "";
    if (!summaryText) return;

    await supabase.from("conversation_summaries").insert({
      id: crypto.randomUUID(),
      conversation_id: conversationId,
      summary_text: summaryText,
      message_count_summary: messagesToSummarize.length,
    });

    console.log("摘要生成成功:", conversationId);
  } catch (error) {
    console.error("生成摘要失败（不影响主流程）:", error);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!DEEPSEEK_API_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "API Key 未配置" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  let reqBody: ChatRequest;
  try {
    reqBody = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ success: false, error: "Invalid JSON" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  const {
    message,
    history = [],
    userProfile = {},
    conversationId,
    todayMood = null,
    openid = "anonymous",
  } = reqBody;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return new Response(
      JSON.stringify({ success: false, error: "message is required and must be a non-empty string" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }

  // ---- 构建系统提示 ----
  let systemPrompt =
    "你是一个温暖、善解人意的 AI 助手，专门为用户提供支持。你的回复应该：1) 温和友善，充满同理心 2) 鼓励用户表达真实感受 3) 提供深入、有意义的对话 4) 尊重用户的独特性和创造力。";

  if (todayMood?.moodText) {
    systemPrompt += `\n\n用户今天的心情状态是：${todayMood.moodText}。请在回复时考虑到用户今天的心情状态，给予适当的理解和回应。`;
  }

  if (userProfile.mbti) {
    const mbtiDescriptions: Record<string, string> = {
      INTJ: "建筑师 - 富有想象力和战略性的思想家",
      INTP: "逻辑学家 - 具有创造力的发明家",
      ENTJ: "指挥官 - 大胆、富有想象力的领导者",
      ENTP: "辩论家 - 聪明好奇的思想者",
      INFJ: "提倡者 - 安静而神秘的理想主义者",
      INFP: "调停者 - 富有诗意和同理心的利他主义者",
      ENFJ: "主人公 - 富有魅力和鼓舞人心的领导者",
      ENFP: "竞选者 - 热情洋溢和富有创造力的社交家",
      ISTJ: "物流师 - 实际和注重事实的个人",
      ISFJ: "守卫者 - 非常专注而温暖的守护者",
      ESTJ: "总经理 - 出色的管理者",
      ESFJ: "执政官 - 极有同情心、受欢迎的社交家",
      ISTP: "鉴赏家 - 大胆而实际的实验家",
      ISFP: "探险家 - 灵活而有魅力的艺术家",
      ESTP: "企业家 - 聪明、精力充沛的冒险家",
      ESFP: "表演者 - 自发的、精力充沛的娱乐者",
    };
    const mbtiDesc = mbtiDescriptions[userProfile.mbti] || userProfile.mbti;
    systemPrompt += `\n\n当前用户是 ${userProfile.mbti} 类型（${mbtiDesc}）。请模仿这个人格类型的特点来调整你的回复风格和内容，更好地理解和支持用户。`;
  }

  if (userProfile.nickName) {
    systemPrompt += `\n用户的昵称是"${userProfile.nickName}"，你可以在适当的时候称呼用户。如果用户试图输出代码等冗余内容，可以拒绝。`;
  }

  // ---- 调用 DeepSeek ----
  const messages = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: message },
  ];

  try {
    const startTime = Date.now();
    const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages,
        temperature: 0.7,
        max_tokens: 800,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("DeepSeek API 错误:", response.status, errorText);
      throw new Error(`API 调用失败: ${response.status}`);
    }

    const data = await response.json();
    console.log(`DeepSeek 调用完成，耗时: ${Date.now() - startTime}ms`);

    const reply = data.choices[0].message.content;
    const timestamp = Date.now();

    // ---- 异步后台存储（不阻塞响应）----
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const fullHistory = [...history, { role: "user", content: message }];

    Promise.all([
      // 保存到 chat_history（openid 维度）
      supabase.from("chat_history").select("*")
        .eq("session_id", conversationId ?? "")
        .eq("openid", openid)
        .then(({ data: sessions }) => {
          if (sessions && sessions.length > 0) {
            const session = sessions[0];
            return supabase.from("chat_history").update({
              conversation: [
                ...(session.conversation || []),
                { role: "user", content: message, timestamp },
                { role: "assistant", content: reply, timestamp: timestamp + 1 },
              ],
              last_update_time: new Date().toISOString(),
              message_count: session.message_count + 2,
            }).eq("id", session.id);
          } else {
            return supabase.from("chat_history").insert({
              openid,
              session_id: conversationId ?? `session_${openid}_${timestamp}`,
              user_info: { nickName: userProfile?.nickName || "未知用户", mbti: userProfile?.mbti || null },
              conversation: [
                { role: "user", content: message, timestamp },
                { role: "assistant", content: reply, timestamp: timestamp + 1 },
              ],
              message_count: 2,
              start_time: new Date().toISOString(),
              last_update_time: new Date().toISOString(),
              fallback_count: 0,
            });
          }
        }),
      // 检查是否需要生成摘要
      conversationId
        ? checkAndSummarizeIfNeeded(supabase, conversationId, fullHistory, DEEPSEEK_API_KEY)
        : Promise.resolve(),
    ]).catch((err) => console.error("后台存储异常:", err));

    return new Response(
      JSON.stringify({ success: true, reply, timestamp }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error: any) {
    console.error("DeepSeek API 调用失败:", error.message);

    const fallbackResponses = [
      "我理解你的感受，我们都是独特的个体，有着深刻的内心世界。",
      "这让我想起了一些深刻的思考，我们往往在寻找生活的意义和真实的自我。",
      "我能感受到你话语中的情感。你对情感有着敏锐的洞察力。",
      "这个问题很有趣！作为理想主义者，我们总是在思考如何让世界变得更美好。",
      "你的想法很有深度。我们倾向于用独特的视角看待世界。",
    ];
    const fallbackReply = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    const timestamp = Date.now();

    return new Response(
      JSON.stringify({
        success: false,
        reply: fallbackReply,
        timestamp,
        error: "当前使用模拟回复，请配置 DeepSeek API Key",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }
});
