import GoogleRedirect from "@/views/GoogleRedirect.vue";
import KakaoRedirect from "@/views/KakaoRedirect.vue";
import LoginPage from "@/views/LoginPage.vue";
import MemberCreate from "@/views/MemberCreate.vue";
import MemberList from "@/views/MemberList.vue";
import NaverRedirect from "@/views/NaverRedirect.vue";

export const MemberRouter = [

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
  },
  {
    path:'/member/list',
    name: 'MemberList',
    component: MemberList
  }

]