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
                  <v-file-input
                    v-model="newImages"
                    class="file-input"
                    hide-details
                    dense
                    accept="image/*"
                    multiple
                    prepend-icon=""
                  >
                    <template v-slot:append-outer>
                      <v-icon color="primary">mdi-image-plus</v-icon>
                    </template>
                  </v-file-input>
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
        sendImages: [], // 전송할 이미지 URL을 저장하기 위한 변수
      }
    },
    async created(){
      this.senderEmail=localStorage.getItem("email");
      this.roomId = this.$route.params.roomId;
      const reponse = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/chat/history/manager/${this.roomId}`)
      await axios.post(`${process.env.VUE_APP_API_BASE_URL}/chat/manager/room/${this.roomId}/read`)
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
    
    async sendMessage(){
      if(this.newMessage.trim()==="" && this.newImages.length===0) return;

      if(this.newImages.length > 0){
        // 이미지가 있다면 먼저 업로드를 진행
        await this.changeImage(this.newImages);
      }
      const message={
        senderEmail: this.senderEmail,
        message: this.newMessage,
        imageUrls: this.sendImages
      }
      this.stompClient.send(`/publish/chat/MANAGER/${this.roomId}`, JSON.stringify(message));
      this.newMessage = ""
      this.sendImages = [];
    },
    scrollToBottom(){
      this.$nextTick(()=>{
        const chatBox = this.$el.querySelector(".chat-box");
        chatBox.scrollTop = chatBox.scrollHeight;
      })
    },
    async changeImage(files){
      const formData = new FormData();
      for(let i=0; i<files.length; i++){
        const file = files[i];
        formData.append("images", file);
      }
      const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/chat/manager/room/${this.roomId}/images`, formData,{
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      this.newImages = [];
      this.sendImages = (response.data.result);
    },
    async disconnectWebSocket(){
      if(this.stompClient && this.stompClient.connected){
        this.stompClient.unsubscribe(`/topic/chat/MANAGER/${this.roomId}`);
        this.stompClient.disconnect();
      }
    }
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
}

.message-input {
  margin: 0 !important;
}

.file-input {
  max-width: 36px !important;
  margin: 0 4px !important;
}

.file-input :deep(.v-input__slot) {
  margin: 0 !important;
}

.file-input :deep(.v-file-input__text) {
  display: none;
}

.send-button {
  margin: 0 0 0 4px !important;
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
</style>