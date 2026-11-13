<template>
  <PageLayout
    title="멤버 관리"
    description="멤버에게 1:1로 메시지를 보내고, 관리자 권한을 넘기거나 내보낼 수 있어요."
    width="wide"
  >

    <div class="members-grid">
      <!-- 멤버 목록 -->
      <section class="panel member-panel" aria-labelledby="member-list-title">
        <header class="panel-head">
          <h2 id="member-list-title" class="sf-panel-title">
            멤버 <span class="count sf-num">{{ filteredUsers.length }}</span>
          </h2>
        </header>
        <v-text-field
          v-model="searchQuery"
          placeholder="이름이나 이메일로 찾기"
          prepend-inner-icon="mdi-magnify"
          variant="outlined"
          density="compact"
          hide-details
          clearable
          class="member-search"
        />

        <ul class="member-list">
          <li
            v-for="user in filteredUsers"
            :key="user.email"
            class="member-row"
            :class="{ 'is-selected': selectedUser && selectedUser.email === user.email }"
          >
            <button
              type="button"
              class="member-main"
              :disabled="user.role === 'MANAGER'"
              :aria-label="user.role === 'MANAGER' ? `${user.name} (관리자)` : `${user.name}님과 대화하기`"
              @click="selectUser(user)"
            >
              <span class="member-avatar" aria-hidden="true">
                <img
                  v-if="user.profileImage && (user.profileImage.startsWith('http') || user.profileImage.startsWith('data:'))"
                  :src="user.profileImage"
                  alt=""
                  @error="handleImageError(user)"
                />
                <span v-else>{{ user.initial }}</span>
              </span>
              <span class="member-text">
                <span class="member-name">
                  {{ user.name }}
                  <span v-if="user.role === 'MANAGER'" class="role-tag">관리자</span>
                </span>
                <span class="member-email">{{ user.email }}</span>
              </span>
              <span v-if="user.unReadCount > 0" class="unread-pill sf-num" :aria-label="`안 읽은 메시지 ${user.unReadCount}개`">
                {{ user.unReadCount > 99 ? '99+' : user.unReadCount }}
              </span>
            </button>

            <v-menu v-if="user.role !== 'MANAGER' && currentUserRole === 'MANAGER'" location="bottom end">
              <template #activator="{ props }">
                <v-btn
                  v-bind="props"
                  icon="mdi-dots-vertical"
                  variant="text"
                  size="small"
                  class="member-more"
                  :aria-label="`${user.name} 관리`"
                />
              </template>
              <v-list density="compact" min-width="180">
                <v-list-item prepend-icon="mdi-account-star-outline" title="관리자로 지정" @click="promoteToAdmin(user)" />
                <v-list-item prepend-icon="mdi-account-remove-outline" title="냉장고에서 내보내기" base-color="error" @click="removeUser(user)" />
              </v-list>
            </v-menu>
          </li>
        </ul>
        <p v-if="!filteredUsers.length" class="empty-hint">
          {{ searchQuery ? '찾는 멤버가 없어요.' : '아직 다른 멤버가 없어요. 초대 링크를 보내 보세요.' }}
        </p>
      </section>

      <!-- 1:1 대화 -->
      <section ref="chatPanelRef" class="panel chat-panel" aria-label="1:1 대화">
        <header class="chat-head">
          <h2 class="sf-panel-title">{{ selectedUser ? `${selectedUser.name}님과 대화` : '1:1 대화' }}</h2>
        </header>

        <div v-if="!selectedUser" class="chat-empty">
          <v-icon size="40" color="medium-emphasis" aria-hidden="true">mdi-message-outline</v-icon>
          <p class="sf-empty-title">대화할 멤버를 고르세요</p>
          <p>멤버 목록에서 멤버를 누르면 여기서 바로 메시지를 주고받을 수 있어요.</p>
        </div>

        <div v-else class="chat-body">
          <div ref="chatContainerRef" class="chat-scroll" @scroll="handleScroll">
            <div v-if="isLoadingMoreMessages" class="chat-note">
              <v-progress-circular indeterminate color="primary" size="20" width="2" />
              이전 메시지를 불러오는 중이에요
            </div>
            <div v-if="!hasMoreMessages && chatMessages.length > 0" class="chat-note">대화의 처음이에요</div>
            <div v-if="!chatMessages.length && !isLoadingMoreMessages" class="chat-note">아직 대화가 없어요. 먼저 인사를 건네 보세요.</div>

            <template v-for="(message, index) in chatMessages" :key="index">
              <div v-if="shouldShowDateSeparator(message, chatMessages[index - 1])" class="date-sep">
                <span>{{ formatDate(message.timestamp) }}</span>
              </div>

              <div
                v-if="message.senderEmail === senderEmail || message.senderEmail !== message.receiverEmail"
                class="msg is-mine"
              >
                <div
                  v-if="message.senderEmail !== senderEmail && shouldShowSenderName(chatMessages, index, senderEmail)"
                  class="msg-sender"
                >
                  {{ message.senderName }}
                </div>
                <div class="msg-line">
                  <span v-if="shouldShowSentMessageTime(chatMessages, index, senderEmail)" class="msg-time">
                    {{ formatTime(message.timestamp) }}
                  </span>
                  <div class="msg-content">
                    <div v-if="message.imageUrls && message.imageUrls.length" class="msg-images" :class="`count-${Math.min(message.imageUrls.length, 4)}`">
                      <button
                        v-for="(url, imgIndex) in message.imageUrls"
                        :key="imgIndex"
                        type="button"
                        class="msg-image"
                        aria-label="사진 크게 보기"
                        @click="openImageModal(message.imageUrls, imgIndex)"
                      >
                        <img :src="url" alt="" />
                      </button>
                    </div>
                    <p v-if="message.message && message.message.trim()" class="bubble">{{ message.message }}</p>
                  </div>
                </div>
              </div>

              <div v-else class="msg is-theirs">
                <div v-if="shouldShowSenderName(chatMessages, index, senderEmail)" class="msg-sender">
                  {{ message.senderName }}
                </div>
                <div class="msg-line">
                  <div class="msg-content">
                    <div v-if="message.imageUrls && message.imageUrls.length" class="msg-images" :class="`count-${Math.min(message.imageUrls.length, 4)}`">
                      <button
                        v-for="(url, imgIndex) in message.imageUrls"
                        :key="imgIndex"
                        type="button"
                        class="msg-image"
                        aria-label="사진 크게 보기"
                        @click="openImageModal(message.imageUrls, imgIndex)"
                      >
                        <img :src="url" alt="" />
                      </button>
                    </div>
                    <p v-if="message.message && message.message.trim()" class="bubble">{{ message.message }}</p>
                  </div>
                  <span v-if="shouldShowMessageTime(chatMessages, index, senderEmail)" class="msg-time">
                    {{ formatTime(message.timestamp) }}
                  </span>
                </div>
              </div>
            </template>
          </div>

          <v-fade-transition>
            <v-btn
              v-if="showNewMessageIndicator"
              class="new-msg-btn"
              color="primary"
              variant="flat"
              size="small"
              rounded="pill"
              prepend-icon="mdi-arrow-down"
              @click="scrollToBottom"
            >
              새 메시지
            </v-btn>
          </v-fade-transition>
        </div>

        <footer class="composer">
          <div v-if="imagePreview.length > 0" class="preview-row">
            <div v-for="(image, index) in imagePreview" :key="index" class="preview-item">
              <img :src="image.preview" alt="보낼 사진" />
              <button type="button" class="preview-remove" aria-label="사진 빼기" @click="removeImage(index)">
                <v-icon size="14">mdi-close</v-icon>
              </button>
            </div>
          </div>
          <div class="composer-row">
            <v-btn
              icon="mdi-image-plus-outline"
              variant="text"
              :disabled="!selectedUser"
              aria-label="사진 첨부"
              @click="fileInput.click()"
            />
            <v-text-field
              v-model="newMessage"
              :placeholder="selectedUser ? '메시지 입력' : '먼저 대화할 멤버를 고르세요'"
              :disabled="!selectedUser"
              variant="outlined"
              density="compact"
              hide-details
              rounded="xl"
              class="composer-input"
              @keyup.enter="sendMessage"
            />
            <v-btn
              icon="mdi-send"
              color="primary"
              variant="flat"
              :disabled="!selectedUser"
              aria-label="보내기"
              @click="sendMessage"
            />
          </div>
          <input ref="fileInput" type="file" multiple accept="image/*" class="d-none" @change="onFileChange" />
        </footer>
      </section>
    </div>

    <ImageModal v-model="showImageModal" :images="modalImages" :start-index="modalStartIndex" />
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/components/layout/PageLayout.vue';
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from "vue";
import SockJS from "sockjs-client";
import Stomp from "webstomp-client";
import axios from "axios";
import {
  getErrorMessage,
  getResultData,
  getFridgeId,
} from "@/utils/commonDataHandler";
import { useStore } from "vuex";
import router from "@/router";
import ImageModal from "@/components/chat/ImageModal.vue";

