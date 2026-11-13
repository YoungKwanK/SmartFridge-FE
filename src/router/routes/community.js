export const communityRoutes = [
  {
    path: '/fridge/community',
    name: 'Community',
    component: () => import('@/views/community/CommunityPage.vue')
  },
  {
    path: '/fridge/post/:postId',
    name: 'PostDetail',
    component: () => import('@/views/community/PostDetailPage.vue')
  }
];
