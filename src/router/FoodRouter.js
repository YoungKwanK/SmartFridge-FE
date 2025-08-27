import FridgeList from "@/views/FridgeList.vue";
import FridgeDashboard from "@/views/FridgeDashBoard.vue";
import SharedFood from "@/views/SharedFood.vue";
import FridgeMemberList from "@/views/FridgeMemberList.vue";

export const FoodRouter = [
  {
    path: '/fridge/list',
    name: 'FridgeList',
    component: FridgeList,
    meta: { requiresAuth: true }
  },
  {
    path: '/fridge/:fridgeId/dashboard',
    name: 'FridgeDashboard',
    component: FridgeDashboard
  },
  {
    path: '/fridge/:fridgeId/food/shared',
    name: 'SharedFood',
    component: SharedFood
  },
  {
    path: '/fridge/:fridgeId/member/list',
    name: 'FridgeMemberList',
    component: FridgeMemberList
  },
  
]