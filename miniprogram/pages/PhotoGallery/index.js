const DEFAULT_PHOTOS = [
  {
    id: 'p1',
    image: '/pages/MainPage/Images/HomeCover01.jpg',
    dateLabel: '2024.03.01',
    yearLabel: '2024年',
    location: '上海',
    likes: 12,
    caption: '那天我们一起散步到很晚。',
    comments: '风很轻，夜色很柔。',
    tags: ['约会', '日常'],
    height: 240,
  },
  {
    id: 'p2',
    image: '/pages/MainPage/Images/HomeCover02.jpg',
    dateLabel: '2024.04.19',
    yearLabel: '2024年',
    location: '杭州',
    likes: 19,
    caption: '我们在西湖边看了很久的晚霞。',
    comments: '回来的路上还买了热奶茶。',
    tags: ['旅行'],
    height: 188,
  },
  {
    id: 'p3',
    image: '/pages/MainPage/Images/HomeCover03.jpg',
    dateLabel: '2024.06.08',
    yearLabel: '2024年',
    location: '苏州',
    likes: 8,
    caption: '第一次一起过端午，小小仪式感。',
    comments: '愿每次节日都有你。',
    tags: ['节日', '第一次'],
    height: 268,
  },
  {
    id: 'p4',
    image: '/pages/MainPage/Images/HomeCover04.jpg',
    dateLabel: '2024.08.22',
    yearLabel: '2024年',
    location: '青岛',
    likes: 23,
    caption: '海风把烦恼都吹散了。',
    comments: '那天的海比想象中还蓝。',
    tags: ['旅行', '约会'],
    height: 206,
  },
  {
    id: 'p5',
    image: '/pages/MainPage/Images/HomeCover05.jpg',
    dateLabel: '2024.10.02',
    yearLabel: '2024年',
    location: '南京',
    likes: 14,
    caption: '普通日子也能很闪亮。',
    comments: '一顿简单的晚饭也值得纪念。',
    tags: ['日常'],
    height: 230,
  },
  {
    id: 'p6',
    image: '/pages/MainPage/Images/HomeCover06.jpg',
    dateLabel: '2025.01.01',
    yearLabel: '2025年',
    location: '上海',
    likes: 31,
    caption: '新年第一张合照，新的开始。',
    comments: '希望以后的每一年都一起过。',
    tags: ['节日', '约会'],
    height: 195,
  }
]

Page({
  data: {
    tabs: [
      { key: 'all', label: '全部' },
      { key: '旅行', label: '旅行' },
      { key: '日常', label: '日常' },
      { key: '约会', label: '约会' },
      { key: '节日', label: '节日' },
    ],
    activeTab: 'all',
    memoryHighlight: null,
    leftColumn: [],
    rightColumn: [],
    isEmpty: false,
    photos: DEFAULT_PHOTOS.slice()
  },

  onShow() {
    this.syncPhotosFromStorage()
    this.buildGallery()
  },

  syncPhotosFromStorage() {
    const stored = wx.getStorageSync('galleryPhotosDB')
    if (Array.isArray(stored) && stored.length > 0) {
      this.setData({ photos: stored })
      return
    }

    const defaultPhotos = DEFAULT_PHOTOS.slice()
    wx.setStorageSync('galleryPhotosDB', defaultPhotos)
    this.setData({ photos: defaultPhotos })
  },

  buildGallery() {
    const filtered = this.getFilteredPhotos()
    const left = []
    const right = []
    let leftHeight = 0
    let rightHeight = 0

    filtered.forEach(photo => {
      const cardHeight = Number(photo.height || 220) + 64
      if (leftHeight <= rightHeight) {
        left.push(photo)
        leftHeight += cardHeight
      } else {
        right.push(photo)
        rightHeight += cardHeight
      }
    })

    const memoryHighlight = filtered.length > 0 ? filtered[0] : (this.data.photos[0] || null)

    wx.setStorageSync('galleryPhotosCache', this.data.photos)
    this.setData({
      leftColumn: left,
      rightColumn: right,
      memoryHighlight,
      isEmpty: filtered.length === 0,
    })
  },

  getFilteredPhotos() {
    if (this.data.activeTab === 'all') {
      return this.data.photos.slice()
    }
    return this.data.photos.filter(photo => (photo.tags || []).includes(this.data.activeTab))
  },

  onTabChange(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.activeTab) return
    this.setData({ activeTab: key })
    this.buildGallery()
  },

  onTagTap(e) {
    const tag = e.currentTarget.dataset.tag
    if (!tag) return
    this.setData({ activeTab: tag })
    this.buildGallery()
  },

  toDetail(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: `../PhotoDetail/index?id=${id}` })
  },

  onHeaderAdd() {
    this.showAddSheet()
  },

  onHeaderMore() {
    wx.showToast({ title: '更多功能开发中', icon: 'none' })
  },

  onFabTap() {
    this.showAddSheet()
  },

  showAddSheet() {
    wx.showActionSheet({
      itemList: ['拍照', '从相册选择', '记录回忆'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.pickImageAndCreateMemory('camera')
        } else if (res.tapIndex === 1) {
          this.pickImageAndCreateMemory('album')
        } else if (res.tapIndex === 2) {
          wx.navigateTo({ url: '../PhotoMemoryAdd/index' })
        }
      }
    })
  },

  pickImageAndCreateMemory(sourceType) {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: [sourceType],
      success: (res) => {
        const file = (res.tempFiles && res.tempFiles[0]) ? res.tempFiles[0] : null
        const imagePath = file ? file.tempFilePath : ''
        if (!imagePath) {
          wx.showToast({ title: '未获取到图片', icon: 'none' })
          return
        }

        const now = new Date()
        const year = now.getFullYear()
        const month = `${now.getMonth() + 1}`.padStart(2, '0')
        const day = `${now.getDate()}`.padStart(2, '0')
        const newMemory = {
          id: `p${Date.now()}`,
          image: imagePath,
          dateLabel: `${year}.${month}.${day}`,
          yearLabel: `${year}年`,
          location: '未命名地点',
          likes: 0,
          caption: sourceType === 'camera' ? '刚刚拍下这一刻。' : '新加入的一张回忆。',
          comments: '记录当下，让回忆慢慢发光。',
          tags: ['日常'],
          height: 180 + Math.floor(Math.random() * 100),
        }

        const nextPhotos = [newMemory].concat(this.data.photos)
        this.setData({ photos: nextPhotos })
        wx.setStorageSync('galleryPhotosDB', nextPhotos)
        wx.setStorageSync('galleryPhotosCache', nextPhotos)
        this.buildGallery()

        wx.showToast({
          title: sourceType === 'camera' ? '拍照已添加' : '照片已添加',
          icon: 'success',
          duration: 1200,
        })
      },
      fail: () => {
        wx.showToast({ title: '已取消操作', icon: 'none' })
      }
    })
  }
})
