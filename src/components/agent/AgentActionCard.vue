<template>
  <!--
    AI가 띄운 정리 제안. AI는 제안만 하고, 실제 처리는 사용자가 여기서 [확인]을 눌러야 일어난다.
    상태는 서버가 정한 값(status)을 그대로 보여 주고, 확인 대기 중일 때만 남은 시간과 버튼을 그린다.
  -->
  <div class="action-card" :class="`is-${viewStatus.toLowerCase()}`">
    <div class="action-head">
      <span class="action-emoji" aria-hidden="true">{{ typeInfo.emoji }}</span>
      <span class="action-title">{{ typeInfo.title }}</span>
      <span class="action-count sf-num">{{ action.foods.length }}개</span>
    </div>

    <ul class="action-foods">
      <li v-for="food in action.foods" :key="food.id" class="action-food">
        <span class="food-name">{{ food.name }}</span>
        <span class="food-qty sf-num">{{ food.quantity }}개</span>
        <DdayBadge :expiration-date-time="food.expirationDateTime" />
      </li>
    </ul>

    <div v-if="viewStatus === 'PENDING'" class="action-foot">
      <span class="action-timer sf-num" :class="{ 'is-urgent': secondsLeft <= 60 }">
        {{ timerLabel }} 안에 확인해 주세요
      </span>
      <div class="action-buttons">
        <v-btn variant="text" size="small" :disabled="!!busy" :loading="busy === 'cancel'" @click="$emit('cancel', action)">
          취소
        </v-btn>
        <v-btn
          color="primary"
          variant="flat"
          size="small"
          :disabled="!!busy"
          :loading="busy === 'confirm'"
          @click="$emit('confirm', action)"
        >
          {{ typeInfo.confirmLabel }}
        </v-btn>
      </div>
    </div>

    <p v-else class="action-result">
      <v-icon size="16" aria-hidden="true">{{ statusInfo.icon }}</v-icon>
      {{ statusInfo.label }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import DdayBadge from '@/components/food/DdayBadge.vue';

const props = defineProps({
  // { id, type, status, foods: [FoodResDto], expiresAt }
  action: { type: Object, required: true },
  // 패널이 1초마다 갱신하는 지금 시각 (카드마다 타이머를 두지 않으려고 밖에서 받는다)
  now: { type: Number, required: true },
  // 처리 중인 버튼 ('confirm' | 'cancel'), 아니면 빈 문자열
  busy: { type: String, default: '' }
});

defineEmits(['confirm', 'cancel']);

const TYPES = {
  FINISH_CONSUMED: { emoji: '🍽️', title: '다 먹은 것으로 기록', confirmLabel: '먹었어요' },
  FINISH_DISCARDED: { emoji: '🗑️', title: '버린 것으로 기록', confirmLabel: '버렸어요' },
  DELETE: { emoji: '✏️', title: '잘못 등록한 식품 삭제', confirmLabel: '삭제할게요' }
};

const STATUSES = {
  CONFIRMED: { icon: 'mdi-check-circle-outline', label: '처리했어요' },
  CANCELLED: { icon: 'mdi-close-circle-outline', label: '취소했어요' },
  EXPIRED: { icon: 'mdi-clock-outline', label: '시간이 지나 처리하지 않았어요. 다시 말씀해 주세요.' },
  FAILED: { icon: 'mdi-alert-circle-outline', label: '처리하지 못했어요. 식품이 이미 바뀌었을 수 있어요.' }
};

const typeInfo = computed(() => TYPES[props.action.type] || TYPES.DELETE);

const secondsLeft = computed(() =>
  Math.max(0, Math.floor((new Date(props.action.expiresAt).getTime() - props.now) / 1000))
);

// 서버에서는 아직 대기여도, 기한이 지났으면 화면에서는 만료로 보여 준다 (눌러도 410이 온다)
const viewStatus = computed(() =>
  props.action.status === 'PENDING' && secondsLeft.value === 0 ? 'EXPIRED' : props.action.status
);

const statusInfo = computed(() => STATUSES[viewStatus.value] || STATUSES.FAILED);

const timerLabel = computed(() => {
  const minutes = Math.floor(secondsLeft.value / 60);
  const seconds = String(secondsLeft.value % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
});
</script>

<style scoped>
.action-card {
  margin-top: 8px;
  padding: 12px 14px;
  border: 1px solid var(--sf-line-strong);
  border-radius: var(--sf-radius-md);
  background: var(--sf-surface);
}

.action-card:not(.is-pending) {
  background: var(--sf-bg);
  border-color: var(--sf-line);
}

.action-head {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--sf-fs-md);
  font-weight: 700;
  color: var(--sf-text);
}

.action-count {
  margin-left: auto;
  font-size: var(--sf-fs-sm);
  font-weight: 600;
  color: var(--sf-text-sub);
}

.action-foods {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
}

.action-food {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 0;
  border-top: 1px solid var(--sf-line);
  font-size: var(--sf-fs-md);
}

.food-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.food-qty {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

.action-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 8px;
  flex-wrap: wrap;
}

.action-timer {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.action-timer.is-urgent {
  color: var(--sf-expired-ink);
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 4px;
  margin-left: auto;
}

.action-result {
  display: flex;
  align-items: flex-start;
  gap: 4px;
  margin: 8px 0 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

.is-confirmed .action-result {
  color: var(--sf-primary);
  font-weight: 600;
}

.is-failed .action-result {
  color: var(--sf-expired-ink);
}

.is-confirmed .action-foods,
.is-cancelled .action-foods,
.is-expired .action-foods {
  opacity: 0.6;
}
</style>
