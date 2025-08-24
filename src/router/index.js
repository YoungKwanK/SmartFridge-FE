import { createRouter , createWebHistory} from "vue-router"
import { ChatRouter } from "./ChatRouter";
import { MemberRouter } from "./MemberRouter";
import { NotificationRouter } from "./NotificationRouter";
import MainDashboard from "@/views/MainDashboard.vue";
import { InquiryRouter } from "./InquiryRouter";
import { FoodRouter } from "./FoodRouter";

const routes = [
  {
    path: '/', // 기본 경로
    name: 'MainDashboard',
    component: MainDashboard
  },
  ...MemberRouter,
  ...ChatRouter,
  ...NotificationRouter,
  ...InquiryRouter,
  ...FoodRouter
]

const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

// 전역 네비게이션 가드 추가
router.beforeEach((to, from, next) => {
  console.log('라우터 이동:', from.path, '->', to.path);
  
  // SSE 연결 상태 확인 및 필요시 재연결
  const store = window.$store || window.__VUE_DEVTOOLS_GLOBAL_HOOK__?.Vue?.prototype?.$store;
  if (store) {
    const isConnected = store.getters['notification/isSSEConnected'];
    if (!isConnected) {
      console.log('라우터 가드: SSE 연결이 끊어짐, 재연결 시도...');
      store.dispatch('notification/initSSE', store);
    }
  }
  
  next();
});

export default router;