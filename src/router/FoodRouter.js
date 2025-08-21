import FoodList from "@/views/FoodList.vue";
import FridgeList from "@/views/FridgeList.vue";

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
      }
]