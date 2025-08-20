import GroupChattingList from "@/views/GroupChattingList.vue";
import MyChatPage from "@/views/MyChatPage.vue";
import SimpleWebSocket from "@/views/SimpleWebSocket.vue";
import StompChatPage from "@/views/StompChatPage.vue";


export const chattingRouter = [
  {
    path:'/simple/chat',
    name: 'SimpleWebSocket',
    component: SimpleWebSocket
  },
  {
    path:'/chatpage/:roomId',
    name: 'StompChatPage',
    component: StompChatPage
  },
  {
    path:'/groupchatting/list',
    name: 'GroupChattingList',
    component: GroupChattingList
  },
  {
    path:'/my/chat/page',
    name: 'MyChatPage',
    component: MyChatPage
  }
]