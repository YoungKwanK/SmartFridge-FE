import { createRouter , createWebHistory} from "vue-router"
import { ChatRouter } from "./ChatRouter";
import { MemberRouter } from "./MemberRouter";
import { NotificationRouter } from "./NotificationRouter";

const routes = [
  ...MemberRouter,
  ...chattingRouter,
  ...NotificationRouter,
]

const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

export default router;