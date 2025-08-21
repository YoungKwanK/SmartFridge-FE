import { createRouter, createWebHashHistory} from "vue-router"
import MemberCreate from "@/views/MemberCreate.vue"
import LoginPage from "@/views/LoginPage.vue";
import MemberList from "@/views/MemberList.vue"
import SimpleWebSocket from "@/views/SimpleWebSocket.vue"
import StompChatPage from "@/views/StompChatPage.vue"
import GroupChattingList from "@/views/GroupChattingList.vue";
import MyChatPage from "@/views/MyChatPage.vue";
import FoodList from "@/views/FoodList.vue";
import FridgeList from "@/views/FridgeList.vue";

const routes = [
  {
    path:'/member/create',
    name: 'MemberCreate',
    component: MemberCreate
  },
  {
    path:'/login',
    name: 'LoginPage',
    component: LoginPage
  },
  {
    path:'/member/list',
    name: 'MemberList',
    component: MemberList
  },
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
  },
  {
    path:'/food/list',
    name: 'FoodList',
    component: FoodList
  },
  {
    path:'/fridge/list',
    name: 'FridgeList',
    component: FridgeList
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

export default router;