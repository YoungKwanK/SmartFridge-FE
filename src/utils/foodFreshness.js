// 식품 유통기한 상태 계산
// 백엔드(FoodService) 기준과 같게: 지금부터 3일 이내면 임박, 지났으면 만료

const DAY_MS = 24 * 60 * 60 * 1000;
export const SOON_DAYS = 3;

// 카테고리 enum(백엔드 Category)에 맞춘 이모지
const CATEGORY_EMOJI = {
  유제품: '🥛',
  가공식품: '🥫',
  채소: '🥬',
  과일: '🍎',
  고기: '🥩',
  음료: '🧃',
  기타: '🍱'
};

export function categoryEmoji(category) {
  return CATEGORY_EMOJI[category] || CATEGORY_EMOJI.기타;
}

// 날짜 단위로 남은 일수 (오늘 = 0, 어제 = -1)
export function daysLeft(expirationDateTime, now = new Date()) {
  if (!expirationDateTime) return null;
  const exp = new Date(expirationDateTime);
  const expDay = new Date(exp.getFullYear(), exp.getMonth(), exp.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((expDay - today) / DAY_MS);
}

// 'expired' | 'soon' | 'fresh' | 'unknown'
export function freshnessStatus(expirationDateTime, now = new Date()) {
  if (!expirationDateTime) return 'unknown';
  const exp = new Date(expirationDateTime);
  if (exp < now) return 'expired';
  if (exp - now <= SOON_DAYS * DAY_MS) return 'soon';
  return 'fresh';
}

// 뱃지에 쓸 짧은 글자
export function ddayLabel(expirationDateTime, now = new Date()) {
  const status = freshnessStatus(expirationDateTime, now);
  if (status === 'unknown') return '기한 없음';
  if (status === 'expired') return '만료';
  const days = daysLeft(expirationDateTime, now);
  return days <= 0 ? '오늘까지' : `D-${days}`;
}

// 스크린리더용 긴 설명
export function ddayDescription(expirationDateTime, now = new Date()) {
  const status = freshnessStatus(expirationDateTime, now);
  if (status === 'unknown') return '유통기한 정보 없음';
  const days = daysLeft(expirationDateTime, now);
  if (status === 'expired') {
    return days < 0 ? `유통기한이 ${-days}일 지났어요` : '유통기한이 지났어요';
  }
  return days <= 0 ? '오늘까지 먹어야 해요' : `유통기한 ${days}일 남음`;
}
