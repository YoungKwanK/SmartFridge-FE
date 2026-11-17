import { reactive } from 'vue';

/*
 * 레시피 추천 결과 캐시.
 * 화면을 벗어나도(상세를 보고 돌아와도) 남아 있게 모듈에 둔다. AI 추천은 느리고 비용이 들어서 다시 부르지 않는다.
 * 냉장고가 바뀌면 쓰지 않고, 식품이 바뀌었을 수 있으니 10분이 지나면 다시 받는다.
 */
const TTL_MS = 10 * 60 * 1000;

// { [mode]: { fridgeId, savedAt, data } }
const entries = reactive({});

export function getRecommendCache(mode, fridgeId) {
  const entry = entries[mode];
  if (!entry || entry.fridgeId !== fridgeId) return null;
  if (Date.now() - entry.savedAt > TTL_MS) return null;
  return entry.data;
}

export function setRecommendCache(mode, fridgeId, data) {
  entries[mode] = data ? { fridgeId, savedAt: Date.now(), data } : null;
}

// AI가 이 레시피를 고른 이유 (AI 추천을 받은 적이 없거나 AI가 순서를 정하지 못했으면 '')
export function findAiReason(fridgeId, recipeId) {
  const ai = getRecommendCache('ai', fridgeId);
  if (!ai?.aiRanked) return '';
  return ai.items.find(item => item.recipe.recipeId === recipeId)?.reason || '';
}
