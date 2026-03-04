const db = wx.cloud.database();

Page({
  data: {
    coupleId: getApp().globalData.defaultCoupleId,
    content: '',
    tempImages: [],
    emotionList: []
  },

  async onShow() { await this.loadList(); },

  onInput(e) { this.setData({ content: e.detail.value }); },

  async chooseImages() {
    const res = await wx.chooseMedia({ count: 9, mediaType: ['image'] });
    this.setData({ tempImages: res.tempFiles.map(i => i.tempFilePath) });
  },

  previewTemp(e) {
    wx.previewImage({ urls: this.data.tempImages, current: e.currentTarget.dataset.src });
  },

  previewCloud(e) {
    const current = e.currentTarget.dataset.src;
    const urls = e.currentTarget.dataset.list;
    wx.previewImage({ urls, current });
  },

  async submitEmotion() {
    if (!this.data.content.trim()) return wx.showToast({ title: '请输入内容', icon: 'none' });
    wx.showLoading({ title: '保存中' });
    try {
      const uploads = await Promise.all(this.data.tempImages.map((path, idx) => wx.cloud.uploadFile({
        cloudPath: `emotions/${this.data.coupleId}/${Date.now()}_${idx}.jpg`,
        filePath: path
      })));
      const fileIDs = uploads.map(i => i.fileID);
      await wx.cloud.callFunction({
        name: 'saveEmotionRecord',
        data: {
          coupleId: this.data.coupleId,
          content: this.data.content.trim(),
          images: fileIDs
        }
      });
      this.setData({ content: '', tempImages: [] });
      await this.loadList();
    } finally {
      wx.hideLoading();
    }
  },

  async loadList() {
    const res = await db.collection('emotions').where({ coupleId: this.data.coupleId }).orderBy('createdAt', 'desc').get();
    this.setData({
      emotionList: res.data.map(i => ({
        ...i,
        timeText: new Date(i.createdAt).toLocaleString(),
        images: i.images || []
      }))
    });
  }
});
