import { View, Text, Input, Button, Image } from "@tarojs/components";
import { observer } from "mobx-react";
import { useState } from "react";
import Taro from "@tarojs/taro";
import { AuthStore, ChatStore } from "@shared/store";
import "./index.scss";

const Home = observer(() => {
  const [inputValue, setInputValue] = useState("");

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) {
      return;
    }

    // 检查是否登录
    if (!AuthStore.isLoggedIn) {
      // 清空输入框
      setInputValue("");

      // 添加用户消息
      ChatStore.addMessage("user", inputValue.trim());

      // 添加系统提示消息
      ChatStore.addMessage("assistant", "你好，请先登录后再使用 😊");

      return;
    }

    const message = inputValue.trim();
    setInputValue("");

    // 使用 ChatStore 发送消息
    await ChatStore.sendMessage(message);
  };

  // 清空对话
  const handleClear = () => {
    Taro.showModal({
      title: "清空对话",
      content: "确定要清空所有对话记录吗？",
      success: (res) => {
        if (res.confirm) {
          ChatStore.clearMessages();
          Taro.showToast({
            title: "已清空",
            icon: "success",
            duration: 1500,
          });
        }
      },
    });
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, "0")}:${date
      .getMinutes()
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <View className="home-page" style={{ height: "100vh", overflow: "hidden" }}>
      {/* 顶部标题 */}
      <View className="chat-header">
        <View className="header-content">
          <View className="header-text">
            <Text className="header-title">INFP的小剧场</Text>
            <Text className="header-subtitle">做你自己就好</Text>
          </View>
          {ChatStore.messages.length > 0 && (
            <View className="clear-button" onClick={handleClear}>
              <Text className="clear-icon">🗑️</Text>
            </View>
          )}
        </View>
      </View>

      {/* 消息列表 */}
      <View
        id="message-list"
        className="message-list"
        style={{
          height: "calc(100vh - 280rpx)",
          overflowY: "scroll"
        }}
      >

        {ChatStore.messages.length === 0 && (
          <View className="welcome-message">
            <Text className="welcome-emoji">🌱</Text>
            <Text className="welcome-text">
              无聊的话可以聊点什么{"\n\n"}
            </Text>
          </View>
        )}

        {ChatStore.messages.map((msg) => (
          <View
            key={msg.id}
            id={`msg-${msg.id}`}
            className={`message-item ${msg.role}`}
          >
            {msg.role === "assistant" && (
              <View className="avatar ai-avatar">
                <Text className="avatar-emoji">🌱</Text>
              </View>
            )}

            <View className="message-content">
              <View className="message-bubble">
                <Text className="message-text">{msg.content}</Text>
              </View>
              <Text className="message-time">{formatTime(msg.timestamp)}</Text>
            </View>

            {msg.role === "user" && (
              <View className="avatar user-avatar">
                {AuthStore.userInfo?.avatarUrl ? (
                  <Image
                    className="avatar-image"
                    src={AuthStore.userInfo.avatarUrl}
                    mode="aspectFill"
                  />
                ) : (
                  <Text className="avatar-emoji">
                    {AuthStore.userInfo?.nickName?.charAt(0) || "我"}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}

        {ChatStore.isLoading && (
          <View className="message-item assistant">
            <View className="avatar ai-avatar">
              <Text className="avatar-emoji">🌱</Text>
            </View>
            <View className="message-content">
              <View className="message-bubble loading">
                <Text className="loading-dots">思考中...</Text>
              </View>
            </View>
          </View>
        )}
      </View>

      {/* 输入区域 */}
      <View className="input-area">
        <View className="input-container">
          <Input
            className="message-input"
            type="text"
            placeholder="分享你的想法..."
            value={inputValue}
            onInput={(e) => setInputValue(e.detail.value)}
            onConfirm={handleSend}
            disabled={ChatStore.isLoading}
            confirmType="send"
          />
          <Button
            className={`send-button ${inputValue.trim() ? "active" : ""}`}
            onClick={handleSend}
            disabled={ChatStore.isLoading || !inputValue.trim()}
          >
            <Text className="send-icon">📤</Text>
          </Button>
        </View>
      </View>
    </View>
  );
});

export default Home;
