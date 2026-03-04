Page({
  goTemplate() {
    wx.navigateTo({ url: '../MissionTemplate/index' })
  },

  goReview() {
    wx.navigateTo({ url: '../MissionReview/index' })
  },

  goGallery() {
    wx.switchTab({ url: '/pages/PhotoGallery/index' })
  },

  goSettings() {
    wx.navigateTo({ url: '../MissionSettings/index' })
  }
})
