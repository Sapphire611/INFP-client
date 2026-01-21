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
            <Text className="logo-emoji">🌱</Text>
          </View>
          <Text className="logo-title">INFP 心灵角落</Text>
          <View className="logo-underline"></View>
        </View>

        {/* 欢迎文字 */}
        <View className="welcome-text">
          <Text className="title">欢迎回来</Text>
          <Text className="description">在这里，做真实的自己</Text>
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

          {/* INFP 特质 */}
          <View className="features">
            <View className="feature-item">
              <Text className="feature-icon">🎨</Text>
              <Text className="feature-text">富有创造力</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">💝</Text>
              <Text className="feature-text">同理心强</Text>
            </View>
            <View className="feature-item">
              <Text className="feature-icon">🌟</Text>
              <Text className="feature-text">理想主义</Text>
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
