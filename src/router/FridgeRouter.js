import FridgeList from "@/views/FridgeList.vue";
import FridgeDashboard from "@/views/FridgeDashBoard.vue";
import SharedFood from "@/views/SharedFood.vue";
import FridgeMemberList from "@/views/FridgeMemberList.vue";
import InvitePage from "@/views/InvitePage.vue";

export const FridgeRouter = [
  {
    path: '/fridge/list',
    name: 'FridgeList',
    component: FridgeList,
    meta: { requiresAuth: true }
  },
  {
    path: '/fridge/dashboard',
    name: 'FridgeDashboard',
    component: FridgeDashboard
  },
  {
    path: '/fridge/food/shared',
    name: 'SharedFood',
    component: SharedFood
  },
  {
    path: '/fridge/member/list',
    name: 'FridgeMemberList',
    component: FridgeMemberList
  },
  {
    // 로그인 여부는 InvitePage에서 확인 (가드에 막히면 초대 코드를 저장하지 못함)
    path: '/invite/:code',
    name: 'Invite',
    component: InvitePage
  },
]
