const cloud = require('wx-server-sdk')
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })
const db = cloud.database()

exports.main = async (event, context) => {
  const { OPENID } = cloud.getWXContext()
  const { persona, city, education, employment, frequency } = event

  // 查找是否已存在
  const { data: existing } = await db.collection('subscribers')
    .where({ openid: OPENID })
    .limit(1)
    .get()

  if (existing.length > 0) {
    // 更新
    await db.collection('subscribers').doc(existing[0]._id).update({
      data: {
        persona,
        city,
        education,
        employment,
        frequency,
        updatedAt: new Date(),
      }
    })
  } else {
    // 新增
    await db.collection('subscribers').add({
      data: {
        openid: OPENID,
        persona,
        city,
        education,
        employment,
        frequency,
        subscribedAt: new Date(),
        lastPushAt: null,
        updatedAt: new Date(),
      }
    })
  }

  return { success: true }
}