// --- 상태 변수 ---
const store = useStore();
const searchQuery = ref("");
const selectedUser = ref(null);
const newMessage = ref("");
const chatMessages = ref([]);
const fridgeId = computed(() => getFridgeId(store));
const chatContainerRef = ref(null);

// WebSocket 관련 상태
const stompClient = ref(null);
const subscription = ref(null); // 구독 객체 저장
const token = ref(localStorage.getItem("accessToken"));
const senderEmail = ref(localStorage.getItem("email"));
const senderName = ref(localStorage.getItem("name"));

// 전역 SSE 이벤트 리스너를 위한 참조
let adminChatListener = null;

// 초기화 상태 플래그 (fetchUsers 완료 전까지 SSE 이벤트 무시)
const isInitialized = ref(false);

// 유저 관리 페이지에서 SSE 이벤트 처리 중인지 확인하는 플래그
const isProcessingSSEEvent = ref(false);

// 마지막 배지 상태 (중복 업데이트 방지)
let lastBadgeState = null;

// 이미지 관련 상태
const newImages = ref([]);
const imagePreview = ref([]);
const fileInput = ref(null);
const currentUserRole = ref("MANAGER");

// 새로운 메시지 표시기 상태
const showNewMessageIndicator = ref(false);

// 페이징 관련 상태
const isLoadingMoreMessages = ref(false);
const hasMoreMessages = ref(true);
const currentPage = ref(0);
const pageSize = ref(20);
const isInitialLoad = ref(true);

