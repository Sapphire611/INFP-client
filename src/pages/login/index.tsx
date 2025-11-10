import { View, Button, Text } from "@tarojs/components";
import { observer } from "mobx-react";
import Taro from "@tarojs/taro";
import { AuthStore } from "@shared/store";
import "./index.scss";

const Login = observer(() => {
  /**
   * 微信一键登录
   */
  const handleWechatLogin = async () => {
    // 直接使用 openid 登录，不获取用户信息
    // 用户可以后续在个人中心完善昵称和头像
    const success = await AuthStore.wechatLogin();
    if (success) {
      // 登录成功后返回上一页或跳转到首页
      const pages = Taro.getCurrentPages();
      if (pages.length > 1) {
        Taro.navigateBack();
      } else {
        Taro.switchTab({ url: "/pages/home/index" });
      }
    }
  };

  return (
    <View className="login-page">
      {/* 装饰性背景圆圈 */}
      <View className="bg-decoration">
        <View className="circle circle-1"></View>
        <View className="circle circle-2"></View>
        <View className="circle circle-3"></View>
      </View>

      <View className="login-container">
        {/* Logo 区域 */}
        <View className="logo-container">
          <View className="logo">
            <Text className="logo-emoji">🎓</Text>
          </View>
          <Text className="logo-title">雷式幼儿园</Text>
          <View className="logo-underline"></View>
        </View>

        {/* 欢迎文字 */}
        <View className="welcome-text">
          <Text className="title">欢迎使用</Text>
          <Text className="subtitle">家长服务平台</Text>
          <Text className="description">让家园沟通更便捷</Text>
        </View>

        {/* 登录按钮 */}
        <View className="login-button-container">
          <Button
            className="login-button"
            onClick={handleWechatLogin}
            loading={AuthStore.isLoading}
            disabled={AuthStore.isLoading}
          >
            <View className="button-content">
              {!AuthStore.isLoading && <Text className="wechat-icon">💬</Text>}
              <Text className="button-text">
                {AuthStore.isLoading ? "登录中..." : "微信一键登录"}
              </Text>
            </View>
          </Button>

          {/* 功能亮点 */}
          <View className="features">
            <View className="feature-item">
              <Text className="feature-icon">📸</Text>
              <Text className="feature-text">实时动态</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">📅</Text>
              <Text className="feature-text">课程安排</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">⭐</Text>
              <Text className="feature-text">成长记录</Text>
            </View>
          </View>
        </View>

        {/* 底部提示 */}
        <View className="tips">
          <Text className="tips-text">登录即代表同意</Text>
          <Text className="tips-link">用户协议</Text>
          <Text className="tips-text">和</Text>
          <Text className="tips-link">隐私政策</Text>
        </View>
      </View>
    </View>
  );
});

export default Login;
