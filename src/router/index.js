import { createRouter , createWebHistory} from "vue-router"
import { ChatRouter } from "./ChatRouter";
import { MemberRouter } from "./MemberRouter";
import MainDashboard from "@/views/MainDashboard.vue";

const routes = [
  {
    path: '/', // 기본 경로
    name: 'MainDashboard',
    component: MainDashboard
  },
  ...MemberRouter,
  ...ChatRouter,
  ...FoodRouter,
]

const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

export default router;