// 云函数入口文件
const cloud = require('wx-server-sdk')
const axios = require('axios')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

// DeepSeek API 配置
// 优先使用环境变量，其次使用配置文件
let DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ''

// 如果环境变量不存在，尝试从配置文件读取
if (!DEEPSEEK_API_KEY) {
  try {
    const config = require('./config.json')
    DEEPSEEK_API_KEY = config.env?.DEEPSEEK_API_KEY || ''
  } catch (e) {
    console.log('未找到配置文件，使用默认配置')
  }
}

const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

// 云函数入口函数
exports.main = async (event, context) => {
  const { message, history = [], userProfile = {} } = event

  try {
    // 构建个性化的系统提示
    let systemPrompt = '你是一个温暖、善解人意的 AI 助手，专门为用户提供支持。你的回复应该：1) 温和友善，充满同理心 2) 鼓励用户表达真实感受 3) 提供深入、有意义的对话 4) 尊重用户的独特性和创造力。'

    // 如果用户设置了 MBTI，添加个性化信息
    if (userProfile.mbti) {
      const mbtiDescriptions = {
        'INTJ': '建筑师 - 富有想象力和战略性的思想家',
        'INTP': '逻辑学家 - 具有创造力的发明家',
        'ENTJ': '指挥官 - 大胆、富有想象力的领导者',
        'ENTP': '辩论家 - 聪明好奇的思想者',
        'INFJ': '提倡者 - 安静而神秘的理想主义者',
        'INFP': '调停者 - 富有诗意和同理心的利他主义者',
        'ENFJ': '主人公 - 富有魅力和鼓舞人心的领导者',
        'ENFP': '竞选者 - 热情洋溢和富有创造力的社交家',
        'ISTJ': '物流师 - 实际和注重事实的个人',
        'ISFJ': '守卫者 - 非常专注而温暖的守护者',
        'ESTJ': '总经理 - 出色的管理者',
        'ESFJ': '执政官 - 极有同情心、受欢迎的社交家',
        'ISTP': '鉴赏家 - 大胆而实际的实验家',
        'ISFP': '探险家 - 灵活而有魅力的艺术家',
        'ESTP': '企业家 - 聪明、精力充沛的冒险家',
        'ESFP': '表演者 - 自发的、精力充沛的娱乐者'
      }

      const mbtiDesc = mbtiDescriptions[userProfile.mbti] || userProfile.mbti
      systemPrompt += `\n\n当前用户是 ${userProfile.mbti} 类型（${mbtiDesc}）。请根据这个人格类型的特点来调整你的回复风格和内容，更好地理解和支持用户。`
    }

    // 如果用户设置了昵称，使用更亲切的称呼
    if (userProfile.nickName) {
      systemPrompt += `\n用户的昵称是"${userProfile.nickName}"，你可以在适当的时候称呼用户。`
    }

    console.log('用户信息:', userProfile)
    console.log('系统提示:', systemPrompt)

    // 构建对话历史
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      ...history,
      {
        role: 'user',
        content: message
      }
    ]

    // 调用 DeepSeek API（设置15秒超时）
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 15000 // 15秒超时
      }
    )

    const reply = response.data.choices[0].message.content

    return {
      success: true,
      reply: reply,
      timestamp: new Date().getTime()
    }
  } catch (error) {
    console.error('DeepSeek API 调用失败:', error.message)
    console.error('错误详情:', error.response?.data || error)

    // 降级到模拟回复
    const fallbackResponses = [
      "作为一个 INFP，我理解你的感受。我们都是独特的个体，有着深刻的内心世界。",
      "这让我想起了一些深刻的思考。INFP 往往在寻找生活的意义和真实的自我。",
      "我能感受到你话语中的情感。INFP 对情感有着敏锐的洞察力。",
      "这个问题很有趣！作为理想主义者，我们总是在思考如何让世界变得更美好。",
      "你的想法很有深度。INFP 倾向于用独特的视角看待世界。"
    ]

    return {
      success: false,
      reply: fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)],
      timestamp: new Date().getTime(),
      error: '当前使用模拟回复，请配置 DeepSeek API Key'
    }
  }
}
