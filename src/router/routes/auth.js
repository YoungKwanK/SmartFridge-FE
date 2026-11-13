export const authRoutes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/auth/LoginPage.vue'),
    meta: { hideSidebar: true }
  },
  {
    // 관리자 전용 이메일/비밀번호 로그인
    path: '/admin/login',
    name: 'AdminLogin',
    component: () => import('@/views/auth/LoginPage.vue'),
    meta: { hideSidebar: true }
  },
  {
    // 구글·카카오·네이버 로그인 후 돌아오는 주소 (OAuth redirect URI와 같아야 함)
    path: '/oauth/:provider(google|kakao|naver)/redirect',
    name: 'OAuthRedirect',
    component: () => import('@/views/auth/OAuthRedirect.vue'),
    meta: { hideSidebar: true }
  }
];
