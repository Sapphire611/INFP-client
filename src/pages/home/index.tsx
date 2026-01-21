import { View, Text, Input, ScrollView, Button } from "@tarojs/components";
import { observer } from "mobx-react";
import { useState, useRef, useEffect } from "react";
import Taro from "@tarojs/taro";
import { AuthStore } from "@shared/store";
import "./index.scss";

interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: number;
}

const Home = observer(() => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      type: "ai",
      content: "你好！我是 INFP 助手 🌱\n\n作为一个 INFP，我理解你可能需要一个倾听者。在这里，你可以自由地表达你的想法和感受。\n\n有什么想聊的吗？",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<any>(null);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        const query = Taro.createSelectorQuery();
        query.select("#message-list").boundingClientRect();
        query.selectViewport().scrollOffset();
        query.exec((res) => {
          if (res[0]) {
            Taro.pageScrollTo({
              scrollTop: res[0].height,
              duration: 300,
            });
          }
        });
      }
    }, 100);
  };

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim()) {
      return;
    }

    // 检查是否登录
    if (!AuthStore.isLoggedIn) {
      Taro.showToast({
        title: "请先登录",
        icon: "none",
      });
      Taro.navigateTo({ url: "/pages/login/index" });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: inputValue.trim(),
      timestamp: Date.now(),
    };

    // 添加用户消息
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // 调用云函数
      const res = await Taro.cloud.callFunction({
        name: "chat",
        data: {
          message: userMessage.content,
        },
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: res.result.reply || "抱歉，我现在无法回复。",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("调用云函数失败:", error);

      // 如果云函数调用失败，使用本地模拟回复
      const fallbackMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: "ai",
        content: "很抱歉，我现在遇到了一些技术问题。\n\n作为 INFP，我们都知道，有时候生活就是这样充满不确定性。但请不要担心，你可以稍后再试。",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
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
    <View className="home-page">
      {/* 顶部标题 */}
      <View className="chat-header">
        <Text className="header-title">INFP 心灵角落</Text>
        <Text className="header-subtitle">倾听・理解・陪伴</Text>
      </View>

      {/* 消息列表 */}
      <ScrollView
        id="message-list"
        ref={scrollViewRef}
        scrollY
        className="message-list"
        scrollIntoView={`msg-${messages[messages.length - 1]?.id}`}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            id={`msg-${msg.id}`}
            className={`message-item ${msg.type}`}
          >
            {msg.type === "ai" && (
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

            {msg.type === "user" && (
              <View className="avatar user-avatar">
                <Text className="avatar-emoji">
                  {AuthStore.userInfo?.nickName?.charAt(0) || "我"}
                </Text>
              </View>
            )}
          </View>
        ))}

        {isLoading && (
          <View className="message-item ai">
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
      </ScrollView>

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
            disabled={isLoading}
            confirmType="send"
          />
          <Button
            className={`send-button ${inputValue.trim() ? "active" : ""}`}
            onClick={handleSend}
            disabled={isLoading || !inputValue.trim()}
          >
            <Text className="send-icon">📤</Text>
          </Button>
        </View>
      </View>
    </View>
  );
});

export default Home;
