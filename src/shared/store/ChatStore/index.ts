import { makeAutoObservable, runInAction } from "mobx";
import Taro from "@tarojs/taro";
import { AuthStore } from "../AuthStore";
import { supabase } from "@shared/utils/supabase";

// 消息类型
export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  isStreaming?: boolean;
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
  lastSendTime = 0;
  conversationId: string = "";

  constructor() {
    makeAutoObservable(this, {}, { autoBind: true });
    this.loadLocalMessages();
    this.initConversationId();
  }

  /**
   * 初始化会话 ID（每次冷启动生成新 ID）
   */
  initConversationId() {
    this.conversationId = `conv_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
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
    this.messages = [...this.messages, message];
    this.saveMessages();
  }

  /**
   * 添加流式消息占位
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
    const idx = this.messages.findIndex((msg) => msg.id === messageId);
    if (idx !== -1) {
      this.messages[idx].content = content;
      this.messages = [...this.messages];
    }
  }

  /**
   * 完成流式消息
   */
  completeStreamingMessage(messageId: string) {
    const idx = this.messages.findIndex((msg) => msg.id === messageId);
    if (idx !== -1) {
      this.messages[idx].isStreaming = false;
      this.messages = [...this.messages];
      this.saveMessages();
    }
  }

  /**
   * 打字机效果显示文本
   */
  async streamText(messageId: string, fullText: string, speed: number = 30) {
    const chars = fullText.split("");
    let currentText = "";
    for (let i = 0; i < chars.length; i++) {
      currentText += chars[i];
      this.updateStreamingMessage(messageId, currentText);
      if (i % 3 === 0) {
        await new Promise((resolve) => setTimeout(resolve, speed));
      }
    }
    this.completeStreamingMessage(messageId);
  }

  // ============================================================
  // conversations 表操作（直接调 Supabase REST API）
  // ============================================================

  /**
   * 在 Supabase 创建或更新会话记录
   * 使用 upsert 语义（INSERT ... ON CONFLICT DO NOTHING）：首次插入，已存在则忽略
   */
  async ensureConversation(firstMessage: string) {
    const openid = AuthStore.userInfo?.openid;
    if (!openid) return;

    const title = firstMessage.slice(0, 20) + (firstMessage.length > 20 ? "..." : "");

    // 先查是否存在（只用 id 一个 eq，规避自定义客户端链式限制）
    const { data } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", this.conversationId)
      .single();

    if (!data) {
      // 创建新会话
      await supabase.from("conversations").insert({
        id: this.conversationId,
        user_id: openid,
        title,
        model: "deepseek-chat",
      });
    } else {
      // 已存在则更新时间戳
      await supabase
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", this.conversationId);
    }
  }

  /**
   * 获取最新摘要，用于注入对话上下文
   * 自定义客户端不支持 order()，直接用 REST API 查询参数
   */
  async getLatestSummary(): Promise<string | null> {
    try {
      const { data } = await supabase
        .from("conversation_summaries")
        .select("summary_text")
        .eq("conversation_id", this.conversationId)
        .single();

      return (data as any)?.summary_text ?? null;
    } catch {
      return null;
    }
  }

  // ============================================================
  // 发送消息
  // ============================================================

  async sendMessage(content: string) {
    if (!content.trim()) return;

    // 发送频率限制（5秒）
    const now = Date.now();
    const MIN_INTERVAL = 5000;
    if (now - this.lastSendTime < MIN_INTERVAL) {
      const remaining = Math.ceil((MIN_INTERVAL - (now - this.lastSendTime)) / 1000);
      Taro.showToast({ title: `请等待 ${remaining} 秒后再发送`, icon: "none", duration: 2000 });
      return;
    }

    try {
      this.isLoading = true;
      this.lastSendTime = now;

      // 1. 显示用户消息
      this.addMessage("user", content);

      // 2. 确保 Supabase conversations 记录存在
      if (AuthStore.userInfo?.openid) {
        this.ensureConversation(content).catch((e) =>
          console.error("ensureConversation failed:", e)
        );
      }

      // 3. 获取会话摘要（历史消息为空时注入摘要作为上下文）
      const localHistory = this.messages.slice(-10);
      let history: ChatHistory[] = localHistory
        .slice(0, -1) // 不包含刚加的用户消息
        .map((msg) => ({ role: msg.role, content: msg.content }));

      if (localHistory.length <= 2 && AuthStore.userInfo?.openid) {
        const summary = await this.getLatestSummary();
        if (summary) {
          history = [
            { role: "assistant", content: `[历史对话摘要]: ${summary}` },
            ...history,
          ];
        }
      }

      // 4. 获取今日心情（暂时注释，mood Edge Function 未部署）
      let todayMood: TodayMood | null = null;
      // try {
      //   const { data: moodData } = await supabase.functions.invoke("mood", {
      //     body: { type: "get", openid: AuthStore.userInfo?.openid },
      //   });
      //   if (moodData?.success) {
      //     const today = new Date().toISOString().split("T")[0];
      //     const todayRecord = moodData.data?.find((r: any) => r.date === today);
      //     if (todayRecord) {
      //       todayMood = { mood: todayRecord.mood, moodText: todayRecord.moodText };
      //     }
      //   }
      // } catch {
      //   // 心情获取失败不影响聊天
      // }

      // 5. 添加流式占位消息
      const streamingMessage = this.addStreamingMessage("assistant");

      // 6. 调用 chat Edge Function
      const res: any = await supabase.functions.invoke("chat", {
        body: {
          message: content,
          history,
          userProfile: {
            nickName: AuthStore.userInfo?.nickName || null,
            mbti: AuthStore.userInfo?.mbti || null,
          },
          conversationId: this.conversationId,
          todayMood,
          openid: AuthStore.userInfo?.openid,
        },
      });

      if (res.data?.reply) {
        await this.streamText(streamingMessage.id, res.data.reply, 20);
        if (!res.data.success && res.data.error) {
          console.warn("使用降级回复:", res.data.error);
        }
      } else if (res.error) {
        runInAction(() => {
          this.messages = this.messages.filter((msg) => msg.id !== streamingMessage.id);
        });
        throw new Error(res.error.message || "获取回复失败");
      } else {
        runInAction(() => {
          this.messages = this.messages.filter((msg) => msg.id !== streamingMessage.id);
        });
        throw new Error("获取回复失败");
      }
    } catch (error: any) {
      console.error("发送消息失败:", error);
      Taro.showToast({ title: "发送失败，请重试", icon: "none" });
      this.addMessage("assistant", "抱歉，我现在无法回复。请稍后再试。");
    } finally {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  }

  /**
   * 清空对话（重置本地消息 + 生成新会话 ID）
   */
  async clearMessages() {
    this.messages = [];
    this.initConversationId();
    try {
      await Taro.removeStorage({ key: MESSAGES_KEY });
    } catch (error) {
      console.error("Failed to clear messages:", error);
    }
  }
}

export const ChatStore = new _ChatStore();
