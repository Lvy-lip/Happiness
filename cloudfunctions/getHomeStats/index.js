const cloud = require('wx-server-sdk');
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });
const db = cloud.database();

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  const coupleId = event.coupleId || 'solo-default-couple';

  const users = db.collection('users');
  const userRes = await users.where({ _openid: OPENID, coupleId }).get();
  if (!userRes.data.length) {
    await users.add({ data: { _openid: OPENID, coupleId, points: 0, createdAt: new Date() } });
  }
  const latestUser = (await users.where({ _openid: OPENID, coupleId }).get()).data[0] || { points: 0 };

  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  const todoRes = await db.collection('todos').where({
    coupleId,
    createdAt: db.command.gte(start)
  }).get();

  const weeklyStats = [];
  for (let i = 0; i < 7; i += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const items = todoRes.data.filter((t) => new Date(t.createdAt) >= day && new Date(t.createdAt) < next);
    weeklyStats.push({
      date: day.toISOString().slice(0, 10),
      label: `${day.getMonth() + 1}/${day.getDate()}`,
      total: items.length,
      completed: items.filter((t) => t.completed).length
    });
  }

  const banners = (await db.collection('banner_images').where({ enabled: true }).get().catch(() => ({ data: [] }))).data
    .map((item) => ({ url: item.url || item.fileID }))
    .filter((item) => item.url);

  return {
    points: latestUser.points || 0,
    weeklyStats,
    banners
  };
};
