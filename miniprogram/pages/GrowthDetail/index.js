Page({
  data: {
    periodLabel: '至今',
    userAName: '我',
    userBName: '对比用户',
    userAPoints: 0,
    userBPoints: 0,
    leaderText: '暂无记录',
    noData: true,
    aPctStr: '0%',
    bPctStr: '0%',
  },

  onLoad(options) {
    const userAPoints = Number(options.userAPoints || 0)
    const userBPoints = Number(options.userBPoints || 0)
    const total = userAPoints + userBPoints
    const aPct = total === 0 ? 0 : (userAPoints / total)
    const bPct = total === 0 ? 0 : (userBPoints / total)

    this.setData({
      periodLabel: options.periodLabel || '至今',
      userAName: decodeURIComponent(options.userAName || '我'),
      userBName: decodeURIComponent(options.userBName || '对比用户'),
      userAPoints,
      userBPoints,
      leaderText: decodeURIComponent(options.leaderText || '暂无记录'),
      noData: total === 0,
      aPctStr: `${(aPct * 100).toFixed(2)}%`,
      bPctStr: `${(bPct * 100).toFixed(2)}%`,
    })
  }
})
