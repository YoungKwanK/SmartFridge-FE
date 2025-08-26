<template>
  <v-app>
    <v-main class="bg-grey-lighten-4">
      <v-container fluid class="pa-6">
        <v-card class="mb-5" rounded="lg">
          <v-card-item>
            <v-card-title class="text-grey-darken-3 text-h4 font-weight-bold">👤 유저 관리 & 채팅</v-card-title>
          </v-card-item>
        </v-card>

        <v-row>
                     <!-- 왼쪽: 사용자 목록 -->
           <v-col cols="12" md="4">
             <v-card rounded="lg">
                             <v-card-item>
                 <div class="d-flex align-center justify-space-between">
                   <v-card-title class="text-grey-darken-3">👤 사용자 목록</v-card-title>
                   <v-btn
                     color="primary"
                     prepend-icon="mdi-account-plus"
                     variant="tonal"
                     size="small"
                     @click="showInviteModal = true"
                   >
                     사용자 초대
                   </v-btn>
                 </div>
               </v-card-item>
              <v-divider></v-divider>
              
                             <!-- 검색 -->
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
              
              <v-list class="bg-transparent user-list-scroll" lines="two" style="height: 400px; overflow-y: auto;">
                <v-list-item
                  v-for="user in filteredUsers"
                  :key="user.email"
                  class="ma-2 user-list-item"
                  rounded="lg"
                  @click="selectUser(user)"
                  :class="{ 'selected-user': selectedUser && selectedUser.email === user.email }"
                >
                                     <template v-slot:prepend>
                     <v-avatar class="avatar-gradient" size="48" style="margin-right: 5px;">
                       <span class="text-white font-weight-bold">{{ user.initial }}</span>
                     </v-avatar>
                   </template>

                  <v-list-item-title class="font-weight-bold">{{ user.name }}</v-list-item-title>
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
                      
                      <!-- 액션 버튼들 (관리자에게는 표시하지 않음) -->
                      <v-menu v-if="user.role !== '관리자'">
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
                          <!-- 관리자만 권한 변경 가능 -->
                          <v-list-item 
                            v-if="currentUserRole === '관리자'"
                            @click="promoteToAdmin(user)"
                          >
                            <template v-slot:prepend>
                              <v-icon>mdi-crown</v-icon>
                            </template>
                            <v-list-item-title>관리자 승격</v-list-item-title>
                          </v-list-item>
                          
                          <!-- 관리자만 사용자 제거 가능 -->
                          <v-list-item 
                            v-if="currentUserRole === '관리자'"
                            @click="removeUser(user)"
                            class="text-error"
                          >
                            <template v-slot:prepend>
                              <v-icon color="error">mdi-account-remove</v-icon>
                            </template>
                            <v-list-item-title class="text-error">사용자 제거</v-list-item-title>
                          </v-list-item>
                        </v-list>
                      </v-menu>
                      
                      <!-- 관리자에게는 액션 버튼과 동일한 크기의 여백 제공 -->
                      <div v-else style="width: 40px; height: 40px;"></div>
                    </div>
                  </template>
                </v-list-item>
              </v-list> 
            </v-card>
          </v-col>

                     <!-- 오른쪽: 채팅방 -->
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
              
                             <!-- 채팅 메시지 영역 -->
               <div class="chat-messages" ref="chatMessages">
                 <div v-if="!selectedUser" class="d-flex align-center justify-center" style="height: 400px;">
                   <v-card-text class="text-center text-grey">
                     <v-icon size="64" color="grey-lighten-1">mdi-chat-outline</v-icon>
                     <div class="text-h6 mt-2">채팅할 사용자를 선택해주세요</div>
                   </v-card-text>
                 </div>
                 
                 <div v-else class="chat-messages-container">
                   <div
                     v-for="(message, index) in chatMessages"
                     :key="index"
                     :class="['message-wrapper', message.sender === 'me' ? 'sent' : 'received']"
                   >
                                           <div class="message-bubble">
                        <div class="sender-name">{{ message.sender === 'me' ? '나' : selectedUser.name }}</div>
                        <div v-if="message.imageUrls && message.imageUrls.length > 0" class="image-container">
                          <img 
                            v-for="(url, imgIndex) in message.imageUrls" 
                            :key="imgIndex" 
                            :src="url" 
                            alt="이미지" 
                            class="chat-image" 
                          />
                        </div>
                        <div class="message-text">{{ message.text }}</div>
                        <div class="message-time">{{ message.time }}</div>
                      </div>
                   </div>
                 </div>
               </div>
               
                               <!-- 메시지 입력 영역 -->
                <v-divider></v-divider>
                <div class="input-area" style="padding: 4px;">
                  <!-- 이미지 미리보기 -->
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
                  
                  <!-- 파일 입력 (숨김) -->
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
                 <v-icon color="blue-darken-1" class="mr-3">mdi-circle-medium</v-icon>
               </template>
               <v-list-item-title class="text-grey-darken-1">{{ item }}</v-list-item-title>
             </v-list-item>
           </v-list>
        </v-card>

      </v-container>

    </v-main>

    <!-- 사용자 초대 모달 -->
    <v-dialog v-model="showInviteModal" max-width="400" persistent>
      <v-card>
        <v-card-title class="d-flex align-center justify-space-between">
          <span>사용자 초대</span>
          <v-btn icon="mdi-close" variant="text" @click="showInviteModal = false"></v-btn>
        </v-card-title>
        <v-divider></v-divider>
        <v-card-text>
          <v-text-field
            v-model="inviteEmail"
            label="이메일 주소"
            placeholder="초대할 사용자의 이메일을 입력하세요"
            variant="outlined"
            density="compact"
            type="email"
            :rules="[v => !!v || '이메일을 입력해주세요', v => /.+@.+\..+/.test(v) || '올바른 이메일 형식이 아닙니다']"
          ></v-text-field>
          <v-text-field
            v-model="inviteMessage"
            label="초대 메시지 (선택사항)"
            placeholder="초대 메시지를 입력하세요"
            variant="outlined"
            density="compact"
            rows="3"
          ></v-text-field>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showInviteModal = false">취소</v-btn>
          <v-btn 
            color="primary" 
            @click="sendInvite"
            :disabled="!inviteEmail || !/.+@.+\..+/.test(inviteEmail)"
          >
            초대 보내기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script setup>
