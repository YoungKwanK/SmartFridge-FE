// 관리자 화면은 AdminLayout(머리글·탭) 안에 자식 라우트로 들어간다
export const adminRoutes = [
  {
    path: '/admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    meta: { requiresAuth: true, requiresAdmin: true, hideSidebar: true },
    children: [
      {
        path: '',
        name: 'AdminDashboard',
        component: () => import('@/views/admin/AdminDashboard.vue')
      },
      {
        path: 'inquiry',
        name: 'AdminInquiryList',
        component: () => import('@/views/admin/InquiryList.vue')
      },
      {
        path: 'notification',
        name: 'AdminNotificationList',
        component: () => import('@/views/admin/NotificationList.vue')
      },
      {
        path: 'users',
        name: 'AdminUserManagement',
        component: () => import('@/views/admin/UserManagement.vue')
      }
    ]
  }
];
