import { View, Text, Button, Image } from "@tarojs/components";
import { observer } from "mobx-react";
import Taro from "@tarojs/taro";
import { AuthStore } from "@shared/store";
import "./index.scss";

const Profile = observer(() => {
  // 从 AuthStore 获取登录状态和用户信息
  const isLoggedIn = AuthStore.isLoggedIn;
  const userInfo = AuthStore.userInfo;

  // 处理微信登录 - 跳转到登录页
  const handleWechatLogin = () => {
    Taro.navigateTo({ url: "/pages/login/index" });
  };

  // 退出登录
  const handleLogout = () => {
    Taro.showModal({
      title: "提示",
      content: "确定要退出登录吗？",
      success: async (res) => {
        if (res.confirm) {
          await AuthStore.logout();
        }
      },
    });
  };

  // 菜单项配置
  const menuItems = [
    {
      id: 1,
      icon: "👤",
      title: "个人信息",
      subtitle: "完善个人资料",
      arrow: true,
    },
    {
      id: 2,
      icon: "📱",
      title: "账号设置",
      subtitle: "账号安全设置",
      arrow: true,
    },
    {
      id: 3,
      icon: "🔔",
      title: "消息通知",
      subtitle: "管理通知设置",
      arrow: true,
    },
    {
      id: 4,
      icon: "❓",
      title: "帮助与反馈",
      subtitle: "常见问题",
      arrow: true,
    },
    {
      id: 5,
      icon: "ℹ️",
      title: "关于我们",
      subtitle: "版本 1.0.0",
      arrow: true,
    },
  ];

  return (
    <View className="profile-page">
      <View className="page-content">
        {/* 用户信息区域 */}
        <View className="user-section">
          {!isLoggedIn ? (
            // 未登录状态
            <View className="not-login">
              <View className="avatar-placeholder">
                <Text className="avatar-icon">👤</Text>
              </View>
              <Text className="welcome-text">欢迎来到家长中心</Text>
              <Text className="login-tip">登录后查看更多内容</Text>
              <Button className="wechat-login-btn" onClick={handleWechatLogin}>
                <Text className="wechat-icon">📱</Text>
                <Text className="btn-text">微信授权登录</Text>
              </Button>
            </View>
          ) : (
            // 已登录状态
            <View className="logged-in">
              <View className="user-header">
                {userInfo?.avatar ? (
                  <Image
                    className="user-avatar"
                    src={userInfo.avatar}
                    mode="aspectFill"
                  />
                ) : (
                  <View className="user-avatar-placeholder">
                    <Text className="avatar-text">
                      {userInfo?.name?.charAt(0) || "用"}
                    </Text>
                  </View>
                )}
                <View className="user-info">
                  <Text className="user-nickname">{userInfo?.name || "家长"}</Text>
                  {userInfo?.phone && (
                    <Text className="user-phone">{userInfo.phone}</Text>
                  )}
                </View>
              </View>

              {/* 数据统计 */}
              <View className="stats-section">
                <View className="stat-item">
                  <Text className="stat-value">{userInfo?.children?.length || 0}</Text>
                  <Text className="stat-label">孩子</Text>
                </View>
                <View className="stat-divider" />
                <View className="stat-item">
                  <Text className="stat-value">0</Text>
                  <Text className="stat-label">任务</Text>
                </View>
                <View className="stat-divider" />
                <View className="stat-item">
                  <Text className="stat-value">0</Text>
                  <Text className="stat-label">星星</Text>
                </View>
              </View>

              {/* 关联的孩子列表 */}
              {userInfo?.children && userInfo.children.length > 0 && (
                <View className="children-section">
                  <Text className="children-title">我的孩子</Text>
                  <View className="children-list">
                    {userInfo.children.map((child: any) => (
                      <View key={child._id || child.id} className="child-card">
                        <View className="child-avatar-container">
                          {child.avatar ? (
                            <Image
                              className="child-avatar"
                              src={child.avatar}
                              mode="aspectFill"
                            />
                          ) : (
                            <View className="child-avatar-placeholder">
                              <Text className="child-avatar-text">
                                {child.name?.charAt(0) || "孩"}
                              </Text>
                            </View>
                          )}
                        </View>
                        <View className="child-info">
                          <Text className="child-name">{child.name || "未命名"}</Text>
                          <Text className="child-detail">
                            {child.studentId && `学号: ${child.studentId}`}
                            {child.class?.name && ` • ${child.class.name}`}
                          </Text>
                        </View>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* 功能菜单列表 */}
        <View className="menu-section">
          {menuItems.map((item) => (
            <View
              key={item.id}
              className="menu-item"
              onClick={() => {
                if (!isLoggedIn && item.id <= 3) {
                  Taro.showToast({
                    title: "请先登录",
                    icon: "none",
                  });
                  return;
                }

                // 个人信息
                if (item.id === 1) {
                  Taro.navigateTo({ url: "/pages/profile-edit/index" });
                  return;
                }

                // 其他菜单项暂时显示提示
                Taro.showToast({
                  title: `${item.title}功能开发中`,
                  icon: "none",
                });
              }}
            >
              <View className="menu-left">
                <Text className="menu-icon">{item.icon}</Text>
                <View className="menu-text">
                  <Text className="menu-title">{item.title}</Text>
                  <Text className="menu-subtitle">{item.subtitle}</Text>
                </View>
              </View>
              {item.arrow && <Text className="menu-arrow">›</Text>}
            </View>
          ))}
        </View>

        {/* 退出登录按钮 */}
        {isLoggedIn && (
          <View className="logout-section">
            <Button className="logout-btn" onClick={handleLogout}>
              退出登录
            </Button>
          </View>
        )}
      </View>
    </View>
  );
});

export default Profile;
