<template>
  <PageLayout
    title="리포트"
    description="다 먹고 버린 기록을 모아 습관을 돌아봐요."
    width="default"
  >
    <!-- 범위·기간 선택 -->
    <div class="report-controls">
      <!-- 냉장고 전체는 관리자만 (다른 멤버의 비공유 식품 기록이 들어가므로) -->
      <div v-if="isManager" class="seg" role="group" aria-label="리포트 범위">
        <button
          v-for="option in scopeOptions"
          :key="option.value"
          type="button"
          class="seg-btn"
          :class="{ 'is-on': scope === option.value }"
          :aria-pressed="scope === option.value"
          @click="scope = option.value"
        >
          {{ option.label }}
        </button>
      </div>
      <span v-else class="scope-note">내가 등록한 식품 기준이에요</span>
      <div class="seg" role="group" aria-label="리포트 기간">
        <button
          v-for="option in periodOptions"
          :key="option.value"
          type="button"
          class="seg-btn"
          :class="{ 'is-on': period === option.value }"
          :aria-pressed="period === option.value"
          @click="period = option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </div>

    <div class="period-nav">
      <template v-if="period === 'MONTH'">
        <v-btn icon="mdi-chevron-left" variant="text" size="small" aria-label="지난달" @click="moveMonth(-1)" />
        <span class="period-label">{{ monthLabel }}</span>
        <v-btn
          icon="mdi-chevron-right"
          variant="text"
          size="small"
          aria-label="다음 달"
          :disabled="isCurrentMonth"
          @click="moveMonth(1)"
        />
      </template>
      <span v-else class="period-label">{{ allPeriodLabel }}</span>
    </div>

    <v-progress-linear v-if="loading" indeterminate color="primary" rounded />

    <!-- 기록 없음 -->
    <section v-else-if="report && totalCount === 0" class="panel empty">
      <span class="empty-emoji" aria-hidden="true">📭</span>
      <p class="empty-title">{{ period === 'MONTH' ? '이 달의 기록이 아직 없어요' : '아직 기록이 없어요' }}</p>
      <p class="empty-hint">식품을 다 먹거나 버렸을 때 정리하기로 처리하면 여기에 모여요.</p>
    </section>

    <template v-else-if="report">
      <!-- 요약 -->
      <div class="summary-grid">
        <div class="summary-card">
          <p class="summary-label">먹었어요</p>
          <p class="summary-value"><span class="sf-num">{{ report.summary.consumedCount }}</span><small>개</small></p>
        </div>
        <div class="summary-card">
          <p class="summary-label">버렸어요</p>
          <p class="summary-value"><span class="sf-num">{{ report.summary.discardedCount }}</span><small>개</small></p>
        </div>
        <div class="summary-card">
          <p class="summary-label">폐기율</p>
          <p class="summary-value"><span class="sf-num">{{ formatRate(report.summary.discardRate) }}</span><small>%</small></p>
          <p
            v-if="report.summary.discardRateDiff !== null && report.summary.discardRateDiff !== undefined"
            class="summary-diff"
            :class="diffClass(report.summary.discardRateDiff)"
          >
            <v-icon size="14">{{ diffIcon(report.summary.discardRateDiff) }}</v-icon>
            지난달보다 {{ Math.abs(report.summary.discardRateDiff) }}%p
          </p>
        </div>
      </div>

      <!-- 한눈에 보기 -->
      <section v-if="report.insights.length" class="panel">
        <h2 class="panel-title"><v-icon size="18" color="primary">mdi-lightbulb-on-outline</v-icon> 한눈에 보기</h2>
        <ul class="insight-list">
          <li v-for="(sentence, index) in report.insights" :key="index">{{ sentence }}</li>
        </ul>
      </section>

      <!-- 월별 폐기율 추이 (전체만) -->
      <section v-if="period === 'ALL' && report.monthlyTrend.length" class="panel">
        <h2 class="panel-title">월별 폐기율</h2>
        <div v-for="month in report.monthlyTrend" :key="month.month" class="bar-row">
          <span class="bar-label">{{ shortMonth(month.month) }}</span>
          <div class="bar-track">
            <span class="bar-fill bar-discarded" :style="{ width: `${month.discardRate || 0}%` }" />
          </div>
          <span class="bar-value sf-num">{{ formatRate(month.discardRate) }}%</span>
        </div>
      </section>

      <!-- 카테고리별 -->
      <section class="panel">
        <div class="panel-head">
          <h2 class="panel-title">카테고리별</h2>
          <span class="legend">
            <span class="legend-dot bar-consumed" aria-hidden="true" />먹음
            <span class="legend-dot bar-discarded" aria-hidden="true" />버림
          </span>
        </div>
        <div
          v-for="item in report.byCategory"
          :key="item.category"
          class="bar-row"
          role="img"
          :aria-label="`${item.category} 먹음 ${item.consumed}개, 버림 ${item.discarded}개`"
        >
          <span class="bar-label">{{ categoryEmoji(item.category) }} {{ item.category }}</span>
          <div class="bar-track">
            <span class="bar-fill bar-consumed" :style="{ width: `${barWidth(item.consumed)}%` }" />
            <span class="bar-fill bar-discarded" :style="{ width: `${barWidth(item.discarded)}%` }" />
          </div>
          <span class="bar-value sf-num">{{ item.consumed }} / {{ item.discarded }}</span>
        </div>
      </section>

      <!-- 습관 -->
      <div class="habit-grid">
        <section class="panel">
          <h2 class="panel-title">자주 버린 식품</h2>
          <ol v-if="report.topDiscarded.length" class="rank-list">
            <li v-for="(item, index) in report.topDiscarded" :key="item.name">
              <span>{{ index + 1 }}. {{ item.name }}</span>
              <span class="sf-num rank-count">{{ item.count }}개</span>
            </li>
          </ol>
          <p v-else class="muted">버린 식품이 없어요.</p>
        </section>
        <section class="panel">
          <h2 class="panel-title">평균 보관일</h2>
          <dl class="days-list">
            <div><dt>먹은 식품</dt><dd class="sf-num">{{ formatDays(report.avgStorageDays.consumed) }}</dd></div>
            <div><dt>버린 식품</dt><dd class="sf-num">{{ formatDays(report.avgStorageDays.discarded) }}</dd></div>
          </dl>
          <p class="muted">등록한 날부터 다 먹거나 버린 날까지예요.</p>
        </section>
      </div>

      <p class="footnote">개수 기준이에요. 잘못 등록으로 삭제한 식품은 통계에서 빠져요.</p>
    </template>
  </PageLayout>
