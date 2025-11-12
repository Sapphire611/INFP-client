import { View, Text, ScrollView, Button } from "@tarojs/components";
import { useState, useEffect } from "react";
import Taro, { useRouter } from "@tarojs/taro";
import { CourseService, Course } from "@shared/server/Course";
import "./index.scss";

const CourseDetail = () => {
  const router = useRouter();
  const courseId = router.params.id || "";
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (courseId) {
      fetchCourseDetail();
    }
  }, [courseId]);

  const fetchCourseDetail = async () => {
    try {
      setLoading(true);
      const course = await CourseService.getCourseDetail(courseId);

      if (course) {
        setCourse(course);
      } else {
        Taro.showToast({
          title: "加载失败",
          icon: "none",
        });
      }
    } catch (error) {
      console.error("获取课程详情失败:", error);
      Taro.showToast({
        title: "加载失败",
        icon: "none",
      });
    } finally {
      setLoading(false);
    }
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

  const handleOpenPDF = () => {
    if (course?.content?.presentations && course.content.presentations.length > 0) {
      const pdfUrl = course.content.presentations[0].url;

      // 下载PDF并打开
      Taro.downloadFile({
        url: pdfUrl,
        success: (res) => {
          if (res.statusCode === 200) {
            Taro.openDocument({
              filePath: res.tempFilePath,
              fileType: "pdf",
              success: () => {
                console.log("打开PDF成功");
              },
              fail: (err) => {
                console.error("打开PDF失败:", err);
                Taro.showToast({
                  title: "打开PDF失败",
                  icon: "none",
                });
              },
            });
          }
        },
        fail: (err) => {
          console.error("下载PDF失败:", err);
          Taro.showToast({
            title: "下载PDF失败",
            icon: "none",
          });
        },
      });
    }
  };

  if (loading) {
    return (
      <View className="course-detail-page">
        <View className="loading-container">
          <Text className="loading-text">加载中...</Text>
        </View>
      </View>
    );
  }

  if (!course) {
    return (
      <View className="course-detail-page">
        <View className="error-container">
          <Text className="error-icon">😕</Text>
          <Text className="error-text">课程不存在</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView className="course-detail-page" scrollY>
      {/* 课程头部 */}
      <View className="course-header">
        <View className="header-content">
          <View className="header-top">
            <View className="unit-badge">
              <Text className="unit-text">
                Unit {course.sequence.unit} / Lesson {course.sequence.lesson}
              </Text>
            </View>
            <View
              className="level-badge"
              style={{ backgroundColor: getLevelColor(course.level) }}
            >
              <Text className="level-text">{course.level}</Text>
            </View>
          </View>

          <Text className="course-title">{course.title}</Text>

          {course.metadata?.theme && (
            <Text className="course-theme">主题: {course.metadata.theme}</Text>
          )}
        </View>
      </View>

      {/* 课程信息卡片 */}
      <View className="info-section">
        <View className="info-card">
          <View className="info-row">
            <View className="info-item">
              <Text className="info-icon">⭐</Text>
              <View className="info-content">
                <Text className="info-label">难度</Text>
                <View className="difficulty-stars">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Text
                      key={i}
                      className={i < course.difficulty ? "star-active" : "star-inactive"}
                    >
                      {i < course.difficulty ? "★" : "☆"}
                    </Text>
                  ))}
                </View>
              </View>
            </View>

            <View className="info-item">
              <Text className="info-icon">⏱</Text>
              <View className="info-content">
                <Text className="info-label">时长</Text>
                <Text className="info-value">
                  {course.estimatedDuration} 分钟
                </Text>
              </View>
            </View>
          </View>

          <View className="info-row">
            <View className="info-item">
              <Text className="info-icon">🎯</Text>
              <View className="info-content">
                <Text className="info-label">适合年级</Text>
                <Text className="info-value">
                  {course.targetGrades.join(", ")}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* 课程描述 */}
      <View className="section">
        <View className="section-header">
          <Text className="section-icon">📖</Text>
          <Text className="section-title">课程简介</Text>
        </View>
        <View className="section-content">
          <Text className="description-text">{course.description}</Text>
        </View>
      </View>

      {/* 学习目标 */}
      {course.content?.objectives && course.content.objectives.length > 0 && (
        <View className="section">
          <View className="section-header">
            <Text className="section-icon">🎯</Text>
            <Text className="section-title">学习目标</Text>
          </View>
          <View className="section-content">
            {course.content.objectives.map((objective, index) => (
              <View key={index} className="objective-item">
                <Text className="objective-bullet">•</Text>
                <Text className="objective-text">{objective}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* PDF资料 */}
      {course.content?.presentations &&
        course.content.presentations.length > 0 && (
          <View className="section">
            <View className="section-header">
              <Text className="section-icon">📄</Text>
              <Text className="section-title">课程资料</Text>
            </View>
            <View className="section-content">
              <View className="pdf-card" onClick={handleOpenPDF}>
                <View className="pdf-icon">📄</View>
                <View className="pdf-info">
                  <Text className="pdf-title">
                    {course.content.presentations[0].title}
                  </Text>
                  <Text className="pdf-hint">点击查看PDF资料</Text>
                </View>
                <Text className="pdf-arrow">→</Text>
              </View>
            </View>
          </View>
        )}

      {/* 底部占位 */}
      <View className="bottom-spacer" />
    </ScrollView>
  );
};

export default CourseDetail;
