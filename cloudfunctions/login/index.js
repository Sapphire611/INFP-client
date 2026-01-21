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
    // 获取用户的 openid 和 unionid（如果有）
    const { OPENID, UNIONID, APPID } = wxContext

    // 从前端获取用户信息
    const { nickName, avatarUrl } = event

    // 查询用户是否已存在
    const userCollection = db.collection('users')
    const { data: existingUsers } = await userCollection.where({
      openid: OPENID
    }).get()

    let userData

    if (existingUsers.length > 0) {
      // 用户已存在，更新最后登录时间和用户信息
      userData = existingUsers[0]
      const updateData = {
        lastLoginTime: db.serverDate(),
        appid: APPID
      }

      // 如果前端传了新的昵称和头像，则更新
      if (nickName) {
        updateData.nickName = nickName
      }
      if (avatarUrl) {
        updateData.avatarUrl = avatarUrl
      }

      await userCollection.doc(userData._id).update({
        data: updateData
      })

      // 更新本地数据对象
      userData = { ...userData, ...updateData }
    } else {
      // 新用户，创建用户记录
      const createResult = await userCollection.add({
        data: {
          openid: OPENID,
          unionid: UNIONID,
          appid: APPID,
          nickName: nickName || '新用户',
          avatarUrl: avatarUrl || '',
          mbti: '',
          createTime: db.serverDate(),
          lastLoginTime: db.serverDate()
        }
      })

      // 获取新创建的用户数据
      const { data: newUsers } = await userCollection.doc(createResult._id).get()
      userData = newUsers
    }

    return {
      success: true,
      userInfo: {
        openid: userData.openid,
        nickName: userData.nickName || 'INFP 用户',
        avatarUrl: userData.avatarUrl || '',
        mbti: userData.mbti || '',
        _id: userData._id
      }
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
