import { View, Text, Button, Image } from "@tarojs/components";
import { observer } from "mobx-react";
import Taro from "@tarojs/taro";
import { AuthStore } from "@shared/store";
import { getMbtiColors, getMbtiEmoji } from "@shared/utils";
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
      icon: "🌱",
      title: "个人资料",
      subtitle: "编辑你的信息",
      arrow: true,
    },
    {
      id: 2,
      icon: "🧠",
      title: "MBTI 设置",
      subtitle: userInfo?.mbti || "设置你的人格类型",
      arrow: true,
    },
    {
      id: 3,
      icon: "💭",
      title: "关于 MBTI",
      subtitle: "了解人格分类理论",
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
                <Text className="avatar-icon">🌱</Text>
              </View>
              <Text className="welcome-text">欢迎来到 INFP的生活日记</Text>
              <Text className="login-tip">登录后开启你的专属空间</Text>
              <Button className="wechat-login-btn" onClick={handleWechatLogin}>
                <Text className="wechat-icon">📱</Text>
                <Text className="btn-text">微信登录</Text>
              </Button>
            </View>
          ) : (
            // 已登录状态
            <View className="logged-in">
              <View className="user-header">
                {userInfo?.avatarUrl ? (
                  <Image
                    className="user-avatar"
                    src={userInfo.avatarUrl}
                    mode="aspectFill"
                  />
                ) : (
                  <View className="user-avatar-placeholder">
                    <Text className="avatar-text">
                      {userInfo?.nickName?.charAt(0) || "I"}
                    </Text>
                  </View>
                )}
                <View className="user-info">
                  <Text className="user-nickname">{userInfo?.nickName || "INFP 用户"}</Text>
                  {userInfo?.mbti ? (
                    <View
                      className="mbti-badge"
                      style={{
                        background: getMbtiColors(userInfo.mbti).light,
                        borderColor: getMbtiColors(userInfo.mbti).primary,
                      }}
                    >
                      <Text className="mbti-emoji">{getMbtiEmoji(userInfo.mbti)}</Text>
                      <Text
                        className="mbti-text"
                        style={{ color: getMbtiColors(userInfo.mbti).primary }}
                      >
                        {userInfo.mbti}
                      </Text>
                    </View>
                  ) : (
                    <Text className="user-tag">未设置 MBTI</Text>
                  )}
                </View>
              </View>
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
                // 需要登录的功能
                if (!isLoggedIn && (item.id === 1 || item.id === 2)) {
                  Taro.showToast({
                    title: "请先登录",
                    icon: "none",
                  });
                  return;
                }

                // 个人资料
                if (item.id === 1) {
                  Taro.navigateTo({ url: "/pages/profile-edit/index" });
                  return;
                }

                // MBTI 设置 - 直接跳转到设置页面
                if (item.id === 2) {
                  Taro.navigateTo({ url: "/pages/mbti-setting/index" });
                  return;
                }

                // 关于 MBTI - 显示介绍弹窗
                if (item.id === 3) {
                  Taro.showModal({
                    title: "关于 MBTI",
                    content:
                      "MBTI（迈尔斯-布里格斯类型指标）是一种人格分类理论，基于荣格的心理类型理论发展而来。\n\n它将人格分为16种类型，通过4个维度来描述：\n• 外向(E) vs 内向(I)\n• 感觉(S) vs 直觉(N)\n• 思考(T) vs 情感(F)\n• 判断(J) vs 知觉(P)\n\n每种类型都有独特的特质和优势，帮助你更好地认识自己和他人。",
                    showCancel: false,
                    confirmText: "了解了",
                  });
                  return;
                }
              }}
            >
              <View className="menu-left">
                <Text className="menu-icon">{item.icon}</Text>
                <View className="menu-text">
                  <Text className="menu-title">{item.title}</Text>
                  <Text
                    className="menu-subtitle"
                    style={
                      item.id === 2 && userInfo?.mbti
                        ? { color: getMbtiColors(userInfo.mbti).primary }
                        : {}
                    }
                  >
                    {item.subtitle}
                  </Text>
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
