export default {
  namespaced: true,
  state: {
    notifications: [],
    notificationCount: 0,
    typeCounts: {
      ADMIN_REPLY: 0,
      NEW_FOOD: 0,
      EXPIRATION_IMMINENT: 0,
      NEW_ANNOUNCEMENT: 0,
      NEW_COMMENT: 0,
      NEW_INQUIRY: 0,
      NEW_MEMBER: 0
    }
  },
  mutations: {
    addNotification(state, notification) {
      state.notifications.unshift(notification); // 최신 알림을 맨 앞에 추가
      state.notificationCount++;
      
      // 타입별 카운트 증가
      if (notification.type && notification.type in state.typeCounts) {
        state.typeCounts[notification.type]++;
      }
      
      // 알림 개수 제한 (최대 5개)
      if (state.notifications.length > 5) {
        state.notifications = state.notifications.slice(0, 5);
      }
    },
    clearNotifications(state) {
      state.notifications = [];
      state.notificationCount = 0;
      // 타입별 카운트 초기화
      Object.keys(state.typeCounts).forEach(key => {
        state.typeCounts[key] = 0;
      });
    },
    markAsRead(state, notificationId) {
      const notification = state.notifications.find(n => n.id === notificationId);
      if (notification) {
        notification.isRead = true;
      }
    }
  },
  actions: {
    addNotification({ commit }, notification) {
      commit('addNotification', notification);
    },
    clearNotifications({ commit }) {
      commit('clearNotifications');
    },
    markAsRead({ commit }, notificationId) {
      commit('markAsRead', notificationId);
    }
  },
  getters: {
    allNotifications: (state) => state.notifications,
    notificationCount: (state) => state.notificationCount,
    typeCounts: (state) => state.typeCounts,
    unreadCount: (state) => state.notifications.filter(n => !n.isRead).length
  }
};