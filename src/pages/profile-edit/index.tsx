import { View, Text, Input, Button, Image } from "@tarojs/components";
import { useState } from "react";
import { observer } from "mobx-react";
import Taro from "@tarojs/taro";
import { AuthStore } from "@shared/store";
import { ParentService } from "@shared/server/Parent";
import "./index.scss";

const ProfileEdit = observer(() => {
  const userInfo = AuthStore.userInfo;

  // 本地状态
  const [name, setName] = useState(userInfo?.name || "");
  const [phone, setPhone] = useState(userInfo?.phone || "");
  const [avatar, setAvatar] = useState(userInfo?.avatar || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 选择头像 - 使用微信新的头像授权方式
   * 从 2023 年开始，getUserProfile 已废弃
   * 需要使用 button open-type="chooseAvatar"
   */
  const handleChooseAvatar = (e: any) => {
    const { avatarUrl } = e.detail;
    if (avatarUrl) {
      // TODO: 上传图片到服务器
      // 现在先使用临时路径
      setAvatar(avatarUrl);
      Taro.showToast({
        title: "头像已选择",
        icon: "success",
      });
    }
  };

  /**
   * 验证手机号
   */
  const validatePhone = (phoneNumber: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  /**
   * 保存个人信息
   */
  const handleSave = async () => {
    // 验证姓名
    if (!name || name.trim().length === 0) {
      Taro.showToast({
        title: "请输入姓名",
        icon: "none",
      });
      return;
    }

    // 验证手机号（必填）
    if (!phone || phone.trim().length === 0) {
      Taro.showToast({
        title: "请输入手机号",
        icon: "none",
      });
      return;
    }

    if (!validatePhone(phone)) {
      Taro.showToast({
        title: "请输入正确的手机号",
        icon: "none",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 调用后端 API 更新用户信息
      const response = await ParentService.updateProfile({
        name: name.trim(),
        phone: phone || undefined,
        avatar: avatar || undefined,
      });

      if (response.data && response.data.parent) {
        // 更新本地存储的用户信息
        await AuthStore.saveUserInfo(response.data.parent);

        Taro.showToast({
          title: "保存成功",
          icon: "success",
        });

        // 延迟返回上一页
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } else {
        throw new Error("更新失败");
      }
    } catch (error) {
      console.error("保存失败:", error);
      Taro.showToast({
        title: "保存失败，请重试",
        icon: "none",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View className="profile-edit-page">
      <View className="page-content">
        {/* 头像设置 */}
        <View className="avatar-section">
          <Text className="section-label">头像</Text>
          <Button
            className="avatar-button"
            openType="chooseAvatar"
            onChooseAvatar={handleChooseAvatar}
          >
            <View className="avatar-container">
              {avatar ? (
                <Image className="avatar-image" src={avatar} mode="aspectFill" />
              ) : (
                <View className="avatar-placeholder">
                  <Text className="avatar-placeholder-text">
                    {name?.charAt(0) || "头"}
                  </Text>
                </View>
              )}
              <View className="avatar-edit-hint">
                <Text className="camera-icon">📷</Text>
                <Text className="hint-text">点击修改</Text>
              </View>
            </View>
          </Button>
        </View>

        {/* 表单区域 */}
        <View className="form-section">
          {/* 姓名 */}
          <View className="form-item">
            <View className="form-label-row">
              <Text className="form-label">姓名</Text>
              <Text className="required-mark">*</Text>
            </View>
            <Input
              className="form-input"
              type="nickname"
              placeholder="请输入您的姓名（点击可使用微信昵称）"
              value={name}
              onInput={(e) => setName(e.detail.value)}
              maxlength={20}
            />
            <Text className="input-hint">💡 输入框会提示使用微信昵称</Text>
          </View>

          {/* 手机号 */}
          <View className="form-item">
            <View className="form-label-row">
              <Text className="form-label">手机号</Text>
              <Text className="required-mark">*</Text>
            </View>
            <Input
              className="form-input"
              type="number"
              placeholder="请输入手机号"
              value={phone}
              onInput={(e) => setPhone(e.detail.value)}
              maxlength={11}
            />
          </View>

          {/* 提示信息 */}
          <View className="form-tips">
            <Text className="tips-icon">💡</Text>
            <Text className="tips-text">
              完善个人信息有助于老师更好地了解您
            </Text>
          </View>
        </View>

        {/* 保存按钮 */}
        <View className="button-section">
          <Button
            className="save-button"
            onClick={handleSave}
            loading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? "保存中..." : "保存"}
          </Button>
        </View>
      </View>
    </View>
  );
});

export default ProfileEdit;
