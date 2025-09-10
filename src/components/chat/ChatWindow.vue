<template>
  <v-card class="d-flex flex-column chat-window-full" rounded="xl">
    <div v-if="!selectedRoom" class="d-flex justify-center align-center flex-grow-1 text-center text-grey">
      <div>
        <p class="text-h6">채팅을 선택해주세요.</p>
        <p>왼쪽 목록에서 채팅방을 선택하면 대화를 시작할 수 있습니다.</p>
      </div>
    </div>

    <template v-else>
      <v-toolbar density="compact">
        <v-toolbar-title class="font-weight-bold">{{ selectedRoom.roomName }}</v-toolbar-title>
        <v-spacer></v-spacer>
        
        <v-btn
          v-if="selectedRoomType === 'purchase' && isRoomCreator && isRoomOpen"
          color="success"
          variant="elevated"
          class="order-complete-btn mr-2"
          @click="completeOrder"
          :loading="isCompletingOrder"
        >
          <v-icon left>mdi-check-circle</v-icon>
          구매 완료
        </v-btn>
        
        <ParticipantsModal
          v-model="showParticipantsModal"
          v-if="selectedRoomType !== 'manager'"
          :room-id="selectedRoom?.roomId"
          :room-type="selectedRoomType"
          :room-name="selectedRoom?.roomName"
          @participants-count-updated="updateParticipantCount"
        >
          <template v-slot:activator="{ props: menuProps }">
            <v-btn 
              v-bind="menuProps"
              icon="mdi-account-group" 
              variant="text" 
              :title="`참여자 목록 (${participantCount}명)`"
            >
            </v-btn>
          </template>
        </ParticipantsModal>
      </v-toolbar>
      <v-divider />

      <div class="chat-container">
        <v-card-text ref="chatBox" class="flex-grow-1 pa-0 chat-box">
          <div v-if="isLoadingMessages" class="loading-container">
            <div class="loading-content">
              <v-progress-circular
                indeterminate
                color="primary"
                size="48"
                width="4"
                class="loading-spinner"
              ></v-progress-circular>
              <p class="loading-text">채팅 내역을 불러오는 중...</p>
            </div>
          </div>
          
          <div v-if="isLoadingMoreMessages" class="load-more-container">
            <div class="load-more-content">
              <v-progress-circular
                indeterminate
                color="primary"
                size="32"
                width="3"
                class="load-more-spinner"
              ></v-progress-circular>
              <p class="load-more-text">과거 메시지를 불러오는 중...</p>
            </div>
          </div>
          
          <div v-else-if="groupedMessages.length === 0" class="empty-chat-container">
            <div class="empty-chat-content">
              <v-icon size="64" color="grey-lighten-1" class="empty-chat-icon">
                mdi-chat-outline
              </v-icon>
              <h3 class="empty-chat-title">채팅을 시작해보세요!</h3>
              <p class="empty-chat-description">
                첫 번째 메시지를 작성하여 대화를 시작할 수 있습니다.
              </p>
            </div>
          </div>
          
          <div v-if="!hasMoreMessages && groupedMessages.length > 0" class="no-more-messages">
            <div class="no-more-content">
              <v-icon size="24" color="grey-lighten-1">mdi-check-circle-outline</v-icon>
              <span class="no-more-text">모든 메시지를 불러왔습니다</span>
            </div>
          </div>
          
          <div v-for="(group, groupIndex) in groupedMessages" :key="groupIndex" class="message-group">
            <div class="date-divider">
              <div class="date-line"></div>
              <div class="date-text">{{ formatDate(group.date) }}</div>
              <div class="date-line"></div>
            </div>
            
            <div
              v-for="(msg, msgIndex) in group.messages"
              :key="`${msg.senderEmail}-${msg.timestamp}-${msgIndex}`"
              :class="['message-wrapper', msg.senderEmail === senderEmail ? 'sent' : 'received']"
            >
              <!-- 보낸 메시지 레이아웃: [메시지] [시간] -->
              <div v-if="msg.senderEmail === senderEmail" class="sent-message-layout">
                <div class="sent-message-container">
                  <div class="message-content-container">
                    <!-- 이미지 -->
                    <div v-if="msg.imageUrls && msg.imageUrls.length > 0" :class="['image-container', `image-count-${msg.imageUrls.length}`]">
                      <div 
                        v-for="(url, imgIndex) in msg.imageUrls" 
                        :key="imgIndex" 
                        class="image-wrapper"
                      >
                        <img 
                          :src="url" 
                          alt="이미지" 
                          class="chat-image clickable" 
                          @click="openImageModal(msg.imageUrls, imgIndex)"
                        />
                      </div>
                    </div>
                    <!-- 메시지 버블 (텍스트가 있을 때만 표시) -->
                    <div v-if="msg.message && msg.message.trim()" class="message-bubble">
                      <div class="message-text">{{ msg.message }}</div>
                    </div>
                  </div>
                  
                  <!-- 시간은 마지막 메시지이거나 다음 메시지와 시간이 다를 때만 표시 -->
                  <div v-if="shouldShowSentMessageTime(group.messages, msgIndex, senderEmail)" class="message-time-bottom-sent">
                    {{ formatMessageTime(msg.timestamp) }}
                  </div>
                </div>
              </div>
              
              <!-- 받은 메시지 레이아웃: [이름] [메시지] [시간] -->
              <div v-else class="received-message-layout">
                <div class="received-message-container">
                  <!-- 이름은 첫 번째 메시지이거나 이전 메시지와 발신자가 다를 때만 표시 -->
                  <div v-if="shouldShowSenderName(group.messages, msgIndex, senderEmail)" class="sender-name-top">
                    {{ msg.senderName }}
                  </div>
                  
                  <div class="message-content-container">
                    <!-- 이미지 -->
                    <div v-if="msg.imageUrls && msg.imageUrls.length > 0" :class="['image-container', `image-count-${msg.imageUrls.length}`]">
                      <div 
                        v-for="(url, imgIndex) in msg.imageUrls" 
                        :key="imgIndex" 
                        class="image-wrapper"
                      >
                        <img 
                          :src="url" 
                          alt="이미지" 
                          class="chat-image clickable" 
                          @click="openImageModal(msg.imageUrls, imgIndex)"
                        />
                      </div>
                    </div>
                    <!-- 메시지 버블 (텍스트가 있을 때만 표시) -->
                    <div v-if="msg.message && msg.message.trim()" class="message-bubble">
                      <div class="message-text">{{ msg.message }}</div>
                    </div>
                  </div>
                  
                  <!-- 시간은 마지막 메시지이거나 다음 메시지와 시간이 다를 때만 표시 -->
                  <div v-if="shouldShowMessageTime(group.messages, msgIndex, senderEmail)" class="message-time-bottom">
                    {{ formatMessageTime(msg.timestamp) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-fade-transition>
          <div v-if="showNewMessageIndicator" class="new-message-indicator">
            <v-btn small rounded color="primary" @click="scrollToBottom">
              <v-icon left>mdi-arrow-down</v-icon>
              새로운 메시지
            </v-btn>
          </div>
        </v-fade-transition>
      </div>

      <v-divider />

      <div class="input-area">
        <div v-if="imagePreview.length > 0" class="image-preview-container">
          <div v-for="(image, index) in imagePreview" :key="index" class="image-preview-item">
            <img :src="image.preview" class="preview-image" />
            <v-btn icon x-small color="error" class="remove-image-btn" @click="removeImage(index)">
              <v-icon small>mdi-close</v-icon>
            </v-btn>
          </div>
        </div>
        <v-text-field
          v-model="newMessage"
          placeholder="메시지를 입력하세요..."
          variant="solo"
          hide-details
          rounded
          density="comfortable"
          @keyup.enter="sendMessage"
        >
          <template #append-inner>
            <v-btn icon="mdi-image-plus" variant="text" @click="fileInput.click()" />
            <v-btn icon="mdi-send" variant="text" @click="sendMessage" />
          </template>
        </v-text-field>
        <input ref="fileInput" type="file" multiple accept="image/*" style="display: none" @change="onFileChange" />
      </div>
    </template>

    <ImageModal 
      v-model="showImageModal" 
      :images="modalImages" 
      :start-index="modalStartIndex" 
    />
  </v-card>
</template>

<script setup>
import { ref, watch, nextTick, onMounted, onUnmounted, computed } from 'vue';
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';
import axios from 'axios';
import { getResultData } from '@/utils/commonDataHandler';
import ImageModal from './ImageModal.vue';
import ParticipantsModal from './ParticipantsModal.vue';

const props = defineProps({
  selectedRoom: { type: Object, default: null },
  selectedRoomType: { type: String, default: null }
});

const emit = defineEmits(['order-completed']);

// --- 상태 (State) ---
const messages = ref([]);
const newMessage = ref("");
const stompClient = ref(null);
const subscription = ref(null);
const token = ref(localStorage.getItem("accessToken"));
const senderEmail = ref(localStorage.getItem("email"));
const senderName = ref(localStorage.getItem("name"));
const newImages = ref([]);
const imagePreview = ref([]);
const chatBox = ref(null);
const fileInput = ref(null);
const showNewMessageIndicator = ref(false);
const showImageModal = ref(false);
const modalImages = ref([]);
const modalStartIndex = ref(0);
const showParticipantsModal = ref(false);
const participantCount = ref(0);
const isCompletingOrder = ref(false);
const isLoadingMessages = ref(false);

// 페이징 관련 상태
const isLoadingMoreMessages = ref(false);
const hasMoreMessages = ref(true);
const currentPage = ref(0);
const pageSize = ref(40);
const isInitialLoad = ref(true);

// [개선 1] 디바운싱을 위한 타이머 변수
let debounceTimer;

const isRoomCreator = computed(() => {
  if (!props.selectedRoom || !props.selectedRoomType || props.selectedRoomType !== 'purchase') {
    return false;
  }
  return props.selectedRoom.isCreator || false;
});

const isRoomOpen = computed(() => {
  if (!props.selectedRoom) {
    return true;
  }
  return props.selectedRoom.isOpen !== undefined ? props.selectedRoom.isOpen : true;
});

const parseTimestamp = (timestamp) => {
  if (!timestamp) return new Date();
  if (timestamp instanceof Date) return timestamp;
  if (typeof timestamp === 'string') {
    if (timestamp.includes('시') && timestamp.includes('분')) {
      const match = timestamp.match(/(\d{4})-(\d{2})-(\d{2})\s+(\d{1,2})시\s+(\d{1,2})분/);
      if (match) {
        const [, year, month, day, hour, minute] = match;
        return new Date(year, month - 1, day, hour, minute);
      }
    }
    if (timestamp.includes('T')) {
      const date = new Date(timestamp);
      if (!isNaN(date.getTime())) return date;
    }
    if (timestamp.match(/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(:\d{2})?$/)) {
      const date = new Date(timestamp.replace(' ', 'T'));
      if (!isNaN(date.getTime())) return date;
    }
    const date = new Date(timestamp);
    if (!isNaN(date.getTime())) return date;
  }
  if (typeof timestamp === 'number') {
    return new Date(timestamp);
  }
  console.warn('알 수 없는 timestamp 형식:', timestamp);
  return new Date();
};

const groupedMessages = computed(() => {
  if (!Array.isArray(messages.value)) {
    return [];
  }
  const groups = {};
  messages.value.forEach(msg => {
    const date = parseTimestamp(msg.timestamp);
    const dateKey = date.toDateString();
    if (!groups[dateKey]) {
      groups[dateKey] = {
        date: date,
        messages: []
      };
    }
    groups[dateKey].messages.push(msg);
  });
  return Object.values(groups).sort((a, b) => a.date - b.date);
});

const formatDate = (date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const msgDate = new Date(date);
  if (msgDate.toDateString() === today.toDateString()) {
    return '오늘';
  } else if (msgDate.toDateString() === yesterday.toDateString()) {
    return '어제';
  } else {
    return msgDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
};

const formatMessageTime = (timestamp) => {
  const date = parseTimestamp(timestamp);
  return date.toLocaleTimeString('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// 메시지 시간 그룹핑을 위한 함수들
const getMessageMinute = (timestamp) => {
  const date = parseTimestamp(timestamp);
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
  if (currentMsg.senderEmail === currentUserEmail) return false;
  
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
  if (currentMsg.senderEmail !== currentUserEmail) return false;
  
  // 마지막 메시지는 항상 시간 표시
  if (currentIndex === messages.length - 1) return true;
  
  const nextMsg = messages[currentIndex + 1];
  
  // 다음 메시지 발신자가 다르면 시간 표시
  if (currentMsg.senderEmail !== nextMsg.senderEmail) return true;
  
  // 같은 발신자인 경우 시간이 다르면 시간 표시
  return getMessageMinute(currentMsg.timestamp) !== getMessageMinute(nextMsg.timestamp);
};

watch(
  [() => props.selectedRoom, () => props.selectedRoomType],
  async ([newRoom, newRoomType], [oldRoom, oldRoomType]) => {
    if (oldRoom) {
      unsubscribe(oldRoom, oldRoomType);
    }

    resetChatState();

    if (newRoom && newRoom.roomId) {
      await loadChatHistory(newRoom, newRoomType);
      isInitialLoad.value = false;
      connectWebsocket(newRoom.roomId, newRoomType);
      
      nextTick(() => {
        if (chatBox.value) {
          const element = chatBox.value.$el || chatBox.value; // Vue 컴포넌트인 경우 $el 사용
          // [개선 1] 디바운스 적용된 핸들러로 등록
          if (element && typeof element.removeEventListener === 'function') {
            element.removeEventListener('scroll', debouncedHandleScroll);
            element.addEventListener('scroll', debouncedHandleScroll);
          }
        }
      });
    }
  },
  { deep: true }
);

const resetChatState = () => {
  messages.value = [];
  newMessage.value = "";
  imagePreview.value = [];
  newImages.value = [];
  showNewMessageIndicator.value = false;
  participantCount.value = 0;
  closeImageModal();
  isLoadingMoreMessages.value = false;
  hasMoreMessages.value = true;
  currentPage.value = 0;
  isInitialLoad.value = true;
  subscription.value = null;
};

const loadChatHistory = async (room, roomType, isLoadMore = false) => {
  if (isLoadMore) {
    isLoadingMoreMessages.value = true;
  } else {
    isLoadingMessages.value = true;
    isInitialLoad.value = true;
    currentPage.value = 0;
    hasMoreMessages.value = true;
  }

  try {
    const url = `${process.env.VUE_APP_API_BASE_URL}/${roomType}/chat/history/${room.roomId}?page=${currentPage.value}&size=${pageSize.value}`;
    const response = await axios.get(url);
    const pageData = getResultData(response);
    const chatMessages = pageData?.content || [];
    const safeNewMessages = Array.isArray(chatMessages) ? chatMessages : [];
    
    if (isLoadMore) {
      // 더 많은 메시지를 로드할 때는 기존 메시지 앞에 추가 (DESC로 받은 데이터를 역순으로 정렬)
      const reversedMessages = safeNewMessages.reverse();
      messages.value = [...reversedMessages, ...messages.value];
    } else {
      // 초기 로드일 때는 DESC로 받은 데이터를 ASC로 정렬 (오래된 것부터 최신 순)
      messages.value = safeNewMessages.reverse();
      try {
        await axios.post(`${process.env.VUE_APP_API_BASE_URL}/${roomType}/chat/${room.roomId}/read`);
      } catch (readError) {
        console.warn('읽음 처리 실패:', readError);
      }
    }

    hasMoreMessages.value = !pageData?.last;
    
    if (isLoadMore) {
      currentPage.value++;
    } else {
      currentPage.value = 1;
      scrollToBottom();
    }
  } catch (error) {
    console.error("채팅 내역 로딩 실패:", error);
    if (!isLoadMore) {
      messages.value = [];
    }
  } finally {
    isLoadingMessages.value = false;
    isLoadingMoreMessages.value = false;
    isInitialLoad.value = false;
  }
};

const handleScroll = async () => {
  const el = chatBox.value?.$el || chatBox.value;
  if (!el) return;
  
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 1) {
    showNewMessageIndicator.value = false;
  }
  
  if (el.scrollTop < 200 && hasMoreMessages.value && !isLoadingMoreMessages.value && !isInitialLoad.value) {
    const previousScrollHeight = el.scrollHeight;
    await loadMoreMessages();
    
    nextTick(() => {
      const newScrollHeight = el.scrollHeight;
      el.scrollTop = newScrollHeight - previousScrollHeight;
    });
  }
};

// [개선 1] 디바운스 핸들러 함수
const debouncedHandleScroll = () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    handleScroll();
  }, 200); // 200ms 후에 handleScroll 실행
};

const loadMoreMessages = async () => {
  if (!props.selectedRoom || !props.selectedRoomType || isLoadingMoreMessages.value || !hasMoreMessages.value) {
    return;
  }
  await loadChatHistory(props.selectedRoom, props.selectedRoomType, true);
};

const scrollToBottom = () => {
  showNewMessageIndicator.value = false;
  nextTick(() => {
    if (chatBox.value) {
      const element = chatBox.value.$el || chatBox.value;
      if (element && typeof element.scrollTop !== 'undefined') {
        element.scrollTop = element.scrollHeight;
      }
    }
  });
};

const connectWebsocket = (roomId, roomType) => {
  if (stompClient.value?.connected || !roomType) return;
  
  const sockJs = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect/chat`);
  stompClient.value = Stomp.over(sockJs);
  stompClient.value.connect({ Authorization: `Bearer ${token.value}` }, () => {
    subscription.value = stompClient.value.subscribe(`/topic/chat/${roomType.toUpperCase()}/${roomId}`, (message) => {
      const newMessage = JSON.parse(message.body);
      
      if (!Array.isArray(messages.value)) {
        messages.value = [];
      }
      
      messages.value.push(newMessage);
      
      if (newMessage.senderEmail === senderEmail.value) {
        scrollToBottom();
        return;
      }
      
      const el = chatBox.value?.$el || chatBox.value;
      const isAtBottom = el ? el.scrollHeight - el.clientHeight <= el.scrollTop + 20 : true;

      if (isAtBottom) {
        scrollToBottom();
      } else {
        showNewMessageIndicator.value = true;
      }
    }, { Authorization: `Bearer ${token.value}` });
  });
};

const unsubscribe = (room, roomType) => {
  if (!room || !roomType) return;
  try {
    if (subscription.value) {
      const id = { roomId: room.roomId, roomType };
      subscription.value.unsubscribe(id);
      subscription.value = null;
    }
    if (stompClient.value?.connected) {
      stompClient.value.disconnect(() => {});
      stompClient.value = null;
    }
  } catch (error) {
    console.error('구독 해제 중 오류 발생:', error);
    subscription.value = null;
    stompClient.value = null;
  }
};

const changeImage = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append("images", file));
  const response = await axios.post(
    `${process.env.VUE_APP_API_BASE_URL}/${props.selectedRoomType}/chat/room/${props.selectedRoom.roomId}/images`,
    formData,
    { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token.value}` } }
  );
  return getResultData(response);
};

