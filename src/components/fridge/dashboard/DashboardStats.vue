<template>
  <section class="stats-panel" aria-labelledby="stats-title">
    <h2 id="stats-title" class="stats-title">냉장고 상태</h2>
    <p class="stats-total">
      <span class="total-number sf-num">{{ total }}</span>
      <span class="total-unit">개 보관 중</span>
    </p>

    <!-- 신선·임박·만료 비율 막대 -->
    <div
      class="ratio-bar"
      role="img"
      :aria-label="`신선 ${fresh}개, 임박 ${soon}개, 만료 ${expired}개`"
    >
      <span v-if="total === 0" class="seg seg-empty" />
      <template v-else>
        <span class="seg seg-fresh" :style="{ flexGrow: fresh }" />
        <span class="seg seg-soon" :style="{ flexGrow: soon }" />
        <span class="seg seg-expired" :style="{ flexGrow: expired }" />
      </template>
    </div>

    <dl class="stats-list">
      <div class="stat">
        <dt><span class="dot dot-fresh" aria-hidden="true" />신선</dt>
        <dd class="sf-num">{{ fresh }}</dd>
      </div>
      <div class="stat">
        <dt><span class="dot dot-soon" aria-hidden="true" />임박</dt>
        <dd class="sf-num">{{ soon }}</dd>
      </div>
      <div class="stat">
        <dt><span class="dot dot-expired" aria-hidden="true" />만료</dt>
        <dd class="sf-num" :class="{ 'is-alert': expired > 0 }">{{ expired }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup>
import axios from 'axios';
import { computed, ref, onMounted } from 'vue';

const props = defineProps({
  fridgeId: {
    type: String,
    required: true
  }
});

const foodStats = ref({});

const total = computed(() => foodStats.value.totalCount || 0);
const fresh = computed(() => foodStats.value.freshCount || 0);
const soon = computed(() => foodStats.value.expiringSoonCount || 0);
const expired = computed(() => foodStats.value.expiredCount || 0);

const fetchFoodStats = async () => {
  try {
    if (!props.fridgeId) {
      console.warn('Props에서 냉장고 ID를 찾을 수 없습니다.');
      return;
    }

    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${props.fridgeId}/food/stats`);
    foodStats.value = response.data.result;
  } catch (error) {
    console.error("식품통계를 불러오는데 실패했습니다:", error);
  }
};

onMounted(() => {
  fetchFoodStats();
});
</script>

<style scoped>
.stats-panel {
  background: var(--sf-surface);
  border-radius: var(--sf-radius-lg);
  box-shadow: var(--sf-shadow);
  padding: 24px;
}

.stats-title {
  margin: 0;
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-text-sub);
}

.stats-total {
  display: flex;
  align-items: baseline;
  gap: 4px;
  margin: 8px 0 16px;
}

.total-number {
  font-size: var(--sf-fs-display);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--sf-text);
}

.total-unit {
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.ratio-bar {
  display: flex;
  gap: 2px;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--sf-bg);
}

.seg {
  flex-basis: 0;
  min-width: 0;
}

.seg-empty { flex-grow: 1; background: var(--sf-line); }
.seg-fresh { background: var(--sf-fresh-bar); }
.seg-soon { background: var(--sf-soon); }
.seg-expired { background: var(--sf-expired); }

.stats-list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 16px 0 0;
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.stat + .stat {
  padding-left: 16px;
  border-left: 1px solid var(--sf-line);
}

.stat dt {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

.stat dd {
  margin: 0;
  font-size: var(--sf-fs-2xl);
  font-weight: 700;
  color: var(--sf-text);
}

.stat dd.is-alert {
  color: var(--sf-expired-ink);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.dot-fresh { background: var(--sf-fresh-bar); box-shadow: inset 0 0 0 1px #8FD6B8; }
.dot-soon { background: var(--sf-soon); }
.dot-expired { background: var(--sf-expired); }
</style>
