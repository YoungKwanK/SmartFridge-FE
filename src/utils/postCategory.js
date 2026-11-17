// 게시판 카테고리 이름 (백엔드 PostCategory enum과 같음)
// 자유게시판은 나중에 다시 열 수 있게 백엔드에는 그대로 두고, 화면에서만 뺐다
export const NOTICE_CATEGORY = '공지사항';
export const PURCHASE_CATEGORY = '공동구매'; // 이 카테고리로 글을 쓰면 공동구매 채팅방이 같이 생긴다

/**
 * 카테고리의 글 목록 화면 주소.
 * 공지사항은 공지사항 목록, 그 밖에는 공동구매 게시판으로 간다.
 */
export function boardRouteOf(category) {
  if (category === NOTICE_CATEGORY) {
    return { path: '/fridge/notice' };
  }
  return { path: '/fridge/groupbuy' };
}
