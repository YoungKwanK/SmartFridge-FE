<template>
  <PageLayout>
    <template #head>
      <nav class="detail-nav">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">레시피 목록으로</v-btn>
      </nav>
    </template>

    <div v-if="isLoading" class="sf-state-box" role="status">
      <v-progress-circular indeterminate color="primary" size="36" />
      <p>레시피를 불러오고 있어요</p>
    </div>

    <div v-else-if="errorMessage" class="sf-state-box" role="alert">
      <p class="sf-empty-title">{{ notFound ? '이 레시피를 찾을 수 없어요' : '레시피를 불러오지 못했어요' }}</p>
      <p>{{ notFound ? '목록에서 다른 레시피를 골라 주세요.' : errorMessage }}</p>
      <v-btn v-if="notFound" color="primary" variant="tonal" class="mt-2" :to="{ name: 'RecipeRecommend' }">
        레시피 목록 보기
      </v-btn>
      <v-btn v-else color="primary" variant="tonal" class="mt-2" @click="load">다시 불러오기</v-btn>
    </div>

    <article v-else-if="recipe" class="recipe">
      <!-- 머리: 사진 + 이름 + 지금 재료로 얼마나 만들 수 있는지 -->
      <header class="hero">
        <div class="hero-photo">
          <img
            v-if="heroImage && !heroImageFailed"
            :src="heroImage"
            :alt="`완성된 ${recipe.name}`"
            @error="heroImageFailed = true"
          />
          <v-icon v-else size="48" aria-hidden="true">mdi-silverware-fork-knife</v-icon>
        </div>

        <div class="hero-text">
          <p v-if="metaText" class="hero-meta">{{ metaText }}</p>
          <h1 class="hero-title">{{ recipe.name }}</h1>

          <div v-if="recipe.totalCount" class="readiness">
            <span class="cells" aria-hidden="true">
              <span v-for="cell in cells" :key="cell.key" class="cell" :class="`is-${cell.state}`" />
            </span>
            <p class="readiness-text sf-num" :class="{ 'is-ready': missing.length === 0 }">{{ readinessText }}</p>
          </div>

          <p v-if="aiReason" class="ai-reason">
            <v-icon size="18" aria-hidden="true">mdi-creation-outline</v-icon>
            <span>{{ aiReason }}</span>
          </p>
        </div>
      </header>

      <div class="recipe-body">
        <!-- 재료: 넓은 화면에서는 단계를 내려 읽는 동안 옆에 붙어 있다 -->
        <aside class="ingredients" aria-labelledby="ingredients-title">
          <h2 id="ingredients-title" class="section-title">재료</h2>

          <section v-for="group in ingredientGroups" :key="group.key" class="ing-group" :aria-label="group.title">
            <h3 class="ing-group-title">
              <span>{{ group.title }}</span>
              <span v-if="group.counted" class="ing-group-count sf-num">{{ group.items.length }}개</span>
            </h3>
            <p v-if="group.note" class="ing-group-note">{{ group.note }}</p>
            <ul class="ing-list">
              <li v-for="item in group.items" :key="item.name" class="ing-row">
                <span class="cell" :class="`is-${cellState(item)}`" aria-hidden="true" />
                <span class="ing-name">
                  {{ item.name }}
                  <span v-if="item.expiring" class="soon-tag">곧 상해요</span>
                </span>
                <span v-if="item.amount" class="ing-amount sf-num">{{ item.amount }}</span>
              </li>
            </ul>
          </section>
        </aside>

        <section class="steps" aria-labelledby="steps-title">
          <div class="steps-head">
            <h2 id="steps-title" class="section-title">만드는 법</h2>
            <p v-if="recipe.steps.length" class="steps-progress sf-num" aria-live="polite">
              {{ doneSteps.size ? `${recipe.steps.length}단계 중 ${doneSteps.size}단계 했어요` : '끝낸 단계의 번호를 누르면 표시돼요' }}
            </p>
          </div>

          <ol v-if="recipe.steps.length" class="step-list">
            <li
              v-for="step in recipe.steps"
              :key="step.order"
              class="step"
              :class="{ 'is-done': doneSteps.has(step.order), 'has-photo': step.imageUrl && !failedStepImages.has(step.order) }"
            >
              <button
                type="button"
                class="step-num sf-num"
                :aria-pressed="doneSteps.has(step.order)"
                :aria-label="`${step.order}단계 다 했어요`"
                @click="toggleStep(step.order)"
              >
                <v-icon v-if="doneSteps.has(step.order)" size="20" aria-hidden="true">mdi-check</v-icon>
                <span v-else aria-hidden="true">{{ step.order }}</span>
              </button>
              <p class="step-text">{{ step.description }}</p>
              <img
                v-if="step.imageUrl && !failedStepImages.has(step.order)"
                class="step-photo"
                :src="step.imageUrl"
                :alt="`${step.order}단계 모습`"
                loading="lazy"
                @error="failedStepImages.add(step.order)"
              />
            </li>
          </ol>
          <p v-else class="steps-empty">이 레시피에는 조리 순서가 없어요. 재료를 참고해 만들어 주세요.</p>

          <aside v-if="recipe.tip" class="tip" aria-label="조리 팁">
            <v-icon size="20" aria-hidden="true">mdi-lightbulb-on-outline</v-icon>
            <p>{{ recipe.tip }}</p>
          </aside>
        </section>
      </div>
    </article>
  </PageLayout>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import PageLayout from '@/components/layout/PageLayout.vue';
