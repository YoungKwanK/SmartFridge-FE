<template>
  <PageLayout title="알림" description="유통기한, 댓글, 문의 답변 같은 소식을 모아 봐요." width="narrow">
    <template #actions>
      <v-btn variant="text" color="primary" prepend-icon="mdi-check-all" @click="readAll()">모두 읽음으로 표시</v-btn>
    </template>

    <div class="type-filters" role="tablist" aria-label="알림 종류">
      <button
        v-for="tab in tabs"
        :key="tab.value"
        type="button"
        role="tab"
        class="type-chip"
        :class="{ 'is-on': selectedTab === tab.value }"
        :aria-selected="selectedTab === tab.value"
        @click="filterByTab(tab.value)"
      >
        {{ tab.label }}
      </button>
    </div>

    <section class="sf-list-panel" aria-label="알림 목록">
      <ul v-if="sortedNotifications.length" class="noti-list">
        <li
          v-for="notification in sortedNotifications"
          :key="notification.id"
          class="noti-item"
          :class="{ 'is-read': notification.read }"
        >
          <button type="button" class="noti-main" @click="goToDetail(notification)">
            <span class="noti-icon" :class="`type-${getNotificationType(notification)}`" aria-hidden="true">
              <v-icon size="20">{{ iconOf(notification) }}</v-icon>
            </span>
            <span class="noti-text">
              <span class="noti-head">
                <span class="noti-type">{{ labelOf(notification) }}</span>
                <span
                  v-if="getNotificationType(notification) === 'expiration'"
                  class="noti-dday sf-num"
                  :class="isUrgentExpiration(notification) ? 'is-soon' : ''"
                >
                  {{ getExpirationDays(notification) <= 0 ? '오늘까지' : `${getExpirationDays(notification)}일 남음` }}
                </span>
              </span>
              <span class="noti-message">{{ getNotificationText(notification) }}</span>
              <span class="noti-time">{{ formatTimeAgo(notification.createdAt) }}</span>
            </span>
            <span v-if="!notification.read" class="unread-dot" aria-label="읽지 않음" />
          </button>
          <v-btn
            icon="mdi-close"
            variant="text"
            size="small"
            class="noti-delete"
            aria-label="알림 삭제"
            @click.stop="confirmDelete(notification)"
          />
        </li>
      </ul>

      <div v-if="isLoading" class="sf-state-box">
        <v-progress-circular indeterminate color="primary" size="32" />
        <p>알림을 불러오는 중이에요</p>
      </div>

      <div v-else-if="!sortedNotifications.length" class="sf-state-box">
        <p class="sf-empty-title">새 알림이 없어요</p>
        <p>유통기한이 다가오거나 댓글이 달리면 여기에 알려드려요.</p>
      </div>

      <div v-if="isLoadingMore" class="sf-state-box is-small">
        <v-progress-circular indeterminate color="primary" size="24" />
      </div>
      <p v-if="!hasMoreData && !isLoadingMore && sortedNotifications.length" class="list-end">
        알림을 모두 확인했어요
      </p>
    </section>

    <!-- 삭제 확인 -->
    <v-dialog v-model="deleteDialog" max-width="400">
      <v-card class="pa-2">
        <v-card-title class="sf-dialog-title">알림을 삭제할까요?</v-card-title>
        <v-card-text class="dialog-body">삭제한 알림은 다시 볼 수 없어요.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="deleteDialog = false">취소</v-btn>
          <v-btn color="error" variant="flat" @click="deleteNotification">삭제</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/components/layout/PageLayout.vue';
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import axios from "axios";
import { getFridgeId } from '@/utils/commonDataHandler';

// Vue Router와 Vuex Store 인스턴스 가져오기
const store = useStore();
const router = useRouter();

// reactive 상태 변수 정의
const notificationList = ref([]);
const selectedTab = ref("all");
const selectedCategory = ref("ALL");
const fridgeId = ref(getFridgeId(store));

const deleteDialog = ref(false);
const deleteTarget = ref(null);
const userType = ref('COMMON');
const currentPage = ref(0);
const pageSize = ref(20);
const hasMoreData = ref(true);
const isLoading = ref(false);
const isLoadingMore = ref(false);

