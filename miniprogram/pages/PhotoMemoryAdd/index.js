Page({
  data: {
    location: '',
    caption: '',
    image: '',
    tagOptions: ['旅行', '日常', '约会', '节日', '第一次'],
    tagIndex: 1,
  },

  onLocationInput(e) {
    this.setData({ location: e.detail.value })
  },

  onCaptionInput(e) {
    this.setData({ caption: e.detail.value })
  },

  onTagChange(e) {
    this.setData({ tagIndex: Number(e.detail.value || 0) })
  },

  pickImage(e) {
    const source = e.currentTarget.dataset.source || 'album'
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: [source],
      success: (res) => {
        const file = (res.tempFiles && res.tempFiles[0]) ? res.tempFiles[0] : null
        if (!file || !file.tempFilePath) return
        this.setData({ image: file.tempFilePath })
      },
      fail: () => {
        wx.showToast({ title: '已取消选择', icon: 'none' })
      }
    })
  },

  submitMemory() {
    const now = new Date()
    const year = now.getFullYear()
    const month = `${now.getMonth() + 1}`.padStart(2, '0')
    const day = `${now.getDate()}`.padStart(2, '0')

    const newMemory = {
      id: `p${Date.now()}`,
      image: this.data.image || '/pages/MainPage/Images/HomeCover01.jpg',
      dateLabel: `${year}.${month}.${day}`,
      yearLabel: `${year}年`,
      location: (this.data.location || '').trim() || '未命名地点',
      likes: 0,
      caption: (this.data.caption || '').trim() || '今天也值得被记住。',
      comments: '来自记录回忆入口',
      tags: [this.data.tagOptions[this.data.tagIndex] || '日常'],
      height: 180 + Math.floor(Math.random() * 120),
    }

    const photos = wx.getStorageSync('galleryPhotosDB') || []
    const nextPhotos = [newMemory].concat(Array.isArray(photos) ? photos : [])
    wx.setStorageSync('galleryPhotosDB', nextPhotos)
    wx.setStorageSync('galleryPhotosCache', nextPhotos)

    wx.showToast({
      title: '回忆已保存',
      icon: 'success',
      duration: 1000,
      success: () => {
        setTimeout(() => {
          wx.navigateBack({ delta: 1 })
        }, 700)
      }
    })
  }
})
