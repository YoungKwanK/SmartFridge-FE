<template>
  <li class="recipe-row">
    <div class="recipe-thumb" aria-hidden="true">
      <img
        v-if="recipe.thumbnailUrl && !imageFailed"
        :src="recipe.thumbnailUrl"
        alt=""
        loading="lazy"
        @error="imageFailed = true"
      />
      <v-icon v-else size="28">mdi-silverware-fork-knife</v-icon>
    </div>

    <div class="recipe-body">
      <div class="recipe-head">
        <h3 class="recipe-name">
          <!-- 줄 전체가 눌리도록 링크의 ::after 를 줄 크기로 펼친다 -->
          <router-link :to="{ name: 'RecipeDetail', params: { recipeId: recipe.recipeId } }" class="recipe-link">
            {{ recipe.name }}
          </router-link>
        </h3>
        <span v-if="metaText" class="recipe-meta">{{ metaText }}</span>
      </div>

      <p v-if="reason" class="recipe-reason">
        <v-icon size="16" aria-hidden="true">mdi-creation-outline</v-icon>
        <span>{{ reason }}</span>
      </p>

      <!-- 재료 칸: 한 칸이 재료 하나. 있는 재료는 채우고, 곧 상하는 재료는 노랑, 없는 재료는 빈 칸 -->
      <div class="match">
        <span class="match-cells" aria-hidden="true">
          <span v-for="cell in cells" :key="cell.key" class="match-cell" :class="`is-${cell.state}`" />
        </span>
        <span class="match-text sf-num" :class="{ 'is-ready': missingCount === 0 }">{{ matchText }}</span>
      </div>

      <dl class="ingredients">
        <div v-if="recipe.matchedIngredients?.length" class="ingredient-line">
          <dt>있는 재료</dt>
          <dd>
            <span
              v-for="name in recipe.matchedIngredients"
              :key="name"
              class="ing"
              :class="{ 'is-expiring': expiringSet.has(name), 'is-selected': selectedSet.has(name) }"
            >{{ name }}<span v-if="expiringSet.has(name)" class="sr-only"> (곧 상해요)</span><span
              v-if="selectedSet.has(name)" class="sr-only"> (고른 재료)</span></span>
          </dd>
        </div>
        <div v-if="recipe.missingIngredients?.length" class="ingredient-line">
          <dt>더 필요한 재료</dt>
          <dd>
            <span
              v-for="item in recipe.missingIngredients"
              :key="item.name"
              class="ing is-missing"
              :class="{ 'is-selected': selectedSet.has(item.name) }"
            >
              {{ item.name }}<span v-if="selectedSet.has(item.name)" class="sr-only"> (고른 재료)</span><span
                v-if="item.amount" class="ing-amount">{{ item.amount }}</span>
            </span>
          </dd>
        </div>
      </dl>
    </div>
  </li>
</template>

<script setup>
import { computed, ref } from 'vue';

const props = defineProps({
  recipe: { type: Object, required: true },
  // AI가 쓴 추천 이유 (겹침 순으로 볼 때와 AI가 고르지 않은 레시피는 없음)
  reason: { type: String, default: '' },
  // 재료 골라서 추천일 때 사용자가 고른 재료 이름 (밑줄로 표시)
  selectedIngredients: { type: Array, default: () => [] }
});

const imageFailed = ref(false);

const expiringSet = computed(() => new Set(props.recipe.expiringIngredients || []));
const selectedSet = computed(() => new Set(props.selectedIngredients));

const metaText = computed(() => {
  const parts = [props.recipe.dishType, props.recipe.cookingMethod].filter(Boolean);
  if (props.recipe.calories) parts.push(`${props.recipe.calories}kcal`);
  return parts.join(', ');
});

const missingCount = computed(() => props.recipe.missingIngredients?.length || 0);

const matchText = computed(() => {
  const { matchedCount, totalCount } = props.recipe;
  if (missingCount.value === 0) return `재료 ${totalCount}개가 모두 있어 바로 만들 수 있어요`;
  return `재료 ${totalCount}개 중 ${matchedCount}개 있어요`;
});

