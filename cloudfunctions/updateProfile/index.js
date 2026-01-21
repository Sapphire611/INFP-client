// 云函数入口文件
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()

  try {
    // 获取用户的 openid
    const { OPENID } = wxContext

    // 从前端获取更新的用户信息
    const { nickName, avatarUrl, mbti } = event

    // 构建更新数据
    const updateData = {
      lastUpdateTime: db.serverDate()
    }

    if (nickName) {
      updateData.nickName = nickName
    }
    if (avatarUrl) {
      updateData.avatarUrl = avatarUrl
    }
    if (mbti !== undefined) {
      updateData.mbti = mbti
    }

    // 查询用户
    const userCollection = db.collection('users')
    const { data: existingUsers } = await userCollection.where({
      openid: OPENID
    }).get()

    if (existingUsers.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    const userData = existingUsers[0]

    // 更新用户信息
    await userCollection.doc(userData._id).update({
      data: updateData
    })

    // 返回更新后的用户信息
    return {
      success: true,
      userInfo: {
        openid: userData.openid,
        nickName: nickName || userData.nickName,
        avatarUrl: avatarUrl || userData.avatarUrl,
        mbti: mbti !== undefined ? mbti : (userData.mbti || ''),
        _id: userData._id
      }
    }
  } catch (error) {
    console.error('更新用户信息失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
