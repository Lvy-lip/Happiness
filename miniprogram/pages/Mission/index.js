Page({
  data: {
    allMissions: [],

    _openidA: getApp().globalData._openidA,
    _openidB: getApp().globalData._openidB,

    filterOptions: [
      { key: 'all', label: '全部' },
      { key: 'today', label: '今日' },
      { key: 'unfinished', label: '未完成' },
      { key: 'finished', label: '已完成' },
    ],
    sortOptions: [
      { key: 'default', label: '默认' },
      { key: 'reward', label: '奖励最高' },
      { key: 'time', label: '耗时最短' },
      { key: 'priority', label: '优先级' },
    ],
    activeFilter: 'all',
    activeSort: 'default',

    sectionCollapsed: {
      focus: false,
      skill: false,
      create: false,
      optional: false,
    },
    sectionList: [],

    dashboard: {
      completeRate: 0,
      todayFinished: 0,
      todayPoints: 0,
      streakDays: 0,
      remainMinutes: 0,
    },

    sectionMeta: {
      focus: '今日重点',
      skill: '技能提升',
      create: '创造输出',
      optional: '可选任务',
    },

    missionSettings: {
      defaultFilter: 'all',
      defaultSort: 'default',
      showCompleteToast: true,
    }
  },

  async onShow() {
    this.loadMissionSettings()
    await this.loadMissions()
  },

  loadMissionSettings() {
    const settings = wx.getStorageSync('missionSettings') || {}
    const filterKeys = this.data.filterOptions.map(item => item.key)
    const sortKeys = this.data.sortOptions.map(item => item.key)

    const defaultFilter = filterKeys.includes(settings.defaultFilter) ? settings.defaultFilter : 'all'
    const defaultSort = sortKeys.includes(settings.defaultSort) ? settings.defaultSort : 'default'
    const showCompleteToast = typeof settings.showCompleteToast === 'boolean' ? settings.showCompleteToast : true

    this.setData({
      missionSettings: {
        defaultFilter,
        defaultSort,
        showCompleteToast,
      },
      activeFilter: defaultFilter,
      activeSort: defaultSort,
    })
  },

  async loadMissions() {
    await wx.cloud.callFunction({
      name: 'getList',
      data: { list: getApp().globalData.collectionMissionList }
    }).then(data => {
      this.setData({ allMissions: data.result.data || [] })
      this.refreshDashboardAndSections()
    })
  },

  refreshDashboardAndSections() {
    const allMissions = this.data.allMissions || []
    const filtered = this.sortMissions(this.applyFilter(allMissions))

    const sectionMap = {
      focus: [],
      skill: [],
      create: [],
      optional: [],
    }

    filtered.forEach((mission) => {
      const sectionKey = this.getSectionKey(mission)
      sectionMap[sectionKey].push(this.toTaskView(mission, sectionKey))
    })

    const sectionList = Object.keys(this.data.sectionMeta).map((key) => ({
      key,
      title: this.data.sectionMeta[key],
      count: sectionMap[key].length,
      collapsed: this.data.sectionCollapsed[key],
      tasks: sectionMap[key],
    }))

    this.setData({
      sectionList,
      dashboard: this.buildDashboard(allMissions),
    })
  },

  applyFilter(missions) {
    if (this.data.activeFilter === 'today') {
      return missions.filter(item => this.isToday(item.date))
    }
    if (this.data.activeFilter === 'unfinished') {
      return missions.filter(item => item.available === true)
    }
    if (this.data.activeFilter === 'finished') {
      return missions.filter(item => item.available === false)
    }
    return missions.slice()
  },

  sortMissions(missions) {
    const next = missions.slice()
    const getCredit = (item) => Number(item.credit || 0)

    if (this.data.activeSort === 'reward') {
      next.sort((a, b) => getCredit(b) - getCredit(a))
    } else if (this.data.activeSort === 'time') {
      next.sort((a, b) => this.getEstimateMinutes(a) - this.getEstimateMinutes(b))
    } else if (this.data.activeSort === 'priority') {
      next.sort((a, b) => {
        if (!!a.star === !!b.star) return getCredit(b) - getCredit(a)
        return a.star ? -1 : 1
      })
    } else {
      next.sort((a, b) => {
        const timeA = new Date(a.date || 0).getTime() || 0
        const timeB = new Date(b.date || 0).getTime() || 0
        return timeB - timeA
      })
    }

    return next
  },

  getSectionKey(mission) {
    const credit = Number(mission.credit || 0)
    if (mission.star) return 'focus'
    if (credit >= 15) return 'skill'
    if (credit >= 8) return 'create'
    return 'optional'
  },

  toTaskView(mission, sectionKey) {
    const ownerTag = mission._openid === this.data._openidA ? 'A侧任务' : 'B侧任务'
    const sectionName = this.data.sectionMeta[sectionKey]

    return {
      ...mission,
      title: mission.title || '未命名任务',
      desc: `${this.getDateLabel(mission.date)} · ${ownerTag}`,
      timeTag: `预计 ${this.getEstimateMinutes(mission)}m`,
      typeTag: mission.available ? sectionName : '已完成',
      priorityTag: mission.star ? '高优先' : '普通优先',
    }
  },

  buildDashboard(missions) {
    const total = missions.length
    const finished = missions.filter(item => item.available === false)
    const todayFinishedList = finished.filter(item => this.isToday(item.date))
    const completeRate = total === 0 ? 0 : Math.round((finished.length / total) * 100)
    const todayPoints = todayFinishedList.reduce((sum, item) => sum + Number(item.credit || 0), 0)
    const remainMinutes = missions
      .filter(item => item.available === true)
      .reduce((sum, item) => sum + this.getEstimateMinutes(item), 0)

    return {
      completeRate,
      todayFinished: todayFinishedList.length,
      todayPoints,
      streakDays: this.getStreakDays(finished),
      remainMinutes,
    }
  },

  getEstimateMinutes(mission) {
    const credit = Number(mission.credit || 0)
    return Math.max(5, Math.min(90, credit * 3))
  },

  getDateLabel(dateText) {
    if (!dateText) return '未记录时间'
    return `${String(dateText).slice(0, 10)} 创建`
  },

  isToday(dateText) {
    if (!dateText) return false
    const date = new Date(dateText)
    if (Number.isNaN(date.getTime())) return false

    const now = new Date()
    return (
      date.getFullYear() === now.getFullYear() &&
      date.getMonth() === now.getMonth() &&
      date.getDate() === now.getDate()
    )
  },

  getDateKey(dateText) {
    const date = new Date(dateText)
    if (Number.isNaN(date.getTime())) return ''

    const year = date.getFullYear()
    const month = `${date.getMonth() + 1}`.padStart(2, '0')
    const day = `${date.getDate()}`.padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  getStreakDays(finishedMissions) {
    const daySet = {}
    finishedMissions.forEach(item => {
      const key = this.getDateKey(item.date)
      if (key) daySet[key] = true
    })

    let streak = 0
    const cursor = new Date()
    while (true) {
      const year = cursor.getFullYear()
      const month = `${cursor.getMonth() + 1}`.padStart(2, '0')
      const day = `${cursor.getDate()}`.padStart(2, '0')
      const key = `${year}-${month}-${day}`
      if (!daySet[key]) break
      streak += 1
      cursor.setDate(cursor.getDate() - 1)
    }

    return streak
  },

  onFilterChange(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.activeFilter) return
    this.setData({ activeFilter: key })
    this.refreshDashboardAndSections()
  },

  onSortChange(e) {
    const key = e.currentTarget.dataset.key
    if (!key || key === this.data.activeSort) return
    this.setData({ activeSort: key })
    this.refreshDashboardAndSections()
  },

  toggleSection(e) {
    const key = e.currentTarget.dataset.key
    if (!key) return
    const field = `sectionCollapsed.${key}`
    this.setData({ [field]: !this.data.sectionCollapsed[key] })
    this.refreshDashboardAndSections()
  },

  async toDetailById(e) {
    const id = e.currentTarget.dataset.id
    if (!id) return
    wx.navigateTo({ url: '../MissionDetail/index?id=' + id })
  },

  noop() {},

  async onTaskCompleteTap(e) {
    const id = e.currentTarget.dataset.id
    const mission = this.data.allMissions.find(item => item._id === id)
    if (!mission) return

    if (mission.available === false) {
      wx.showToast({ title: '任务已经完成', icon: 'none' })
      return
    }

    await this.finishMissionById(mission)
  },

  async onToggleStar(e) {
    const id = e.currentTarget.dataset.id
    const mission = this.data.allMissions.find(item => item._id === id)
    if (!mission) return

    await wx.cloud.callFunction({ name: 'getOpenId' }).then(async openid => {
      if (mission._openid !== openid.result) {
        wx.showToast({ title: '只能编辑自己的任务', icon: 'none' })
        return
      }

      await wx.cloud.callFunction({
        name: 'editStar',
        data: {
          _id: mission._id,
          list: getApp().globalData.collectionMissionList,
          value: !mission.star,
        }
      })

      mission.star = !mission.star
      this.setData({ allMissions: this.data.allMissions })
      this.refreshDashboardAndSections()
    })
  },

  async onDeleteTask(e) {
    const id = e.currentTarget.dataset.id
    const mission = this.data.allMissions.find(item => item._id === id)
    if (!mission) return

    await wx.cloud.callFunction({ name: 'getOpenId' }).then(async openid => {
      if (mission._openid !== openid.result) {
        wx.showToast({ title: '只能编辑自己的任务', icon: 'none' })
        return
      }

      await wx.cloud.callFunction({
        name: 'deleteElement',
        data: {
          _id: mission._id,
          list: getApp().globalData.collectionMissionList,
        }
      })

      const next = this.data.allMissions.filter(item => item._id !== mission._id)
      this.setData({ allMissions: next })
      this.refreshDashboardAndSections()
    })
  },

  async finishMissionById(mission) {
    await wx.cloud.callFunction({ name: 'getOpenId' }).then(async openid => {
      if (mission._openid === openid.result) {
        wx.showToast({
          title: '不能完成自己的任务',
          icon: 'none',
          duration: 2000,
        })
        return
      }

      await wx.cloud.callFunction({
        name: 'editAvailable',
        data: {
          _id: mission._id,
          value: false,
          list: getApp().globalData.collectionMissionList,
        }
      })
      await wx.cloud.callFunction({
        name: 'editCredit',
        data: {
          _openid: mission._openid,
          value: mission.credit,
          list: getApp().globalData.collectionUserList,
        }
      })

      mission.available = false
      this.setData({ allMissions: this.data.allMissions })
      this.refreshDashboardAndSections()

      if (this.data.missionSettings.showCompleteToast) {
        wx.showToast({
          title: '任务完成',
          icon: 'success',
          duration: 1600,
        })
      }
    })
  },

  async toAddPage() {
    wx.navigateTo({ url: '../MissionAdd/index' })
  },

  onQuickActionTap(e) {
    const action = e.currentTarget.dataset.action
    if (action === 'new') {
      this.toAddPage()
      return
    }
    if (action === 'template') {
      wx.navigateTo({ url: '../MissionTemplate/index' })
      return
    }
    if (action === 'gallery') {
      wx.switchTab({ url: '/pages/PhotoGallery/index' })
      return
    }
    wx.navigateTo({ url: '../MissionReview/index' })
  },

  onFabTap() {
    wx.showActionSheet({
      itemList: ['新建任务', '从模板创建', '快速记录'],
      success: (res) => {
        if (res.tapIndex === 0) {
          this.toAddPage()
        } else if (res.tapIndex === 1) {
          wx.navigateTo({ url: '../MissionTemplate/index' })
        } else if (res.tapIndex === 2) {
          wx.navigateTo({ url: '../MissionReview/index?mode=quick' })
        }
      }
    })
  },

  onMoreTap() {
    wx.navigateTo({ url: '../MissionMore/index' })
  },

  onSettingsTap() {
    wx.navigateTo({ url: '../MissionSettings/index' })
  }
})
