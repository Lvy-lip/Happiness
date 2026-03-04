const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { productId, coupleId = 'solo-default-couple' } = event;
  const users = db.collection('users');

  const productRes = await db.collection('products').doc(productId).get();
  const product = productRes.data;
  if (!product) return { success: false, message: '商品不存在' };
  if (product.stock <= 0) return { success: false, message: '库存不足' };

  const userRes = await users.where({ _openid: OPENID, coupleId }).get();
  if (!userRes.data.length) return { success: false, message: '用户未初始化' };
  const user = userRes.data[0];

  if ((user.points || 0) < product.price) {
    return { success: false, message: '积分不足' };
  }

  await users.doc(user._id).update({ data: { points: db.command.inc(-product.price) } });
  await db.collection('products').doc(productId).update({ data: { stock: db.command.inc(-1) } });
  await db.collection('orders').add({
    data: {
      _openid: OPENID,
      coupleId,
      productId,
      productName: product.name,
      costPoints: product.price,
      createdAt: new Date()
    }
  });

  return { success: true, message: '兑换成功' };
};
