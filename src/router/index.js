import { createRouter , createWebHistory} from "vue-router"
import { ChatRouter } from "./ChatRouter";
import { MemberRouter } from "./MemberRouter";

const routes = [
  ...MemberRouter,
  ...ChatRouter,
]

const router = createRouter(
    {
        history: createWebHistory(),
        routes
    }
)

export default router;