Page({
  data: {
    coupleId: getApp().globalData.defaultCoupleId,
    banners: [
      { url: '/pages/MainPage/Images/HomeCover01.jpg' },
      { url: '/pages/MainPage/Images/HomeCover02.jpg' },
      { url: '/pages/MainPage/Images/HomeCover03.jpg' }
    ],
    weeklyStats: [],
    points: 0
  },

  async onShow() {
    await this.loadHome();
  },

  async loadHome() {
    try {
      const res = await wx.cloud.callFunction({
        name: 'getHomeStats',
        data: { coupleId: this.data.coupleId }
      });
      this.setData({
        banners: res.result.banners?.length ? res.result.banners : this.data.banners,
        weeklyStats: res.result.weeklyStats || [],
        points: res.result.points || 0
      });
    } catch (e) {
      wx.showToast({ title: '首页加载失败', icon: 'none' });
    }
  }
});