// 이미지 모달 관련 상태
const showImageModal = ref(false);
const modalImages = ref([]);
const modalStartIndex = ref(0);

// --- 데이터 ---
const users = ref([]);

// --- API 함수 ---
const fetchUsers = async () => {
  try {
    
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId.value}/members`,
      { headers: { Authorization: `Bearer ${token.value}` } }
    );
    
    const userData = getResultData(response);
    
    users.value = userData.map((user) => {
      const userName = user.memberName || user.nickname || "이름 없음";
      
      // 유효한 이미지 주소가 없으면 null → 템플릿에서 이름 첫 글자로 표시
      const rawImage = (user.memberProfileImage || '').trim();
      const profileImage = rawImage.startsWith('http') || rawImage.startsWith('data:') ? rawImage : null;
      
      return {
        name: userName,
        email: user.memberEmail,
        role: user.type,
        initial: userName.charAt(0),
        roomId: user.roomId,
        unReadCount: user.unReadCount || 0,
        profileImage: profileImage,
      };
    });
    
    // 사용자 목록 로드 후 배지 상태 업데이트
    updateAdminChatBadge();
    
    // 초기화 완료 플래그 설정 (이제부터 SSE 이벤트 처리 가능)
    isInitialized.value = true;
  } catch (error) {
    console.error("사용자 목록 조회 실패:", getErrorMessage(error));
    // 에러가 발생해도 초기화 완료로 처리 (무한 대기 방지)
    isInitialized.value = true;
  }
};

// --- 계산된 속성 ---
const filteredUsers = computed(() => {
  // 1. 검색 기능 먼저 적용
  const filtered = searchQuery.value
    ? users.value.filter(
        (user) =>
          user.name.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          user.email.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    : users.value; // 2. 정렬 기능 추가 // MANAGER 역할을 가진 사용자를 먼저 정렬

  return filtered.sort((a, b) => {
    if (a.role === "MANAGER" && b.role !== "MANAGER") {
      return -1; // a를 b보다 앞으로
    } else if (a.role !== "MANAGER" && b.role === "MANAGER") {
      return 1; // b를 a보다 앞으로
    } else {
      return 0; // 순서 변경 없음
    }
  });
});

// --- Lifecycle Hooks ---
onMounted(async () => {
  
  // 유저관리 페이지 진입 시 MANAGER_CHAT 알림 제거하지 않음 (실제 unReadCount 기반으로 배지 관리)
  
  // sessionStorage에서 배지 상태 복원 (페이지 이동 시에도 유지)
  await store.dispatch('notification/restoreBadgeStateFromStorage');
  
  // 사용자 목록 로드 (fetchUsers 내부에서 배지 상태 업데이트됨)
  await fetchUsers();
  
  // fetchUsers 완료 후 SSE 이벤트 리스너 등록 (배지 깜빡임 방지)
  setupAdminChatListener();
  
  window.addEventListener('beforeunload', handleBeforeUnload);
});

// --- Watcher ---
watch(selectedUser, async (newUser, oldUser) => {
  if (oldUser) {
    unsubscribe(oldUser);
  }
  if (newUser) {
    // 채팅 상태 초기화
    chatMessages.value = [];
    newMessage.value = "";
    imagePreview.value = [];
    newImages.value = [];
    showNewMessageIndicator.value = false;
    closeImageModal();
    
    // 페이징 상태 초기화
    isLoadingMoreMessages.value = false;
    hasMoreMessages.value = true;
    currentPage.value = 0;
    isInitialLoad.value = true;
    
    await loadChatHistory(newUser, false);
    connectWebSocket(newUser.roomId);
  } else {
    chatMessages.value = [];
    showNewMessageIndicator.value = false;
    closeImageModal();
  }
});


// 채팅 내역 로딩 함수 (페이징 지원)
const loadChatHistory = async (user, isLoadMore = false) => {
  if (isLoadMore) {
    isLoadingMoreMessages.value = true;
  } else {
    isInitialLoad.value = true;
    currentPage.value = 0;
    hasMoreMessages.value = true;
  }

  try {
    const url = `${import.meta.env.VITE_API_BASE_URL}/manager/chat/history/room/${user.roomId}?page=${currentPage.value}&size=${pageSize.value}`;
    const response = await axios.get(url, {
      headers: { Authorization: `Bearer ${token.value}` },
    });
    
    // Page<ChatMessageDto> 구조에서 content 필드 추출
    const pageData = getResultData(response);
    const chatData = pageData?.content || [];
    
    // 배열이 아닌 경우 빈 배열로 처리
    const safeNewMessages = Array.isArray(chatData) ? chatData : [];
    
    if (isLoadMore) {
      // 더 많은 메시지를 로드할 때는 기존 메시지 앞에 추가 (DESC로 받은 데이터를 역순으로 정렬)
      const newMessages = safeNewMessages.map((msg) => ({
        senderEmail: msg.senderEmail,
        senderName: msg.senderName,
        message: msg.message,
        timestamp: msg.timestamp,
        imageUrls: msg.imageUrls || [],
        receiverEmail: msg.receiverEmail,
      }));
      // DESC로 받은 데이터를 ASC로 정렬 (오래된 것부터 최신 순)
      const reversedMessages = newMessages.reverse();
      chatMessages.value = [...reversedMessages, ...chatMessages.value];
    } else {
      // 초기 로드일 때는 메시지 교체 (백엔드에서 DESC로 정렬해서 보내주므로 역순으로 정렬)
      const messages = safeNewMessages.map((msg) => ({
        senderEmail: msg.senderEmail,
        senderName: msg.senderName,
        message: msg.message,
        timestamp: msg.timestamp,
        imageUrls: msg.imageUrls || [],
        receiverEmail: msg.receiverEmail,
      }));
      // DESC로 받은 데이터를 ASC로 정렬 (오래된 것부터 최신 순)
      chatMessages.value = messages.reverse();
      
      // 읽음 처리
      try {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/manager/chat/${user.roomId}/read`);
      } catch (readError) {
        console.warn('읽음 처리 실패:', readError);
      }
      
      // 선택된 사용자의 안읽은 메시지 개수 초기화
      const userIndex = users.value.findIndex(u => u.email === user.email);
      if (userIndex !== -1) {
        users.value[userIndex].unReadCount = 0;
        
        // SSE 이벤트 처리 중이 아닐 때만 배지 업데이트 (중복 방지)
        if (!isProcessingSSEEvent.value) {
          updateAdminChatBadge();
        }
      }
    }

    // 더 이상 로드할 메시지가 없는지 확인
    hasMoreMessages.value = !pageData?.last;
    
    if (isLoadMore) {
      currentPage.value++;
    } else {
      currentPage.value = 1; // 초기 로드 후 다음 페이지는 1부터
      scrollToBottom();
    }
  } catch (error) {
    console.error("채팅 내역 로딩 실패:", getErrorMessage(error));
    
    // 에러 발생 시 빈 배열로 설정 (초기 로드인 경우만)
    if (!isLoadMore) {
      chatMessages.value = [];
    }
  } finally {
    isLoadingMoreMessages.value = false;
    isInitialLoad.value = false;
  }
};

