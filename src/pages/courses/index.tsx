import { View, Text, ScrollView } from "@tarojs/components";
import { useState, useEffect, useCallback } from "react";
import Taro from "@tarojs/taro";
import { CourseService } from "@shared/server/Course";
import "./index.scss";

interface Course {
  _id: string;
  title: string;
  description: string;
  level: string;
  targetGrades: string[];
  sequence: {
    unit: number;
    lesson: number;
  };
  metadata: {
    theme: string;
  };
  difficulty: number;
  estimatedDuration: number;
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeLevel, setActiveLevel] = useState("all");

  const fetchCourses = useCallback(async () => {
    try {
      setLoading(true);

      const params: any = {
        limit: 100,
        isActive: true,
      };

      if (activeLevel !== "all") {
        params.level = activeLevel;
      }

      const response = await CourseService.getCourses(params);

      if (response && response.data) {
        setCourses(response.data || []);
      } else {
        Taro.showToast({
          title: "加载失败",
          icon: "none",
        });
      }
    } catch (error) {
      console.error("获取课程失败:", error);
      Taro.showToast({
        title: "加载失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
  }, [activeLevel]);

  useEffect(() => {
    fetchCourses();
  }, [fetchCourses]);

  const handleCourseClick = (courseId: string) => {
    Taro.navigateTo({
      url: `/pages/courses/detail/index?id=${courseId}`,
    });
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner":
        return "#4ade80";
      case "Elementary":
        return "#60a5fa";
      case "Intermediate":
        return "#f59e0b";
      default:
        return "#94a3b8";
    }
  };

  const levelTabs = [
    { key: "all", label: "全部" },
    { key: "Beginner", label: "入门" },
    { key: "Elementary", label: "初级" },
    { key: "Intermediate", label: "中级" },
  ];

  if (loading) {
    return (
      <View className="courses-page">
        <View className="loading-container">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="courses-page">
      {/* 等级筛选 */}
      <View className="level-tabs">
        {levelTabs.map((tab) => (
          <View
            key={tab.key}
            className={`tab-item ${activeLevel === tab.key ? "active" : ""}`}
            onClick={() => setActiveLevel(tab.key)}
          >
            <Text className="tab-text">{tab.label}</Text>
          </View>
        ))}
      </View>

      {/* 课程列表 */}
      <View className="courses-container-wrapper">
        <View className="courses-container">
        {courses.length === 0 ? (
          <View className="empty-container">
            <Text className="empty-icon">📚</Text>
            <Text className="empty-text">暂无课程</Text>
          </View>
        ) : (
          <View className="courses-list">
            {courses.map((course) => (
              <View
                key={course._id}
                className="course-card"
                onClick={() => handleCourseClick(course._id)}
              >
                {/* 课程头部 */}
                <View className="course-header">
                  <View className="unit-info">
                    <Text className="unit-text">
                      Unit {course.sequence?.unit || 0}
                    </Text>
                    <Text className="lesson-text">
                      Lesson {course.sequence?.lesson || 0}
                    </Text>
                  </View>
                  <View
                    className="level-badge"
                    style={{ backgroundColor: getLevelColor(course.level) }}
                  >
                    <Text className="level-text">{course.level}</Text>
                  </View>
                </View>

                {/* 课程内容 */}
                <View className="course-content">
                  <Text className="course-title">{course.title}</Text>
                  {course.metadata?.theme && (
                    <Text className="course-theme">
                      主题: {course.metadata.theme}
                    </Text>
                  )}
                  <Text className="course-description">
                    {course.description}
                  </Text>
                </View>

                {/* 课程底部信息 */}
                <View className="course-footer">
                  <View className="difficulty">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Text
                        key={i}
                        className={i < (course.difficulty || 0) ? "star-active" : "star-inactive"}
                      >
                        {i < (course.difficulty || 0) ? "★" : "☆"}
                      </Text>
                    ))}
                  </View>
                  <Text className="duration">
                    ⏱ {course.estimatedDuration || 0} 分钟
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
        </View>
      </View>
    </View>
  );
};

export default Courses;
