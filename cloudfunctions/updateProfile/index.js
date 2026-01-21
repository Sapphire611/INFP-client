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

    console.log('收到的更新数据:', { nickName, avatarUrl, mbti })
    console.log('用户 OPENID:', OPENID)

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
      console.log('准备更新 MBTI:', mbti)
    }

    // 查询用户
    const userCollection = db.collection('users')
    const { data: existingUsers } = await userCollection.where({
      openid: OPENID
    }).get()

    console.log('查询到的用户数量:', existingUsers.length)

    if (existingUsers.length === 0) {
      return {
        success: false,
        error: '用户不存在'
      }
    }

    const userData = existingUsers[0]
    console.log('更新前的用户数据:', userData)

    // 更新用户信息
    const updateResult = await userCollection.doc(userData._id).update({
      data: updateData
    })

    console.log('数据库更新结果:', updateResult)

    // 重新查询最新的用户数据
    const { data: updatedUser } = await userCollection.doc(userData._id).get()
    console.log('更新后的用户数据:', updatedUser)

    // 返回更新后的用户信息
    return {
      success: true,
      userInfo: {
        openid: updatedUser.openid,
        nickName: updatedUser.nickName,
        avatarUrl: updatedUser.avatarUrl,
        mbti: updatedUser.mbti || '',
        _id: updatedUser._id
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
