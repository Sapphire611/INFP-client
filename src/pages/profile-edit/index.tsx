import { View, Text, Input, Button, Image } from "@tarojs/components";
import { useState } from "react";
import { observer } from "mobx-react";
import Taro from "@tarojs/taro";
import { AuthStore } from "@shared/store";
import "./index.scss";

const ProfileEdit = observer(() => {
  const userInfo = AuthStore.userInfo;

  // 本地状态
  const [nickName, setNickName] = useState(userInfo?.nickName || "");
  const [avatarUrl, setAvatarUrl] = useState(userInfo?.avatarUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 选择头像
   */
  const handleChooseAvatar = (e: any) => {
    const { avatarUrl: newAvatarUrl } = e.detail;
    if (newAvatarUrl) {
      setAvatarUrl(newAvatarUrl);
      Taro.showToast({
        title: "头像已选择",
        icon: "success",
      });
    }
  };

  /**
   * 保存个人信息
   */
  const handleSave = async () => {
    // 验证昵称
    if (!nickName || nickName.trim().length === 0) {
      Taro.showToast({
        title: "请输入昵称",
        icon: "none",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      // 调用云函数更新用户信息
      const res = await Taro.cloud.callFunction({
        name: "updateProfile",
        data: {
          nickName: nickName.trim(),
          avatarUrl: avatarUrl,
        },
      });

      console.log("更新用户信息结果:", res);

      if (res.result && typeof res.result === 'object' && 'success' in res.result && res.result.success) {
        // 更新本地存储的用户信息（保留原有的所有字段）
        await AuthStore.saveUserInfo({
          ...userInfo,
          nickName: nickName.trim(),
          avatarUrl: avatarUrl,
        });

        Taro.showToast({
          title: "保存成功",
          icon: "success",
        });

        // 延迟返回上一页
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } else {
        const errorMsg = (res.result && typeof res.result === 'object' && 'error' in res.result)
          ? res.result.error
          : "更新失败";
        throw new Error(errorMsg as string);
      }
    } catch (error: any) {
      console.error("保存失败:", error);
      Taro.showToast({
        title: error.message || "保存失败，请重试",
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
              {avatarUrl ? (
                <Image className="avatar-image" src={avatarUrl} mode="aspectFill" />
              ) : (
                <View className="avatar-placeholder">
                  <Text className="avatar-placeholder-text">
                    {nickName?.charAt(0) || "头"}
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
          {/* 昵称 */}
          <View className="form-item">
            <View className="form-label-row">
              <Text className="form-label">昵称</Text>
              <Text className="required-mark">*</Text>
            </View>
            <Input
              className="form-input"
              type="nickname"
              placeholder="请输入您的昵称"
              value={nickName}
              onInput={(e) => setNickName(e.detail.value)}
              maxlength={20}
            />
          </View>

          {/* 提示信息 */}
          <View className="form-tips">
            <Text className="tips-icon">💡</Text>
            <Text className="tips-text">
              完善个人信息后可以更好地使用服务
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
