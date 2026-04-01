import { makeAutoObservable } from "mobx";
import Taro from "@tarojs/taro";
import { AuthStore } from "../AuthStore";
import { supabase } from "@shared/utils/supabase";

// 消息类型
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean; // 是否正在流式显示中
}

// 对话历史（用于 API 调用）
interface ChatHistory {
  role: "user" | "assistant" | "system";
  content: string;
}

// 今日心情类型
interface TodayMood {
  mood: string;
  moodText: string;
}

const MESSAGES_KEY = "infp_chat_messages";

class _ChatStore {
  messages: Message[] = [];
  isLoading = false;
  lastSendTime = 0; // 上次发送消息的时间戳
  sessionId: string = ""; // 当前会话ID

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadLocalMessages();
    this.initSessionId();
  }

  /**
   * 初始化会话ID
   */
  initSessionId() {
    // 生成唯一的会话ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  /**
   * 从本地存储加载消息
   */
  async loadLocalMessages() {
    try {
      const messages = await Taro.getStorage({ key: MESSAGES_KEY })
        .then((res) => JSON.parse(res.data))
        .catch(() => []);

      if (messages && messages.length > 0) {
        this.messages = messages;
      }
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }

  /**
   * 保存消息到本地存储
   */
  async saveMessages() {
    try {
      await Taro.setStorage({
        key: MESSAGES_KEY,
        data: JSON.stringify(this.messages),
      });
    } catch (error) {
      console.error("Failed to save messages:", error);
    }
  }

  /**
   * 添加消息
   */
  addMessage(role: "user" | "assistant", content: string) {
    const message: Message = {
      id: `${Date.now()}_${Math.random()}`,
      role,
      content,
      timestamp: Date.now(),
    };

    // 使用新数组替换，确保 MobX 能检测到变化
    this.messages = [...this.messages, message];
    this.saveMessages();
  }

  /**
   * 添加流式消息（初始为空，然后逐步显示内容）
   */
  addStreamingMessage(role: "user" | "assistant"): Message {
    const message: Message = {
      id: `${Date.now()}_${Math.random()}`,
      role,
      content: "",
      timestamp: Date.now(),
      isStreaming: true,
    };

    this.messages = [...this.messages, message];
    return message;
  }

  /**
   * 更新流式消息内容
   */
  updateStreamingMessage(messageId: string, content: string) {
    const messageIndex = this.messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex !== -1) {
      this.messages[messageIndex].content = content;
      // 触发 MobX 更新
      this.messages = [...this.messages];
    }
  }

  /**
   * 完成流式消息
   */
  completeStreamingMessage(messageId: string) {
    const messageIndex = this.messages.findIndex((msg) => msg.id === messageId);
    if (messageIndex !== -1) {
      this.messages[messageIndex].isStreaming = false;
      this.messages = [...this.messages];
      this.saveMessages();
    }
  }

  /**
   * 流式显示文本（打字机效果）
   */
  async streamText(messageId: string, fullText: string, speed: number = 30) {
    const chars = fullText.split('');
    let currentText = '';

    for (let i = 0; i < chars.length; i++) {
      currentText += chars[i];
      this.updateStreamingMessage(messageId, currentText);

      // 每3个字符暂停一次，让显示更自然
      if (i % 3 === 0) {
        await new Promise(resolve => setTimeout(resolve, speed));
      }
    }

    this.completeStreamingMessage(messageId);
  }

  /**
   * 发送消息并获取回复
   */
  async sendMessage(content: string) {
    if (!content.trim()) {
      return;
    }

    // 检查发送频率限制（5秒内只能发送一次）
    const now = Date.now();
    const timeSinceLastSend = now - this.lastSendTime;
    const MIN_INTERVAL = 5000; // 5秒

    if (timeSinceLastSend < MIN_INTERVAL) {
      const remainingTime = Math.ceil((MIN_INTERVAL - timeSinceLastSend) / 1000);
      Taro.showToast({
        title: `请等待 ${remainingTime} 秒后再发送`,
        icon: "none",
        duration: 2000,
      });
      return;
    }

    try {
      this.isLoading = true;
      this.lastSendTime = now; // 更新最后发送时间

      // 添加用户消息
      this.addMessage("user", content);

      // 构建对话历史（最近10条）
      const history: ChatHistory[] = this.messages
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // 获取用户信息
      const userProfile = {
        nickName: AuthStore.userInfo?.nickName || null,
        mbti: AuthStore.userInfo?.mbti || null,
      };

      // 获取今日心情记录
      let todayMood: TodayMood | null = null;
      try {
        const { data: moodData, error: moodError } = await supabase.functions.invoke("mood", {
          body: {
            type: "get",
            openid: AuthStore.userInfo?.openid,
          },
        });

        if (!moodError && moodData && moodData.success) {
          const today = new Date().toISOString().split("T")[0];
          const todayRecord = moodData.data.find((r: any) => r.date === today);
          if (todayRecord) {
            todayMood = {
              mood: todayRecord.mood,
              moodText: todayRecord.moodText,
            };
          }
        }
      } catch (error) {
        console.error("获取心情记录失败:", error);
        // 获取心情失败不影响聊天，继续执行
      }

      // 先添加一个空的流式消息，显示加载状态
      const streamingMessage = this.addStreamingMessage("assistant");

      // 调用 Supabase Edge Function
      const res: any = await supabase.functions.invoke("chat", {
        body: {
          message: content,
          history: history.slice(0, -1), // 不包括刚添加的用户消息
          userProfile, // 携带用户信息
          sessionId: this.sessionId, // 传递会话ID
          todayMood, // 携带今日心情
          openid: AuthStore.userInfo?.openid, // 传递 openid 用于保存聊天记录
        },
      });

      if (res.data && res.data.reply) {
        // 使用打字机效果显示 AI 回复
        await this.streamText(streamingMessage.id, res.data.reply, 20);

        // 如果使用的是降级回复，显示提示
        if (!res.data.success && res.data.error) {
          console.warn("使用降级回复:", res.data.error);
        }
      } else if (res.error) {
        // Edge Function 调用失败
        this.messages = this.messages.filter(msg => msg.id !== streamingMessage.id);
        throw new Error(res.error.message || "获取回复失败");
      } else {
        // 失败时移除流式消息
        this.messages = this.messages.filter(msg => msg.id !== streamingMessage.id);
        throw new Error("获取回复失败");
      }
    } catch (error: any) {
      console.error("发送消息失败:", error);
      Taro.showToast({
        title: "发送失败，请重试",
        icon: "none",
      });

      // 添加错误提示消息
      this.addMessage(
        "assistant",
        "抱歉，我现在无法回复。请稍后再试。"
      );
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * 清空对话
   */
  async clearMessages() {
    this.messages = [];
    // 重新生成会话ID
    this.initSessionId();
    try {
      await Taro.removeStorage({ key: MESSAGES_KEY });
    } catch (error) {
      console.error("Failed to clear messages:", error);
    }
  }
}

export const ChatStore = new _ChatStore();
