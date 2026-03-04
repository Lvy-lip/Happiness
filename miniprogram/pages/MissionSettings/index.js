Page({
	data: {
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
		defaultFilter: 'all',
		defaultSort: 'default',
		defaultFilterLabel: '全部',
		defaultSortLabel: '默认',
		showCompleteToast: true,
	},

	onShow() {
		this.loadSettings()
	},

	loadSettings() {
		const settings = wx.getStorageSync('missionSettings') || {}
		const filterKeys = this.data.filterOptions.map(item => item.key)
		const sortKeys = this.data.sortOptions.map(item => item.key)

		const defaultFilter = filterKeys.includes(settings.defaultFilter) ? settings.defaultFilter : 'all'
		const defaultSort = sortKeys.includes(settings.defaultSort) ? settings.defaultSort : 'default'
		const showCompleteToast = typeof settings.showCompleteToast === 'boolean' ? settings.showCompleteToast : true
		const filterLabel = this.data.filterOptions.find(item => item.key === defaultFilter)?.label || '全部'
		const sortLabel = this.data.sortOptions.find(item => item.key === defaultSort)?.label || '默认'

		this.setData({
			defaultFilter,
			defaultSort,
			defaultFilterLabel: filterLabel,
			defaultSortLabel: sortLabel,
			showCompleteToast,
		})
	},

	saveSettings(next) {
		const settings = {
			defaultFilter: next.defaultFilter,
			defaultSort: next.defaultSort,
			showCompleteToast: next.showCompleteToast,
		}
		wx.setStorageSync('missionSettings', settings)
	},

	pickDefaultFilter() {
		wx.showActionSheet({
			itemList: this.data.filterOptions.map(item => item.label),
			success: (res) => {
				const selected = this.data.filterOptions[res.tapIndex]
				if (!selected) return
				const next = {
					defaultFilter: selected.key,
					defaultSort: this.data.defaultSort,
					showCompleteToast: this.data.showCompleteToast,
				}
				this.setData({
					defaultFilter: selected.key,
					defaultFilterLabel: selected.label,
				})
				this.saveSettings(next)
			}
		})
	},

	pickDefaultSort() {
		wx.showActionSheet({
			itemList: this.data.sortOptions.map(item => item.label),
			success: (res) => {
				const selected = this.data.sortOptions[res.tapIndex]
				if (!selected) return
				const next = {
					defaultFilter: this.data.defaultFilter,
					defaultSort: selected.key,
					showCompleteToast: this.data.showCompleteToast,
				}
				this.setData({
					defaultSort: selected.key,
					defaultSortLabel: selected.label,
				})
				this.saveSettings(next)
			}
		})
	},

	onCompleteToastChange(e) {
		const showCompleteToast = !!e.detail.value
		const next = {
			defaultFilter: this.data.defaultFilter,
			defaultSort: this.data.defaultSort,
			showCompleteToast,
		}
		this.setData({ showCompleteToast })
		this.saveSettings(next)
	},

})