// 더 많은 메시지 로드 함수
const loadMoreMessages = async () => {
  if (!selectedUser.value || isLoadingMoreMessages.value || !hasMoreMessages.value) {
    return;
  }
  
  await loadChatHistory(selectedUser.value, true);
};

// 이미지 로딩 오류 처리
const handleImageError = (user) => {
  // 이미지를 못 불러오면 이름 첫 글자로 표시
  user.profileImage = null;
};

// 날짜와 시간 포맷팅 함수들
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const isToday = date.toDateString() === today.toDateString();
  const isYesterday = date.toDateString() === yesterday.toDateString();
  
  if (isToday) {
    return '오늘';
  } else if (isYesterday) {
    return '어제';
  } else {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

const formatTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// 메시지 시간 그룹핑을 위한 함수들
const getMessageMinute = (timestamp) => {
  const date = new Date(timestamp);
  return `${date.getHours()}:${date.getMinutes()}`;
};


const shouldShowSenderName = (messages, currentIndex, currentUserEmail) => {
  const currentMsg = messages[currentIndex];
  
  // 현재 사용자가 보낸 메시지는 이름 표시 안함
  if (currentMsg.senderEmail === currentUserEmail) return false;
  
  // 첫 번째 메시지는 항상 이름 표시
  if (currentIndex === 0) return true;
  
  const prevMsg = messages[currentIndex - 1];
  
  // 이전 메시지 발신자가 다르면 이름 표시
  if (currentMsg.senderEmail !== prevMsg.senderEmail) return true;
  
  // 같은 발신자인 경우 시간이 다르면 이름 표시
  return getMessageMinute(currentMsg.timestamp) !== getMessageMinute(prevMsg.timestamp);
};

const shouldShowMessageTime = (messages, currentIndex, currentUserEmail) => {
  const currentMsg = messages[currentIndex];
  
  // 현재 사용자가 보낸 메시지는 시간 표시 안함 (아래쪽에 별도로 표시)
  if (currentMsg.senderEmail === currentUserEmail || currentMsg.senderEmail !== currentMsg.receiverEmail) return false;
  
  // 마지막 메시지는 항상 시간 표시
  if (currentIndex === messages.length - 1) return true;
  
  const nextMsg = messages[currentIndex + 1];
  
  // 다음 메시지 발신자가 다르면 시간 표시
  if (currentMsg.senderEmail !== nextMsg.senderEmail) return true;
  
  // 같은 발신자인 경우 시간이 다르면 시간 표시
  return getMessageMinute(currentMsg.timestamp) !== getMessageMinute(nextMsg.timestamp);
};

const shouldShowSentMessageTime = (messages, currentIndex, currentUserEmail) => {
  const currentMsg = messages[currentIndex];
  
  // 현재 사용자가 보낸 메시지가 아니면 시간 표시 안함
  if (!(currentMsg.senderEmail === currentUserEmail || currentMsg.senderEmail !== currentMsg.receiverEmail)) return false;
  
  // 마지막 메시지는 항상 시간 표시
  if (currentIndex === messages.length - 1) return true;
  
  const nextMsg = messages[currentIndex + 1];
  
  // 다음 메시지 발신자가 다르면 시간 표시
  if (currentMsg.senderEmail !== nextMsg.senderEmail) return true;
  
  // 같은 발신자인 경우 시간이 다르면 시간 표시
  return getMessageMinute(currentMsg.timestamp) !== getMessageMinute(nextMsg.timestamp);
};

const shouldShowDateSeparator = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;
  
  const currentDate = new Date(currentMessage.timestamp).toDateString();
  const previousDate = new Date(previousMessage.timestamp).toDateString();
  
  return currentDate !== previousDate;
};

