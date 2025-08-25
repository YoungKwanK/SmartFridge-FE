import NonsharedFood from "@/views/NonsharedFood.vue";
import FridgeList from "@/views/FridgeList.vue";
import FridgeDashboard from "@/views/FridgeDashBoard.vue";
import SharedFood from "@/views/SharedFood.vue";
import FridgeMemberList from "@/views/FridgeMemberList.vue";

export const FoodRouter = [
  {
    path: '/fridge/:fridgeId/food/nonshared',
    name: 'NonsharedFood',
    component: NonsharedFood
  },
  {
    path: '/fridge/list',
    name: 'FridgeList',
    component: FridgeList
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