import { defineStore } from 'pinia'

export const useNotificationStore = defineStore('notification', {
  state: () => ({
    notificationCount: parseInt(localStorage.getItem('notificationCount')) || 0
  }),
  getters: {
    getNotificationCount: (state) => state.notificationCount
  },
  actions: {
    // 새로운 알림 도착 시
    increment() {
      this.notificationCount++
      localStorage.setItem('notificationCount', this.notificationCount)
    },

    // 특정 개수만큼 더하기 (SSE에서 데이터에 따라)
    addCount(count) {
      this.notificationCount += count
      localStorage.setItem('notificationCount', this.notificationCount)
    },

    // 읽은 후 초기화
    clear() {
      this.notificationCount = 0
      localStorage.setItem('notificationCount', this.notificationCount)
    },

    // 서버에서 초기값 가져오기 (선택)
    setCount(count) {
      this.notificationCount = count
      localStorage.setItem('notificationCount', this.notificationCount)
    }
  }
})