import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface WechatLoginRequest {
  code: string;
  nickName?: string;
  avatarUrl?: string;
  appNumber?: string; // 小程序编号：'1' = INFP Notebook, '2' = Chat
}

interface WechatSessionResponse {
  openid?: string;
  session_key?: string;
  unionid?: string;
  errcode?: number;
  errmsg?: string;
}

serve(async (req) => {
  // 处理 CORS preflight 请求
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const {
      code,
      nickName,
      avatarUrl,
      appNumber = "2",
    }: WechatLoginRequest = await req.json();

    if (!code) {
      throw new Error("缺少微信登录 code");
    }

    // 调试：打印所有环境变量
    console.log("=== Edge Function 环境变量调试 ===");
    console.log("appNumber:", appNumber);
    console.log("所有环境变量:", Object.keys(Deno.env.toObject()));
    console.log(
      "WECHAT_APPID_1:",
      Deno.env.get("WECHAT_APPID_1") ? "已设置" : "未设置",
    );
    console.log(
      "WECHAT_SECRET_1:",
      Deno.env.get("WECHAT_SECRET_1") ? "已设置" : "未设置",
    );
    console.log(
      "WECHAT_APPID_2:",
      Deno.env.get("WECHAT_APPID_2") ? "已设置" : "未设置",
    );
    console.log(
      "WECHAT_SECRET_2:",
      Deno.env.get("WECHAT_SECRET_2") ? "已设置" : "未设置",
    );
    console.log("================================");

    // 根据 appNumber 从环境变量（Secrets）中读取对应的小程序配置
    const WECHAT_APPID = Deno.env.get(`WECHAT_APPID_${appNumber}`);
    const WECHAT_SECRET = Deno.env.get(`WECHAT_SECRET_${appNumber}`);

    if (!WECHAT_APPID || !WECHAT_SECRET) {
      const missingConfigs = [];
      if (!WECHAT_APPID) missingConfigs.push(`WECHAT_APPID_${appNumber}`);
      if (!WECHAT_SECRET) missingConfigs.push(`WECHAT_SECRET_${appNumber}`);
      console.error(`缺少微信配置：${missingConfigs.join(", ")}`);
      throw new Error(
        `服务器配置错误：缺少 ${missingConfigs.join(" 和 ")} 环境变量，请在 Supabase Dashboard -> Edge Functions -> secrets 中配置`,
      );
    }

    console.log(`使用小程序配置：APP_${appNumber} (${WECHAT_APPID})`);

    // 调用微信接口，用 code 换取 openid 和 session_key
    const wechatUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${WECHAT_APPID}&secret=${WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`;

    const wechatResponse = await fetch(wechatUrl);
    const wechatData: WechatSessionResponse = await wechatResponse.json();

    if (wechatData.errcode) {
      console.error("微信登录失败:", wechatData);
      console.error("使用的 APPID:", WECHAT_APPID);
      console.error("SECRET :", WECHAT_SECRET);
      throw new Error(
        `微信登录失败: ${wechatData.errmsg} (错误码: ${wechatData.errcode})`,
      );
    }

    const { openid, unionid } = wechatData;

    if (!openid) {
      throw new Error("获取 openid 失败");
    }

    // 初始化 Supabase 客户端
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 查询用户是否已存在
    const { data: existingUser, error: queryError } = await supabase
      .from("wechat_users")
      .select("*")
      .eq("openid", openid)
      .single();

    let userData;

    if (queryError && queryError.code !== "PGRST116") {
      // PGRST116 表示没有找到记录，其他错误需要抛出
      console.error("查询用户失败:", queryError);
      throw new Error(queryError.message);
    }

    if (existingUser) {
      // 用户已存在，更新最后登录时间和用户信息
      const updateData: any = {
        last_login_at: new Date().toISOString(),
      };

      // 如果提供了新的昵称或头像，则更新
      if (nickName) {
        updateData.wechat_nickname = nickName;
      }
      if (avatarUrl) {
        updateData.wechat_avatar_url = avatarUrl;
      }

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

      userData = updatedUser;
    } else {
      // 新用户，创建用户记录
      const { data: newUser, error: insertError } = await supabase
        .from("wechat_users")
        .insert({
          openid: openid,
          unionid: unionid,
          wechat_nickname: nickName || "新用户",
          wechat_avatar_url: avatarUrl || "",
          is_active: true,
          last_login_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertError) {
        console.error("创建用户失败:", insertError);
        throw new Error(insertError.message);
      }

      userData = newUser;
    }

    // 返回用户信息
    return new Response(
      JSON.stringify({
        success: true,
        userInfo: {
          openid: userData.openid,
          nickName: userData.wechat_nickname || "INFP 用户",
          avatarUrl: userData.wechat_avatar_url || "",
          mbti: userData.mbti || "",
          id: userData.id,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      },
    );
  } catch (error: any) {
    console.error("登录失败:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "登录失败，请重试",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      },
    );
  }
});