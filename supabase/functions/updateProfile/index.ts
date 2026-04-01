import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface UpdateProfileRequest {
  nickName?: string;
  avatarUrl?: string;
  mbti?: string;
  openid: string;
}

serve(async (req) => {
  // 处理 CORS preflight 请求
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { nickName, avatarUrl, mbti, openid }: UpdateProfileRequest = await req.json();

    if (!openid) {
      throw new Error("缺少用户 openid");
    }

    console.log('收到的更新数据:', { nickName, avatarUrl, mbti });
    console.log('用户 OPENID:', openid);

    // 初始化 Supabase 客户端
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 构建更新数据
    const updateData: any = {
      last_login_at: new Date().toISOString(), // 更新登录时间
    };

    if (nickName) {
      updateData.wechat_nickname = nickName;
    }
    if (avatarUrl) {
      updateData.wechat_avatar_url = avatarUrl;
    }
    if (mbti !== undefined) {
      updateData.mbti = mbti;
      console.log('准备更新 MBTI:', mbti);
    }

    // 查询用户是否存在
    const { data: existingUser, error: queryError } = await supabase
      .from("wechat_users")
      .select("*")
      .eq("openid", openid)
      .single();

    if (queryError) {
      console.error("查询用户失败:", queryError);
      throw new Error("用户不存在");
    }

    console.log('更新前的用户数据:', existingUser);

    // 更新用户信息
    const { data: updatedUser, error: updateError } = await supabase
      .from("wechat_users")
      .update(updateData)
      .eq("openid", openid)
      .select()
      .single();

    if (updateError) {
      console.error("更新用户失败:", updateError);
      throw new Error(updateError.message);
    }

    console.log('更新后的用户数据:', updatedUser);

    // 返回更新后的用户信息
    return new Response(
      JSON.stringify({
        success: true,
        userInfo: {
          openid: updatedUser.openid,
          nickName: updatedUser.wechat_nickname,
          avatarUrl: updatedUser.wechat_avatar_url,
          mbti: updatedUser.mbti || '',
          id: updatedUser.id
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("更新用户信息失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "更新失败"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});