Page({
  data: {
    pageTitle: '今日复盘'
  },

  onLoad(options) {
    if (options && options.mode === 'quick') {
      this.setData({ pageTitle: '快速记录' })
    }
  },

  goMission() {
    wx.navigateBack({ delta: 1 })
  }
})
