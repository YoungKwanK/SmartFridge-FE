import GroupChat from "@/views/GroupChatList.vue";
import MyChatPage from "@/views/MyChatPage.vue";
import SimpleWebSocket from "@/views/SimpleWebSocket.vue";
import StompChatPage from "@/views/StompChatPage.vue";


export const ChatRouter = [
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
    path:'/groupchat/list',
    name: 'GroupChatList',
    component: GroupChat
  },
  {
    path:'/my/chat/page',
    name: 'MyChatPage',
    component: MyChatPage
  }
]