<template>
  <section class="expiring-panel" aria-labelledby="expiring-title">
    <header class="panel-head">
      <h2 id="expiring-title" class="panel-title">
        <template v-if="foods.length">먼저 확인할 식품 <span class="count sf-num">{{ foods.length }}</span></template>
        <template v-else>곧 상하는 식품이 없어요</template>
      </h2>
      <p class="panel-hint">유통기한이 3일 이내로 남거나 지난 식품이에요.</p>
    </header>

    <div v-if="loading" class="panel-loading">
      <v-progress-linear indeterminate color="primary" rounded />
    </div>

    <ul v-else-if="foods.length" class="food-list">
      <FoodRow v-for="food in visibleFoods" :key="food.id" :food="food" show-shared />
    </ul>

    <p v-else class="panel-empty">
      지금은 모두 신선해요. 유통기한이 가까워지면 여기에 먼저 보여드려요.
    </p>

    <button
      v-if="foods.length > limit"
      type="button"
      class="more-btn"
      @click="expanded = !expanded"
    >
      {{ expanded ? '접기' : `${foods.length - limit}개 더 보기` }}
    </button>
  </section>
</template>

<script setup>
import { computed, ref } from 'vue';
import FoodRow from '@/components/food/FoodRow.vue';

const props = defineProps({
  foods: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const limit = 5;
const expanded = ref(false);
const visibleFoods = computed(() => (expanded.value ? props.foods : props.foods.slice(0, limit)));
</script>

<style scoped>
.expiring-panel {
  background: var(--sf-surface);
  border-radius: var(--sf-radius-lg);
  box-shadow: var(--sf-shadow);
  padding: 24px 24px 12px;
  /* 화면의 주인공: 왼쪽 띠로 '먼저 볼 곳'임을 표시 */
  border-left: 4px solid var(--sf-soon);
}

.panel-head {
  margin-bottom: 8px;
}

.panel-title {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--sf-text);
  margin: 0;
}

.count {
  font-size: 28px;
  font-weight: 800;
}

.panel-hint {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--sf-text-sub);
}

.food-list {
  padding: 0;
  margin: 0;
}

.panel-loading {
  padding: 24px 0;
}

.panel-empty {
  margin: 12px 0 12px;
  font-size: 15px;
  color: var(--sf-text-sub);
}

.more-btn {
  display: block;
  width: 100%;
  padding: 12px 0;
  border: none;
  border-top: 1px solid var(--sf-line);
  background: none;
  font: inherit;
  font-size: 14px;
  font-weight: 600;
  color: var(--sf-primary);
  cursor: pointer;
}

.more-btn:hover {
  color: var(--sf-primary-hover);
}

@media (max-width: 600px) {
  .expiring-panel {
    padding: 20px 16px 8px;
  }
}
</style>
