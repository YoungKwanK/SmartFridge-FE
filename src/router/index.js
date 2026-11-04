import { createRouter , createWebHistory} from "vue-router"
import { ChatRouter } from "./ChatRouter";
import { MemberRouter } from "./MemberRouter";
import { NotificationRouter } from "./NotificationRouter";
import { AdminRouter } from "./AdminRouter";
import MainDashboard from "@/views/MainDashboard.vue";
import LoginPage from "@/views/LoginPage.vue";
import MyPage from "@/views/MyPage.vue";
import { InquiryRouter } from "./InquiryRouter";
import { FridgeRouter } from "./FridgeRouter";
import { CommunityRouter } from "./CommunityRouter";

const routes = [
  {
    path: '/', // 기본 경로 - 메인 대시보드
    name: 'MainDashboard',
    component: MainDashboard
  },
  {
    path: '/login', // 로그인 페이지
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/mypage', // 마이페이지
    name: 'MyPage',
    component: MyPage,
    meta: { requiresAuth: true }
  },
  ...MemberRouter,
  ...ChatRouter,
  ...NotificationRouter,
  ...InquiryRouter,
  ...FridgeRouter,
  ...CommunityRouter,
  ...AdminRouter
]

const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

// 라우터 가드 - 인증이 필요한 페이지 접근 제어
// (vue-router 5에서 next() 콜백 방식이 deprecated 되어 반환값 방식으로 변경)
router.beforeEach((to) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin);
  const isAuthenticated = localStorage.getItem('accessToken');
  const userRole = localStorage.getItem('role') || 'USER';

  // 인증이 필요한 페이지인데 로그인하지 않은 경우
  if (requiresAuth && !isAuthenticated) {
    return '/';
  }
  // 관리자 권한이 필요한 페이지인데 관리자가 아닌 경우
  if (requiresAdmin && userRole !== 'ADMIN') {
    return '/';
  }
  // 이미 로그인된 사용자가 로그인 페이지에 접근하려는 경우
  if ((to.path === '/login' || to.path === '/admin/login') && isAuthenticated) {
    // 관리자인 경우 관리자 대시보드로, 일반 사용자인 경우 냉장고 목록으로
    return userRole === 'ADMIN' ? '/admin' : '/fridge/list';
  }
  return true;
});

// SSE 연결 상태 확인 및 필요시 재연결 (기존: next() 호출 후 실행 → afterEach로 이동)
router.afterEach(() => {
  const isAuthenticated = localStorage.getItem('accessToken');
  const store = window.$store;
  if (store && isAuthenticated) {
    const isConnected = store.getters['notification/isSSEConnected'];
    if (!isConnected) {
      store.dispatch('notification/initSSE', store);
    }
  }
});

export default router;