</template>

<script setup>
import axios from 'axios';
import { computed, onMounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import PageLayout from '@/components/layout/PageLayout.vue';
import { getFridgeId } from '@/utils/commonDataHandler';
import { categoryEmoji } from '@/utils/foodFreshness';
import { snackbar } from '@/composables/snackbar';

const store = useStore();

const scopeOptions = [
  { label: '내 리포트', value: 'MY' },
  { label: '냉장고 전체', value: 'FRIDGE' }
];
const periodOptions = [
  { label: '월간', value: 'MONTH' },
  { label: '전체', value: 'ALL' }
];

// 'YYYY-MM' 형식
const toMonthString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
const currentMonth = toMonthString(new Date());

const scope = ref('MY');
const period = ref('MONTH');
const month = ref(currentMonth);
const report = ref(null);
const loading = ref(false);
const isManager = ref(false);

// 관리자인지 확인 (일반 멤버는 내 리포트만 볼 수 있다)
const fetchRole = async () => {
  const fridgeId = getFridgeId(store);
  if (!fridgeId) return;
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/detail`);
    isManager.value = response.data?.result?.type === 'MANAGER';
  } catch (error) {
    console.error('냉장고 정보를 불러오지 못했습니다:', error);
    isManager.value = false;
  }
};

const isCurrentMonth = computed(() => month.value === currentMonth);
const monthLabel = computed(() => {
  const [year, value] = month.value.split('-');
  return `${year}년 ${Number(value)}월`;
});
const allPeriodLabel = computed(() => {
  const from = report.value?.from;
  if (!from) return '첫 기록부터 지금까지';
  return `${from.replaceAll('-', '.')}부터 지금까지`;
});
const totalCount = computed(() =>
  (report.value?.summary.consumedCount || 0) + (report.value?.summary.discardedCount || 0)
);
// 카테고리 막대는 가장 많은 카테고리를 100%로 맞춘다
const maxCategoryTotal = computed(() =>
  Math.max(1, ...(report.value?.byCategory || []).map(item => item.consumed + item.discarded))
);

const moveMonth = (step) => {
  const [year, value] = month.value.split('-').map(Number);
  const next = toMonthString(new Date(year, value - 1 + step, 1));
  if (next > currentMonth) return;
  month.value = next;
};

const fetchReport = async () => {
  const fridgeId = getFridgeId(store);
  if (!fridgeId) return;
  loading.value = true;
  try {
    const params = { period: period.value, scope: scope.value };
    if (period.value === 'MONTH') params.month = month.value;
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/report`, { params });
    report.value = response.data.result;
  } catch (error) {
    console.error('리포트를 불러오지 못했습니다:', error);
    report.value = null;
    snackbar.error('리포트를 불러오지 못했어요: ' + (error.response?.data?.status_message || error.message));
  } finally {
    loading.value = false;
  }
};

