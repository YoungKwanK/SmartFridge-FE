import NonsharedFood from "@/views/NonsharedFood.vue";
import FridgeList from "@/views/FridgeList.vue";
import FridgeDashboard from "@/views/FridgeDashBoard.vue";
import SharedFood from "@/views/SharedFood.vue";

export const FoodRouter = [
  {
    path: '/fridge/:fridgeId/food/nonshared',
    name: 'NonsharedFood',
    component: NonsharedFood
  },
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
  
]