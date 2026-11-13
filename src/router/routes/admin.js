const adminMeta = { requiresAuth: true, requiresAdmin: true, hideSidebar: true };

export const adminRoutes = [
  {
    path: '/admin',
    name: 'AdminDashboard',
    component: () => import('@/views/admin/AdminDashboard.vue'),
    meta: adminMeta
  },
  {
    path: '/admin/inquiry',
    name: 'AdminInquiryList',
    component: () => import('@/views/admin/InquiryList.vue'),
    meta: adminMeta
  },
  {
    path: '/admin/notification',
    name: 'AdminNotificationList',
    component: () => import('@/views/admin/NotificationList.vue'),
    meta: adminMeta
  },
  {
    path: '/admin/users',
    name: 'AdminUserManagement',
    component: () => import('@/views/admin/UserManagement.vue'),
    meta: adminMeta
  }
];