import { getErrorMessage, getFridgeId, getResultData } from '@/utils/commonDataHandler';
import { findAiReason } from '@/composables/recipeRecommendCache';

const store = useStore();
const route = useRoute();
const router = useRouter();

const recipe = ref(null);
const isLoading = ref(false);
const errorMessage = ref('');
const notFound = ref(false);
const heroImageFailed = ref(false);
const failedStepImages = reactive(new Set());
// 끝낸 단계 (이 화면에서만 기억한다)
const doneSteps = reactive(new Set());

const fridgeId = computed(() => getFridgeId(store));
const recipeId = computed(() => Number(route.params.recipeId));

// 마지막 요청만 화면에 반영한다 (냉장고·레시피를 빠르게 바꿨을 때 늦게 온 응답이 덮어쓰지 않게)
let requestSeq = 0;

const load = async () => {
  if (!fridgeId.value || !recipeId.value) return;
  const seq = ++requestSeq;
  isLoading.value = true;
  errorMessage.value = '';
  notFound.value = false;
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId.value}/recipes/${recipeId.value}`
    );
    if (seq !== requestSeq) return;
    recipe.value = getResultData(response);
    heroImageFailed.value = false;
    failedStepImages.clear();
  } catch (error) {
    if (seq !== requestSeq) return;
    recipe.value = null;
    notFound.value = error?.response?.status === 404;
    errorMessage.value = getErrorMessage(error);
  } finally {
    if (seq === requestSeq) isLoading.value = false;
  }
};

watch(recipeId, () => doneSteps.clear());
watch([fridgeId, recipeId], load, { immediate: true });

// 추천 목록에서 왔으면 보던 위치로, 주소로 바로 들어왔으면 목록을 새로 연다
const goBack = () => {
  if (window.history.state?.back) {
    router.back();
  } else {
    router.push({ name: 'RecipeRecommend' });
  }
};

const heroImage = computed(() => recipe.value?.mainImageUrl || recipe.value?.thumbnailUrl || '');

const metaText = computed(() => {
  if (!recipe.value) return '';
  const parts = [recipe.value.dishType, recipe.value.cookingMethod].filter(Boolean);
  if (recipe.value.calories) parts.push(`1인분 ${recipe.value.calories}kcal`);
  return parts.join(', ');
});

const aiReason = computed(() => (recipe.value ? findAiReason(fridgeId.value, recipe.value.recipeId) : ''));

const ingredients = computed(() => recipe.value?.ingredients || []);
const owned = computed(() => {
  const list = ingredients.value.filter(item => item.owned);
  // 곧 상하는 재료를 먼저
  return [...list.filter(item => item.expiring), ...list.filter(item => !item.expiring)];
});
const missing = computed(() => ingredients.value.filter(item => !item.pantry && !item.owned));
const pantry = computed(() => ingredients.value.filter(item => item.pantry));

const ingredientGroups = computed(() => [
  { key: 'owned', title: '있는 재료', counted: true, items: owned.value },
  { key: 'missing', title: '더 필요한 재료', counted: true, items: missing.value },
  { key: 'pantry', title: '기본 양념', note: '집에 있다고 보고 재료 수에 넣지 않아요.', items: pantry.value }
].filter(group => group.items.length));

const cellState = (item) => {
  if (item.pantry) return 'pantry';
  if (item.expiring) return 'expiring';
  return item.owned ? 'owned' : 'missing';
};

// 목록의 재료 칸과 같은 순서: 곧 상하는 재료, 있는 재료, 더 필요한 재료
const cells = computed(() => [...owned.value, ...missing.value].map(item => ({
  key: item.name,
  state: cellState(item)
})));

const readinessText = computed(() => {
  const { matchedCount, totalCount } = recipe.value;
  if (missing.value.length === 0) return `재료 ${totalCount}개가 모두 있어 바로 만들 수 있어요`;
  return `재료 ${totalCount}개 중 ${matchedCount}개 있어요`;
});

const toggleStep = (order) => {
  if (doneSteps.has(order)) {
    doneSteps.delete(order);
  } else {
    doneSteps.add(order);
  }
};
</script>

<style scoped>
/*
 * 사이드바 때문에 화면 폭보다 본문 폭이 기준이어야 해서 컨테이너 쿼리를 쓴다.
 * 기본은 한 줄로 쌓고, 본문이 넓어지면 머리(사진|글), 본문(재료|만드는 법), 단계(글|사진)를 나란히 둔다.
 */
.detail-nav {
  margin: -8px 0 12px -12px;
}

.recipe {
  container: recipe / inline-size;
  display: flex;
  flex-direction: column;
  gap: 36px;
}

/* 머리 */
.hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  align-items: center;
}

.hero-photo {
  display: grid;
  place-items: center;
  aspect-ratio: 4 / 3;
  max-height: 360px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-line);
  color: var(--sf-text-faint);
  overflow: hidden;
}

.hero-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-text {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.hero-meta {
  margin: 0;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.hero-title {
  margin: -6px 0 0;
  font-size: var(--sf-fs-3xl);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: var(--sf-text);
  word-break: keep-all;
}

/* 재료 칸 (목록의 칸을 크게) */
.readiness {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 6px;
}

.cells {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.cell {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.cells .cell {
  width: 22px;
  height: 22px;
  border-radius: 5px;
}

.cell.is-owned {
  background: var(--sf-mint);
}

.cell.is-expiring {
  background: var(--sf-soon);
}

.cell.is-missing {
  box-shadow: inset 0 0 0 1.5px var(--sf-line-strong);
}

/* 기본 양념은 칸으로 세지 않으므로 작은 점 */
.cell.is-pantry {
  width: 6px;
  height: 6px;
  margin: 4px;
  border-radius: 50%;
  background: var(--sf-line-strong);
}

.readiness-text {
  margin: 0;
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-text-sub);
}

.readiness-text.is-ready {
  color: var(--sf-primary);
  font-weight: 700;
}

.ai-reason {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  max-width: 52ch;
  margin: 0;
  font-size: var(--sf-fs-md);
  line-height: 1.6;
  color: var(--sf-text);
}

.ai-reason .v-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--sf-primary);
}

/* 본문: 재료 | 만드는 법 */
.recipe-body {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 28px;
  align-items: start;
}

.section-title {
  margin: 0;
  font-size: var(--sf-fs-xl);
  font-weight: 800;
  color: var(--sf-text);
}

.ingredients {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
}

.ing-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.ing-group-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0;
  font-size: var(--sf-fs-sm);
  font-weight: 700;
  color: var(--sf-text-sub);
}

.ing-group-count {
  font-weight: 500;
  color: var(--sf-text-faint);
}

.ing-group-note {
  margin: 0;
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-faint);
}

.ing-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.ing-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 0;
  border-bottom: 1px solid var(--sf-line);
  font-size: var(--sf-fs-md);
}

.ing-row:last-child {
  border-bottom: none;
}

.ing-name {
  flex: 1;
  min-width: 0;
  color: var(--sf-text);
}

.soon-tag {
  display: inline-block;
  margin-left: 4px;
  padding: 0 6px;
  border-radius: 4px;
  background: var(--sf-soon-bg);
  color: var(--sf-soon-ink);
  font-size: var(--sf-fs-xs);
  font-weight: 700;
  line-height: 1.6;
  vertical-align: 1px;
}

.ing-amount {
  flex-shrink: 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
  text-align: right;
}

/* 만드는 법 */
.steps {
  container: steps / inline-size;
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-width: 0;
}

.steps-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 16px;
}

.steps-progress {
  margin: 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.step-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.step {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr);
  gap: 10px 14px;
  align-items: start;
  padding: 20px 0;
  border-top: 1px solid var(--sf-line);
}

.step:first-child {
  border-top: none;
  padding-top: 4px;
}

.step-num {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  box-shadow: inset 0 0 0 1.5px var(--sf-line-strong);
  background: var(--sf-surface);
  font-size: var(--sf-fs-md);
  font-weight: 700;
  color: var(--sf-text);
  cursor: pointer;
  transition: background-color 0.18s ease, box-shadow 0.18s ease, color 0.18s ease;
}

.step-num:hover {
  box-shadow: inset 0 0 0 1.5px var(--sf-primary);
}

.step-num:focus-visible {
  outline: 2px solid var(--sf-primary);
  outline-offset: 2px;
}

.step.is-done .step-num {
  background: var(--sf-mint-soft);
  box-shadow: inset 0 0 0 1.5px var(--sf-primary);
  color: var(--sf-primary);
}

.step-text {
  max-width: 60ch;
  margin: 5px 0 0;
  font-size: var(--sf-fs-md);
  line-height: 1.7;
  color: var(--sf-text);
  word-break: keep-all;
  overflow-wrap: anywhere;
  transition: color 0.18s ease;
}

.step.is-done .step-text {
  color: var(--sf-text-faint);
}

.step-photo {
  grid-column: 2;
  width: 100%;
  max-width: 360px;
  aspect-ratio: 4 / 3;
  border-radius: var(--sf-radius-md);
  background: var(--sf-line);
  object-fit: cover;
  transition: opacity 0.18s ease;
}

.step.is-done .step-photo {
  opacity: 0.5;
}

.steps-empty {
  margin: 0;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.tip {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 16px 20px;
  border-radius: var(--sf-radius-md);
  background: var(--sf-mint-soft);
}

.tip .v-icon {
  flex-shrink: 0;
  margin-top: 2px;
  color: var(--sf-primary);
}

.tip p {
  margin: 0;
  max-width: 60ch;
  font-size: var(--sf-fs-md);
  line-height: 1.65;
  color: var(--sf-text);
}

/* 본문이 넉넉하면 사진과 글을 나란히 */
@container recipe (min-width: 600px) {
  .hero {
    grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
    gap: 36px;
  }

  .hero-photo {
    max-height: none;
  }

  .hero-title {
    font-size: var(--sf-fs-display);
  }
}

/* 재료를 옆에 붙여 두고 만드는 법을 읽는다 */
@container recipe (min-width: 840px) {
  .recipe-body {
    grid-template-columns: 300px minmax(0, 1fr);
    gap: 40px;
  }

  .ingredients {
    position: sticky;
    top: 24px;
    max-height: calc(100vh - 48px);
    overflow-y: auto;
    padding: 24px;
  }
}

/* 단계 사진을 글 오른쪽에 */
@container steps (min-width: 560px) {
  .step {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 18px;
    padding: 22px 0;
  }

  .step.has-photo {
    grid-template-columns: 40px minmax(0, 1fr) 150px;
  }

  .step-num {
    width: 40px;
    height: 40px;
  }

  .step-text {
    margin-top: 7px;
    font-size: var(--sf-fs-lg);
  }

  .step-photo {
    grid-column: auto;
  }
}

@media (prefers-reduced-motion: reduce) {
  .step-num,
  .step-text,
  .step-photo {
    transition: none;
  }
}
</style>