import { ref, computed, nextTick, watch, onUnmounted } from 'vue';
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';
import axios from 'axios';

// --- 상태 변수 ---
const showInviteModal = ref(false);
const inviteEmail = ref('');
const inviteMessage = ref('');
const searchQuery = ref('');
const selectedUser = ref(null);
const newMessage = ref('');
const chatMessages = ref([]);

// WebSocket 관련 상태
const stompClient = ref(null);
const token = ref(localStorage.getItem("accessToken"));
const senderEmail = ref(localStorage.getItem("email"));
const senderName = ref(localStorage.getItem("name"));

// 이미지 관련 상태
const newImages = ref([]);
const imagePreview = ref([]);
const fileInput = ref(null);

// 현재 사용자 역할 (실제로는 로그인한 사용자 정보에서 가져와야 함)
const currentUserRole = ref('관리자');

// --- 임시 데이터 ---
// 사용자 목록 데이터 (마지막 활동 정보 제거)
const users = ref([
  { 
    name: '홍길동', 
    email: 'hong@example.com', 
    role: '관리자', 
    initial: '홍',
    isOnline: true
  },
  { 
    name: '김철수', 
    email: 'kim@example.com', 
    role: '사용자', 
    initial: '김',
    isOnline: false
  },
  { 
    name: '이영희', 
    email: 'lee@example.com', 
    role: '사용자', 
    initial: '이',
    isOnline: true
  },
  { 
    name: '박민수', 
    email: 'park@example.com', 
    role: '사용자', 
    initial: '박',
    isOnline: false
  },
  { 
    name: '최지현', 
    email: 'choi@example.com', 
    role: '사용자', 
    initial: '최',
    isOnline: true
  },
  { 
    name: '정민호', 
    email: 'jung@example.com', 
    role: '사용자', 
    initial: '정',
    isOnline: false
  },
  { 
    name: '한소영', 
    email: 'han@example.com', 
    role: '사용자', 
    initial: '한',
    isOnline: true
  },
  { 
    name: '송태현', 
    email: 'song@example.com', 
    role: '사용자', 
    initial: '송',
    isOnline: false
  },
  { 
    name: '윤지은', 
    email: 'yoon@example.com', 
    role: '사용자', 
    initial: '윤',
    isOnline: true
  },
  { 
    name: '강동원', 
    email: 'kang@example.com', 
    role: '사용자', 
    initial: '강',
    isOnline: false
  }
]);

// 사용 안내 데이터 업데이트
const guide = ref([
  '왼쪽에서 사용자를 선택하면 오른쪽에서 채팅할 수 있습니다.',
  '관리자는 사용자 권한을 변경하거나 제거할 수 있습니다.',
  '사용자 초대 버튼으로 새로운 멤버를 추가할 수 있습니다.',
  '검색을 사용하여 원하는 사용자를 쉽게 찾을 수 있습니다.',
]);