// methods를 일반 함수로 변환
const fetchNotifications = async (isLoadMore = false) => {
  if (isLoading.value || (isLoadMore && isLoadingMore.value)) return;
  
  if (isLoadMore) {
    isLoadingMore.value = true;
  } else {
    isLoading.value = true;
  }
  
  // 냉장고 Id 가 없으면 냉장고 목록으로 이동
  if (fridgeId.value === null) {
    router.push('/fridge/list');
    return;
  }

  try {
    let url = `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId.value}/notification/list`;
    const params = new URLSearchParams();
    if (selectedCategory.value !== "ALL") {
      if (selectedCategory.value.includes(',')) {
        selectedCategory.value.split(',').forEach(type => {
          params.append('notificationType', type.trim());
        });
      } else {
        params.append('notificationType', selectedCategory.value);
      }
    }
    params.append('page', currentPage.value.toString());
    params.append('size', pageSize.value.toString());
    if (params.toString()) url += `?${params.toString()}`;

    const response = await axios.get(url);
    const pageData = response.data.result;
    const newNotifications = pageData.content;

    if (isLoadMore) {
      notificationList.value = [...notificationList.value, ...newNotifications];
    } else {
      notificationList.value = newNotifications;
      setUserType();
    }

    // 서버에서 제공하는 last 필드를 사용하여 더보기 버튼 표시 여부 결정
    hasMoreData.value = !pageData.last;
  } catch (error) {
    console.error('알림 조회 실패:', error);
  } finally {
    if (isLoadMore) {
      isLoadingMore.value = false;
    } else {
      isLoading.value = false;
    }
  }
};

const setUserType = () => {
  if (notificationList.value.length > 0) {
    const memberType = notificationList.value[0].fridgeMemberType;
    if (!memberType) userType.value = 'ADMIN';
    else userType.value = memberType === 'MANAGER' ? 'MANAGER' : 'COMMON';
  }
};

const filterByTab = (tab) => {
  selectedTab.value = tab;
  if (tab === "qa") {
    return;
  }
  let category = "ALL";
  if (tab === "expiration") category = "EXPIRATION_IMMINENT";
  else if (tab === "post") category = "NEW_ANNOUNCEMENT";
  else if (tab === "comment") category = "NEW_COMMENT";
  else if (tab === "inquiry-reply") category = "ADMIN_REPLY,ADMIN_REPLY_UPDATED";
  else if (tab === "group-chat") category = "ROOM_FULL,ROOM_CLOSED";
  else if (tab === "member") category = "NEW_MEMBER";
  selectedCategory.value = category;
  resetPagination();
  fetchNotifications();
};

const getNotificationType = (notification) => {
  if (notification.type === "EXPIRATION_IMMINENT") return "expiration";
  if (notification.type === "NEW_ANNOUNCEMENT") return "post";
  if (notification.type === "NEW_COMMENT") return "comment";
  if (notification.type === "INQUIRY_REPLY") return "inquiry-reply";
  if (notification.type === "ADMIN_REPLY" || notification.type === "ADMIN_REPLY_UPDATED") return "inquiry-reply";
  if (notification.type === "NEW_INQUIRY") return "inquiry-reply";
  if (notification.type === "NEW_MEMBER") return "member";
  if (notification.type === "ROOM_FULL" || notification.type === "ROOM_CLOSED") return "group-chat";
  return "other";
};

const getNotificationText = (notification) => {
  if (notification.type === "EXPIRATION_IMMINENT") return `${notification.content || '음식'}`;
  if (notification.type === "NEW_ANNOUNCEMENT") return `${notification.content || '새로운 공지사항'}`;
  if (notification.type === "NEW_COMMENT") return `${notification.content || '새로운 댓글'}`;
  if (notification.type === "INQUIRY_REPLY") return `${notification.content || '새로운 문의 답변'}`;
  if (notification.type === "ADMIN_REPLY") return `${notification.content || '새로운 문의 답변'}`;
  if (notification.type === "NEW_INQUIRY") return `${notification.content || '새로운 문의'}`;
  if (notification.type === "NEW_MEMBER") return `${notification.content || '새로운 멤버'}`;
  return notification.content || '새로운 알림이 있습니다';
};

