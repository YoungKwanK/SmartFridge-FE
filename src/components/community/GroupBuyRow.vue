<template>
  <!--
    공동구매 목록의 한 줄.
    왼쪽: 대표 이미지(없으면 장바구니 아이콘) / 가운데: 제목과 작성 정보 / 오른쪽: 자리 표시(찬 자리 ●, 빈자리 ○)와 남은 자리
    색은 쓰지 않는다: 주황은 참여 버튼, 노랑·빨강은 유통기한 상태에만 쓰는 색이라서.
  -->
  <li class="gb-row" :class="{ 'is-closed': !canJoin }">
    <button type="button" class="gb-link" @click="$emit('open', post)">
      <span class="gb-thumb" aria-hidden="true">
        <img v-if="showThumb" :src="post.thumbnailUrl" alt="" loading="lazy" @error="thumbFailed = true" />
        <v-icon v-else size="24">mdi-cart-outline</v-icon>
      </span>
      <span class="gb-body">
        <span class="gb-title">
          <span v-if="badge" class="gb-badge">{{ badge }}</span>
          {{ post.title }}
        </span>
        <span class="gb-meta">
          <span>{{ post.writer }}</span>
          <span>{{ post.timeAgo }}</span>
          <span class="sf-num">조회 {{ post.viewCount }}</span>
        </span>
      </span>

      <span v-if="purchase" class="gb-seats" :aria-label="seatsLabel">
        <span class="gb-seat-line" aria-hidden="true">
          <!-- 10자리까지는 한 자리씩, 그보다 많으면 막대로 -->
          <span v-if="purchase.maxParticipants <= MAX_DOTS" class="gb-dots">
            <span
              v-for="seat in purchase.maxParticipants"
              :key="seat"
              class="gb-dot"
              :class="{ 'is-taken': seat <= purchase.currentParticipants }"
            />
          </span>
          <span v-else class="gb-bar"><span :style="{ width: `${filledPercent}%` }" /></span>
          <span class="gb-count sf-num">{{ purchase.currentParticipants }}/{{ purchase.maxParticipants }}</span>
        </span>
        <span class="gb-state" aria-hidden="true">{{ stateText }}</span>
      </span>
    </button>
  </li>
</template>

<script setup>
import { computed, ref, watch } from 'vue';

const props = defineProps({
  // 게시판 목록의 글 하나. 공동구매 글이면 purchase(모집 현황)가, 이미지가 있으면 thumbnailUrl(첫 장)이 함께 온다
  post: { type: Object, required: true }
});
defineEmits(['open']);

const MAX_DOTS = 10;

// 이미지 주소가 깨졌으면 아이콘으로 대신한다
const thumbFailed = ref(false);
watch(() => props.post.thumbnailUrl, () => { thumbFailed.value = false; });
const showThumb = computed(() => !!props.post.thumbnailUrl && !thumbFailed.value);

const purchase = computed(() => props.post.purchase || null);

const isEnded = computed(() => !purchase.value || purchase.value.joinStatus !== 'OPEN' || !purchase.value.isActive);
const isFull = computed(() => !!purchase.value && purchase.value.currentParticipants >= purchase.value.maxParticipants);
const canJoin = computed(() => !isEnded.value && !isFull.value);

const seatsLeft = computed(() =>
  purchase.value ? Math.max(0, purchase.value.maxParticipants - purchase.value.currentParticipants) : 0
);

const stateText = computed(() => {
  if (isEnded.value) return '모집 끝';
  if (isFull.value) return '정원 마감';
  return `${seatsLeft.value}자리 남음`;
});

const seatsLabel = computed(() => {
  if (!purchase.value) return '';
  return `${purchase.value.maxParticipants}명 중 ${purchase.value.currentParticipants}명 참여, ${stateText.value}`;
});

const filledPercent = computed(() =>
  purchase.value
    ? Math.min(100, (purchase.value.currentParticipants / Math.max(1, purchase.value.maxParticipants)) * 100)
    : 0
);

// 내가 연 모집인지, 참여한 모집인지
const badge = computed(() => {
  if (purchase.value?.isCreator) return '내가 모집';
  if (purchase.value?.isJoined) return '참여 중';
  return '';
});
</script>

<style scoped>
.gb-row {
  border-bottom: 1px solid var(--sf-line);
}

.gb-link {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 16px 20px;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.gb-link:hover .gb-title {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.gb-link:focus-visible {
  outline: 2px solid var(--sf-primary);
  outline-offset: -2px;
}

/* 대표 이미지: 정사각형으로 잘라 보여준다 */
.gb-thumb {
  display: grid;
  place-items: center;
  width: 64px;
  height: 64px;
  border-radius: 10px;
  background: var(--sf-bg);
  color: var(--sf-text-faint);
  overflow: hidden;
}

.gb-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gb-row.is-closed .gb-thumb img {
  opacity: 0.6;
}

.gb-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.gb-title {
  overflow: hidden;
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-text);
  white-space: nowrap;
  text-overflow: ellipsis;
}

/* 선택·소속을 뜻하는 민트: 사이드바의 선택된 메뉴와 같은 색 */
.gb-badge {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--sf-mint-soft);
  font-size: var(--sf-fs-xs);
  font-weight: 700;
  color: var(--sf-primary);
  vertical-align: 2px;
}

.gb-meta {
  display: flex;
  gap: 10px;
  overflow: hidden;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
  white-space: nowrap;
}

/* 오른쪽 자리 표시 */
.gb-seats {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.gb-seat-line {
  display: flex;
  align-items: center;
  gap: 8px;
}

.gb-dots {
  display: flex;
  gap: 4px;
}

.gb-dot {
  width: 10px;
  height: 10px;
  border: 1.5px solid var(--sf-line-strong);
  border-radius: 50%;
}

.gb-dot.is-taken {
  border-color: var(--sf-text);
  background: var(--sf-text);
}

.gb-bar {
  position: relative;
  width: 104px;
  height: 6px;
  border-radius: 999px;
  background: var(--sf-line);
  overflow: hidden;
}

.gb-bar span {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: inherit;
  background: var(--sf-text);
}

.gb-count {
  min-width: 34px;
  font-size: var(--sf-fs-sm);
  font-weight: 600;
  color: var(--sf-text-sub);
  text-align: right;
}

.gb-state {
  font-size: var(--sf-fs-sm);
  font-weight: 700;
  color: var(--sf-text);
}

/* 참여할 수 없는 모집은 한 단계 흐리게: 지난 글은 아래로 가라앉아 보이게 */
.gb-row.is-closed .gb-title,
.gb-row.is-closed .gb-state {
  font-weight: 500;
  color: var(--sf-text-sub);
}

.gb-row.is-closed .gb-dot.is-taken,
.gb-row.is-closed .gb-bar span {
  border-color: var(--sf-text-faint);
  background: var(--sf-text-faint);
}

@media (max-width: 600px) {
  .gb-link {
    grid-template-columns: 52px minmax(0, 1fr) auto;
    gap: 12px;
    padding: 14px 16px;
  }

  .gb-thumb {
    width: 52px;
    height: 52px;
  }

  /* 좁은 화면에서는 자리 점 대신 숫자와 남은 자리만 */
  .gb-dots,
  .gb-bar {
    display: none;
  }
}
</style>
