import { View, Text, Input, Button, Image } from "@tarojs/components";
import { useState, useEffect } from "react";
import { observer } from "mobx-react";
import Taro from "@tarojs/taro";
import { AuthStore } from "@shared/store";
import { supabase, uploadFileToStorage } from "@shared/utils/supabase";
import "./index.scss";

const ProfileEdit = observer(() => {
  const userInfo = AuthStore.userInfo;

  // 本地状态
  const [nickName, setNickName] = useState(userInfo?.nickName || "");
  const [avatarUrl, setAvatarUrl] = useState(userInfo?.avatarUrl || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 同步 userInfo 变化到状态
  useEffect(() => {
    if (userInfo) {
      setNickName(userInfo.nickName || "");
      setAvatarUrl(userInfo.avatarUrl || "");
    }
  }, [userInfo]);

  /**
   * 获取微信用户头像和昵称
   */
  const handleGetWechatProfile = () => {
    return new Promise<{ nickName: string; avatarUrl: string }>((resolve, reject) => {
      // 先尝试使用 wx.getUserProfile（需要用户授权）
      if (Taro.getEnv() === Taro.ENV_TYPE.WEB) {
        // 微信 Web 环境（公众号网页）
        Taro.getUserProfile({
          desc: "用于完善用户资料",
          success: (res) => {
            const userInfo = res.userInfo;
            if (userInfo) {
              resolve({
                nickName: userInfo.nickName || "",
                avatarUrl: userInfo.avatarUrl || "",
              });
            } else {
              reject(new Error("获取用户信息失败"));
            }
          },
          fail: (err) => {
            console.error("getUserProfile 失败:", err);
            reject(err);
          },
        });
      } else {
        // 微信小程序环境
        // 小程序 wx.getUserProfile 已废弃，推荐使用微信头像昵称能力
        // 这里使用 button 唤起授权
        Taro.showModal({
          title: "提示",
          content: "请点击按钮使用微信头像和昵称",
          showCancel: false,
          confirmText: "我知道了",
        }).then(() => reject(new Error("需要用户点击按钮授权")));
      }
    });
  };

  /**
   * 选择头像 - 使用微信头像
   */
  const handleChooseAvatar = async () => {
    try {
      // 在小程序环境中，微信推荐使用 open-type="chooseAvatar" 的 button
      // 由于我们使用自定义方式，这里直接提示用户
      Taro.showToast({
        title: "点击头像区域选择微信头像",
        icon: "none",
      });
    } catch (error) {
      console.error("选择头像失败:", error);
    }
  };

  /**
   * 处理头像选择（通过 button 的 chooseavatar 事件）
   */
  const handleChooseAvatarByButton = async (e: any) => {
    const avatarUrl = e.detail.avatarUrl;
    if (avatarUrl) {
      // 微信返回的是临时文件路径，需要上传到 Supabase
      if (avatarUrl.startsWith('http://tmp/') || avatarUrl.startsWith('wxfile://')) {
        Taro.showLoading({ title: '上传头像中...' });

        const { url, error } = await uploadFileToStorage(avatarUrl);

        Taro.hideLoading();

        if (error) {
          Taro.showToast({
            title: '头像上传失败',
            icon: 'none'
          });
          return;
        }

        setAvatarUrl(url);
      } else {
        // 已经是完整的 URL（可能是之前上传过的）
        setAvatarUrl(avatarUrl);
      }
    }
  };

  /**
   * 处理昵称输入（通过 button 的 getphonenumber 事件）
   */
  const handleNicknameInput = (e: any) => {
    const nickName = e.detail.value;
    setNickName(nickName);
  };

  /**
   * 保存个人信息（直接使用 Supabase 数据库）
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

    if (!AuthStore.userInfo?.openid) {
      Taro.showToast({
        title: "用户未登录",
        icon: "none",
      });
      return;
    }

    // 检查头像是否是临时路径
    if (avatarUrl && (avatarUrl.startsWith('http://tmp/') || avatarUrl.startsWith('wxfile://'))) {
      Taro.showToast({
        title: "头像上传中，请稍后重试",
        icon: "none",
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const openid = AuthStore.userInfo.openid;

      // 直接调用 Supabase 数据库更新用户信息
      const { data, error } = await supabase
        .from("wechat_users")
        .update({
          wechat_nickname: nickName.trim(),
          wechat_avatar_url: avatarUrl,
          last_login_at: new Date().toISOString(),
        })
        .eq("openid", openid)
        .select()
        .single();

      console.log("更新用户信息结果:", data, error);

      if (error) {
        throw new Error(error.message || "更新失败");
      }

      if (data) {
        // 更新本地存储的用户信息（保留原有的所有字段）
        await AuthStore.saveUserInfo({
          ...AuthStore.userInfo,
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
        throw new Error("更新失败");
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
        {/* 头像设置 - 使用微信头像能力 */}
        <View className="avatar-section">
          <Text className="section-label">头像</Text>
          <View className="avatar-container">
            {/* 使用 button 的 open-type="chooseAvatar" 获取微信头像 */}
            <Button
              className="avatar-button"
              open-type="chooseAvatar"
              onChooseAvatar={handleChooseAvatarByButton}
            >
              {avatarUrl ? (
                <Image
                  className="avatar-image"
                  src={avatarUrl}
                  mode="aspectFill"
                />
              ) : (
                <View className="avatar-placeholder">
                  <Text className="avatar-placeholder-text">
                    {nickName?.charAt(0) || "头"}
                  </Text>
                </View>
              )}
            </Button>
            <View className="avatar-edit-hint">
              <Text className="camera-icon">📷</Text>
              <Text className="hint-text">点击更换微信头像</Text>
            </View>
          </View>
        </View>

        {/* 表单区域 */}
        <View className="form-section">
          {/* 昵称 - 使用微信昵称能力 */}
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
              onBlur={handleNicknameInput}
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
