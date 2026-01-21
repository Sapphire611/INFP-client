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
  const { message, history = [] } = event

  try {
    // 构建对话历史
    const messages = [
      {
        role: 'system',
        content: '你是一个温暖、善解人意的 AI 助手，需要扮演 INFP 人格类型的用户提供支持。INFP（调停者）是富有创造力、理想主义和同理心的人。你的回复应该：1) 温和友善，充满同理心 2) 鼓励用户表达真实感受 3) 提供深入、有意义的对话 4) 尊重用户的独特性和创造力。'
      },
      ...history,
      {
        role: 'user',
        content: message
      }
    ]

    // 调用 DeepSeek API
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
        }
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
