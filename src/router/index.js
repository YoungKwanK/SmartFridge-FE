import { createRouter , createWebHistory} from "vue-router"
import { ChatRouter } from "./ChatRouter";
import { MemberRouter } from "./MemberRouter";
import { NotificationRouter } from "./NotificationRouter";
import MainDashboard from "@/views/MainDashboard.vue";
import { InquiryRouter } from "./InquiryRouter";

const routes = [
  {
    path: '/', // 기본 경로
    name: 'MainDashboard',
    component: MainDashboard
  },
  ...MemberRouter,
  ...ChatRouter,
  ...NotificationRouter,
  ...InquiryRouter,
]

const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

export default router;