// --- 계산된 속성 ---
// 검색된 사용자 목록
const filteredUsers = computed(() => {
  let filtered = users.value;
  
  // 검색어로 필터링
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    filtered = filtered.filter(user => 
      user.name.toLowerCase().includes(query) || 
      user.email.toLowerCase().includes(query)
    );
  }
  
  return filtered;
});

// 사용자 선택 시 WebSocket 연결 관리
watch(selectedUser, async (newUser, oldUser) => {
  if (oldUser) {
    disconnectWebSocket();
  }

  chatMessages.value = [];
  newMessage.value = "";
  imagePreview.value = [];
  newImages.value = [];

  if (newUser) {
    try {
      // 채팅 내역 로딩 (실제로는 서버에서 가져와야 함)
      chatMessages.value = [
        {
          sender: 'other',
          text: `안녕하세요! ${newUser.name}입니다. 무엇을 도와드릴까요?`,
          time: getCurrentTime()
        }
      ];
      scrollToBottom();
      connectWebSocket(newUser.email);
    } catch (error) {
      console.error("채팅 내역 로딩 실패:", error);
    }
  }
}, { deep: true });

// --- 헬퍼 함수 ---
// 사용자의 역할(role)에 따라 v-chip의 색상을 반환하는 함수
const getRoleChipColor = (role) => {
  if (role === '관리자') return 'red';
  return 'green';
};

// 사용자 선택 함수
const selectUser = (user) => {
  selectedUser.value = user;
  // 선택된 사용자와의 채팅 기록 초기화 (실제로는 서버에서 가져와야 함)
  chatMessages.value = [
    {
      sender: 'other',
      text: `안녕하세요! ${user.name}입니다. 무엇을 도와드릴까요?`,
      time: getCurrentTime()
    }
  ];
  
  // 사용자 선택 후 스크롤을 맨 아래로
  scrollToBottom();
};

// WebSocket 연결 함수
const connectWebSocket = (userEmail) => {
  if (stompClient.value?.connected) return;
  
  try {
    const sockJs = new SockJS(`${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/connect/chat`);
    stompClient.value = Stomp.over(sockJs);
    stompClient.value.connect({ Authorization: `Bearer ${token.value}` }, () => {
      // 1:1 채팅을 위한 구독
      stompClient.value.subscribe(`/topic/chat/PRIVATE/${userEmail}`, (message) => {
        const receivedMessage = JSON.parse(message.body);
        chatMessages.value.push({
          sender: 'other',
          text: receivedMessage.message,
          time: getCurrentTime()
        });
        scrollToBottom();
      }, { Authorization: `Bearer ${token.value}` });
    });
  } catch (error) {
    console.error('WebSocket 연결 실패:', error);
  }
};

// WebSocket 연결 해제 함수
const disconnectWebSocket = () => {
  if (stompClient.value?.connected) {
    stompClient.value.disconnect();
    stompClient.value = null;
  }
};

// 이미지 업로드 함수
const uploadImages = async (files) => {
  if (!selectedUser.value) return [];
  
  try {
    const formData = new FormData();
    files.forEach(file => formData.append("images", file));
    
    const response = await axios.post(
      `${process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080'}/chat/private/${selectedUser.value.email}/images`,
      formData,
      { 
        headers: { 
          'Content-Type': 'multipart/form-data', 
          'Authorization': `Bearer ${token.value}` 
        } 
      }
    );
    return response.data.imageUrls || [];
  } catch (error) {
    console.error('이미지 업로드 실패:', error);
    return [];
  }
};

// 메시지 전송 함수
const sendMessage = async () => {
  if (!selectedUser.value || (newMessage.value.trim() === "" && newImages.value.length === 0)) return;

  const currentMessage = newMessage.value;
  const currentImages = [...newImages.value];
  newMessage.value = "";
  newImages.value = [];
  imagePreview.value = [];

  try {
    // 이미지 업로드
    const imageUrls = currentImages.length > 0 ? await uploadImages(currentImages) : [];
    
    // 내 메시지 추가
    chatMessages.value.push({
      sender: 'me',
      text: currentMessage,
      time: getCurrentTime(),
      imageUrls: imageUrls
    });
    
    // WebSocket을 통해 메시지 전송
    if (stompClient.value?.connected) {
      const message = {
        senderEmail: senderEmail.value,
        senderName: senderName.value,
        message: currentMessage,
        imageUrls: imageUrls,
        timestamp: new Date().toISOString()
      };
      stompClient.value.send(`/publish/chat/PRIVATE/${selectedUser.value.email}`, JSON.stringify(message));
    }
    
    scrollToBottom();
    
    // 상대방 응답 시뮬레이션 (실제로는 WebSocket을 통해 받음)
    if (currentMessage.trim()) {
      setTimeout(() => {
        chatMessages.value.push({
          sender: 'other',
          text: getRandomResponse(),
          time: getCurrentTime()
        });
        scrollToBottom();
      }, 1000);
    }
  } catch (error) {
    console.error('메시지 전송 실패:', error);
    newMessage.value = currentMessage;
    newImages.value = currentImages;
    imagePreview.value = currentImages.map(file => ({ file, preview: URL.createObjectURL(file) }));
  }
};

