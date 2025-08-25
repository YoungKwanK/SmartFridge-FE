import ChatPage from "@/views/ChatPage.vue";


export const ChatRouter = [
  {
    path:'/chatpage/:fridgeId',
    name: 'ChatPage',
    component: ChatPage,
  },
]