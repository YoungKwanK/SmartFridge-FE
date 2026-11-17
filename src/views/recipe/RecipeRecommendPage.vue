<template>
  <PageLayout
    title="레시피 추천"
    description="지금 냉장고에 있는 재료로 만들 수 있는 요리예요. 소금·간장 같은 기본 양념은 재료 수에 넣지 않아요."
  >
    <div class="sf-tabs" role="tablist" aria-label="추천 방식">
      <button
        v-for="option in modeOptions"
        :key="option.value"
        type="button"
        role="tab"
        class="sf-tab"
        :class="{ 'is-on': mode === option.value }"
        :aria-selected="mode === option.value"
        @click="changeMode(option.value)"
      >
        <v-icon v-if="option.icon" size="18" class="tab-icon" aria-hidden="true">{{ option.icon }}</v-icon>
        {{ option.label }}
      </button>
    </div>

    <p class="legend" aria-label="재료 칸 보는 법">
      <span class="legend-item"><span class="legend-cell is-expiring" aria-hidden="true" />곧 상하는 재료</span>
      <span class="legend-item"><span class="legend-cell is-owned" aria-hidden="true" />있는 재료</span>
      <span class="legend-item"><span class="legend-cell is-missing" aria-hidden="true" />더 필요한 재료</span>
    </p>

    <section class="sf-list-panel" :aria-label="currentLabel" :aria-busy="isLoading">
      <div v-if="isLoading" class="sf-state-box" role="status">
        <v-progress-circular indeterminate color="primary" size="36" />
        <p v-if="mode === 'ai'">AI가 냉장고 재료를 보고 레시피를 고르고 있어요. 몇 초 걸려요.</p>
        <p v-else>레시피를 찾고 있어요</p>
      </div>

      <div v-else-if="errorMessage" class="sf-state-box" role="alert">
        <p class="sf-empty-title">레시피를 불러오지 못했어요</p>
        <p>{{ errorMessage }}</p>
        <v-btn color="primary" variant="tonal" class="mt-2" @click="load(mode, true)">다시 불러오기</v-btn>
      </div>

      <template v-else-if="items.length">
        <p v-if="mode === 'ai' && !aiRanked" class="fallback-note" role="status">
          <v-icon size="18" aria-hidden="true">mdi-information-outline</v-icon>
          지금은 AI 추천을 받을 수 없어 재료가 많이 겹치는 순으로 보여 드려요.
        </p>
        <ul class="recipe-list">
          <RecipeRow
            v-for="item in items"
            :key="item.recipe.recipeId"
            :recipe="item.recipe"
            :reason="item.reason || ''"
          />
        </ul>
      </template>

      <div v-else class="sf-state-box">
        <p class="sf-empty-title">냉장고 재료로 만들 수 있는 레시피를 찾지 못했어요</p>
        <p>식품을 더 등록하면 만들 수 있는 요리를 찾아 드려요.</p>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" class="mt-2" to="/fridge/food/shared">
          식품 등록하러 가기
        </v-btn>
      </div>
    </section>
  </PageLayout>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import PageLayout from '@/components/layout/PageLayout.vue';
import RecipeRow from '@/components/recipe/RecipeRow.vue';
import { getErrorMessage, getFridgeId, getResultData } from '@/utils/commonDataHandler';
import { getRecommendCache, setRecommendCache } from '@/composables/recipeRecommendCache';

const store = useStore();
const route = useRoute();
const router = useRouter();

const modeOptions = [
  { value: 'match', label: '재료가 많이 겹치는 순' },
  { value: 'ai', label: 'AI 추천', icon: 'mdi-creation-outline' }
];

const mode = ref(route.query.mode === 'ai' ? 'ai' : 'match');
const isLoading = ref(false);
const errorMessage = ref('');
// 방식별로 한 번 받은 결과는 탭을 오가거나 상세를 보고 돌아와도 다시 부르지 않는다 (AI 호출은 느리고 비용이 든다)
const fridgeId = computed(() => getFridgeId(store));
const cached = (target) => getRecommendCache(target, fridgeId.value);

const currentLabel = computed(() => modeOptions.find(option => option.value === mode.value).label);
const items = computed(() => cached(mode.value)?.items || []);
const aiRanked = computed(() => cached('ai')?.aiRanked ?? false);

// 받는 중인 방식 (탭을 오가도 같은 요청을 두 번 보내지 않는다)
const pending = new Set();

const load = async (target, force = false) => {
  if (cached(target) && !force) return;
  const currentFridgeId = fridgeId.value;
  if (!currentFridgeId) return;

  isLoading.value = true;
  errorMessage.value = '';
  if (pending.has(target)) return;
  pending.add(target);
  try {
    const path = target === 'ai' ? 'recommend/ai' : 'recommend';
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${currentFridgeId}/recipes/${path}`);
    const result = getResultData(response);
    // 두 응답을 { recipe, reason } 목록 하나로 맞춘다
    setRecommendCache(target, currentFridgeId, target === 'ai'
      ? { aiRanked: !!result.aiRanked, items: result.recipes || [] }
      : { items: (result || []).map(recipe => ({ recipe, reason: null })) });
  } catch (error) {
    // 다른 탭으로 옮겼다가 돌아와도 다시 시도할 수 있게 캐시는 비워 둔다
    setRecommendCache(target, currentFridgeId, null);
    if (mode.value === target) {
      errorMessage.value = getErrorMessage(error);
    }
  } finally {
    pending.delete(target);
    if (mode.value === target) {
      isLoading.value = false;
    }
  }
};

const changeMode = (next) => {
  if (mode.value === next) return;
  router.replace({ query: { ...route.query, mode: next === 'ai' ? 'ai' : undefined } });
};

watch(() => route.query.mode, (value) => {
  mode.value = value === 'ai' ? 'ai' : 'match';
  errorMessage.value = '';
  isLoading.value = false;
  load(mode.value);
}, { immediate: true });

// 다른 냉장고로 바꾸면 그 냉장고 기준으로 다시 받는다
watch(fridgeId, () => {
  errorMessage.value = '';
  load(mode.value);
});
</script>

<style scoped>
.tab-icon {
  margin-right: 4px;
  vertical-align: -3px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.legend-cell {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.legend-cell.is-owned {
  background: var(--sf-mint);
}

.legend-cell.is-expiring {
  background: var(--sf-soon);
}

.legend-cell.is-missing {
  box-shadow: inset 0 0 0 1.5px var(--sf-line-strong);
}

.recipe-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.fallback-note {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 12px 24px;
  border-bottom: 1px solid var(--sf-line);
  background: var(--sf-bg);
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}
</style>
