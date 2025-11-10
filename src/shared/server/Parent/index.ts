import httpRequest, { IApiData } from "@shared/utils/request";

interface UpdateProfileParams {
  name?: string;
  phone?: string;
  avatar?: string;
}

interface ParentProfile {
  id: string;
  name: string;
  phone?: string;
  avatar?: string;
  children: any[];
  isActive: boolean;
}

interface UpdateProfileResponse extends IApiData {
  data: {
    parent: ParentProfile;
  };
}

interface GetProfileResponse extends IApiData {
  data: {
    parent: ParentProfile;
  };
}

class _ParentService {
  /**
   * 更新家长个人资料
   * @param params 更新参数
   */
  updateProfile(params: UpdateProfileParams) {
    return httpRequest.request<UpdateProfileResponse>({
      url: "/parent/profile",
      method: "PATCH",
      data: params,
    });
  }

  /**
   * 获取当前家长个人资料
   */
  getProfile() {
    return httpRequest.get<GetProfileResponse>("/parent/profile");
  }
}

const ParentService = new _ParentService();
export { ParentService, ParentProfile, UpdateProfileParams };
