const db = wx.cloud.database();

Page({
  data: {
    coupleId: getApp().globalData.defaultCoupleId,
    todoTitle: '',
    todoType: 'today',
    dailyTodos: [],
    todayTodos: []
  },

  async onShow() {
    await this.loadTodos();
  },

  onInput(e) { this.setData({ todoTitle: e.detail.value }); },

  switchType(e) { this.setData({ todoType: e.currentTarget.dataset.type }); },

  async loadTodos() {
    const res = await db.collection('todos').where({ coupleId: this.data.coupleId }).orderBy('createdAt', 'desc').get();
    this.setData({
      dailyTodos: res.data.filter(i => i.type === 'daily'),
      todayTodos: res.data.filter(i => i.type === 'today')
    });
  },

  async addTodo() {
    if (!this.data.todoTitle.trim()) return;
    await db.collection('todos').add({
      data: {
        coupleId: this.data.coupleId,
        title: this.data.todoTitle.trim(),
        type: this.data.todoType,
        points: 10,
        completed: false,
        settled: false,
        completedAt: null,
        createdAt: new Date()
      }
    });
    this.setData({ todoTitle: '' });
    await this.loadTodos();
  },

  async toggleTodo(e) {
    const todoId = e.currentTarget.dataset.id;
    await wx.cloud.callFunction({
      name: 'settleTodoComplete',
      data: { todoId, coupleId: this.data.coupleId }
    });
    await this.loadTodos();
  },

  async deleteTodo(e) {
    await db.collection('todos').doc(e.currentTarget.dataset.id).remove();
    await this.loadTodos();
  },

  async editTodo(e) {
    const id = e.currentTarget.dataset.id;
    const target = [...this.data.dailyTodos, ...this.data.todayTodos].find(i => i._id === id);
    if (!target) return;
    wx.showModal({
      title: '编辑todo',
      editable: true,
      placeholderText: target.title,
      success: async (res) => {
        if (res.confirm && res.content.trim()) {
          await db.collection('todos').doc(id).update({ data: { title: res.content.trim() } });
          await this.loadTodos();
        }
      }
    });
  }
});
