import httpRequest, { IApiData } from "@shared/utils/request";

interface WechatLoginParams {
  code: string;
  nickname?: string;
  avatarUrl?: string;
}

interface ParentInfo {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  children: any[];
  isActive: boolean;
}

interface WechatLoginResponse extends IApiData {
  data: {
    token: string;
    parent: ParentInfo;
  };
}

class _AuthService {
  /**
   * 微信登录
   * @param params 登录参数
   */
  wechatLogin(params: WechatLoginParams) {
    return httpRequest.post<WechatLoginResponse>("/auth/wechat-login", params);
  }
}

const AuthService = new _AuthService();
export { AuthService, ParentInfo, WechatLoginResponse };
