import FoodList from "@/views/FoodList.vue";
import FridgeList from "@/views/FridgeList.vue";
import FridgeDashboard from "@/views/FridgeDashBoard.vue";

export const FoodRouter = [
    {
        path:'/food/list',
        name: 'FoodList',
        component: FoodList
      },
      {
        path:'/fridge/list',
        name: 'FridgeList',
        component: FridgeList
      },
      {
        path:'/fridge/:id/dashboard',
        name: 'FridgeDashboard',
        component: FridgeDashboard
      }
]