import { createRouter , createWebHistory} from "vue-router"
import { ChatRouter } from "./ChatRouter";
import { MemberRouter } from "./MemberRouter";
import { NotificationRouter } from "./NotificationRouter";
import MainDashboard from "@/views/MainDashboard.vue";
import LoginPage from "@/views/LoginPage.vue";
import NoFridgePage from "@/views/NoFridgePage.vue";
import { InquiryRouter } from "./InquiryRouter";
import { FoodRouter } from "./FoodRouter";

const routes = [
  {
    path: '/', // 기본 경로 - 로그인 페이지
    name: 'Login',
    component: LoginPage
  },
  {
    path: '/no-fridge', // 참여한 냉장고가 없을 때 페이지
    name: 'NoFridge',
    component: NoFridgePage,
    meta: { requiresAuth: true }
  },
  {
    path: '/dashboard', // 메인 대시보드
    name: 'MainDashboard', 
    component: MainDashboard,
    meta: { requiresAuth: true }
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

// 라우터 가드 - 인증이 필요한 페이지 접근 제어
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);
  const isAuthenticated = localStorage.getItem('accessToken');
  
  // 인증이 필요한 페이지인데 로그인하지 않은 경우
  if (requiresAuth && !isAuthenticated) {
    next('/');
  } 
  // 이미 로그인된 사용자가 로그인/회원가입 페이지에 접근하려는 경우
  else if ((to.path === '/' || to.path === '/member/create') && isAuthenticated) {
    next('/dashboard');
  } 
  else {
    next();
  }
});

export default router;