import { NOTICE_CATEGORY } from '@/utils/postCategory';

export const communityRoutes = [
  {
    path: '/fridge/groupbuy',
    name: 'GroupBuy',
    component: () => import('@/views/groupbuy/GroupBuyPage.vue')
  },
  {
    // 공지사항 전체 목록. 사이드바 메뉴는 없고, 대시보드의 공지 배너에서 들어온다
    path: '/fridge/notice',
    name: 'Notice',
    component: () => import('@/views/notice/NoticePage.vue')
  },
  {
    // 예전 커뮤니티 주소. 공지사항은 공지 목록으로, 나머지는 공동구매로 보낸다
    path: '/fridge/community',
    redirect: to => (to.query.board === NOTICE_CATEGORY ? '/fridge/notice' : '/fridge/groupbuy')
  },
  {
    path: '/fridge/post/:postId',
    name: 'PostDetail',
    component: () => import('@/views/community/PostDetailPage.vue')
  }
];
