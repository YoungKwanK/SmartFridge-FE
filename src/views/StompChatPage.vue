<template>
  <v-container>
    <v-row justify="center">
      <v-col cols="12" md="8">
        <v-card class="chat-container">
          <v-card-title class="text-center text-h5 chat-header">
            채팅
          </v-card-title>
          <v-card-text>
            <div class="chat-box">
              <div
                v-for="(msg, index) in messages"
                :key="index"
                :class="['message-wrapper', msg.senderEmail === this.senderEmail ? 'sent' : 'received']"
              >
                <div class="message-bubble">
                  <div class="sender-name">{{msg.senderEmail}}</div>
                  <div v-if="msg.imageUrls && msg.imageUrls.length > 0" class="image-container">
                    <img
                      v-for="(url, imgIndex) in msg.imageUrls"
                      :key="imgIndex"
                      :src="url"
                      alt="이미지"
                      class="chat-image"
                    />
                  </div>
                  <div class="message-text">{{msg.message}}</div>
                  <div class="message-time">{{ msg.timestamp }}</div>
                </div>
              </div>
            </div>
            <div class="input-area">
              <!-- 선택된 이미지 미리보기 영역 추가 -->
              <div v-if="imagePreview.length > 0" class="image-preview-container">
                <div v-for="(image, index) in imagePreview" :key="index" class="image-preview-item">
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
                label="메시지 입력"
                @keyup.enter="sendMessage"
                dense
                hide-details
                outlined
                class="message-input"
              >
                <template v-slot:append>
                  <v-btn
                    icon
                    small
                    @click="$refs.fileInput.click()"
                    class="file-button"
                    color="grey darken-1"
                  >
                    <v-icon>mdi-image-plus</v-icon>
                  </v-btn>
                  <v-btn
                    color="primary"
                    @click="sendMessage"
                    class="send-button"
                    icon
                  >
                    <v-icon>mdi-send</v-icon>
                  </v-btn>
                </template>
              </v-text-field>
              <input
                ref="fileInput"
                type="file"
                multiple
                accept="image/*"
                style="display: none"
                @change="onFileChange"
              >
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import SockJS from 'sockjs-client';
import Stomp from 'webstomp-client';
import axios from 'axios';


  export default{
    data(){
      return{
        messages: [],
        newMessage: "",
        stompClient: null,
        token: "",
        senderEmail: "",
        roomId: null,
        images: [],
        newImages: [], // 파일 업로드를 위한 변수
        imagePreview: [], // 이미지 미리보기를 위한 배열
        sendImages: [], // 전송할 이미지 URL을 저장하기 위한 변수
      }
    },
    async created(){
      this.senderEmail=localStorage.getItem("email");
      this.roomId = this.$route.params.roomId;
      const reponse = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/manager/chat/history/${this.roomId}`)
      await axios.post(`${process.env.VUE_APP_API_BASE_URL}/manager/chat/${this.roomId}/read`)
      this.messages = reponse.data.result;
      this.connectWebsocket();
    },
    // 사용자가 현재 라우트에서 다른 라우트로 이동하려고 할 때 호출되는 훅 함수
    beforeRouterLeave(to, from, next){
      this.disconnectWebSocket();
      next();
    },
    // 화면을 완전히 꺼버렸을 때  
    beforeUnmount(){
      this.disconnectWebSocket();
    },  
    methods: {
      connectWebsocket(){
        if(this.stompClient && this.stompClient.connected) return;
        // sockjs는 websocket을 내장한 향상된 js 라이브러리. http엔드포인트 사용.
        const sockJs = new SockJS(`${process.env.VUE_APP_API_BASE_URL}/connect/chat`)
        this.stompClient = Stomp.over(sockJs);
        this.token = localStorage.getItem("token");
        this.stompClient.connect({
          Authorization: `Bearer ${this.token}`
        },
          ()=>{
              this.stompClient.subscribe(`/topic/chat/MANAGER/${this.roomId}`, (message)=>{
              const parseMessage = JSON.parse(message.body);
              this.messages.push(parseMessage);
              this.scrollToBottom();
            },{Authorization: `Bearer ${this.token}`})
          }
        )
    },
    
    async sendMessage() {
      if (this.newMessage.trim() === "" && this.newImages.length === 0) return;

      // 현재 메시지와 이미지 상태를 저장
      const currentMessage = this.newMessage;
      const currentImages = [...this.newImages];
      
      // 즉시 상태 초기화
      this.newMessage = "";
      this.newImages = [];
      this.imagePreview = [];
      
      try {
        let imageUrls = [];
        if (currentImages.length > 0) {
          imageUrls = await this.changeImage(currentImages);
        }

        const message = {
          senderEmail: this.senderEmail,
          message: currentMessage,
          imageUrls: imageUrls
        }

        this.stompClient.send(`/publish/chat/MANAGER/${this.roomId}`, JSON.stringify(message));
      } catch (error) {
        console.error('메시지 전송 실패:', error);
        // 전송 실패 시 상태 복구
        this.newMessage = currentMessage;
        this.newImages = currentImages;
        // 이미지 미리보기 복구
        this.imagePreview = currentImages.map(file => ({
          file: file,
          preview: URL.createObjectURL(file)
        }));
      }
    },

    onFileChange(event) {
      const files = Array.from(event.target.files);
      
      // 현재 선택된 이미지 수 + 새로 선택한 이미지 수가 10장을 초과하는지 확인
      if (this.newImages.length + files.length > 10) {
        alert('이미지는 최대 10장까지만 선택할 수 있습니다.');
        event.target.value = '';
        return;
      }
      
      // 기존 이미지에 새 이미지 추가
      this.newImages = [...this.newImages, ...files];
      
      // 새로운 이미지 미리보기 추가
      const newPreviews = files.map(file => ({
        file: file,
        preview: URL.createObjectURL(file)
      }));
      
      this.imagePreview = [...this.imagePreview, ...newPreviews];
      event.target.value = '';
    },

    removeImage(index) {
      URL.revokeObjectURL(this.imagePreview[index].preview);
      this.imagePreview.splice(index, 1);
      this.newImages.splice(index, 1);
    },

    scrollToBottom(){
      this.$nextTick(()=>{
        const chatBox = this.$el.querySelector(".chat-box");
        chatBox.scrollTop = chatBox.scrollHeight;
      })
    },
    async changeImage(files) {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }
      const response = await axios.post(
        `${process.env.VUE_APP_API_BASE_URL}/manager/chat/room/${this.roomId}/images`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
          }
        }
      );
      return response.data.result;
    },
    async disconnectWebSocket(){
      if(this.stompClient && this.stompClient.connected){
        this.stompClient.unsubscribe(`/topic/chat/MANAGER/${this.roomId}`);
        this.stompClient.disconnect();
      }
    },
  },
}
</script>

<style scoped>
.chat-container {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05) !important;
}

.chat-header {
  background: #1976D2;
  color: white;
  padding: 16px;
}

.chat-box {
  height: calc(100vh - 250px);
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
  position: relative;
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

.chat-image {
  max-width: 200px;
  max-height: 200px;
  border-radius: 8px;
  margin: 4px 0;
}

.input-area {
  padding: 16px;
  background: white;
  border-top: 1px solid #eee;
  display: flex;
  flex-direction: column;
}

.message-input {
  margin: 0 !important;
}

.file-button {
  margin: 0 8px !important;
}

/* v-file-input 관련 스타일 제거 */
.file-input,
.file-input :deep(.v-input__slot),
.file-input :deep(.v-file-input__text) {
  display: none;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}

.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding: 12px 0;
  min-height: 50px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.image-preview-item {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.image-preview-item:hover .preview-image {
  filter: brightness(0.8);
}

.remove-image-btn {
  position: absolute !important;
  top: -4px !important;
  right: -4px !important;
  width: 20px !important;
  height: 20px !important;
  min-width: 20px !important;
  padding: 0 !important;
  background-color: rgba(255, 255, 255, 0.9) !important;
  background-color: #ff4444 !important; /* 빨간색 배경으로 변경 */
  box-shadow: 0 2px 4px rgba(0,0,0,0.2) !important;
  z-index: 2;
}

.remove-image-btn .v-icon {
  font-size: 16px !important;
  color: white !important; /* 아이콘 색상을 흰색으로 변경 */
}

/* hover 효과 추가 */
.remove-image-btn:hover {
  background-color: #ff0000 !important; /* 호버시 더 진한 빨간색 */
}
</style>