const chatPanelRef = ref(null);

const selectUser = (user) => {
  if (user.role !== "MANAGER") {
    selectedUser.value = user;
    // 좁은 화면에서는 대화창이 목록 아래에 있으니 고른 뒤 대화창으로 내려 준다
    // 아래 @media (max-width: 960px)에서 한 단으로 바뀌는 기준과 맞춘다
    if (window.matchMedia("(max-width: 960px)").matches) {
      nextTick(() => chatPanelRef.value?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  }
};

// --- WebSocket 함수 ---
const connectWebSocket = (roomId) => {
  if (stompClient.value?.connected) return;
  try {
    const sockJs = new SockJS(
      `${import.meta.env.VITE_API_BASE_URL}/connect/chat`
    );
    stompClient.value = Stomp.over(sockJs);
    stompClient.value.connect(
      { Authorization: `Bearer ${token.value}` },
      () => {
        // 구독 객체를 저장
        subscription.value = stompClient.value.subscribe(
          `/topic/chat/MANAGER/${roomId}`,
          (message) => {
            const receivedMessage = JSON.parse(message.body);
            if (Array.isArray(chatMessages.value)) {
              chatMessages.value.push({
                senderEmail: receivedMessage.senderEmail,
                senderName: receivedMessage.senderName,
                message: receivedMessage.message,
                timestamp: receivedMessage.timestamp,
                imageUrls: receivedMessage.imageUrls || [],
                receiverEmail: receivedMessage.receiverEmail || selectedUser.value?.email,
              });
              
              // 내가 보낸 메시지라면 무조건 스크롤을 아래로 이동
              if (receivedMessage.senderEmail === senderEmail.value) {
                scrollToBottom();
                return;
              }
              
              // 다른 사람이 보낸 메시지의 경우, 사용자가 하단에 거의 스크롤되었는지 확인
              const el = chatContainerRef.value;
              const isAtBottom = el ? el.scrollHeight - el.clientHeight <= el.scrollTop + 20 : true;

              if (isAtBottom) {
                scrollToBottom();
              } else {
                showNewMessageIndicator.value = true;
              }
            }
          },
          { Authorization: `Bearer ${token.value}` }
        );
      }
    );
  } catch (error) {
    console.error("WebSocket 연결 실패:", error);
  }
};

// 구독 해제 로직
const unsubscribe = (user) => {
  if (!user) {
    console.warn('unsubscribe: user가 없습니다.');
    return;
  }

  
  try {
    // 1. 먼저 구독 해제
    if (subscription.value) {
      const id = { roomId: user.roomId, roomType: 'manager' };
      subscription.value.unsubscribe(id);
      subscription.value = null;
    }
    
    // 2. 그 다음 연결 해제
    if (stompClient.value?.connected) {
      stompClient.value.disconnect(() => {
      });
      stompClient.value = null;
    }
  } catch (error) {
    console.error('구독 해제 중 오류 발생:', error);
    // 오류 발생 시에도 상태 정리
    subscription.value = null;
    stompClient.value = null;
  }
};

const disconnectWebSocket = () => {
  if (selectedUser.value) {
    unsubscribe(selectedUser.value);
  } else if (stompClient.value?.connected) {
    stompClient.value.disconnect();
    stompClient.value = null;
    subscription.value = null;
  }
};

// --- 메시지 및 이미지 처리 ---
const uploadImages = async (files) => {
  if (!selectedUser.value) return [];
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("images", file));
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/manager/chat/room/${selectedUser.value.roomId}/images`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token.value}`,
        },
      }
    );
    return getResultData(response);
  } catch (error) {
    console.error("이미지 업로드 실패:", getErrorMessage(error));
    return [];
  }
};

