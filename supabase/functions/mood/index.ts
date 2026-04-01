import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface MoodRequest {
  type: 'add' | 'get';
  data?: {
    mood: string;
    moodText: string;
    date: string;
  };
  openid?: string;
}

serve(async (req) => {
  // 处理 CORS preflight 请求
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 初始化 Supabase 客户端
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, data, openid }: MoodRequest = await req.json();

    if (type === 'add') {
      const { mood, moodText, date } = data || {};
      console.log('添加记录:', { openid, mood, moodText, date });

      if (!openid) {
        throw new Error("缺少用户 openid");
      }

      if (!mood || !date) {
        throw new Error("缺少必要参数：mood 和 date");
      }

      // 先检查今天是否已有记录
      const { data: existingRecord, error: queryError } = await supabase
        .from("mood_records")
        .select("*")
        .eq("openid", openid)
        .eq("date", date)
        .single();

      if (queryError && queryError.code !== "PGRST116") {
        console.error("查询记录失败:", queryError);
      }

      if (existingRecord) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "今日已记录",
            alreadyExists: true
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
          },
        );
      }

      // 添加新记录
      const { data: addResult, error: insertError } = await supabase
        .from("mood_records")
        .insert({
          openid: openid,
          mood: mood,
          mood_text: moodText,
          date: date
        })
        .select()
        .single();

      if (insertError) {
        console.error("添加失败:", insertError);
        throw new Error(insertError.message);
      }

      console.log('添加结果:', addResult);

      return new Response(
        JSON.stringify({
          success: true,
          data: addResult
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    } else if (type === 'get') {
      if (!openid) {
        throw new Error("缺少用户 openid");
      }

      // 获取最近1个月的记录
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: records, error } = await supabase
        .from("mood_records")
        .select("*")
        .eq("openid", openid)
        .gte("date", thirtyDaysAgoStr)
        .order("date", { ascending: false })
        .limit(100);

      if (error) {
        console.error("获取记录失败:", error);
        throw new Error(error.message);
      }

      // 转换数据格式以兼容前端
      const formattedRecords = (records || []).map((r: any) => ({
        id: r.id,
        mood: r.mood,
        moodText: r.mood_text,
        date: r.date,
        createTime: r.created_at
      }));

      return new Response(
        JSON.stringify({
          success: true,
          data: formattedRecords
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "Unknown type"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  } catch (error: any) {
    console.error("请求失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "请求失败"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});