const sendMessage = async () => {
  if (!props.selectedRoom || (newMessage.value.trim() === "" && newImages.value.length === 0)) return;

  const currentMessage = newMessage.value;
  const currentImages = [...newImages.value];
  newMessage.value = "";
  newImages.value = [];
  imagePreview.value = [];

  try {
    const imageUrls = currentImages.length > 0 ? await changeImage(currentImages) : [];
    const message = { 
      senderEmail: senderEmail.value, 
      senderName: senderName.value,
      message: currentMessage, 
      imageUrls
    };
    if (stompClient.value?.connected) {
      stompClient.value.send(`/publish/chat/${props.selectedRoomType.toUpperCase()}/${props.selectedRoom.roomId}`, JSON.stringify(message));
    }
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    newMessage.value = currentMessage;
    newImages.value = currentImages;
    imagePreview.value = currentImages.map(file => ({ file, preview: URL.createObjectURL(file) }));
  }
};

const onFileChange = (event) => {
  const files = Array.from(event.target.files);
  if (newImages.value.length + files.length > 10) {
    alert('이미지는 최대 10장까지만 선택할 수 있습니다.');
    return;
  }
  newImages.value.push(...files);
  imagePreview.value.push(...files.map(file => ({ file, preview: URL.createObjectURL(file) })));
  event.target.value = '';
};

