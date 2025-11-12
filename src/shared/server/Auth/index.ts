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

interface WechatPhoneParams {
  code: string;
}

interface WechatPhoneResponse extends IApiData {
  data: {
    phoneNumber: string;
    purePhoneNumber: string;
    countryCode: string;
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

  /**
   * 获取微信绑定的手机号
   * @param params code 参数
   */
  getWechatPhone(params: WechatPhoneParams) {
    return httpRequest.post<WechatPhoneResponse>("/auth/wechat-phone", params);
  }
}

const AuthService = new _AuthService();
export { AuthService, ParentInfo, WechatLoginResponse };
