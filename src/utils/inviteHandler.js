// 소셜 로그인은 외부 사이트를 거쳐 같은 탭으로 돌아오므로, 초대 코드를 sessionStorage에 보관한다
// (로그인 페이지의 localStorage.clear()에도 지워지지 않고, 다른 탭의 로그인에는 영향을 주지 않는다)
const PENDING_INVITE_CODE_KEY = 'pendingInviteCode';

export function savePendingInviteCode(code) {
  sessionStorage.setItem(PENDING_INVITE_CODE_KEY, code);
}

export function clearPendingInviteCode() {
  sessionStorage.removeItem(PENDING_INVITE_CODE_KEY);
}

// 소셜 로그인 후 이동할 경로: 처리 중인 초대가 있으면 초대 페이지, 없으면 냉장고 목록
export function getPostLoginPath() {
  const code = sessionStorage.getItem(PENDING_INVITE_CODE_KEY);
  return code ? `/invite/${encodeURIComponent(code)}` : '/fridge/list';
}