// 곧 상하는 재료를 앞에 두고, 있는 재료, 없는 재료 순으로 칸을 채운다
const cells = computed(() => {
  const matched = props.recipe.matchedIngredients || [];
  const expiring = matched.filter(name => expiringSet.value.has(name));
  const fresh = matched.filter(name => !expiringSet.value.has(name));
  const total = Math.max(props.recipe.totalCount || 0, matched.length + missingCount.value);
  const list = [
    ...expiring.map(name => ({ key: `e-${name}`, state: 'expiring' })),
    ...fresh.map(name => ({ key: `o-${name}`, state: 'owned' }))
  ];
  for (let i = list.length; i < total; i++) {
    list.push({ key: `m-${i}`, state: 'missing' });
  }
  return list;
});
</script>

<style scoped>
.recipe-row {
  position: relative;
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 18px;
  padding: 20px 24px;
  border-top: 1px solid var(--sf-line);
  transition: background-color 0.15s ease;
}

.recipe-row:hover {
  background: var(--sf-bg);
}

.recipe-row:has(.recipe-link:focus-visible) {
  outline: 2px solid var(--sf-primary);
  outline-offset: -2px;
}

.recipe-link {
  color: inherit;
  text-decoration: none;
}

.recipe-link:focus-visible {
  outline: none;
}

.recipe-link::after {
  content: '';
  position: absolute;
  inset: 0;
}

.recipe-row:hover .recipe-link {
  color: var(--sf-primary);
}

.recipe-row:first-child {
  border-top: none;
}

.recipe-thumb {
  display: grid;
  place-items: center;
  width: 88px;
  height: 88px;
  border-radius: var(--sf-radius-md);
  background: var(--sf-bg);
  color: var(--sf-text-faint);
  overflow: hidden;
}

.recipe-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.recipe-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.recipe-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.recipe-name {
  margin: 0;
  font-size: var(--sf-fs-lg);
  font-weight: 700;
  line-height: 1.35;
  color: var(--sf-text);
}

.recipe-meta {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.recipe-reason {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0;
  max-width: 64ch;
  font-size: var(--sf-fs-md);
  line-height: 1.5;
  color: var(--sf-text);
}

.recipe-reason .v-icon {
  flex-shrink: 0;
  margin-top: 3px;
  color: var(--sf-primary);
}

/* 재료 칸 */
.match {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px 12px;
}

.match-cells {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 3px;
}

.match-cell {
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.match-cell.is-owned {
  background: var(--sf-mint);
}

.match-cell.is-expiring {
  background: var(--sf-soon);
}

.match-cell.is-missing {
  box-shadow: inset 0 0 0 1.5px var(--sf-line-strong);
}

.match-text {
  font-size: var(--sf-fs-sm);
  font-weight: 600;
  color: var(--sf-text-sub);
}

/* 재료 목록 */
.ingredients {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
}

.ingredient-line {
  display: grid;
  grid-template-columns: 88px minmax(0, 1fr);
  gap: 8px;
  align-items: baseline;
}

.ingredient-line dt {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.ingredient-line dd {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 6px;
  margin: 0;
}

.ing {
  font-size: var(--sf-fs-sm);
  line-height: 1.6;
  color: var(--sf-text);
}

.ing:not(:last-child)::after {
  content: ',';
}

.ing.is-expiring {
  padding: 0 6px;
  border-radius: 4px;
  background: var(--sf-soon-bg);
  color: var(--sf-soon-ink);
  font-weight: 600;
}

.ing.is-expiring:not(:last-child)::after {
  content: '';
}

.ing.is-missing {
  color: var(--sf-text-sub);
}

.ing.is-selected {
  font-weight: 700;
  color: var(--sf-text);
  text-decoration: underline;
  text-decoration-color: var(--sf-primary);
  text-decoration-thickness: 2px;
  text-underline-offset: 3px;
}

.ing-amount {
  margin-left: 0.3em;
  color: var(--sf-text-faint);
}

.match-text.is-ready {
  color: var(--sf-primary);
  font-weight: 700;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

@media (max-width: 600px) {
  .recipe-row {
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 14px;
    padding: 16px;
  }

  .recipe-thumb {
    width: 64px;
    height: 64px;
  }

  .ingredient-line {
    grid-template-columns: 1fr;
    gap: 2px;
  }
}
</style>
