import { createRouter , createWebHistory} from "vue-router"
import { chattingRouter } from "./chattingRouter";
import { MemberRouter } from "./MemberRouter";

const routes = [
  ...MemberRouter,
  ...chattingRouter,
]

const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

export default router;