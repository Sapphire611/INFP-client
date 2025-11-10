import { makeAutoObservable } from "mobx";
import Taro from "@tarojs/taro";
import { AuthService, ParentInfo } from "@shared/server/Auth";

const TOKEN_KEY = "jxrays_token";
const USER_INFO_KEY = "jxrays_user_info";

class _AuthStore {
  token = "";
  userInfo: ParentInfo | null = null;
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
      const token = await Taro.getStorage({ key: TOKEN_KEY }).then(res => res.data).catch(() => "");
      const userInfo = await Taro.getStorage({ key: USER_INFO_KEY }).then(res => JSON.parse(res.data)).catch(() => null);

      if (token) {
        this.token = token;
      }
      if (userInfo) {
        this.userInfo = userInfo;
      }
    } catch (error) {
      console.error("Failed to load local data:", error);
    }
  }

  /**
   * 保存 token 到本地存储
   */
  async saveToken(token: string) {
    this.token = token;
    try {
      await Taro.setStorage({ key: TOKEN_KEY, data: token });
    } catch (error) {
      console.error("Failed to save token:", error);
    }
  }

  /**
   * 保存用户信息到本地存储
   */
  async saveUserInfo(userInfo: ParentInfo) {
    this.userInfo = userInfo;
    try {
      await Taro.setStorage({ key: USER_INFO_KEY, data: JSON.stringify(userInfo) });
    } catch (error) {
      console.error("Failed to save user info:", error);
    }
  }

  /**
   * 微信登录
   * @param nickname 用户昵称（可选）
   * @param avatarUrl 用户头像（可选）
   */
  async wechatLogin(nickname?: string, avatarUrl?: string) {
    try {
      this.isLoading = true;

      // 获取微信登录 code
      const { code } = await Taro.login();

      if (!code) {
        throw new Error("获取微信登录凭证失败");
      }

      // 调用后端接口
      const response = await AuthService.wechatLogin({
        code,
        nickname,
        avatarUrl,
      });

      if (response.data && response.data.token) {
        await this.saveToken(response.data.token);
        await this.saveUserInfo(response.data.parent);

        Taro.showToast({
          title: "登录成功",
          icon: "success",
        });

        return true;
      } else {
        throw new Error("登录失败：未获取到 token");
      }
    } catch (error: any) {
      console.error("微信登录失败:", error);
      Taro.showToast({
        title: error.message || "登录失败",
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
    this.token = "";
    this.userInfo = null;
    try {
      await Taro.removeStorage({ key: TOKEN_KEY });
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
    return !!this.token;
  }
}

export const AuthStore = new _AuthStore();