const removeImage = (index) => {
  URL.revokeObjectURL(imagePreview.value[index].preview);
  imagePreview.value.splice(index, 1);
  newImages.value.splice(index, 1);
};

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

const updateParticipantCount = (count) => {
  participantCount.value = count;
};

const completeOrder = async () => {
  if (!props.selectedRoom || !props.selectedRoomType || props.selectedRoomType !== 'purchase' || !isRoomOpen.value) return;

  const confirmed = confirm('정말로 주문을 완료하시겠습니까? 완료 후에는 취소할 수 없습니다.');
  if (!confirmed) return;

  isCompletingOrder.value = true;

  try {
    // [개선 2] axios.delete 파라미터 구조 수정
    await axios.delete(
      `${process.env.VUE_APP_API_BASE_URL}/purchase/chat/${props.selectedRoom.roomId}/complete`,
      { headers: { 'Authorization': `Bearer ${token.value}` } }
    );
    alert('공동 구매가 완료되었습니다.');
    emit('order-completed');
  } catch (error) {
    console.error("요청 실패:", error);
    alert('요청에 실패했습니다. 다시 시도해주세요.');
  } finally {
    isCompletingOrder.value = false;
  }
};

const handleBeforeUnload = () => {
  if (props.selectedRoom && props.selectedRoomType) {
    unsubscribe(props.selectedRoom, props.selectedRoomType);
  }
};

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  unsubscribe(props.selectedRoom, props.selectedRoomType);
  window.removeEventListener('beforeunload', handleBeforeUnload);
  
  if (chatBox.value) {
    const element = chatBox.value.$el || chatBox.value;
    // [개선 1] 디바운스 적용된 핸들러 제거
    if (element && typeof element.removeEventListener === 'function') {
      element.removeEventListener('scroll', debouncedHandleScroll);
    }
  }
});
</script>

