import { View, Text, Image } from "@tarojs/components";
import { useEffect, useState } from "react";
import { observer } from "mobx-react";
import Taro from "@tarojs/taro";
import { AuthStore } from "@shared/store";
import { ParentService } from "@shared/server/Parent";
import "./index.scss";

const Home = observer(() => {
  const userInfo = AuthStore.userInfo;
  const children = userInfo && userInfo.children ? userInfo.children : [];
  const [isLoading, setIsLoading] = useState(false);

  // 页面加载时刷新用户信息
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!AuthStore.isLoggedIn) {
        return;
      }

      try {
        setIsLoading(true);
        const response = await ParentService.getProfile();

        if (response.code === 10000 && response.data && response.data.parent) {
          // 更新本地存储的用户信息
          await AuthStore.saveUserInfo(response.data.parent);
        }
      } catch (error) {
        console.error("获取用户信息失败:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <View className="home-page">
      <View className="home-content">
        {/* 家长中心卡片 */}
        <View className="parent-center-card">
          <View className="card-bg">
            <Text className="card-title">家长中心</Text>
            <Text className="card-subtitle">陪伴孩子快乐学习</Text>
          </View>
        </View>

        {/* 学生信息卡片列表 */}
        {children.map((child: any) => {
          const childName = child.name || "未命名";
          const childAvatar = child.avatar;
          const className = child.class && child.class.name ? child.class.name : "未分配班级";
          const studentId = child.studentId;
          const completedLessons = child.learningProgress && child.learningProgress.completedLessons ? child.learningProgress.completedLessons : 0;
          const totalLessons = child.learningProgress && child.learningProgress.totalLessons ? child.learningProgress.totalLessons : 0;
          const totalStars = child.learningProgress && child.learningProgress.totalStars ? child.learningProgress.totalStars : 0;
          const pendingLessons = totalLessons - completedLessons;
          const completionRate = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

          return (
            <View key={child._id || child.id} className="student-card">
              <View className="student-avatar">
                {childAvatar ? (
                  <Image
                    className="avatar-img"
                    src={childAvatar}
                    mode="aspectFill"
                  />
                ) : (
                  <Text className="avatar-text">
                    {childName.charAt(0)}
                  </Text>
                )}
              </View>
              <View className="student-info">
                <Text className="student-name">{childName}</Text>
                <Text className="student-class">
                  {className}
                  {studentId && ` • 学号: ${studentId}`}
                </Text>
              </View>

              <View className="stats-container">
                <View className="stat-item">
                  <Text className="stat-value">{completedLessons}</Text>
                  <Text className="stat-label">已完成</Text>
                </View>
                <View className="stat-item">
                  <Text className="stat-value">{pendingLessons}</Text>
                  <Text className="stat-label">待完成</Text>
                </View>
                <View className="stat-item">
                  <Text className="stat-value">{completionRate}%</Text>
                  <Text className="stat-label">完成率</Text>
                </View>
              </View>

              <View className="stars-badge">
                <Text className="star-icon">⭐</Text>
                <Text className="star-count">{totalStars}</Text>
              </View>

              <View className="action-buttons">
                <View className="action-btn">
                  <Text className="btn-icon">🏆</Text>
                  <Text className="btn-text">徽章</Text>
                </View>
                <View className="action-btn">
                  <Text className="btn-icon">📊</Text>
                  <Text className="btn-text">报告</Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* 最近活动 */}
        <View className="recent-activity">
          <Text className="section-title">最近活动</Text>

          <View className="activity-list">
            <View className="activity-item">
              <View className="activity-icon">
                <Image
                  className="icon-img"
                  src="https://via.placeholder.com/80x80"
                  mode="aspectFit"
                />
              </View>
              <View className="activity-info">
                <Text className="activity-title">字母A学习打卡</Text>
                <Text className="activity-time">1小时前</Text>
              </View>
            </View>

            <View className="activity-item">
              <View className="activity-icon">
                <Image
                  className="icon-img"
                  src="https://via.placeholder.com/80x80"
                  mode="aspectFit"
                />
              </View>
              <View className="activity-info">
                <Text className="activity-title">字母B学习打卡</Text>
                <Text className="activity-time">1小时前</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
});

export default Home;
