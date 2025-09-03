<template>
  <v-app>
    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="pa-6">
        <v-card class="mb-5" rounded="lg">
          <v-card-item>
            <v-card-title class="text-grey-darken-3 text-h4 font-weight-bold"
              >👤 유저 관리 & 채팅</v-card-title
            >
          </v-card-item>
        </v-card>

        <v-row>
          <v-col cols="12" md="4">
            <v-card rounded="lg">
              <v-card-item>
                <div class="d-flex align-center justify-space-between">
                  <v-card-title class="text-grey-darken-3"
                    >👤 사용자 목록</v-card-title
                  >
                </div>
              </v-card-item>
              <v-divider></v-divider>

              <v-card-text class="pb-0">
                <v-text-field
                  v-model="searchQuery"
                  prepend-inner-icon="mdi-magnify"
                  placeholder="사용자 이름 또는 이메일로 검색"
                  variant="outlined"
                  density="compact"
                  hide-details
                  clearable
                ></v-text-field>
              </v-card-text>

              <v-list
                class="bg-transparent user-list-scroll"
                lines="two"
                style="height: 400px; overflow-y: auto"
              >
                <v-list-item
                  v-for="user in filteredUsers"
                  :key="user.email"
                  class="ma-2 user-list-item"
                  rounded="lg"
                  @click="user.role !== 'MANAGER' && selectUser(user)"
                  :class="{
                    'selected-user':
                      selectedUser && selectedUser.email === user.email,
                    'manager-user': user.role === 'MANAGER',
                  }"
                  :style="{
                    cursor: user.role === 'MANAGER' ? 'default' : 'pointer',
                  }"
                >
                  <template v-slot:prepend>
                    <div class="avatar-container">
                      <v-avatar
                        class="avatar-gradient"
                        size="48"
                        style="margin-right: 5px"
                      >
                        <span class="text-white font-weight-bold">{{
                          user.initial
                        }}</span>
                      </v-avatar>
                      <!-- 안읽은 메시지 개수 배지 -->
                      <div
                        v-if="user.unReadCount > 0"
                        class="unread-badge"
                      >
                        <span class="badge-content">{{ user.unReadCount }}</span>
                      </div>
                    </div>
                  </template>

                  <v-list-item-title class="font-weight-bold">{{
                    user.name
                  }}</v-list-item-title>
                  <v-list-item-subtitle>
                    {{ user.email }}
                  </v-list-item-subtitle>

                  <template v-slot:append>
                    <div class="d-flex align-center">
                      <v-chip
                        :color="getRoleChipColor(user.role)"
                        label
                        size="small"
                        class="font-weight-bold mr-2"
                      >
                        {{ user.role }}
                      </v-chip>

                      <v-menu
                        v-if="
                          user.role !== 'MANAGER' &&
                          currentUserRole === 'MANAGER'
                        "
                      >
                        <template v-slot:activator="{ props }">
                          <v-btn
                            icon="mdi-dots-vertical"
                            variant="text"
                            size="small"
                            v-bind="props"
                            @click.stop
                          ></v-btn>
                        </template>
                        <v-list>
                          <v-list-item @click="promoteToAdmin(user)">
                            <template v-slot:prepend>
                              <v-icon>mdi-crown</v-icon>
                            </template>
                            <v-list-item-title>관리자 승격</v-list-item-title>
                          </v-list-item>

                          <v-list-item
                            @click="removeUser(user)"
                            class="text-error"
                          >
                            <template v-slot:prepend>
                              <v-icon color="error">mdi-account-remove</v-icon>
                            </template>
                            <v-list-item-title class="text-error"
                              >사용자 제거</v-list-item-title
                            >
                          </v-list-item>
                        </v-list>
                      </v-menu>

                      <div
                        v-else-if="user.role === 'MANAGER'"
                        style="width: 40px; height: 40px"
                      ></div>
                      <div
                        v-else-if="currentUserRole !== 'MANAGER'"
                        style="width: 40px; height: 40px"
                      ></div>
                    </div>
                  </template>
                </v-list-item>
              </v-list>
            </v-card>
          </v-col>

          <v-col cols="12" md="8">
            <v-card rounded="lg">
              <v-card-item>
                <v-card-title class="text-grey-darken-3">
                  💬 채팅방
                  <span v-if="selectedUser" class="text-caption ml-2">
                    - {{ selectedUser.name }}님과의 대화
                  </span>
                </v-card-title>
              </v-card-item>
              <v-divider></v-divider>

              <div class="chat-messages">
                <div
                  v-if="!selectedUser"
                  class="d-flex align-center justify-center"
                  style="height: 400px"
                >
                  <v-card-text class="text-center text-grey">
                    <v-icon size="64" color="grey-lighten-1"
                      >mdi-chat-outline</v-icon
                    >
                    <div class="text-h6 mt-2">채팅할 사용자를 선택해주세요</div>
                  </v-card-text>
                </div>

                <div v-else class="chat-container">
                  <div
                    class="chat-messages-container"
                    ref="chatContainerRef"
                    @scroll="handleScroll"
                  >
                    <template v-for="(message, index) in chatMessages" :key="index">
                      <!-- 날짜 구분선 -->
                      <div
                        v-if="shouldShowDateSeparator(message, chatMessages[index - 1])"
                        class="date-separator"
                      >
                        <div class="date-separator-line"></div>
                        <span class="date-separator-text">{{ formatDate(message.timestamp) }}</span>
                        <div class="date-separator-line"></div>
                      </div>
                      
                      <!-- 메시지 -->
                      <div
                        :class="[
                          'message-wrapper',
                          message.senderEmail === senderEmail ? 'sent' : 'received',
                        ]"
                      >
                        <div class="message-bubble">
                          <div
                            v-if="message.senderEmail !== senderEmail"
                            class="sender-name"
                          >
                            {{ message.senderName }}
                          </div>
                          <div
                            v-if="message.imageUrls && message.imageUrls.length > 0"
                            :class="['image-container', `image-count-${message.imageUrls.length}`]"
                          >
                            <div 
                              v-for="(url, imgIndex) in message.imageUrls" 
                              :key="imgIndex" 
                              class="image-wrapper"
                            >
                              <img 
                                :src="url" 
                                alt="이미지" 
                                class="chat-image clickable" 
                                @click="openImageModal(message.imageUrls, imgIndex)"
                              />
                            </div>
                          </div>
                          <div class="message-text">{{ message.message }}</div>
                          <div class="message-time">{{ formatTime(message.timestamp) }}</div>
                        </div>
                      </div>
                    </template>
                  </div>

                  <!-- 새로운 메시지 표시기 -->
                  <v-fade-transition>
                    <div v-if="showNewMessageIndicator" class="new-message-indicator">
                      <v-btn small rounded color="primary" @click="scrollToBottom">
                        <v-icon left>mdi-arrow-down</v-icon>
                        새로운 메시지
                      </v-btn>
                    </div>
                  </v-fade-transition>
                </div>
              </div>

              <v-divider></v-divider>
              <div class="input-area" style="padding: 4px">
                <div
                  v-if="imagePreview.length > 0"
                  class="image-preview-container"
                >
                  <div
                    v-for="(image, index) in imagePreview"
                    :key="index"
                    class="image-preview-item"
                  >
                    <img :src="image.preview" class="preview-image" />
                    <v-btn
                      icon
                      x-small
                      color="error"
                      class="remove-image-btn"
                      @click="removeImage(index)"
                    >
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
                    <v-btn
                      v-if="selectedUser"
                      icon="mdi-image-plus"
                      variant="text"
                      @click="fileInput.click()"
                    />
                    <v-btn
                      v-if="selectedUser"
                      icon="mdi-send"
                      variant="text"
                      @click="sendMessage"
                    />
                  </template>
                </v-text-field>

                <input
                  ref="fileInput"
                  type="file"
                  multiple
                  accept="image/*"
                  style="display: none"
                  @change="onFileChange"
                />
              </div>
            </v-card>
          </v-col>
        </v-row>

        <v-card class="mt-5" rounded="lg">
          <v-card-item>
            <v-card-title class="text-grey-darken-3">사용 안내</v-card-title>
          </v-card-item>
          <v-divider></v-divider>
          <v-list class="bg-transparent">
            <v-list-item v-for="(item, i) in guide" :key="i" density="compact">
              <template v-slot:prepend>
                <v-icon color="blue-darken-1" class="mr-3"
                  >mdi-circle-medium</v-icon
                >
              </template>
              <v-list-item-title class="text-grey-darken-1">{{
                item
              }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-card>
      </v-container>
    </v-main>

    <!-- 이미지 모달 -->
    <ImageModal 
      v-model="showImageModal" 
      :images="modalImages" 
      :start-index="modalStartIndex" 
    />
  </v-app>
</template>

<script setup>
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

// 이미지 관련 상태
const newImages = ref([]);
const imagePreview = ref([]);
const fileInput = ref(null);
const currentUserRole = ref("MANAGER");

// 새로운 메시지 표시기 상태
const showNewMessageIndicator = ref(false);

// 이미지 모달 관련 상태
const showImageModal = ref(false);
const modalImages = ref([]);
const modalStartIndex = ref(0);

// --- 데이터 ---
const users = ref([]);
const guide = ref([
  "왼쪽에서 사용자를 선택하면 오른쪽에서 채팅할 수 있습니다.",
  "관리자는 사용자 권한을 변경하거나 제거할 수 있습니다.",
  "검색을 사용하여 원하는 사용자를 쉽게 찾을 수 있습니다.",
]);

// --- API 함수 ---
const fetchUsers = async () => {
  try {
    const response = await axios.get(
      `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/members`,
      { headers: { Authorization: `Bearer ${token.value}` } }
    );
    users.value = getResultData(response).map((user) => ({
      name: user.memberName || user.nickname || "이름 없음",
      email: user.memberEmail,
      role: user.type,
      initial: (user.memberName || user.nickname || "이름 없음").charAt(0),
      roomId: user.roomId,
      unReadCount: user.unReadCount,
    }));
    console.log("unReadCount"+users.value[1].unReadCount);
  } catch (error) {
    console.error("사용자 목록 조회 실패:", getErrorMessage(error));
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
  // 유저관리 페이지 진입 시 ADMIN_CHAT 알림 제거
  try {
    await store.dispatch('notification/clearAdminChatNotificationsOnEnter');
  } catch (error) {
    console.error('ADMIN_CHAT 알림 제거 실패:', error);
  }
  
  // 사용자 목록 로드
  await fetchUsers();
  window.addEventListener('beforeunload', handleBeforeUnload);
});

// --- Watcher ---
watch(selectedUser, async (newUser, oldUser) => {
  if (oldUser) {
    unsubscribe(oldUser);
  }
  if (newUser) {
    chatMessages.value = [];
    newMessage.value = "";
    imagePreview.value = [];
    newImages.value = [];
    showNewMessageIndicator.value = false; // 새로운 메시지 표시기 초기화
    closeImageModal(); // 이미지 모달도 초기화
    try {
      const response = await axios.get(
        `${process.env.VUE_APP_API_BASE_URL}/manager/chat/history/room/${newUser.roomId}`,
        {
          headers: { Authorization: `Bearer ${token.value}` },
        }
      );
      await axios.post(`${process.env.VUE_APP_API_BASE_URL}/manager/chat/${newUser.roomId}/read`);
      const chatData = getResultData(response);
      if (Array.isArray(chatData)) {
        chatMessages.value = chatData.map((msg) => ({
          senderEmail: msg.senderEmail,
          senderName: msg.senderName,
          message: msg.message,
          timestamp: msg.timestamp,
          imageUrls: msg.imageUrls || [],
        }));
      }
      // 선택된 사용자의 안읽은 메시지 개수 초기화
      const userIndex = users.value.findIndex(u => u.email === newUser.email);
      if (userIndex !== -1) {
        users.value[userIndex].unReadCount = 0;
      }
      scrollToBottom();
      connectWebSocket(newUser.roomId);
    } catch (error) {
      console.error("채팅 내역 로딩 실패:", getErrorMessage(error));
      chatMessages.value = [];
    }
  } else {
    chatMessages.value = [];
    showNewMessageIndicator.value = false; // 새로운 메시지 표시기 초기화
    closeImageModal(); // 이미지 모달도 초기화
  }
});

// --- 헬퍼 함수 ---
const getRoleChipColor = (role) => (role === "MANAGER" ? "red" : "green");

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

const shouldShowDateSeparator = (currentMessage, previousMessage) => {
  if (!previousMessage) return true;
  
  const currentDate = new Date(currentMessage.timestamp).toDateString();
  const previousDate = new Date(previousMessage.timestamp).toDateString();
  
  return currentDate !== previousDate;
};

const selectUser = (user) => {
  if (user.role !== "MANAGER") {
    selectedUser.value = user;
  }
};

// --- WebSocket 함수 ---
const connectWebSocket = (roomId) => {
  if (stompClient.value?.connected) return;
  try {
    const sockJs = new SockJS(
      `${process.env.VUE_APP_API_BASE_URL}/connect/chat`
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

  console.log(`사용자 ${user.name || user.email} 구독 해제 시작`);
  
  try {
    // 1. 먼저 구독 해제
    if (subscription.value) {
      const id = { roomId: user.roomId, roomType: 'manager' };
      subscription.value.unsubscribe(id);
      subscription.value = null;
      console.log('구독이 해제되었습니다.');
    }
    
    // 2. 그 다음 연결 해제
    if (stompClient.value?.connected) {
      stompClient.value.disconnect(() => {
        console.log('WebSocket 연결이 정상적으로 해제되었습니다 (disconnected)');
      });
      stompClient.value = null;
      console.log('WebSocket 연결 해제 완료');
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
    console.log("📬 FormData에 담긴 내용을 확인합니다:");
    for (const [key, value] of formData.entries()) {
      // value가 File 객체인지, 정보(이름, 크기 등)가 올바른지 확인
      console.log(`${key}:`, value);
    }
    const response = await axios.post(
      `${process.env.VUE_APP_API_BASE_URL}/manager/chat/room/${selectedUser.value.roomId}/images`,
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

const handleScroll = () => {
  const el = chatContainerRef.value;
  if (!el) return;
  
  // 사용자가 수동으로 맨 아래로 스크롤하면 새 메시지 표시기를 숨깁니다.
  if (el.scrollHeight - el.scrollTop - el.clientHeight < 1) {
    showNewMessageIndicator.value = false;
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
      await axios.patch(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/delegateManager?memberEmail=${user.email}`);
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
        `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId.value}/members/${user.email}`,
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

// --- 생명주기 훅 ---
onUnmounted(() => {
  disconnectWebSocket();
  window.removeEventListener('beforeunload', handleBeforeUnload);
});
</script>

<style scoped>
.app-bar-gradient {
  background: linear-gradient(91.91deg, #667eea 0%, #764ba2 100%);
}
.avatar-gradient {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

/* 아바타 컨테이너와 배지 스타일 */
.avatar-container {
  position: relative;
  display: inline-block;
}

.unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 10;
  background-color: #f44336;
  color: white;
  border-radius: 12px;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  box-shadow: 0 2px 6px rgba(0,0,0,0.3);
}

.badge-content {
  font-size: 11px;
  font-weight: bold;
  line-height: 1;
  padding: 0 4px;
}
.user-list-item {
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}
.user-list-item:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}
.selected-user {
  border-color: #667eea;
  background-color: #e3f2fd;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}
.user-list-scroll {
  scrollbar-width: thin;
  scrollbar-color: #667eea #f5f5f5;
}
.user-list-scroll::-webkit-scrollbar {
  width: 8px;
}
.user-list-scroll::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}
.user-list-scroll::-webkit-scrollbar-thumb {
  background: #667eea;
  border-radius: 4px;
}
.user-list-scroll::-webkit-scrollbar-thumb:hover {
  background: #5a6fd8;
}
.chat-messages {
  height: 400px;
  overflow: hidden;
}
.chat-container {
  position: relative;
  height: 400px;
}
.chat-messages-container {
  height: 400px;
  overflow-y: auto;
  padding: 20px;
  background: #f8f9fa;
}
.message-wrapper {
  margin: 8px 0;
  display: flex;
  flex-direction: column;
}
.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  word-break: break-word;
}
.sent {
  align-items: flex-end;
}
.sent .message-bubble {
  background: #1976d2;
  color: white;
  border-bottom-right-radius: 4px;
}
.received {
  align-items: flex-start;
}
.received .message-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}
.sender-name {
  font-size: 0.75rem;
  margin-bottom: 4px;
  opacity: 0.8;
}
.message-text {
  font-size: 0.95rem;
  line-height: 1.4;
}
.message-time {
  font-size: 0.7rem;
  margin-top: 4px;
  opacity: 0.7;
}
.input-area {
  background: white;
  border-top: 1px solid #eee;
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
  border-radius: 12px; 
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  display: block;
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
.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 0 4px 12px;
}
.image-preview-item {
  position: relative;
  width: 60px;
  height: 60px;
}
.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
}
.remove-image-btn {
  position: absolute !important;
  top: -4px !important;
  right: -4px !important;
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  background-color: #ff4444 !important;
}
.remove-image-btn .v-icon {
  font-size: 16px !important;
  color: white !important;
}

/* 날짜 구분선 스타일 */
.date-separator {
  display: flex;
  align-items: center;
  margin: 16px 0;
  padding: 0 20px;
}

.date-separator-line {
  flex: 1;
  height: 1px;
  background-color: #e0e0e0;
}

.date-separator-text {
  padding: 0 16px;
  font-size: 0.75rem;
  color: #666;
  background-color: #f8f9fa;
  border-radius: 12px;
  white-space: nowrap;
}

/* 새로운 메시지 표시기 스타일 */
.new-message-indicator {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  opacity: 0.9;
}

/* 이미지 클릭 가능 스타일 */
.chat-image.clickable {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.chat-image.clickable:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}
</style>