<style scoped>
.chat-window-full { 
  height: calc(100vh - 32px);
  min-height: calc(100vh - 32px);
}
.chat-container {
  position: relative;
  flex: 1 1 auto;
  overflow-y: hidden;
}
.chat-box { 
  height: 100%;
  overflow-y: auto; 
  padding: 24px; 
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  position: relative;
}
.chat-box::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="dots" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="1" fill="rgba(148, 163, 184, 0.1)"/></pattern></defs><rect width="100" height="100" fill="url(%23dots)"/></svg>');
  z-index: 0;
}
.message-wrapper { 
  margin: 8px 16px; 
  display: flex; 
  flex-direction: column; 
  position: relative;
  z-index: 1;
  animation: fadeInUp 0.3s ease-out;
  gap: 4px;
}
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 보낸 메시지 레이아웃 */
.sent-message-layout {
  display: flex;
  justify-content: flex-end;
}

/* 보낸 메시지 컨테이너 */
.sent-message-container {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  max-width: 75%;
}

/* 받은 메시지 레이아웃 */
.received-message-layout {
  display: flex;
  justify-content: flex-start;
}

/* 받은 메시지 컨테이너 */
.received-message-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  max-width: 75%;
}

/* 메시지 컨텐츠 컨테이너 */
.message-content-container {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.sent-message-layout .message-content-container {
  align-items: flex-end;
}

.received-message-layout .message-content-container {
  align-items: flex-start;
}

/* 메시지 버블 */
.message-bubble {
  padding: 12px 16px;
  border-radius: 18px;
  word-break: break-word;
  backdrop-filter: blur(10px);
  position: relative;
  transition: all 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  min-width: 60px;
}

.message-bubble:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
}

