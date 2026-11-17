<template>
  <!--
    대시보드 맨 위의 공지 한 줄. 공지 유무와 상관없이 늘 같은 높이로 둔다.
    - 고정 공지나 최근 7일 공지가 있으면 그 제목을 보여주고
    - 없으면 흐린 안내 문구만 둔다 (지난 공지 목록과 관리자의 '공지 쓰기'로 가는 길은 늘 열려 있다)
  -->
  <aside class="notice-banner" :class="{ 'is-quiet': !notice }" aria-label="공지사항">
    <span class="notice-icon" aria-hidden="true">
      <v-icon size="18">mdi-bullhorn-outline</v-icon>
    </span>

    <template v-if="loaded">
      <router-link v-if="notice" :to="`/fridge/post/${notice.id}`" class="notice-link">
        <span class="notice-title">{{ notice.title }}</span>
        <span class="notice-time">{{ notice.timeAgo }}</span>
      </router-link>
      <p v-else class="notice-empty">{{ total > 0 ? '최근 7일 동안 새 공지가 없어요' : '아직 공지가 없어요' }}</p>

      <router-link v-if="total > 0" to="/fridge/notice" class="notice-action">
        공지 <span class="sf-num">{{ total }}</span>개 보기
      </router-link>
      <router-link
        v-else-if="isManager"
        :to="{ path: '/fridge/notice', query: { write: 1 } }"
        class="notice-action"
      >
        공지 쓰기
      </router-link>
    </template>
  </aside>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  // 공지 목록 (고정 글이 먼저, 그다음 최신순으로 온다)
  notices: { type: Array, default: () => [] },
  // 공지 전체 개수
  total: { type: Number, default: 0 },
  // 공지 목록을 받아 왔는지 (받기 전에는 빈 줄만 그려 높이만 잡아 둔다)
  loaded: { type: Boolean, default: false },
  // 냉장고 관리자인지 (공지가 하나도 없을 때 '공지 쓰기'를 보여준다)
  isManager: { type: Boolean, default: false }
});

// 목록의 timeAgo는 7일이 지나면 'MM/dd'로 바뀐다. 그 전까지만 최근 공지로 본다
const isRecent = (post) => !/^\d{2}\/\d{2}$/.test(post.timeAgo || '');

// 고정한 공지는 기간과 상관없이, 없으면 최근 7일 안의 가장 새 공지를 보여준다
const notice = computed(() =>
  props.notices.find(post => post.pinned) || props.notices.find(isRecent) || null
);
</script>

<style scoped>
.notice-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 52px;
  padding: 8px 8px 8px 12px;
  border: 1px solid var(--sf-line);
  border-radius: var(--sf-radius-md);
  background: var(--sf-surface);
}

.notice-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--sf-radius-sm);
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
}

/* 보여줄 공지가 없을 때는 아이콘도 무채색으로: '먼저 확인할 식품'보다 눈에 띄지 않게 */
.notice-banner.is-quiet .notice-icon {
  background: var(--sf-bg);
  color: var(--sf-text-faint);
}

.notice-link {
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex: 1;
  min-width: 0;
  color: var(--sf-text);
  text-decoration: none;
}

.notice-link:hover .notice-title {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.notice-title {
  overflow: hidden;
  font-size: var(--sf-fs-md);
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.notice-time {
  flex-shrink: 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.notice-empty {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-faint);
  white-space: nowrap;
  text-overflow: ellipsis;
}

.notice-action {
  flex-shrink: 0;
  margin-left: auto;
  padding: 8px 10px;
  border-radius: var(--sf-radius-sm);
  font-size: var(--sf-fs-sm);
  font-weight: 600;
  color: var(--sf-text-sub);
  text-decoration: none;
  white-space: nowrap;
}

.notice-action:hover {
  background: var(--sf-bg);
  color: var(--sf-text);
}

.notice-link:focus-visible,
.notice-action:focus-visible {
  outline: 2px solid var(--sf-primary);
  outline-offset: 2px;
  border-radius: var(--sf-radius-sm);
}

@media (max-width: 600px) {
  .notice-time {
    display: none;
  }
}
</style>
