// 내 정보 · 내 문의 · 내 알림
export const mypageRoutes = [
  {
    path: '/mypage',
    name: 'MyPage',
    component: () => import('@/views/mypage/MyPage.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/inquiry',
    name: 'MyInquiryPage',
    component: () => import('@/views/inquiry/MyInquiryPage.vue')
  },
  {
    path: '/notification/list',
    name: 'MyNotificationPage',
    component: () => import('@/views/notification/MyNotificationPage.vue')
  }
];
