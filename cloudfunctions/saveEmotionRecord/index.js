const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { content = '', images = [], coupleId = 'solo-default-couple' } = event;
  if (!content.trim()) return { success: false, message: '内容不能为空' };

  const res = await db.collection('emotions').add({
    data: {
      _openid: OPENID,
      coupleId,
      content: content.trim(),
      images,
      createdAt: new Date()
    }
  });
  return { success: true, id: res._id };
};
