import { createRouter, createWebHistory } from 'vue-router';
import { authGuard, reconnectSSE } from './guards';
import { mainRoutes } from './routes/main';
import { authRoutes } from './routes/auth';
import { fridgeRoutes } from './routes/fridge';
import { communityRoutes } from './routes/community';
import { chatRoutes } from './routes/chat';
import { mypageRoutes } from './routes/mypage';
import { adminRoutes } from './routes/admin';

// meta.requiresAuth  : 로그인 필요
// meta.requiresAdmin : 관리자만
// meta.hideSidebar   : 왼쪽 사이드바를 숨기는 화면 (App.vue에서 사용)
const routes = [
  ...mainRoutes,
  ...authRoutes,
  ...fridgeRoutes,
  ...communityRoutes,
  ...chatRoutes,
  ...mypageRoutes,
  ...adminRoutes
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(authGuard);
router.afterEach(reconnectSSE);

export default router;
