import GoogleRedirect from "@/views/GoogleRedirect.vue";
import KakaoRedirect from "@/views/KakaoRedirect.vue";
import LoginPage from "@/views/LoginPage.vue";
import NaverRedirect from "@/views/NaverRedirect.vue";

export const MemberRouter = [
  {
    path:'/login',
    name: 'LoginPage',
    component: LoginPage
  },
  {
    // 관리자 전용 이메일/비밀번호 로그인
    path:'/admin/login',
    name: 'AdminLoginPage',
    component: LoginPage
  },
  {
    path:'/oauth/google/redirect',
    name: 'GoogleRedirect',
    component: GoogleRedirect
  },
  {
    path:'/oauth/kakao/redirect',
    name: 'KakaoRedirect',
    component: KakaoRedirect
  },
  {
    path:'/oauth/naver/redirect',
    name: 'NaverRedirect',
    component: NaverRedirect
  }
]
