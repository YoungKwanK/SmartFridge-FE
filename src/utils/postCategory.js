import axios from 'axios';

// 게시판 카테고리 이름 (백엔드 PostCategory enum과 같음)
export const NOTICE_CATEGORY = '공지사항';
export const DEFAULT_CATEGORY = '자유게시판';
export const PURCHASE_CATEGORY = '공동구매'; // 이 카테고리로 글을 쓰면 공동구매 채팅방이 같이 생긴다
const FALLBACK_CATEGORIES = ['공지사항', '자유게시판', '공동구매'];

// 한 번 받아온 목록을 화면끼리 같이 쓰도록 저장 (커뮤니티 화면과 작성 모달이 따로 요청하지 않게)
let categoriesPromise = null;

/**
 * 게시판 카테고리 이름 목록을 가져온다. 예: ['공지사항', '자유게시판', '공동구매']
 * 처음 한 번만 /api/categories를 부르고, 이후에는 저장해 둔 결과를 돌려준다.
 * 요청이 실패하면 기본 목록을 돌려주고, 다음 호출 때 다시 요청한다.
 */
export function fetchPostCategories() {
  if (!categoriesPromise) {
    categoriesPromise = axios
      .get(`${import.meta.env.VITE_API_BASE_URL}/api/categories`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` }
      })
      .then(response => response.data)
      .catch(error => {
        console.error('게시판 카테고리 목록을 불러오는 데 실패했습니다.', error);
        categoriesPromise = null;
        return FALLBACK_CATEGORIES;
      });
  }
  return categoriesPromise;
}