/* 보낸 메시지 하단 시간 */
.message-time-bottom-sent {
  font-size: 0.65rem;
  opacity: 0.7;
  font-weight: 500;
  letter-spacing: 0.025em;
  color: rgba(26, 115, 232, 0.8);
  background: rgba(26, 115, 232, 0.1);
  backdrop-filter: blur(5px);
  padding: 1px 6px;
  border-radius: 8px;
  display: inline-block;
  white-space: nowrap;
  margin-top: 2px;
  align-self: flex-end;
  border: 1px solid rgba(26, 115, 232, 0.2);
}

/* 받은 메시지 상단 이름 */
.sender-name-top {
  font-size: 0.8rem;
  opacity: 0.9;
  font-weight: 600;
  letter-spacing: 0.025em;
  color: #5f6368;
  margin-bottom: 4px;
  align-self: flex-start;
}

/* 받은 메시지 하단 시간 */
.message-time-bottom {
  font-size: 0.65rem;
  opacity: 0.7;
  font-weight: 500;
  letter-spacing: 0.025em;
  color: #5f6368;
  background: rgba(95, 99, 104, 0.1);
  backdrop-filter: blur(5px);
  padding: 1px 6px;
  border-radius: 8px;
  display: inline-block;
  white-space: nowrap;
  margin-top: 2px;
  align-self: flex-start;
}
/* 보낸 메시지 버블 스타일 */
.sent-message-layout .message-bubble { 
  background: linear-gradient(135deg, #1a73e8 0%, #1557b0 100%);
  color: #ffffff;
  border-bottom-right-radius: 6px;
  box-shadow: 0 4px 16px rgba(26, 115, 232, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.sent-message-layout .message-bubble:hover {
  background: linear-gradient(135deg, #1557b0 0%, #1248a0 100%);
  box-shadow: 0 6px 20px rgba(26, 115, 232, 0.35);
  transform: translateY(-1px);
}

/* 받은 메시지 버블 스타일 */
.received-message-layout .message-bubble { 
  background: rgba(255, 255, 255, 0.95);
  color: #2c2c2c;
  border-bottom-left-radius: 6px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 1px solid #e8eaed;
}

.received-message-layout .message-bubble:hover {
  background: rgba(248, 249, 250, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

/* 메시지 텍스트 스타일 */
.message-text { 
  font-size: 0.95rem; 
  line-height: 1.5; 
  font-weight: 400;
  letter-spacing: 0.01em;
  word-break: break-word;
  margin: 0;
}

.sent-message-layout .message-text {
  color: #ffffff;
  font-weight: 500;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.received-message-layout .message-text {
  color: #2c2c2c;
  font-weight: 400;
}

/* 메시지 시간 스타일 */
.message-time { 
  font-size: 0.65rem; 
  opacity: 0.7; 
  font-weight: 500;
  letter-spacing: 0.025em;
  background: rgba(0, 0, 0, 0.05);
  backdrop-filter: blur(5px);
  padding: 1px 6px;
  border-radius: 8px;
  display: inline-block;
  white-space: nowrap;
}


/* 이미지 컨테이너 스타일 */
.image-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0;
  max-width: 420px; /* 2열로 배치할 때 적절한 크기 */
}

.image-wrapper {
  flex: 0 0 auto;
}

.chat-image { 
  width: 200px; 
  height: 150px; 
  object-fit: cover; 
  border-radius: 16px; 
  box-shadow: 0 4px 16px rgba(0,0,0,0.12);
  transition: all 0.3s ease;
  display: block;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

/* 이미지 개수별 크기 조정 */
.image-container.image-count-1 .chat-image {
  width: 250px;
  height: 180px;
}

.image-container.image-count-2 .chat-image {
  width: 180px;
  height: 135px;
}

.image-container.image-count-3 .chat-image,
.image-container.image-count-4 .chat-image {
  width: 130px;
  height: 100px;
}

/* 5개 이상일 때는 더 작게 */
.image-container[class*="image-count-"]:not(.image-count-1):not(.image-count-2):not(.image-count-3):not(.image-count-4) .chat-image {
  width: 100px;
  height: 80px;
}

/* 모바일 반응형 */
@media (max-width: 768px) {
  .image-container {
    max-width: 300px;
  }
  
  .image-container.image-count-1 .chat-image {
    width: 200px;
    height: 150px;
  }
  
  .image-container.image-count-2 .chat-image {
    width: 140px;
    height: 105px;
  }
  
  .image-container.image-count-3 .chat-image,
  .image-container.image-count-4 .chat-image {
    width: 90px;
    height: 70px;
  }
  
  .image-container[class*="image-count-"]:not(.image-count-1):not(.image-count-2):not(.image-count-3):not(.image-count-4) .chat-image {
    width: 70px;
    height: 55px;
  }
}
.input-area { 
  padding: 16px; 
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(226, 232, 240, 0.5);
  border-radius: 0 0 24px 24px;
}
.image-preview-container { display: flex; flex-wrap: wrap; gap: 12px; padding: 0 4px 12px; }
.image-preview-item { position: relative; width: 60px; height: 60px; }
.preview-image { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.image-preview-item .remove-image-btn {
  position: absolute;
  top: -4px;
  right: -4px;
  width: 20px;
  height: 20px;
  min-width: 20px;
  background-color: #ff4444;
}
.image-preview-item .remove-image-btn .v-icon {
  font-size: 16px;
  color: white;
}
.new-message-indicator {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
    animation: bounceIn 0.4s ease-out;
}
@keyframes bounceIn {
  0% { 
    opacity: 0; 
    transform: translateX(-50%) scale(0.3);
  }
  50% { 
    opacity: 1; 
    transform: translateX(-50%) scale(1.05);
  }
  100% { 
    opacity: 1; 
    transform: translateX(-50%) scale(1);
  }
}
.new-message-indicator .v-btn {
  background: rgba(255, 255, 255, 0.95) !important;
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.3) !important;
  border: 1px solid rgba(102, 126, 234, 0.2);
  color: #667eea !important;
  font-weight: 600;
}

/* 날짜별 메시지 그룹 스타일 */
.message-group {
  margin-bottom: 20px;
}

.date-divider {
  display: flex;
  align-items: center;
    margin: 20px 0 12px 0;
  text-align: center;
  position: relative;
  z-index: 1;
}

.date-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(to right, transparent, rgba(148, 163, 184, 0.4), transparent);
}

.date-text {
  padding: 0 16px;
  font-size: 0.75rem;
  color: #64748b;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 8px 16px;
  font-weight: 600;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  border: 1px solid rgba(255, 255, 255, 0.2);
  letter-spacing: 0.025em;
}

/* 이미지 클릭 가능 스타일 */
.chat-image.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.chat-image.clickable:hover {
  transform: scale(1.05) translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
  border-color: rgba(255, 255, 255, 0.5);
}

/* 주문 완료 버튼 스타일 */
.order-complete-btn {
  background: linear-gradient(135deg, #4caf50 0%, #45a049 100%) !important;
  color: white !important;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3) !important;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
}

.order-complete-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.order-complete-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4) !important;
  background: linear-gradient(135deg, #45a049 0%, #3d8b40 100%) !important;
}

.order-complete-btn:hover::before {
  left: 100%;
}

.order-complete-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3) !important;
}

.order-complete-btn .v-icon {
  animation: pulse-icon 2s infinite;
}

@keyframes pulse-icon {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); }
}

/* 로딩 상태 스타일 */
.order-complete-btn.v-btn--loading {
  background: linear-gradient(135deg, #81c784 0%, #66bb6a 100%) !important;
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.2) !important;
}

.order-complete-btn.v-btn--loading .v-icon {
  animation: none;
}

/* 로딩 화면 스타일 */
.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  padding: 40px 20px;
}

