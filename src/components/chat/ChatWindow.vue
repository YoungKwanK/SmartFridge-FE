<template>
  <v-card class="d-flex flex-column" style="height: 100vh;" rounded="xl">
    <div v-if="!selectedRoom" class="d-flex justify-center align-center flex-grow-1 text-center text-grey">
      <div>
        <p class="text-h6">채팅을 선택해주세요.</p>
        <p>왼쪽 목록에서 채팅방을 선택하면 대화를 시작할 수 있습니다.</p>
      </div>
    </div>

    <template v-else>
      <v-toolbar density="compact">
        <v-toolbar-title class="font-weight-bold">{{ selectedRoom.roomName }}</v-toolbar-title>
      </v-toolbar>
      <v-divider />

      <v-card-text ref="chatBox" class="flex-grow-1 pa-0 chat-box">
        <div
          v-for="(msg, index) in messages"
          :key="index"
          :class="['message-wrapper', msg.senderEmail === senderEmail ? 'sent' : 'received']"
        >
          <div class="message-bubble">
            <div class="sender-name">{{ msg.senderName }}</div>
            <div v-if="msg.imageUrls && msg.imageUrls.length > 0" class="image-container">
              <img v-for="(url, imgIndex) in msg.imageUrls" :key="imgIndex" :src="url" alt="이미지" class="chat-image" />
            </div>
            <div class="message-text">{{ msg.message }}</div>
            <div class="message-time">{{ msg.timestamp }}</div>
          </div>
        </div>
      </v-card-text>
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
  </v-card>
</template>

<script setup>
// [수정] 모든 import와 defineProps를 스크립트 최상단으로 이동
import { ref, watch, nextTick, onUnmounted} from 'vue';
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';
import axios from 'axios';
import { getResultData } from '@/utils/commonDataHandler';


const props = defineProps({
  selectedRoom: {
    type: Object,
    default: null
  }
});

// --- 상태 (State) ---
const messages = ref([]);
const newMessage = ref("");
const stompClient = ref(null);
const token = ref(localStorage.getItem("accessToken"));
const senderEmail = ref(localStorage.getItem("email"));
const newImages = ref([]);
const imagePreview = ref([]);
const chatBox = ref(null);
const fileInput = ref(null);

// --- 핵심 로직: selectedRoom prop 변경 감지 ---
watch(() => props.selectedRoom, async (newRoom, oldRoom) => {
  // 1. 이전 방과의 웹소켓 연결이 있다면 해제
  if (oldRoom) {
    disconnectWebSocket();
  }

  // 2. 메시지, 입력창 등 상태 초기화
  messages.value = [];
  newMessage.value = "";
  imagePreview.value = [];
  newImages.value = [];

  // 3. 새로운 방이 선택되었다면 데이터 로드 및 웹소켓 연결
  if (newRoom && newRoom.roomId) {
    try {
      const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/purchase/chat/history/${newRoom.roomId}`);
      messages.value = getResultData(response);
      await axios.post(`${process.env.VUE_APP_API_BASE_URL}/purchase/chat/${newRoom.roomId}/read`);
      
      scrollToBottom();
      connectWebsocket(newRoom.roomId);
    } catch (error) {
      console.error("채팅 내역 로딩 실패:", error);
    }
  }
}, {
  deep: true // props 객체 내부의 값 변경까지 감지
});

// --- 함수 (Functions) ---
const scrollToBottom = () => {
  nextTick(() => {
    if (chatBox.value) chatBox.value.scrollTop = chatBox.value.scrollHeight;
  });
};

const connectWebsocket = (roomId) => {
  if (stompClient.value?.connected) return;
  const sockJs = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect/chat`);
  stompClient.value = Stomp.over(sockJs);
  stompClient.value.connect({ Authorization: `Bearer ${token.value}` }, () => {
    stompClient.value.subscribe(`/topic/chat/PURCHASE/${roomId}`, (message) => {
      messages.value.push(JSON.parse(message.body));
      scrollToBottom();
    }, { Authorization: `Bearer ${token.value}` });
  });
};

const disconnectWebSocket = () => {
  if (stompClient.value?.connected) {
    stompClient.value.unsubscribe(`/topic/chat/PURCHASE/${props.selectedRoom.roomId}`);
    stompClient.value.disconnect();
    stompClient.value = null;
  }
};

const changeImage = async (files) => {
  const formData = new FormData();
  files.forEach(file => formData.append("images", file));
  const response = await axios.post(
    `${process.env.VUE_APP_API_BASE_URL}/purchase/chat/room/${props.selectedRoom.roomId}/images`,
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
    const message = { senderEmail: senderEmail.value, message: currentMessage, imageUrls };
    if (stompClient.value?.connected) {
      stompClient.value.send(`/publish/chat/PURCHASE/${props.selectedRoom.roomId}`, JSON.stringify(message));
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

// 컴포넌트가 사라질 때 웹소켓 연결 해제
onUnmounted(() => {
  disconnectWebSocket();
});
</script>

<style scoped>
/* [추가] 채팅 UI가 올바르게 보이도록 전체 스타일 추가 */
.chat-box {
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
.sent { align-items: flex-end; }
.sent .message-bubble {
  background: #1976D2;
  color: white;
  border-bottom-right-radius: 4px;
}
.received { align-items: flex-start; }
.received .message-bubble {
  background: white;
  color: #333;
  border-bottom-left-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}
.sender-name { font-size: 0.75rem; margin-bottom: 4px; opacity: 0.8; }
.message-text { font-size: 0.95rem; line-height: 1.4; }
.message-time { font-size: 0.7rem; margin-top: 4px; opacity: 0.7; }
.chat-image { max-width: 200px; border-radius: 8px; margin: 4px 0; }
.input-area { padding: 12px; background: white; border-top: 1px solid #eee; }
.image-preview-container { display: flex; flex-wrap: wrap; gap: 12px; padding: 0 4px 12px; }
.image-preview-item { position: relative; width: 60px; height: 60px; }
.preview-image { width: 100%; height: 100%; object-fit: cover; border-radius: 8px; }
.remove-image-btn {
  position: absolute !important; top: -4px !important; right: -4px !important;
  width: 20px !important; height: 20px !important; min-width: 20px !important;
  background-color: #ff4444 !important;
}
.remove-image-btn .v-icon { font-size: 16px !important; color: white !important; }
</style>