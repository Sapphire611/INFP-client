import { View, Text, Button } from "@tarojs/components";
import { useState } from "react";
import { observer } from "mobx-react";
import Taro from "@tarojs/taro";
import { AuthStore } from "@shared/store";
import { getMbtiColors, getMbtiEmoji } from "@shared/utils";
import "./index.scss";

// MBTI 类型定义
const MBTI_TYPES = [
  { type: "INTJ", name: "建筑师", description: "富有想象力和战略性的思想家" },
  { type: "INTP", name: "逻辑学家", description: "具有创造力的发明家" },
  { type: "ENTJ", name: "指挥官", description: "大胆、富有想象力的领导者" },
  { type: "ENTP", name: "辩论家", description: "聪明好奇的思想者" },
  { type: "INFJ", name: "提倡者", description: "安静而神秘的理想主义者" },
  { type: "INFP", name: "调停者", description: "富有诗意和同理心的利他主义者" },
  { type: "ENFJ", name: "主人公", description: "富有魅力和鼓舞人心的领导者" },
  { type: "ENFP", name: "竞选者", description: "热情洋溢和富有创造力的社交家" },
  { type: "ISTJ", name: "物流师", description: "实际和注重事实的个人" },
  { type: "ISFJ", name: "守卫者", description: "非常专注而温暖的守护者" },
  { type: "ESTJ", name: "总经理", description: "出色的管理者" },
  { type: "ESFJ", name: "执政官", description: "极有同情心、受欢迎的社交家" },
  { type: "ISTP", name: "鉴赏家", description: "大胆而实际的实验家" },
  { type: "ISFP", name: "探险家", description: "灵活而有魅力的艺术家" },
  { type: "ESTP", name: "企业家", description: "聪明、精力充沛的冒险家" },
  { type: "ESFP", name: "表演者", description: "自发的、精力充沛的娱乐者" },
];

const MbtiSetting = observer(() => {
  const userInfo = AuthStore.userInfo;
  const [selectedMbti, setSelectedMbti] = useState(userInfo?.mbti || "");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * 保存 MBTI 设置
   */
  const handleSave = async () => {
    if (!selectedMbti) {
      Taro.showToast({
        title: "请选择 MBTI 类型",
        icon: "none",
      });
      return;
    }

    console.log("准备保存 MBTI，当前选择:", selectedMbti);
    console.log("当前用户信息:", userInfo);

    try {
      setIsSubmitting(true);

      // 调用云函数更新 MBTI
      const res = await Taro.cloud.callFunction({
        name: "updateProfile",
        data: {
          mbti: selectedMbti,
        },
      });

      console.log("云函数调用结果:", res);

      // 类型安全检查
      const result = res.result as any;
      console.log("返回的 userInfo:", result?.userInfo);

      if (result && typeof result === 'object' && result.success) {
        // 使用云函数返回的最新用户信息，合并到本地信息中
        const updatedUserInfo = result.userInfo;
        console.log("准备保存到本地的用户信息:", updatedUserInfo);

        await AuthStore.saveUserInfo({
          ...userInfo,
          ...updatedUserInfo,
        });

        console.log("保存到本地成功，当前 AuthStore.userInfo:", AuthStore.userInfo);

        Taro.showToast({
          title: "保存成功",
          icon: "success",
        });

        // 延迟返回上一页
        setTimeout(() => {
          Taro.navigateBack();
        }, 1500);
      } else {
        const errorMsg = (result && typeof result === 'object' && result.error)
          ? result.error
          : "更新失败";
        throw new Error(errorMsg);
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
    <View className="mbti-setting-page">
      <View className="page-content">
        {/* 标题说明 */}
        <View className="header-section">
          <Text className="page-title">选择你的 MBTI 类型</Text>
          <Text className="page-description">
            MBTI 是一种人格类型理论，将人格分为 16 种类型
          </Text>
        </View>

        {/* MBTI 类型列表 */}
        <View className="mbti-list">
          {MBTI_TYPES.map((item) => {
            const colors = getMbtiColors(item.type);
            const isSelected = selectedMbti === item.type;

            return (
              <View
                key={item.type}
                className={`mbti-item ${isSelected ? "selected" : ""}`}
                onClick={() => setSelectedMbti(item.type)}
                style={{
                  borderColor: isSelected ? colors.primary : "transparent",
                  background: isSelected
                    ? `linear-gradient(135deg, ${colors.light} 0%, ${colors.light} 100%)`
                    : "#ffffff",
                }}
              >
                <View className="mbti-item-content">
                  <View
                    className="mbti-type-badge"
                    style={{
                      background: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
                    }}
                  >
                    <Text className="mbti-emoji">{getMbtiEmoji(item.type)}</Text>
                  </View>
                  <View className="mbti-info">
                    <Text className="mbti-name">
                      {item.type} · {item.name}
                    </Text>
                    <Text className="mbti-description">{item.description}</Text>
                  </View>
                </View>
                {isSelected && (
                  <View
                    className="check-icon"
                    style={{ background: colors.primary }}
                  >
                    ✓
                  </View>
                )}
              </View>
            );
          })}
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

export default MbtiSetting;
