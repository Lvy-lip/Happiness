const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const { todoId, coupleId = 'solo-default-couple' } = event;
  const users = db.collection('users');

  const todo = await db.collection('todos').doc(todoId).get();
  if (!todo.data) return { success: false, message: 'todo不存在' };

  const completed = !todo.data.completed;
  const updateData = { completed, completedAt: completed ? new Date() : null };

  if (completed && !todo.data.settled) {
    updateData.settled = true;
    await db.collection('todos').doc(todoId).update({ data: updateData });
    const userRes = await users.where({ _openid: OPENID, coupleId }).get();
    if (!userRes.data.length) {
      await users.add({ data: { _openid: OPENID, coupleId, points: todo.data.points || 0, createdAt: new Date() } });
    } else {
      await users.doc(userRes.data[0]._id).update({ data: { points: db.command.inc(todo.data.points || 0) } });
    }
    return { success: true, message: '完成并结算积分' };
  }

  await db.collection('todos').doc(todoId).update({ data: updateData });
  return { success: true, message: completed ? '已完成(已结算过)' : '已取消完成' };
};
