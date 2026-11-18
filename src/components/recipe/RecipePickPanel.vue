<template>
  <section class="sf-list-panel" aria-label="재료 골라서 추천">
    <div class="pick">
      <!-- 고른 재료 -->
      <div class="pick-block">
        <div class="pick-label-row">
          <h2 id="pick-selected-title" class="pick-label">
            고른 재료 <span class="sf-num count">{{ state.selected.length }}/{{ MAX_SELECTED }}</span>
          </h2>
          <v-btn v-if="state.selected.length" variant="text" size="small" @click="clearAll">모두 빼기</v-btn>
        </div>
        <ul v-if="state.selected.length" class="chip-list" aria-labelledby="pick-selected-title">
          <li v-for="item in state.selected" :key="item.ingredientId">
            <button type="button" class="chip is-selected" :aria-label="`${item.name} 빼기`" @click="toggle(item)">
              {{ item.name }}
              <span v-if="!item.owned" class="chip-tag">없음</span>
              <v-icon size="16" aria-hidden="true">mdi-close</v-icon>
            </button>
          </li>
        </ul>
        <p v-else class="pick-hint">아래에서 쓰고 싶은 재료를 골라 주세요. 냉장고에 없는 재료도 고를 수 있어요.</p>
      </div>

      <!-- 재료 찾기 -->
      <div class="pick-block">
        <v-text-field
          v-model="keyword"
          placeholder="재료 이름으로 찾기 (예: 두부, 달걀)"
          aria-label="재료 이름으로 찾기"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          maxlength="50"
          prepend-inner-icon="mdi-magnify"
        />
        <h3 id="pick-options-title" class="pick-sub">{{ trimmedKeyword ? '찾은 재료' : '냉장고에 있는 재료' }}</h3>

        <p v-if="optionsLoading && !options.length" class="pick-hint" role="status">재료를 찾고 있어요</p>
        <p v-else-if="optionsError" class="pick-hint is-error" role="alert">{{ optionsError }}</p>
        <ul v-else-if="options.length" class="chip-list" aria-labelledby="pick-options-title">
          <li v-for="option in options" :key="option.ingredientId">
            <button
              type="button"
              class="chip"
              :class="{ 'is-selected': isSelected(option), 'is-expiring': option.expiring }"
              :aria-pressed="isSelected(option)"
              :disabled="!isSelected(option) && isFull"
              @click="toggle(option)"
            >
              <span v-if="option.owned" class="chip-dot" :class="{ 'is-expiring': option.expiring }" aria-hidden="true" />
              {{ option.name }}
              <span v-if="option.expiring" class="chip-tag">곧 상해요</span>
              <span v-else-if="!option.owned" class="chip-tag">없음</span>
              <v-icon v-if="isSelected(option)" size="16" aria-hidden="true">mdi-check</v-icon>
            </button>
          </li>
        </ul>
        <p v-else-if="trimmedKeyword" class="pick-hint">‘{{ trimmedKeyword }}’(이)라는 재료를 쓰는 레시피가 없어요.</p>
        <p v-else class="pick-hint">냉장고에 레시피에 쓰이는 재료가 없어요. 위에서 재료 이름으로 찾아 보세요.</p>
        <p v-if="isFull" class="pick-hint">재료는 {{ MAX_SELECTED }}개까지 고를 수 있어요.</p>
      </div>
    </div>

    <!-- 추천 결과 -->
    <div class="results" :aria-busy="resultsLoading">
      <div v-if="!state.selected.length" class="sf-state-box">
        <p class="sf-empty-title">재료를 고르면 그 재료로 만들 수 있는 요리를 찾아 드려요</p>
        <p>고른 재료를 많이 쓰는 요리부터, 그다음은 더 사야 할 재료가 적은 요리부터 보여 드려요.</p>
      </div>

      <div v-else-if="resultsLoading && !state.results" class="sf-state-box" role="status">
        <v-progress-circular indeterminate color="primary" size="36" />
        <p>레시피를 찾고 있어요</p>
      </div>

      <div v-else-if="resultsError" class="sf-state-box" role="alert">
        <p class="sf-empty-title">레시피를 불러오지 못했어요</p>
        <p>{{ resultsError }}</p>
        <v-btn color="primary" variant="tonal" class="mt-2" @click="loadResults">다시 불러오기</v-btn>
      </div>

      <ul v-else-if="state.results?.length" class="recipe-list" :class="{ 'is-stale': resultsLoading }">
        <RecipeRow
          v-for="item in state.results"
          :key="item.recipe.recipeId"
          :recipe="item.recipe"
          :selected-ingredients="item.selectedIngredients"
        />
      </ul>

      <div v-else-if="state.results" class="sf-state-box">
        <p class="sf-empty-title">고른 재료를 쓰는 레시피를 찾지 못했어요</p>
        <p>다른 재료를 골라 보세요.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import RecipeRow from '@/components/recipe/RecipeRow.vue';
import { getErrorMessage, getFridgeId, getResultData } from '@/utils/commonDataHandler';
import { usePickState } from '@/composables/recipeExploreState';

// 서버 제한과 같다 (RecipeRecommendService.MAX_SELECTED_INGREDIENTS)
const MAX_SELECTED = 10;
const DEBOUNCE_MS = 300;

