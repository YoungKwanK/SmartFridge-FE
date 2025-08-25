import CommunityPage from '../views/CommunityPage.vue'
import PostDetailPage from '../views/PostDetailPage.vue'

export const CommunityRouter = [
  {
    path: '/fridge/:fridgeId/community',
    name: 'Community',
    component: CommunityPage
  },
  {
    path: '/fridge/:fridgeId/post/:postId',
    name: 'PostDetail',
    component: PostDetailPage
  }
]
