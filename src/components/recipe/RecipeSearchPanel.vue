<template>
  <section class="sf-list-panel" aria-label="레시피 검색" :aria-busy="isLoading">
    <form class="search-bar" role="search" @submit.prevent="submit">
      <v-text-field
        v-model="input"
        placeholder="요리 이름으로 찾기 (예: 김치찌개)"
        aria-label="요리 이름"
        variant="outlined"
        density="compact"
        hide-details
        clearable
        maxlength="50"
        prepend-inner-icon="mdi-magnify"
        class="search-field"
      />
      <v-btn type="submit" color="primary" variant="flat" :disabled="!input?.trim()" :loading="isLoading && !state.recipes.length">
        검색
      </v-btn>
    </form>

    <div v-if="isLoading && !state.recipes.length" class="sf-state-box" role="status">
      <v-progress-circular indeterminate color="primary" size="36" />
      <p>레시피를 찾고 있어요</p>
    </div>

    <div v-else-if="errorMessage && !state.recipes.length" class="sf-state-box" role="alert">
      <p class="sf-empty-title">레시피를 찾지 못했어요</p>
      <p>{{ errorMessage }}</p>
      <v-btn color="primary" variant="tonal" class="mt-2" @click="fetchPage(0)">다시 찾기</v-btn>
    </div>

    <template v-else-if="state.recipes.length">
      <p class="result-head" role="status">‘{{ state.keyword }}’ 검색 결과</p>
      <ul class="recipe-list">
        <RecipeRow v-for="recipe in state.recipes" :key="recipe.recipeId" :recipe="recipe" />
      </ul>
      <div v-if="state.hasNext || errorMessage" class="more">
        <p v-if="errorMessage" class="more-error" role="alert">{{ errorMessage }}</p>
        <v-btn variant="tonal" color="primary" :loading="isLoading" @click="fetchPage(state.page + 1)">
          {{ errorMessage ? '다시 불러오기' : '더 보기' }}
        </v-btn>
      </div>
    </template>

    <div v-else-if="state.searched" class="sf-state-box">
      <p class="sf-empty-title">‘{{ state.keyword }}’(으)로 찾은 레시피가 없어요</p>
      <p>더 짧게 줄이거나 다른 이름으로 찾아 보세요. 재료로 찾고 싶다면 ‘재료 골라서 추천’을 써 보세요.</p>
    </div>

    <div v-else class="sf-state-box">
      <p class="sf-empty-title">만들고 싶은 요리를 찾아 보세요</p>
      <p>찾은 레시피마다 냉장고에 있는 재료와 더 필요한 재료를 보여 드려요.</p>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import axios from 'axios';
import RecipeRow from '@/components/recipe/RecipeRow.vue';
import { getErrorMessage, getFridgeId, getResultData } from '@/utils/commonDataHandler';
import { useSearchState } from '@/composables/recipeExploreState';

const PAGE_SIZE = 20;

const store = useStore();
const fridgeId = computed(() => getFridgeId(store));
// 모듈에 하나뿐인 상태라 냉장고가 바뀌어도 같은 객체를 그 자리에서 비운다
const state = useSearchState(fridgeId.value);

const input = ref(state.keyword);
const isLoading = ref(false);
const errorMessage = ref('');
// 늦게 온 이전 응답이 새 결과를 덮지 않게 요청마다 번호를 붙인다
let requestSeq = 0;

const fetchPage = async (page) => {
  const currentFridgeId = fridgeId.value;
  if (!currentFridgeId || !state.keyword) return;
  const seq = ++requestSeq;
  isLoading.value = true;
  errorMessage.value = '';
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${currentFridgeId}/recipes/search`, {
      params: { keyword: state.keyword, page, size: PAGE_SIZE }
    });
    if (seq !== requestSeq) return;
    const result = getResultData(response);
    state.recipes = page === 0 ? (result.recipes || []) : [...state.recipes, ...(result.recipes || [])];
    state.page = page;
    state.hasNext = !!result.hasNext;
    state.searched = true;
  } catch (error) {
    if (seq !== requestSeq) return;
    errorMessage.value = getErrorMessage(error);
  } finally {
    if (seq === requestSeq) isLoading.value = false;
  }
};

const submit = () => {
  const keyword = (input.value || '').trim();
  if (!keyword) return;
  state.keyword = keyword;
  state.recipes = [];
  state.hasNext = false;
  fetchPage(0);
};

// 다른 냉장고로 바꾸면 검색을 처음부터 시작한다
watch(fridgeId, (value) => {
  useSearchState(value);
  input.value = '';
  errorMessage.value = '';
  requestSeq++;
  isLoading.value = false;
});
</script>

<style scoped>
.search-bar {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 16px 24px;
  border-bottom: 1px solid var(--sf-line);
}

.search-field {
  flex: 1;
  min-width: 0;
}

.result-head {
  margin: 0;
  padding: 12px 24px 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

.recipe-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.more {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px 24px;
  border-top: 1px solid var(--sf-line);
}

.more-error {
  margin: 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-expired-ink);
}

@media (max-width: 600px) {
  .search-bar {
    padding: 12px 16px;
  }
}
</style>
