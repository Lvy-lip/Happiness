const db = wx.cloud.database();

Page({
  data: {
    coupleId: getApp().globalData.defaultCoupleId,
    points: 0,
    products: []
  },

  async onShow() {
    await this.loadData();
  },

  async loadData() {
    const [userRes, productRes] = await Promise.all([
      wx.cloud.callFunction({ name: 'getHomeStats', data: { coupleId: this.data.coupleId } }),
      db.collection('products').where({ coupleId: this.data.coupleId }).get()
    ]);
    let products = productRes.data;
    if (!products.length) {
      await db.collection('products').add({ data: { coupleId: this.data.coupleId, name: '一个亲亲', description: 'Chiikawa 甜蜜兑换', price: 30, stock: 999 } });
      await db.collection('products').add({ data: { coupleId: this.data.coupleId, name: '晚安抱抱', description: '睡前治愈抱抱券', price: 50, stock: 999 } });
      products = (await db.collection('products').where({ coupleId: this.data.coupleId }).get()).data;
    }
    this.setData({ points: userRes.result.points || 0, products });
  },

  async buy(e) {
    const productId = e.currentTarget.dataset.id;
    const res = await wx.cloud.callFunction({ name: 'purchaseProduct', data: { coupleId: this.data.coupleId, productId } });
    wx.showToast({ title: res.result.message, icon: res.result.success ? 'success' : 'none' });
    if (res.result.success) await this.loadData();
  }
});
