export const mainRoutes = [
  {
    path: '/',
    name: 'MainDashboard',
    component: () => import('@/views/main/MainDashboard.vue'),
    meta: { hideSidebar: true }
  }
];
