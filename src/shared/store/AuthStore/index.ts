import { makeAutoObservable } from "mobx";
import Taro from "@tarojs/taro";
import { ChatStore } from "../ChatStore";
import { supabase, getAppNumber } from "@shared/utils/supabase";

// 微信用户信息接口
export interface WechatUserInfo {
  openid?: string;
  nickName: string;
  avatarUrl: string;
  gender?: number;
  mbti?: string;
}

const USER_INFO_KEY = "infp_user_info";

class _AuthStore {
  userInfo: WechatUserInfo | null = null;
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadLocalData();
  }

  /**
   * 从本地存储加载数据
   */
  async loadLocalData() {
    try {
      const userInfo = await Taro.getStorage({ key: USER_INFO_KEY })
        .then(res => JSON.parse(res.data))
        .catch(() => null);

      if (userInfo) {
        this.userInfo = userInfo;
      }
    } catch (error) {
      console.error("Failed to load local data:", error);
    }
  }

  /**
   * 保存用户信息到本地存储
   */
  async saveUserInfo(userInfo: WechatUserInfo) {
    this.userInfo = userInfo;
    try {
      await Taro.setStorage({ key: USER_INFO_KEY, data: JSON.stringify(userInfo) });
    } catch (error) {
      console.error("Failed to save user info:", error);
    }
  }

  /**
   * 微信登录（使用 Supabase Edge Function）
   */
  async wechatLogin(nickName?: string, avatarUrl?: string) {
    try {
      this.isLoading = true;

      // 获取微信登录 code
      const loginResult = await new Promise<{ code?: string; errMsg: string }>((resolve) => {
        Taro.login({
          success: (res) => resolve({ code: res.code, errMsg: res.errMsg }),
          fail: (err) => resolve({ errMsg: err.errMsg }),
        });
      });

      if (!loginResult.code) {
        throw new Error("获取登录凭证失败");
      }

      // 调用 Supabase Edge Function 进行微信登录
      const { data, error } = await supabase.functions.invoke("wechat-login", {
        body: {
          code: loginResult.code,
          nickName: nickName,
          avatarUrl: avatarUrl,
          appNumber: getAppNumber(),
        },
      });

      console.log("Supabase Edge Function 登录结果:", data, error);

      if (error) {
        throw new Error(error.message || "登录失败");
      }

      if (data && data.success) {
        const { userInfo } = data;

        // 保存用户信息
        const wechatUserInfo: WechatUserInfo = {
          openid: userInfo.openid,
          nickName: userInfo.nickName || "INFP 用户",
          avatarUrl: userInfo.avatarUrl || "",
          mbti: userInfo.mbti || "",
        };

        await this.saveUserInfo(wechatUserInfo);

        // 登录成功后清除未登录状态下的聊天消息
        await ChatStore.clearMessages();

        Taro.showToast({
          title: "登录成功",
          icon: "success",
        });

        return true;
      } else {
        throw new Error(data?.error || "登录失败");
      }
    } catch (error: any) {
      console.error("微信登录失败:", error);
      Taro.showToast({
        title: error.message || "登录失败，请重试",
        icon: "none",
      });
      return false;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 退出登录
   */
  async logout() {
    this.userInfo = null;
    try {
      await Taro.removeStorage({ key: USER_INFO_KEY });

      // 退出登录时清除聊天消息
      await ChatStore.clearMessages();

      Taro.showToast({
        title: "已退出登录",
        icon: "success",
      });
    } catch (error) {
      console.error("Failed to clear storage:", error);
    }
  }

  /**
   * 检查是否已登录
   */
  get isLoggedIn() {
    return !!this.userInfo;
  }
}

export const AuthStore = new _AuthStore();