// 스크롤을 맨 아래로 이동하는 함수
const scrollToBottom = () => {
  nextTick(() => {
    const chatContainer = document.querySelector('.chat-messages-container');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  });
};

// 현재 시간 포맷팅
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('ko-KR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// 랜덤 응답 생성 (실제로는 AI 응답이나 미리 정의된 응답을 사용)
const getRandomResponse = () => {
  const responses = [
    '네, 알겠습니다!',
    '좋은 아이디어네요!',
    '그렇군요, 이해했습니다.',
    '도움이 필요하시면 언제든 말씀해주세요.',
    '좋은 하루 보내세요!',
    '감사합니다!',
    '정말 유용한 정보네요.',
    '그렇게 생각하시는군요!'
  ];
  return responses[Math.floor(Math.random() * responses.length)];
};

// 사용자 초대 함수
const sendInvite = () => {
  console.log('Invite sent to:', inviteEmail.value);
  console.log('Message:', inviteMessage.value);
  alert(`${inviteEmail.value}로 초대가 전송되었습니다.`);
  showInviteModal.value = false;
  inviteEmail.value = '';
  inviteMessage.value = '';
};

// 관리자 승격 함수
const promoteToAdmin = (user) => {
  if (confirm(`${user.name}님을 관리자로 승격하시겠습니까?`)) {
    user.role = '관리자';
    console.log(`${user.name}님이 관리자로 승격되었습니다.`);
  }
};

// 이미지 파일 선택 함수
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

// 이미지 제거 함수
const removeImage = (index) => {
  URL.revokeObjectURL(imagePreview.value[index].preview);
  imagePreview.value.splice(index, 1);
  newImages.value.splice(index, 1);
};

// 사용자 제거 함수
const removeUser = (user) => {
  if (confirm(`${user.name}님을 냉장고에서 제거하시겠습니까?`)) {
    const index = users.value.findIndex(u => u.email === user.email);
    if (index > -1) {
      users.value.splice(index, 1);
      // 선택된 사용자가 제거된 경우 선택 해제
      if (selectedUser.value && selectedUser.value.email === user.email) {
        selectedUser.value = null;
        chatMessages.value = [];
        disconnectWebSocket();
      }
      console.log(`${user.name}님이 제거되었습니다.`);
    }
  }
};

// 컴포넌트 언마운트 시 WebSocket 연결 해제
onUnmounted(() => {
  disconnectWebSocket();
});
</script>

<style scoped>
.app-bar-gradient {
  background: linear-gradient(91.91deg, #667EEA 0%, #764BA2 100%);
}

.avatar-gradient {
  background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);
}

.user-list-item {
  background-color: #F8F9FA;
  border: 1px solid #E9ECEF;
  transition: all 0.2s ease-in-out;
  cursor: pointer;
}

.user-list-item:hover {
  border-color: #667EEA;
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.selected-user {
  border-color: #667EEA;
  background-color: #E3F2FD;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.user-list-scroll {
  scrollbar-width: thin;
  scrollbar-color: #667EEA #f5f5f5;
}

.user-list-scroll::-webkit-scrollbar {
  width: 8px;
}

.user-list-scroll::-webkit-scrollbar-track {
  background: #f5f5f5;
  border-radius: 4px;
}

.user-list-scroll::-webkit-scrollbar-thumb {
  background: #667EEA;
  border-radius: 4px;
}

.user-list-scroll::-webkit-scrollbar-thumb:hover {
  background: #5a6fd8;
}

.chat-messages {
  height: 400px;
  overflow: hidden;
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
  background: #1976D2;
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
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
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

/* 이미지 관련 스타일 */
.chat-image {
  max-width: 200px;
  border-radius: 8px;
  margin: 4px 0;
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
</style>