const barWidth = (count) => (count / maxCategoryTotal.value) * 100;
const formatRate = (rate) => (rate === null || rate === undefined ? '-' : rate);
const formatDays = (days) => (days === null || days === undefined ? '-' : `${days}일`);
const shortMonth = (value) => {
  const [year, m] = value.split('-');
  return `${year.slice(2)}.${m}`;
};
// 폐기율은 줄어야 좋은 값이다
const diffClass = (diff) => (diff < 0 ? 'is-good' : diff > 0 ? 'is-bad' : '');
const diffIcon = (diff) => (diff < 0 ? 'mdi-arrow-down' : diff > 0 ? 'mdi-arrow-up' : 'mdi-minus');

watch([scope, period, month], fetchReport);
onMounted(async () => {
  await fetchRole();
  fetchReport();
});
</script>

<style scoped>
.report-controls {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 8px;
}

.scope-note {
  align-self: center;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

.seg {
  display: inline-flex;
  border: 1px solid var(--sf-line-strong);
  border-radius: var(--sf-radius-sm);
  overflow: hidden;
  background: var(--sf-surface);
}

.seg-btn {
  padding: 8px 16px;
  font: inherit;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
  background: transparent;
  border: 0;
  cursor: pointer;
}

.seg-btn + .seg-btn {
  border-left: 1px solid var(--sf-line-strong);
}

.seg-btn.is-on {
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
  font-weight: 700;
}

.period-nav {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 40px;
}

.period-label {
  font-size: var(--sf-fs-lg);
  font-weight: 700;
  color: var(--sf-text);
}

.panel {
  background: var(--sf-surface);
  border-radius: var(--sf-radius-lg);
  box-shadow: var(--sf-shadow);
  padding: 20px 24px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 0 12px;
  font-size: var(--sf-fs-lg);
  font-weight: 700;
  color: var(--sf-text);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  background: var(--sf-surface);
  border-radius: var(--sf-radius-md);
  box-shadow: var(--sf-shadow);
  padding: 16px 20px;
}

.summary-label {
  margin: 0 0 4px;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

.summary-value {
  margin: 0;
  font-size: var(--sf-fs-2xl);
  font-weight: 800;
  color: var(--sf-text);
}

.summary-value small {
  margin-left: 2px;
  font-size: var(--sf-fs-md);
  font-weight: 400;
  color: var(--sf-text-sub);
}

.summary-diff {
  display: flex;
  align-items: center;
  gap: 2px;
  margin: 4px 0 0;
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-sub);
}

.summary-diff.is-good { color: var(--sf-primary); }
.summary-diff.is-bad { color: var(--sf-expired-ink); }

.insight-list {
  margin: 0;
  padding-left: 20px;
  font-size: var(--sf-fs-md);
  line-height: 1.9;
  color: var(--sf-text);
}

.bar-row {
  display: grid;
  grid-template-columns: 96px minmax(0, 1fr) 64px;
  align-items: center;
  gap: 12px;
  margin: 10px 0;
  font-size: var(--sf-fs-sm);
}

.bar-label {
  color: var(--sf-text);
  white-space: nowrap;
}

.bar-track {
  display: flex;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--sf-bg);
}

.bar-fill {
  height: 100%;
}

.bar-consumed { background: var(--sf-mint); }
.bar-discarded { background: var(--sf-expired); }

.bar-value {
  text-align: right;
  color: var(--sf-text-sub);
}

.legend {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-sub);
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.legend-dot + .legend-dot,
.legend .bar-discarded {
  margin-left: 8px;
}

.habit-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--sf-section-gap);
}

.rank-list {
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: var(--sf-fs-md);
  line-height: 2;
}

.rank-list li {
  display: flex;
  justify-content: space-between;
}

.rank-count {
  color: var(--sf-text-sub);
}

.days-list {
  margin: 0;
  font-size: var(--sf-fs-md);
  line-height: 2;
}

.days-list div {
  display: flex;
  justify-content: space-between;
}

.days-list dd {
  margin: 0;
  font-weight: 700;
}

.muted {
  margin: 4px 0 0;
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-faint);
}

.footnote {
  margin: 0;
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-faint);
}

.empty {
  text-align: center;
  padding: 40px 24px;
}

.empty-emoji {
  font-size: 32px;
}

.empty-title {
  margin: 8px 0 4px;
  font-size: var(--sf-fs-lg);
  font-weight: 700;
  color: var(--sf-text);
}

.empty-hint {
  margin: 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

@media (max-width: 600px) {
  .summary-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
  }
  .summary-card {
    padding: 12px;
  }
  .summary-value {
    font-size: var(--sf-fs-xl);
  }
  .habit-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .bar-row {
    grid-template-columns: 80px minmax(0, 1fr) 52px;
    gap: 8px;
  }
  .panel {
    padding: 16px;
  }
}
</style>