const store = useStore();
const fridgeId = computed(() => getFridgeId(store));
const apiBase = () => `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId.value}/recipes`;

// 모듈에 하나뿐인 상태라 냉장고가 바뀌어도 같은 객체를 그 자리에서 비운다
const state = usePickState(fridgeId.value);

const keyword = ref('');
const trimmedKeyword = computed(() => (keyword.value || '').trim());
const options = ref([]);
const optionsLoading = ref(false);
const optionsError = ref('');

const resultsLoading = ref(false);
const resultsError = ref('');

const isFull = computed(() => state.selected.length >= MAX_SELECTED);
const selectedIds = computed(() => new Set(state.selected.map(item => item.ingredientId)));
const isSelected = (option) => selectedIds.value.has(option.ingredientId);

// 늦게 온 이전 응답이 새 결과를 덮지 않게 요청마다 번호를 붙인다
let optionSeq = 0;
let resultSeq = 0;
let optionTimer = null;
let resultTimer = null;

const loadOptions = async () => {
  if (!fridgeId.value) return;
  const seq = ++optionSeq;
  optionsLoading.value = true;
  optionsError.value = '';
  try {
    const params = trimmedKeyword.value ? { keyword: trimmedKeyword.value } : {};
    const response = await axios.get(`${apiBase()}/ingredients`, { params });
    if (seq !== optionSeq) return;
    options.value = getResultData(response) || [];
  } catch (error) {
    if (seq !== optionSeq) return;
    options.value = [];
    optionsError.value = getErrorMessage(error);
  } finally {
    if (seq === optionSeq) optionsLoading.value = false;
  }
};

const loadResults = async () => {
  const seq = ++resultSeq;
  if (!fridgeId.value || !state.selected.length) {
    state.results = null;
    resultsLoading.value = false;
    return;
  }
  resultsLoading.value = true;
  resultsError.value = '';
  try {
    const response = await axios.get(`${apiBase()}/recommend/ingredients`, {
      params: { ingredientIds: state.selected.map(item => item.ingredientId).join(',') }
    });
    if (seq !== resultSeq) return;
    state.results = getResultData(response) || [];
  } catch (error) {
    if (seq !== resultSeq) return;
    resultsError.value = getErrorMessage(error);
  } finally {
    if (seq === resultSeq) resultsLoading.value = false;
  }
};

const scheduleResults = () => {
  clearTimeout(resultTimer);
  resultTimer = setTimeout(loadResults, DEBOUNCE_MS);
};

const toggle = (option) => {
  if (isSelected(option)) {
    state.selected = state.selected.filter(item => item.ingredientId !== option.ingredientId);
  } else if (!isFull.value) {
    state.selected = [...state.selected, { ...option }];
  } else {
    return;
  }
  scheduleResults();
};

const clearAll = () => {
  state.selected = [];
  scheduleResults();
};

watch(trimmedKeyword, () => {
  clearTimeout(optionTimer);
  optionTimer = setTimeout(loadOptions, DEBOUNCE_MS);
});

// 다른 냉장고로 바꾸면 고른 재료를 비우고 그 냉장고 재료를 다시 받는다
watch(fridgeId, (value) => {
  usePickState(value);
  keyword.value = '';
  resultsError.value = '';
  resultSeq++;
  resultsLoading.value = false;
  loadOptions();
});

loadOptions();
// 상세를 보고 돌아왔는데 결과를 못 받은 채였다면 다시 받는다
if (state.selected.length && !state.results) loadResults();
</script>

<style scoped>
.pick {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--sf-line);
}

.pick-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.pick-label-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-height: 28px;
}

.pick-label {
  margin: 0;
  font-size: var(--sf-fs-md);
  font-weight: 700;
  color: var(--sf-text);
}

.count {
  margin-left: 4px;
  font-weight: 500;
  color: var(--sf-text-faint);
}

.pick-sub {
  margin: 4px 0 0;
  font-size: var(--sf-fs-sm);
  font-weight: 600;
  color: var(--sf-text-sub);
}

.pick-hint {
  margin: 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.pick-hint.is-error {
  color: var(--sf-expired-ink);
}

.chip-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 34px;
  padding: 0 12px;
  border: 1px solid var(--sf-line-strong);
  border-radius: 999px;
  background: var(--sf-surface);
  font: inherit;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text);
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}

.chip:hover:not(:disabled) {
  border-color: var(--sf-primary);
}

.chip:focus-visible {
  outline: 2px solid var(--sf-primary);
  outline-offset: 2px;
}

.chip:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.chip.is-selected {
  border-color: var(--sf-primary);
  background: var(--sf-primary);
  color: #fff;
  font-weight: 600;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--sf-mint);
}

.chip-dot.is-expiring {
  background: var(--sf-soon);
}

.chip-tag {
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-faint);
}

.chip.is-expiring:not(.is-selected) .chip-tag {
  color: var(--sf-soon-ink);
  font-weight: 600;
}

.chip.is-selected .chip-tag {
  color: inherit;
  opacity: 0.85;
}

.recipe-list {
  margin: 0;
  padding: 0;
  list-style: none;
  transition: opacity 0.15s ease;
}

.recipe-list.is-stale {
  opacity: 0.55;
}

@media (max-width: 600px) {
  .pick {
    padding: 16px;
  }
}
</style>