const getExpirationDays = (notification) => {
  if (notification.type === "EXPIRATION_IMMINENT") {
    const today = new Date();
    const expirationDate = new Date(notification.expirationDate || notification.createdAt);
    return Math.max(0, Math.ceil((expirationDate - today) / (1000 * 60 * 60 * 24)));
  }
  return 0;
};

const isUrgentExpiration = (notification) => {
  if (notification.type === "EXPIRATION_IMMINENT") return getExpirationDays(notification) <= 3;
  return false;
};

const formatTimeAgo = (dateStr) => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return `${diffDays}일 전`;
  else if (diffHours > 0) return `${diffHours}시간 전`;
  return "방금 전";
};

const goToDetail = (notification) => {
  // 클릭 시 개별 읽음 처리 (서버 반영 + 로컬 즉시 반영)
  markAsRead(notification);

  const type = notification?.type;
  const extractPostId = (n) => (
    n?.targetId ?? n?.postId ?? n?.announceId ?? n?.announcementId ?? n?.boardId ?? n?.post?.id ?? n?.target?.id ?? null
  );
  const postId = extractPostId(notification);

  if (type === 'EXPIRATION_IMMINENT') {
    router.push('/fridge/food/shared');
    return;
  }

  if (type === 'NEW_MEMBER') {
    router.push('/fridge/member/list');
    return;
  }

  if (type === 'ADMIN_REPLY' || type === 'ADMIN_REPLY_UPDATED' || type === 'INQUIRY_REPLY' || type === 'NEW_INQUIRY') {
    router.push('/inquiry');
    return;
  }

  if (type === 'NEW_ANNOUNCEMENT' || type === 'NEW_COMMENT') {
    if (postId) {
      const commentId = notification?.commentId || notification?.targetCommentId || notification?.comment?.id;
      if (type === 'NEW_COMMENT' && commentId) {
        router.push({ path: `/fridge/post/${postId}`, query: { commentId } });
      } else if (type === 'NEW_COMMENT') {
        router.push({ path: `/fridge/post/${postId}`, query: { scrollTo: 'comments' } });
      } else {
        router.push(`/fridge/post/${postId}`);
      }
    } else {
      router.push('/fridge/community');
    }
    return;
  }

  // 기존 fallbacks (예방적 유지)
  if (notification.targetType === 'ANNOUNCE') {
    if (postId) router.push(`/fridge/post/${postId}`);
    else router.push('/fridge/community');
    return;
  }
  if (notification.targetType === 'FOOD') {
    router.push('/fridge/food/shared');
    return;
  }
};

// 단건 읽음 처리 함수
const markAsRead = async (notification) => {
  try {
    if (!notification || !notification.id) return;
    // 로컬 즉시 반영 (UI 반응성 보장)
    notification.read = true;
    notification.isRead = true;
    // 서버 반영
    await axios.patch(
      `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId.value}/notification/isRead`,
      [{ notificationId: notification.id }]
    );
  } catch (error) {
    // 실패하더라도 네비게이션은 진행하므로 조용히 로깅만
    console.error('단건 읽음 처리 실패:', error);
  }
};

const confirmDelete = (notification) => {
  deleteTarget.value = notification;
  deleteDialog.value = true;
};

