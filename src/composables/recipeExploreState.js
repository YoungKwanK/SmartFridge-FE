import { reactive } from 'vue';

/*
 * 레시피 검색과 재료 골라서 추천 화면의 상태.
 * 레시피 상세를 보고 돌아와도 검색어·결과·고른 재료가 남아 있게 모듈에 둔다.
 * 냉장고가 바뀌면 그 냉장고 기준으로 처음부터 다시 시작한다 (재료 보유 여부가 냉장고마다 다르다).
 */
const searchState = reactive({
  fridgeId: null,
  keyword: '',
  recipes: [],
  page: 0,
  hasNext: false,
  searched: false
});

const pickState = reactive({
  fridgeId: null,
  // [{ ingredientId, name, owned, expiring }]
  selected: [],
  // [{ recipe, selectedIngredients }] (아직 찾지 않았으면 null)
  results: null
});

export function useSearchState(fridgeId) {
  if (searchState.fridgeId !== fridgeId) {
    Object.assign(searchState, { fridgeId, keyword: '', recipes: [], page: 0, hasNext: false, searched: false });
  }
  return searchState;
}

export function usePickState(fridgeId) {
  if (pickState.fridgeId !== fridgeId) {
    Object.assign(pickState, { fridgeId, selected: [], results: null });
  }
  return pickState;
}
