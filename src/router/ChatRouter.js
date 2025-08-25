import GroupChat from "@/components/chat/GroupChatList.vue";
import MyChatPage from "@/components/chat/MyChatPage.vue";
import StompChatPage from "@/components/chat/StompChatPage.vue";
import ChatPage from "@/views/ChatPage.vue";


export const ChatRouter = [
  {
    path:'/chatpage/:fridgeId',
    name: 'ChatPage',
    component: ChatPage,
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