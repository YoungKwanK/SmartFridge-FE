<template>
  <span
    class="dday-badge sf-num"
    :class="`is-${status}`"
    :title="description"
  >
    <span aria-hidden="true">{{ label }}</span>
    <span class="sr-only">{{ description }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';
import { freshnessStatus, ddayLabel, ddayDescription } from '@/utils/foodFreshness';

const props = defineProps({
  expirationDateTime: { type: String, default: null }
});

const status = computed(() => freshnessStatus(props.expirationDateTime));
const label = computed(() => ddayLabel(props.expirationDateTime));
const description = computed(() => ddayDescription(props.expirationDateTime));
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
  color: #3D2D00;
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
