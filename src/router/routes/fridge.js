export const fridgeRoutes = [
  {
    path: '/fridge/list',
    name: 'FridgeList',
    component: () => import('@/views/fridge/FridgeList.vue'),
    meta: { requiresAuth: true, hideSidebar: true }
  },
  {
    path: '/fridge/dashboard',
    name: 'FridgeDashboard',
    component: () => import('@/views/fridge/FridgeDashboard.vue')
  },
  {
    path: '/fridge/food/shared',
    name: 'SharedFood',
    component: () => import('@/views/food/SharedFood.vue')
  },
  {
    path: '/fridge/member/list',
    name: 'FridgeMemberList',
    component: () => import('@/views/fridge/FridgeMemberList.vue')
  },
  {
    // 로그인 여부는 InvitePage에서 확인 (가드에 막히면 초대 코드를 저장하지 못함)
    path: '/invite/:code',
    name: 'Invite',
    component: () => import('@/views/fridge/InvitePage.vue'),
    meta: { hideSidebar: true }
  }
];
