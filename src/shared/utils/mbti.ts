/**
 * MBTI 工具函数
 */

// MBTI 颜色配置
export const MBTI_COLORS = {
  // 外交家 (NF) - 绿色
  diplomat: {
    primary: "#66bb6a",
    secondary: "#81c784",
    light: "rgba(102, 187, 106, 0.1)",
  },
  // 分析家 (NT) - 紫色
  analyst: {
    primary: "#9c27b0",
    secondary: "#ba68c8",
    light: "rgba(156, 39, 176, 0.1)",
  },
  // 守护者 (SJ) - 蓝色
  sentinel: {
    primary: "#2196f3",
    secondary: "#64b5f6",
    light: "rgba(33, 150, 243, 0.1)",
  },
  // 探险家 (SP) - 黄色
  explorer: {
    primary: "#ff9800",
    secondary: "#ffb74d",
    light: "rgba(255, 152, 0, 0.1)",
  },
};

// MBTI 类型分类
const MBTI_ROLES = {
  diplomat: ["INFJ", "INFP", "ENFJ", "ENFP"], // 外交家
  analyst: ["INTJ", "INTP", "ENTJ", "ENTP"], // 分析家
  sentinel: ["ISTJ", "ISFJ", "ESTJ", "ESFJ"], // 守护者
  explorer: ["ISTP", "ISFP", "ESTP", "ESFP"], // 探险家
};

// 角色中文名称
export const ROLE_NAMES = {
  diplomat: "外交家",
  analyst: "分析家",
  sentinel: "守护者",
  explorer: "探险家",
};

// 每个 MBTI 类型的专属 emoji
export const MBTI_EMOJIS: Record<string, string> = {
  // 分析家 (NT) - 紫色
  INTJ: "🏛️", // 建筑师
  INTP: "🧪", // 逻辑学家 - 紫色药水
  ENTJ: "🪄", // 指挥官 - 闪电
  ENTP: "💡", // 辩论家

  // 外交家 (NF) - 绿色
  INFJ: "🌟", // 提倡者
  INFP: "🦋", // 调停者
  ENFJ: "🗡️", // 主人公 - 单剑
  ENFP: "😊", // 竞选者 - 快乐的

  // 守护者 (SJ) - 蓝色
  ISTJ: "👓", // 物流师 - 蓝颜色眼镜
  ISFJ: "👩‍⚕️", // 守卫者 - 护士
  ESTJ: "📏", // 总经理 - 尺子/教棒
  ESFJ: "🤝", // 执政官

  // 探险家 (SP) - 黄色
  ISTP: "🔧", // 鉴赏家
  ISFP: "🎨", // 探险家 - 画盘
  ESTP: "🎯", // 企业家
  ESFP: "🪇", // 表演者 - 沙球
};

/**
 * 获取 MBTI 类型的角色分类
 */
export function getMbtiRole(
  mbti: string
): "diplomat" | "analyst" | "sentinel" | "explorer" | null {
  const upperMbti = mbti?.toUpperCase();
  if (!upperMbti) return null;

  if (MBTI_ROLES.diplomat.includes(upperMbti)) return "diplomat";
  if (MBTI_ROLES.analyst.includes(upperMbti)) return "analyst";
  if (MBTI_ROLES.sentinel.includes(upperMbti)) return "sentinel";
  if (MBTI_ROLES.explorer.includes(upperMbti)) return "explorer";

  return null;
}

/**
 * 获取 MBTI 类型的颜色配置
 */
export function getMbtiColors(mbti: string) {
  const role = getMbtiRole(mbti);
  if (!role) {
    // 默认返回绿色
    return MBTI_COLORS.diplomat;
  }
  return MBTI_COLORS[role];
}

/**
 * 获取 MBTI 类型的角色名称
 */
export function getMbtiRoleName(mbti: string): string {
  const role = getMbtiRole(mbti);
  if (!role) return "";
  return ROLE_NAMES[role];
}

/**
 * 获取 MBTI 类型的 emoji
 */
export function getMbtiEmoji(mbti: string): string {
  const upperMbti = mbti?.toUpperCase();
  if (!upperMbti) return "🦋";
  return MBTI_EMOJIS[upperMbti] || "🦋";
}
