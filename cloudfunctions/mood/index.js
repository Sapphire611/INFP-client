const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

const db = cloud.database();
const _ = db.command;

exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext();
  const openid = wxContext.OPENID;
  const {
    type,
    data
  } = event;

  if (type === 'add') {
    const {
      mood,
      moodText,
      date
    } = data;
    console.log('添加记录:', { openid, mood, moodText, date });

    try {
      // 先检查今天是否已有记录
      const existingRecord = await db.collection('records')
        .where({
          _openid: openid,
          date: date
        })
        .get();

      console.log('已有记录:', existingRecord.data.length);

      if (existingRecord.data.length > 0) {
        return {
          success: false,
          errMsg: '今日已记录',
          alreadyExists: true
        };
      }

      const addResult = await db.collection('records').add({
        data: {
          _openid: openid,
          mood,
          moodText,
          date,
          createTime: db.serverDate(),
        }
      });

      console.log('添加结果:', addResult);

      return {
        success: true,
        data: addResult
      };
    } catch (e) {
      console.error('添加失败:', e);
      return {
        success: false,
        errMsg: e.message || e
      };
    }
  } else if (type === 'get') {
    try {
      // 获取最近1个月的记录
      // 计算30天前的时间
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const res = await db.collection('records')
        .where({
          _openid: openid,
          // createTime: _.gte(thirtyDaysAgo) // 如果 createTime 是 serverDate，这在查询时可能需要注意类型，或者直接用前端传的 date 字符串比较
        })
        .orderBy('createTime', 'desc')
        .limit(100) // 限制数量
        .get();

      return {
        success: true,
        data: res.data
      };
    } catch (e) {
      console.error(e);
      return {
        success: false,
        errMsg: e
      };
    }
  }

  return {
    success: false,
    errMsg: 'Unknown type'
  };
};
