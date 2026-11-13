<template>
  <span
    class="dday-badge sf-num"
    :class="[`is-${status}`, { 'is-today': isToday }]"
    :title="description"
  >
    <span aria-hidden="true">{{ label }}</span>
    <span class="sr-only">{{ description }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { freshnessStatus, ddayLabel, ddayDescription, daysLeft } from '@/utils/foodFreshness';

const props = defineProps({
  expirationDateTime: { type: String, default: null }
});

const status = computed(() => freshnessStatus(props.expirationDateTime));
const label = computed(() => ddayLabel(props.expirationDateTime));
const description = computed(() => ddayDescription(props.expirationDateTime));
// 임박 중에서도 오늘이 마지막 날인 식품
const isToday = computed(() => status.value === 'soon' && daysLeft(props.expirationDateTime) <= 0);
</script>

<style scoped>
.dday-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 52px;
  height: 26px;
  padding: 0 8px;
  border-radius: var(--sf-radius-sm);
  font-size: var(--sf-fs-sm);
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

/* 신선: 색을 칠하지 않는다 */
.is-fresh,
.is-unknown {
  color: var(--sf-text-faint);
  font-weight: 600;
}

.is-soon {
  background: var(--sf-soon);
  color: var(--sf-soon-on);
}

/* 오늘까지: 같은 노랑 계열에서 한 단계 진하게 뒤집어 D-1·D-2보다 먼저 눈에 띄게 */
.is-soon.is-today {
  background: var(--sf-soon-ink);
  color: var(--sf-soon-bg);
}

.is-expired {
  background: var(--sf-expired);
  color: #FFFFFF;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
