import { makeAutoObservable } from "mobx";
import Taro from "@tarojs/taro";

// 消息类型
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

// 对话历史（用于 API 调用）
interface ChatHistory {
  role: "user" | "assistant" | "system";
  content: string;
}

const MESSAGES_KEY = "infp_chat_messages";

class _ChatStore {
  messages: Message[] = [];
  isLoading = false;

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadLocalMessages();
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
   * 发送消息并获取回复
   */
  async sendMessage(content: string) {
    if (!content.trim()) {
      return;
    }

    try {
      this.isLoading = true;

      // 添加用户消息
      this.addMessage("user", content);

      // 构建对话历史（最近10条）
      const history: ChatHistory[] = this.messages
        .slice(-10)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      // 调用云函数
      const res = await Taro.cloud.callFunction({
        name: "chat",
        data: {
          message: content,
          history: history.slice(0, -1), // 不包括刚添加的用户消息
        },
      });

      if (res.result && res.result.reply) {
        // 添加 AI 回复
        this.addMessage("assistant", res.result.reply);

        // 如果使用的是降级回复，显示提示
        if (!res.result.success && res.result.error) {
          console.warn("使用降级回复:", res.result.error);
        }
      } else {
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
    try {
      await Taro.removeStorage({ key: MESSAGES_KEY });
    } catch (error) {
      console.error("Failed to clear messages:", error);
    }
  }
}

export const ChatStore = new _ChatStore();