.loading-content {
  text-align: center;
  max-width: 300px;
}

.loading-spinner {
  margin-bottom: 16px;
}

.loading-text {
  font-size: 1rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

/* 더 많은 메시지 로딩 인디케이터 스타일 */
.load-more-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.load-more-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.load-more-spinner {
  margin: 0;
}

.load-more-text {
  font-size: 0.9rem;
  color: #6b7280;
  margin: 0;
  font-weight: 500;
}

/* 더 이상 로드할 메시지가 없을 때 스타일 */
.no-more-messages {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  margin: 16px;
}

.no-more-content {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(0, 0, 0, 0.05);
}

.no-more-text {
  font-size: 0.85rem;
  color: #9ca3af;
  font-weight: 500;
  letter-spacing: 0.025em;
}

/* 빈 채팅방 안내 UI 스타일 */
.empty-chat-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 300px;
  padding: 40px 20px;
}

.empty-chat-content {
  text-align: center;
  max-width: 400px;
}

.empty-chat-icon {
  margin-bottom: 24px;
  opacity: 0.6;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

.empty-chat-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
  line-height: 1.4;
}

.empty-chat-description {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.5;
  margin: 0;
}

/* 다크모드에서 로딩 화면 */
@media (prefers-color-scheme: dark) {
  .loading-text {
    color: #9ca3af;
  }
  
  .load-more-container {
    background: rgba(30, 41, 59, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .load-more-text {
    color: #9ca3af;
  }
  
  .no-more-content {
    background: rgba(30, 41, 59, 0.6);
    border-color: rgba(255, 255, 255, 0.1);
  }
  
  .no-more-text {
    color: #6b7280;
  }
}

/* 다크모드에서 빈 채팅방 안내 UI */
@media (prefers-color-scheme: dark) {
  .empty-chat-title {
    color: #f3f4f6;
  }
  
  .empty-chat-description {
    color: #9ca3af;
  }
}
</style>