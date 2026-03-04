/* Main page of the app */
Page({
    //允许接收服务通知
    async requestSubscribeMessage() {
        const templateId = 'R5sHALA7TKs6jCyH_kwNr9l8vVfWKCU5cXQnFKWlwfA'//填入你自己想要的模板ID，记得复制粘贴全，我自己因为网页没开全，结果浪费半小时
        wx.requestSubscribeMessage({
        //tmplIds: [templateId,templateId2,templateId3],
        tmplIds: [templateId],
        success: (res) => {
            //if (res[templateId] === 'accept'&&res[templateId2] === 'accept'&&res[templateId3] === 'accept') {
            if (res[templateId] === 'accept') {
            this.setData({
                requestSubscribeMessageResult: '成功',
            })
            } else {
            this.setData({
                requestSubscribeMessageResult: `失败（${res[templateId]}）`,
            })
            }
        },
        fail: (err) => {
            this.setData({
            requestSubscribeMessageResult: `失败（${JSON.stringify(err)}）`,
            })
        },
        })
    },
    data: {
        creditA: 0,
        creditB: 0,

        userA: '',
        userB: '',

        period: 'all',
        periodTabs: [
            { label: '当天', value: 'day' },
            { label: '当周', value: 'week' },
            { label: '当月', value: 'month' },
            { label: '至今', value: 'all' },
        ],
        periodLabelMap: {
            day: '当天',
            week: '当周',
            month: '当月',
            all: '至今',
        },
        periodLabel: '至今',
        growthView: {
            hasCompareUser: false,
            userAName: '我',
            userBName: '对比用户',
            userAPoints: 0,
            userBPoints: 0,
            leaderText: '暂无对比数据',
            noData: true,
            bar: {
                aPctStr: '0%',
                bPctStr: '0%',
            },
        },
    },

    async onShow(){
        this.getCreditA()
        this.getCreditB()
        this.setData({
            userA: getApp().globalData.userA,
            userB: getApp().globalData.userB,
        })
        this.refreshGrowthAnalysis()
    },

    onPeriodChange(e) {
        const nextPeriod = e.currentTarget.dataset.value
        if (!nextPeriod || nextPeriod === this.data.period) {
            return
        }
        this.setData({ period: nextPeriod })
        this.refreshGrowthAnalysis()
    },

    goGrowthDetail() {
        const view = this.data.growthView || {}
        const query = [
            `periodLabel=${encodeURIComponent(this.data.periodLabel || '至今')}`,
            `userAName=${encodeURIComponent(view.userAName || '我')}`,
            `userBName=${encodeURIComponent(view.userBName || '对比用户')}`,
            `userAPoints=${Number(view.userAPoints || 0)}`,
            `userBPoints=${Number(view.userBPoints || 0)}`,
            `leaderText=${encodeURIComponent(view.leaderText || '暂无记录')}`,
        ].join('&')
        wx.navigateTo({
            url: `/pages/GrowthDetail/index?${query}`,
        })
    },

    onSelectCompareUser() {
        wx.showToast({
            title: '选择对比用户入口预留',
            icon: 'none',
        })
    },

    goPhotoGallery() {
        wx.switchTab({
            url: '/pages/PhotoGallery/index',
        })
    },

    goMissionCenter() {
        wx.switchTab({
            url: '/pages/Mission/index',
        })
    },

    goMarketPage() {
        wx.switchTab({
            url: '/pages/Market/index',
        })
    },

    getPeriodPoints(role) {
        const basePoints = role === 'A' ? Number(this.data.creditA || 0) : Number(this.data.creditB || 0)
        const periodMap = {
            day: basePoints,
            week: basePoints,
            month: basePoints,
            all: basePoints,
        }
        return Number(periodMap[this.data.period] || 0)
    },

    refreshGrowthAnalysis() {
        const userAName = this.data.userA || '我'
        const hasCompareUser = !!this.data.userB
        const userBName = hasCompareUser ? this.data.userB : '对比用户'
        const aValue = this.getPeriodPoints('A')
        const bValue = hasCompareUser ? this.getPeriodPoints('B') : 0
        const total = aValue + bValue
        const aPct = total === 0 ? 0 : (aValue / total)
        const bPct = total === 0 ? 0 : (bValue / total)

        let leaderText = '暂无记录'
        if (!hasCompareUser) {
            leaderText = '先选择对比用户，查看领先情况'
        } else if (total === 0) {
            leaderText = '当前时间范围暂无积分记录'
        } else if (aValue === bValue) {
            leaderText = `双方持平（${aValue}分）`
        } else {
            const leaderName = aValue > bValue ? userAName : userBName
            const diff = Math.abs(aValue - bValue)
            leaderText = `${leaderName} 领先 ${diff} 分`
        }

        this.setData({
            periodLabel: this.data.periodLabelMap[this.data.period],
            growthView: {
                hasCompareUser,
                userAName,
                userBName,
                userAPoints: aValue,
                userBPoints: bValue,
                leaderText,
                noData: total === 0,
                bar: {
                    aPctStr: `${(aPct * 100).toFixed(2)}%`,
                    bPctStr: `${(bPct * 100).toFixed(2)}%`,
                },
            },
        })
    },

    getCreditA(){
        wx.cloud.callFunction({name: 'getElementByOpenId', data: {list: getApp().globalData.collectionUserList, _openid: getApp().globalData._openidA}})
        .then(res => {
          const credit = res.result.data[0] ? Number(res.result.data[0].credit || 0) : 0
          this.setData({creditA: credit})
          this.refreshGrowthAnalysis()
        })
    },
    
    getCreditB(){
        wx.cloud.callFunction({name: 'getElementByOpenId', data: {list: getApp().globalData.collectionUserList, _openid: getApp().globalData._openidB}})
        .then(res => {
            const credit = res.result.data[0] ? Number(res.result.data[0].credit || 0) : 0
            this.setData({creditB: credit})
            this.refreshGrowthAnalysis()
        })
    },
})