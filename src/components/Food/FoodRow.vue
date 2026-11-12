<template>
  <li class="food-row" :class="`is-${status}`">
    <span class="food-emoji" aria-hidden="true">{{ emoji }}</span>
    <div class="food-main">
      <span class="food-name">{{ food.name }}</span>
      <span class="food-meta">
        <span>{{ food.registeredName }}</span>
        <span v-if="food.storageType" class="food-storage">{{ food.storageType }}</span>
        <span v-if="showShared && food.shareable" class="food-shared">공유</span>
      </span>
    </div>
    <span class="food-qty sf-num">{{ food.quantity }}개</span>
    <DdayBadge :expiration-date-time="food.expirationDateTime" />
  </li>
</template>

<script setup>
import { computed } from 'vue';
import DdayBadge from '@/components/Food/DdayBadge.vue';
import { categoryEmoji, freshnessStatus } from '@/utils/foodFreshness';

const props = defineProps({
  food: { type: Object, required: true },
  // 개인·공유가 섞인 목록에서만 '공유' 표시
  showShared: { type: Boolean, default: false }
});

const emoji = computed(() => categoryEmoji(props.food.category));
const status = computed(() => freshnessStatus(props.food.expirationDateTime));
</script>

<style scoped>
.food-row {
  display: grid;
  grid-template-columns: 36px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--sf-line);
  list-style: none;
}

.food-row:last-child {
  border-bottom: none;
}

.food-emoji {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: var(--sf-bg);
  font-size: 20px;
}

.food-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.food-name {
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-expired .food-name {
  color: var(--sf-expired-ink);
}

.food-meta {
  display: flex;
  gap: 8px;
  font-size: 13px;
  color: var(--sf-text-faint);
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
}

.food-storage::before,
.food-shared::before {
  content: '';
  display: inline-block;
  width: 1px;
  height: 10px;
  margin-right: 8px;
  background: var(--sf-line-strong);
  vertical-align: -1px;
}

.food-shared {
  color: var(--sf-primary);
  font-weight: 600;
}

.food-qty {
  font-size: 14px;
  color: var(--sf-text-sub);
}
</style>
