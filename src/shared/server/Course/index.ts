import Taro from "@tarojs/taro";
import { apiUrl } from "@shared/utils/request";

interface CourseSequence {
  unit: number;
  lesson: number;
  order: number;
}

interface CourseMetadata {
  theme?: string;
  code?: string;
  tags?: string[];
}

interface CourseContent {
  objectives?: string[];
  presentations?: Array<{
    title: string;
    url: string;
    pageCount: number;
    thumbnail: string;
  }>;
}

interface Course {
  _id: string;
  title: string;
  description: string;
  level: string;
  targetGrades: string[];
  sequence: CourseSequence;
  metadata: CourseMetadata;
  content: CourseContent;
  difficulty: number;
  estimatedDuration: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CoursesResponse {
  data: Course[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

interface GetCoursesParams {
  page?: number;
  limit?: number;
  search?: string;
  level?: string;
  grade?: string;
  unit?: number;
  isActive?: boolean;
}

class _CourseService {
  /**
   * 获取课程列表
   * @param params 查询参数
   */
  async getCourses(params?: GetCoursesParams) {
    const queryString = params
      ? "?" +
        Object.entries(params)
          .filter(([_, value]) => value !== undefined)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join("&")
      : "";

    const url = `${apiUrl}/courses${queryString}`;

    return Taro.request({
      url,
      method: "GET",
    })
      .then((response) => {
        // 拦截器已经处理过响应，response 是业务数据格式 {code, msg, data}
        // data 包含 {data: Course[], pagination: {...}}
        if (response && response.data) {
          return response.data as CoursesResponse;
        }

        throw new Error("Unexpected response format");
      })
      .catch((error) => {
        console.error("Request error:", error);
        throw error;
      });
  }

  /**
   * 获取课程详情
   * @param id 课程ID
   */
  async getCourseDetail(id: string) {
    const url = `${apiUrl}/courses/${id}`;

    return Taro.request({
      url,
      method: "GET",
    })
      .then((response) => {
        // 拦截器已经处理过响应，response 是业务数据格式 {code, msg, data}
        if (response && response.data) {
          return response.data as Course;
        }

        throw new Error("Unexpected response format");
      })
      .catch((error) => {
        console.error("Request error:", error);
        throw error;
      });
  }
}

const CourseService = new _CourseService();
export { CourseService, Course, GetCoursesParams };