const deleteNotification = async () => {
  if (!deleteTarget.value) return;
  try {
    await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId.value}/notification/delete/${deleteTarget.value.id}`);
    notificationList.value = notificationList.value.filter(n => n.id !== deleteTarget.value.id);
    deleteDialog.value = false;
    deleteTarget.value = null;
  } catch (error) {
    console.error('알림 삭제 실패:', error);
  }
};

const TYPE_META = {
  expiration: { label: '유통기한', icon: 'mdi-clock-alert-outline' },
  post: { label: '공지', icon: 'mdi-bullhorn-outline' },
  comment: { label: '댓글', icon: 'mdi-comment-outline' },
  'inquiry-reply': { label: '문의 답변', icon: 'mdi-message-reply-text-outline' },
  'group-chat': { label: '공동구매', icon: 'mdi-cart-outline' },
  member: { label: '새 멤버', icon: 'mdi-account-plus-outline' },
  other: { label: '알림', icon: 'mdi-bell-outline' }
};
const iconOf = (notification) => TYPE_META[getNotificationType(notification)].icon;
const labelOf = (notification) => TYPE_META[getNotificationType(notification)].label;

const tabs = computed(() => {
  const list = [
    { value: 'all', label: '전체' },
    { value: 'expiration', label: '유통기한' },
    { value: 'post', label: '공지' },
    { value: 'comment', label: '댓글' },
    { value: 'inquiry-reply', label: '문의 답변' },
    { value: 'group-chat', label: '공동구매' }
  ];
  if (userType.value === 'MANAGER') list.push({ value: 'member', label: '새 멤버' });
  return list;
});

const resetPagination = () => { 
  currentPage.value = 0;
  hasMoreData.value = true;
  notificationList.value = [];
};

const loadMoreData = async () => { 
  if (!hasMoreData.value || isLoadingMore.value) return;
  currentPage.value++;
  await fetchNotifications(true);
};

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;
  if (scrollTop + windowHeight >= documentHeight - 100) loadMoreData();
};

const readAll = async () => {
  try {
    const readNotification = notificationList.value.map(n => ({ notificationId: n.id }));
    await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId.value}/notification/isRead`, readNotification);
    await fetchNotifications();
  } catch (error) { console.error('모두 읽음 처리 실패:', error); }
};

// computed 속성
const sortedNotifications = computed(() => {
  let filteredNotifications = notificationList.value;
  if (selectedCategory.value !== "ALL") {
    const types = new Set(selectedCategory.value.split(',').map(t => t.trim()));
    filteredNotifications = filteredNotifications.filter(n => types.has(n.type));
  }
  const unreadNotifications = filteredNotifications.filter(n => !n.read);
  const readNotifications = filteredNotifications.filter(n => n.read);
  const sortedUnread = unreadNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const sortedRead = readNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return [...sortedUnread, ...sortedRead];
});

// 라이프사이클 훅
onMounted(async () => {
  await fetchNotifications();
  window.addEventListener('scroll', handleScroll);
});

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScroll);
});
</script>


<style scoped>
.type-filters {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  scrollbar-width: none;
}

.type-chip {
  flex-shrink: 0;
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--sf-line-strong);
  border-radius: 999px;
  background: var(--sf-surface);
  font: inherit;
  font-size: var(--sf-fs-md);
  font-weight: 500;
  color: var(--sf-text-sub);
  cursor: pointer;
}

.type-chip.is-on {
  border-color: var(--sf-text);
  background: var(--sf-text);
  font-weight: 600;
  color: #fff;
}

.noti-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.noti-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  border-bottom: 1px solid var(--sf-line);
}

.noti-main {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) 12px;
  align-items: start;
  gap: 14px;
  width: 100%;
  padding: 16px 52px 16px 20px;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.noti-main:hover {
  background: var(--sf-bg);
}

.noti-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--sf-bg);
  color: var(--sf-text-sub);
}

.noti-icon.type-expiration {
  background: var(--sf-soon-bg);
  color: var(--sf-soon-ink);
}

.noti-icon.type-group-chat {
  background: #FFF0E6;
  color: #C2501A;
}

.noti-icon.type-post,
.noti-icon.type-member {
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
}

.noti-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.noti-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: var(--sf-fs-sm);
}

.noti-type {
  font-weight: 600;
  color: var(--sf-text-sub);
}

.noti-dday {
  color: var(--sf-text-faint);
}

.noti-dday.is-soon {
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--sf-soon);
  font-weight: 700;
  color: #3D2D00;
}

.noti-message {
  font-size: var(--sf-fs-md);
  line-height: 1.5;
  color: var(--sf-text);
}

.noti-time {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.is-read .noti-message {
  color: var(--sf-text-sub);
}

.is-read .noti-icon {
  opacity: 0.6;
}

.unread-dot {
  width: 8px;
  height: 8px;
  margin-top: 6px;
  border-radius: 50%;
  background: var(--sf-expired);
}

.noti-delete {
  position: absolute;
  top: 12px;
  right: 8px;
  color: var(--sf-text-faint);
}

.sf-state-box.is-small {
  padding: 16px;
}

.list-end {
  margin: 0;
  padding: 16px;
  text-align: center;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.dialog-body {
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

@media (max-width: 600px) {
  .noti-main {
    padding: 14px 44px 14px 16px;
    gap: 12px;
  }
}
</style>
