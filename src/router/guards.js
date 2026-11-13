// 라우터 가드 - 인증이 필요한 페이지 접근 제어
// (vue-router 5에서 next() 콜백 방식이 deprecated 되어 반환값 방식 사용)
export const authGuard = (to) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const isAuthenticated = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('role') || 'USER';

  // 인증이 필요한 페이지인데 로그인하지 않은 경우
  if (requiresAuth && !isAuthenticated) {
    return '/';
  }
  // 관리자 권한이 필요한 페이지인데 관리자가 아닌 경우
  if (requiresAdmin && userRole !== 'ADMIN') {
    return '/';
  }
  // 이미 로그인된 사용자가 로그인 페이지에 접근하려는 경우
  if ((to.path === '/login' || to.path === '/admin/login') && isAuthenticated) {
    // 관리자인 경우 관리자 대시보드로, 일반 사용자인 경우 냉장고 목록으로
    return userRole === 'ADMIN' ? '/admin' : '/fridge/list';
  }
  return true;
};

// 페이지 이동 후 SSE 연결이 끊겨 있으면 다시 연결
export const reconnectSSE = () => {
  const isAuthenticated = localStorage.getItem('accessToken');
  const store = window.$store;
  if (store && isAuthenticated) {
    const isConnected = store.getters['notification/isSSEConnected'];
    if (!isConnected) {
      store.dispatch('notification/initSSE', store);
    }
  }
};