const sendMessage = async () => {
  if (
    !selectedUser.value ||
    (newMessage.value.trim() === "" && newImages.value.length === 0)
  )
    return;

  const currentMessage = newMessage.value;
  const currentImages = [...newImages.value];
  newMessage.value = "";
  newImages.value = [];
  imagePreview.value = [];

  try {
    const imageUrls =
      currentImages.length > 0 ? await uploadImages(currentImages) : [];

    if (stompClient.value?.connected) {
      const message = {
        senderEmail: senderEmail.value,
        senderName: senderName.value,
        message: currentMessage,
        imageUrls: imageUrls,
        timestamp: new Date().toISOString(),
      };
      stompClient.value.send(
        `/publish/chat/MANAGER/${selectedUser.value.roomId}`,
        JSON.stringify(message)
      );
    }

    scrollToBottom();
  } catch (error) {
    console.error("메시지 전송 실패:", error);
    newMessage.value = currentMessage;
    newImages.value = currentImages;
    imagePreview.value = currentImages.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
  }
};

const handleScroll = async () => {
  const el = chatContainerRef.value;
  if (!el) return;
  
  // 사용자가 수동으로 맨 아래로 스크롤하면 새 메시지 표시기를 숨깁니다.
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 1) {
    showNewMessageIndicator.value = false;
  }
  
  // 위로 스크롤하여 과거 메시지 로드
  if (el.scrollTop < 200 && hasMoreMessages.value && !isLoadingMoreMessages.value && !isInitialLoad.value) {
    const previousScrollHeight = el.scrollHeight;
    await loadMoreMessages();
    
    // 스크롤 위치 유지 (새로 로드된 메시지로 인한 높이 변화 보정)
    nextTick(() => {
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = newScrollHeight - previousScrollHeight;
    });
  }
};

const scrollToBottom = () => {
  showNewMessageIndicator.value = false;
  nextTick(() => {
    if (chatContainerRef.value) {
      chatContainerRef.value.scrollTop = chatContainerRef.value.scrollHeight;
    }
  });
};

const onFileChange = (event) => {
  const files = Array.from(event.target.files);
  if (newImages.value.length + files.length > 10) {
    alert("이미지는 최대 10장까지만 선택할 수 있습니다.");
    return;
  }
  newImages.value.push(...files);
  imagePreview.value.push(
    ...files.map((file) => ({ file, preview: URL.createObjectURL(file) }))
  );
  event.target.value = "";
};

const removeImage = (index) => {
  URL.revokeObjectURL(imagePreview.value[index].preview);
  imagePreview.value.splice(index, 1);
  newImages.value.splice(index, 1);
};

// 이미지 모달 관련 함수들
const openImageModal = (imageUrls, startIndex = 0) => {
  modalImages.value = imageUrls;
  modalStartIndex.value = startIndex;
  showImageModal.value = true;
};

const closeImageModal = () => {
  showImageModal.value = false;
  modalImages.value = [];
  modalStartIndex.value = 0;
};

// --- 관리자 기능 ---
const promoteToAdmin = async (user) => {
  if (confirm(`${user.name}님을 관리자로 승격하시겠습니까?`)) {
    try {
      await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId.value}/delegateManager?memberEmail=${user.email}`);
      alert(`${user.name}님을 관리자로 승격하였습니다.`);
      router.push('/fridge/list');
    } catch (error) {
      console.error("관리자 승격 실패:", getErrorMessage(error));
      alert("관리자 승격에 실패했습니다.");
    }
  }
};

const removeUser = async (user) => {
  if (confirm(`${user.name}님을 냉장고에서 제거하시겠습니까?`)) {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId.value}/members/${user.email}`,
      );
      users.value = users.value.filter((u) => u.email !== user.email);
      if (selectedUser.value && selectedUser.value.email === user.email) {
        selectedUser.value = null;
      }
    } catch (error) {
      console.error("사용자 제거 실패:", getErrorMessage(error));
      alert("사용자 제거에 실패했습니다.");
    }
  }
};

// beforeunload 이벤트 핸들러
const handleBeforeUnload = () => {
  // 현재 선택된 사용자가 있으면 WebSocket 연결 해제
  if (selectedUser.value) {
    unsubscribe(selectedUser.value);
  }
};

// --- 전역 SSE 이벤트 리스너 관리 ---
const setupAdminChatListener = () => {
  // 전역 SSE 이벤트 리스너 등록
  adminChatListener = (event) => {
    const notification = event.detail;
    handleAdminChatNotification(notification);
  };
  
  // 커스텀 이벤트 리스너 등록
  window.addEventListener('admin-chat-notification', adminChatListener);
};

const removeAdminChatListener = () => {
  if (adminChatListener) {
    window.removeEventListener('admin-chat-notification', adminChatListener);
    adminChatListener = null;
  }
};

