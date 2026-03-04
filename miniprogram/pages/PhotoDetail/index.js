Page({
  data: {
    photoId: '',
    photo: null,
    isEditing: false,
    editForm: {
      location: '',
      caption: '',
      comments: '',
    },
  },

  onLoad(options) {
    const id = options && options.id
    this.setData({ photoId: id || '' })
    this.loadPhotoById()
  },

  loadPhotoById() {
    const photos = wx.getStorageSync('galleryPhotosDB') || wx.getStorageSync('galleryPhotosCache') || []
    const photo = photos.find(item => item.id === this.data.photoId) || null

    this.setData({
      photo,
      isEditing: false,
      editForm: {
        location: photo ? (photo.location || '') : '',
        caption: photo ? (photo.caption || '') : '',
        comments: photo ? (photo.comments || '') : '',
      },
    })
  },

  onLocationInput(e) {
    this.setData({ 'editForm.location': e.detail.value })
  },

  onCaptionInput(e) {
    this.setData({ 'editForm.caption': e.detail.value })
  },

  onCommentsInput(e) {
    this.setData({ 'editForm.comments': e.detail.value })
  },

  startEdit() {
    if (!this.data.photo) return
    this.setData({
      isEditing: true,
      editForm: {
        location: this.data.photo.location || '',
        caption: this.data.photo.caption || '',
        comments: this.data.photo.comments || '',
      }
    })
  },

  cancelEdit() {
    this.setData({ isEditing: false })
  },

  saveEdit() {
    const photo = this.data.photo
    if (!photo) return

    const location = (this.data.editForm.location || '').trim() || '未命名地点'
    const caption = (this.data.editForm.caption || '').trim() || '今天也值得被记住。'
    const comments = (this.data.editForm.comments || '').trim() || '记录当下，让回忆慢慢发光。'

    const photos = wx.getStorageSync('galleryPhotosDB') || []
    const nextPhotos = photos.map(item => {
      if (item.id !== photo.id) return item
      return {
        ...item,
        location,
        caption,
        comments,
      }
    })

    const nextPhoto = nextPhotos.find(item => item.id === photo.id) || null
    wx.setStorageSync('galleryPhotosDB', nextPhotos)
    wx.setStorageSync('galleryPhotosCache', nextPhotos)
    this.setData({
      photo: nextPhoto,
      isEditing: false,
    })

    wx.showToast({ title: '已保存', icon: 'success', duration: 1000 })
  },

  deletePhoto() {
    const photo = this.data.photo
    if (!photo) return

    wx.showModal({
      title: '删除回忆',
      content: '删除后将无法恢复，确认删除这张图片吗？',
      confirmColor: '#e06a86',
      success: (res) => {
        if (!res.confirm) return

        const photos = wx.getStorageSync('galleryPhotosDB') || []
        const nextPhotos = photos.filter(item => item.id !== photo.id)
        wx.setStorageSync('galleryPhotosDB', nextPhotos)
        wx.setStorageSync('galleryPhotosCache', nextPhotos)

        wx.showToast({
          title: '已删除',
          icon: 'success',
          duration: 900,
          success: () => {
            setTimeout(() => {
              wx.navigateBack({ delta: 1 })
            }, 650)
          }
        })
      }
    })
  },
})
