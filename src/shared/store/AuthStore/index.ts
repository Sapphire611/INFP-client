import { makeAutoObservable } from "mobx";
import Taro from "@tarojs/taro";

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
   * 微信登录（使用云函数）
   */
  async wechatLogin(nickName?: string, avatarUrl?: string) {
    try {
      this.isLoading = true;

      // 调用云函数登录
      // 如果提供了昵称和头像，则传递给云函数
      const data: any = {};
      if (nickName) {
        data.nickName = nickName;
      }
      if (avatarUrl) {
        data.avatarUrl = avatarUrl;
      }

      const res = await Taro.cloud.callFunction({
        name: "login",
        data,
      });

      console.log("云函数登录结果:", res);

      if (res.result && res.result.success) {
        const { userInfo } = res.result;

        // 保存用户信息
        const wechatUserInfo: WechatUserInfo = {
          openid: userInfo.openid,
          nickName: userInfo.nickName || "INFP 用户",
          avatarUrl: userInfo.avatarUrl || "",
          mbti: userInfo.mbti || "",
        };

        await this.saveUserInfo(wechatUserInfo);

        Taro.showToast({
          title: "登录成功",
          icon: "success",
        });

        return true;
      } else {
        throw new Error(res.result?.error || "登录失败");
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