// 배지 업데이트 함수 (사용자 목록의 unReadCount 기반으로 즉시 동기화)
const updateAdminChatBadge = () => {
  // 모든 사용자의 unReadCount 확인 (즉시 동기화)
  const hasUnreadMessages = users.value.some(user => (user.unReadCount || 0) > 0);
  const newBadgeState = hasUnreadMessages ? 1 : 0;
  
  // 상태가 변경되지 않았으면 업데이트하지 않음 (중복 방지)
  if (lastBadgeState === newBadgeState) {
    console.log('🔔 배지 상태 변경 없음, 업데이트 건너뛰기:', {
      currentState: newBadgeState,
      hasUnreadMessages
    });
    return;
  }
  
  // 마지막 상태 업데이트
  lastBadgeState = newBadgeState;
  
  // 유저 관리 페이지에서 설정한 배지 상태 추적
  store.commit('notification/setUserManagementBadgeState', { 
    hasUnreadMessages,
    isSetByUserManagement: true 
  });
  
  // 배지 상태 즉시 업데이트 (지연 없음)
  store.commit('notification/setAdminChatCount', newBadgeState);
  
  console.log('🔔 유저 관리 배지 즉시 업데이트:', {
    hasUnreadMessages,
    newBadgeState,
    selectedUser: selectedUser.value?.email,
    usersUnReadCounts: users.value.map(user => ({ 
      name: user.name, 
      unReadCount: user.unReadCount 
    }))
  });
};

// MANAGER_CHAT 알림 처리
const handleAdminChatNotification = async (notification) => {
  
  if (notification.type === 'MANAGER_CHAT') {
    // 중복 처리 방지
    if (isProcessingSSEEvent.value) {
      console.log('📨 SSE MANAGER_CHAT 이벤트 중복 처리 방지');
      return;
    }
    
    // 초기화가 완료되지 않았으면 SSE 이벤트 무시 (배지 깜빡임 방지)
    if (!isInitialized.value) {
      console.log('📨 SSE MANAGER_CHAT 이벤트 무시 (초기화 미완료):', {
        roomId: notification.roomId || notification.chatRoomId,
        isInitialized: isInitialized.value
      });
      return;
    }
    
    // SSE 이벤트 처리 시작
    isProcessingSSEEvent.value = true;
    
    try {
      const roomId = notification.roomId || notification.chatRoomId;
    
      let userIndex = -1;
      
      if (roomId) {
        userIndex = users.value.findIndex(u => u.roomId === roomId);
      }
      
      if (userIndex !== -1) {
        // 현재 선택된 사용자의 메시지가 아닌 경우에만 unReadCount 증가
        if (selectedUser.value?.roomId !== roomId) {
          users.value[userIndex].unReadCount = (users.value[userIndex].unReadCount || 0) + 1;
          
          // 실시간 배지 동기화 (사용자 목록의 unReadCount 기반)
          updateAdminChatBadge();
        } else {
          console.log('📨 현재 선택된 사용자의 메시지이므로 unReadCount 증가하지 않음:', {
            selectedUser: selectedUser.value?.email,
            roomId
          });
        }
      } else {
        // 사용자를 찾을 수 없는 경우 사용자 목록을 새로 고침하여 최신 unReadCount 가져오기
        try {
          await fetchUsers();
          // fetchUsers 내부에서 updateAdminChatBadge가 호출됨
        } catch (error) {
          console.error('사용자 목록 새로고침 실패:', error);
        }
      }
    } finally {
      // SSE 이벤트 처리 완료
      isProcessingSSEEvent.value = false;
    }
  }
};

// --- 생명주기 훅 ---
onUnmounted(() => {
  disconnectWebSocket();
  removeAdminChatListener();
  window.removeEventListener('beforeunload', handleBeforeUnload);
  
  // 페이지를 떠날 때 현재 배지 상태를 유지 (실제 unReadCount 기반)
  updateAdminChatBadge();
  
  // 페이지를 떠날 때 배지 상태를 sessionStorage에 저장하여 로그아웃 후에도 유지
  const currentBadgeState = store.getters['notification/typeCounts']?.MANAGER_CHAT || 0;
  const userManagementState = store.getters['notification/userManagementBadgeState'];
  
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('managerChatBadgeState', JSON.stringify({
      count: currentBadgeState,
      timestamp: Date.now()
    }));
    
    sessionStorage.setItem('userManagementBadgeState', JSON.stringify({
      hasUnreadMessages: userManagementState?.hasUnreadMessages || false,
      isSetByUserManagement: userManagementState?.isSetByUserManagement || false,
      timestamp: Date.now()
    }));
    
    console.log('💾 유저 관리 페이지 종료 시 배지 상태 저장:', {
      managerChatBadge: currentBadgeState,
      userManagementState
    });
  }
});
</script>

<style scoped>
.members-grid {
  display: grid;
  grid-template-columns: minmax(300px, 380px) minmax(0, 1fr);
  gap: var(--sf-section-gap);
  align-items: stretch;
}

.panel {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
}

.count {
  margin-left: 4px;
  color: var(--sf-text-faint);
}

/* 멤버 목록 */
.member-panel {
  padding: 20px 0 8px;
  max-height: calc(100vh - 180px);
}

