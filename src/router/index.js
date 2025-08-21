import { createRouter , createWebHistory} from "vue-router"
import { ChatRouter } from "./ChatRouter";
import { MemberRouter } from "./MemberRouter";
import { FoodRouter } from "./FoodRouter";

const routes = [
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