.member-panel .panel-head,
.member-search {
  flex: 0 0 auto;
  margin: 0 20px 12px;
}

.member-list {
  flex: 1;
  margin: 0;
  padding: 0;
  overflow-y: auto;
  list-style: none;
}

.member-row {
  position: relative;
  display: flex;
  align-items: center;
}

.member-row.is-selected {
  background: var(--sf-mint-soft);
}

.member-row.is-selected::before {
  content: '';
  position: absolute;
  top: 8px;
  bottom: 8px;
  left: 0;
  width: 3px;
  border-radius: 0 3px 3px 0;
  background: var(--sf-primary);
}

.member-main {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
  padding: 10px 8px 10px 20px;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.member-main:disabled {
  cursor: default;
}

.member-row:not(.is-selected) .member-main:not(:disabled):hover {
  background: #FAFBFC;
}

.member-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--sf-mint-soft);
  font-size: 16px;
  font-weight: 700;
  color: var(--sf-primary);
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.member-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text);
}

.role-tag {
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--sf-bg);
  font-size: 12px;
  font-weight: 600;
  color: var(--sf-text-sub);
}

.member-email {
  font-size: 13px;
  color: var(--sf-text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.unread-pill {
  min-width: 20px;
  padding: 1px 6px;
  border-radius: 999px;
  background: var(--sf-expired);
  font-size: 12px;
  font-weight: 700;
  text-align: center;
  color: #fff;
}

.member-more {
  margin-right: 8px;
  color: var(--sf-text-faint);
}

.empty-hint {
  margin: 8px 20px 16px;
  font-size: 14px;
  color: var(--sf-text-sub);
}

/* 대화 */
.chat-panel {
  height: calc(100vh - 180px);
  min-height: 480px;
  overflow: hidden;
}

.chat-head {
  padding: 18px 20px;
  border-bottom: 1px solid var(--sf-line);
}

.chat-empty {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px;
  text-align: center;
  font-size: 14px;
  color: var(--sf-text-sub);
}

.chat-empty p {
  margin: 0;
}

.sf-empty-title {
  margin-top: 8px !important;
}

.chat-body {
  position: relative;
  flex: 1;
  min-height: 0;
  background: var(--sf-bg);
}

.chat-scroll {
  height: 100%;
  padding: 16px 20px;
  overflow-y: auto;
}

.chat-note {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 0 16px;
  font-size: 13px;
  color: var(--sf-text-faint);
}

.date-sep {
  display: flex;
  justify-content: center;
  margin: 16px 0;
}

.date-sep span {
  padding: 3px 12px;
  border-radius: 999px;
  background: var(--sf-surface);
  font-size: 12px;
  color: var(--sf-text-sub);
}

.msg {
  display: flex;
  flex-direction: column;
  margin-bottom: 6px;
}

.msg.is-mine {
  align-items: flex-end;
}

.msg.is-theirs {
  align-items: flex-start;
}

.msg-sender {
  margin: 8px 4px 4px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sf-text-sub);
}

.msg-line {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  max-width: min(72%, 520px);
}

.msg-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.is-mine .msg-content {
  align-items: flex-end;
}

.bubble {
  margin: 0;
  padding: 9px 13px;
  border-radius: 16px;
  font-size: 15px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-word;
}

.is-mine .bubble {
  border-bottom-right-radius: 4px;
  background: var(--sf-primary);
  color: #fff;
}

.is-theirs .bubble {
  border-bottom-left-radius: 4px;
  background: var(--sf-surface);
  color: var(--sf-text);
  box-shadow: 0 0 0 1px var(--sf-line);
}

.msg-time {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--sf-text-faint);
}

.msg-images {
  display: grid;
  gap: 4px;
  width: min(260px, 100%);
}

.msg-images.count-2,
.msg-images.count-3,
.msg-images.count-4 {
  grid-template-columns: 1fr 1fr;
}

.msg-image {
  padding: 0;
  border: none;
  border-radius: 10px;
  overflow: hidden;
  background: var(--sf-line);
  cursor: zoom-in;
}

.msg-image img {
  display: block;
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
}

.new-msg-btn {
  position: absolute;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
}

.composer {
  padding: 12px 16px;
  border-top: 1px solid var(--sf-line);
  background: var(--sf-surface);
}

.composer-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.composer-input {
  flex: 1;
}

.preview-row {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  overflow-x: auto;
}

.preview-item {
  position: relative;
  flex-shrink: 0;
}

.preview-item img {
  display: block;
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
}

.preview-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 2px solid var(--sf-surface);
  border-radius: 50%;
  background: var(--sf-text);
  color: #fff;
  cursor: pointer;
}

@media (max-width: 960px) {
  .members-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .member-panel {
    max-height: 360px;
  }

  .chat-panel {
    height: 70vh;
    height: 70dvh;
    /* 상단 앱 바에 머리말이 가리지 않게 */
    scroll-margin-top: calc(var(--v-layout-top, 0px) + 12px);
  }
}

@media (max-width: 600px) {
  .msg-line {
    max-width: 85%;
  }
}
</style>

