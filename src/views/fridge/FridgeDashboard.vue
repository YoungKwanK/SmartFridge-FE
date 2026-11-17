<template>
  <PageLayout width="wide">
    <template #head>
      <DashboardHeader :fridgeId="currentFridgeId" :show-notice-write="showNoticeWrite" />
    </template>

    <NoticeBanner :notices="notices" :total="noticeTotal" />

    <div class="dash-top">
      <ExpiringPanel :foods="expiringFoods" :loading="loading" />
      <DashboardStats :fridgeId="currentFridgeId" :key="refreshKey" />
    </div>

    <FoodPreviewTable
      :fridgeId="currentFridgeId"
      :personal-foods="recentPersonal"
      :shared-foods="recentShared"
      :loading="loading"
      @food-saved="handleFoodSaved"
    />
  </PageLayout>
</template>

<script setup>
import PageLayout from '@/components/layout/PageLayout.vue';
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { NOTICE_CATEGORY } from '@/utils/postCategory'
import { getFridgeId } from '@/utils/commonDataHandler'
import { freshnessStatus } from '@/utils/foodFreshness'
import DashboardHeader from '@/components/fridge/dashboard/DashboardHeader.vue'
import DashboardStats from '@/components/fridge/dashboard/DashboardStats.vue'
import ExpiringPanel from '@/components/fridge/dashboard/ExpiringPanel.vue'
import FoodPreviewTable from '@/components/fridge/dashboard/FoodPreviewTable.vue'
import NoticeBanner from '@/components/fridge/dashboard/NoticeBanner.vue'

const store = useStore()
// 현재 선택된 냉장고 ID를 Vuex store에서 가져오기
const currentFridgeId = computed(() => getFridgeId(store))

// 통계 컴포넌트를 다시 그리기 위한 키
const refreshKey = ref(0)

const loading = ref(true)
const recentPersonal = ref([])
const recentShared = ref([])
const expiringFoods = ref([])

const RECENT_SIZE = 5

// 공지 배너용 공지 목록 (고정 글이 먼저, 그다음 최신순)
const notices = ref([])
const noticeTotal = ref(0)
const noticesLoaded = ref(false)
const NOTICE_SIZE = 10

// 공지가 하나도 없을 때만 관리자 머리말에 '공지 쓰기'를 보여준다 (있으면 배너에서 들어가 쓴다)
const isManager = computed(() => store.getters.getCurrentFridgeInfo?.type === 'MANAGER')
const showNoticeWrite = computed(() => isManager.value && noticesLoaded.value && noticeTotal.value === 0)

const fetchNotices = async () => {
  try {
    const response = await axios.get(
      `${import.meta.env.VITE_API_BASE_URL}/fridge/${currentFridgeId.value}/post/list`,
      { params: { page: 0, size: NOTICE_SIZE, category: NOTICE_CATEGORY } }
    )
    notices.value = response.data?.result?.content || []
    noticeTotal.value = response.data?.result?.totalElements || 0
    noticesLoaded.value = true
  } catch (error) {
    console.error('공지사항을 불러오는데 실패했습니다:', error)
  }
}

// 식품 목록 API는 페이징 없이 전부(유통기한이 가까운 순) 돌려준다
const fetchFoodList = async (isShared) => {
  const response = await axios.get(
    `${import.meta.env.VITE_API_BASE_URL}/fridge/${currentFridgeId.value}/food/list`,
    { params: { isShared } }
  )
  return response.data?.result || []
}

// 최근 등록한 순서 (id가 클수록 나중에 등록)
const latestFirst = (foods) => [...foods].sort((a, b) => b.id - a.id).slice(0, RECENT_SIZE)

// 최근 등록 목록과 '먼저 확인할 식품' 목록을 함께 불러온다
const fetchFoods = async () => {
  if (!currentFridgeId.value) return
  loading.value = true
  try {
    const [personal, shared] = await Promise.all([
      fetchFoodList(false),
      fetchFoodList(true)
    ])
    recentPersonal.value = latestFirst(personal)
    recentShared.value = latestFirst(shared)

    const now = new Date()
    expiringFoods.value = [...personal, ...shared]
      .filter(food => ['expired', 'soon'].includes(freshnessStatus(food.expirationDateTime, now)))
      .sort((a, b) => new Date(a.expirationDateTime) - new Date(b.expirationDateTime))
  } catch (error) {
    console.error('식품 목록을 불러오는데 실패했습니다:', error)
  } finally {
    loading.value = false
  }
}

// 식품을 등록하면 목록과 통계를 모두 새로 고친다
const handleFoodSaved = () => {
  refreshKey.value++
  fetchFoods()
}

onMounted(async () => {
  if (!currentFridgeId.value) {
    console.warn('선택된 냉장고가 없습니다.')
    return
  }

  fetchFoods()
  fetchNotices()

  // SSE 연결이 없으면 초기화
  const isSSEConnected = store.getters['notification/isSSEConnected'];
  if (!isSSEConnected) {
    await store.dispatch('notification/initSSE');
  }

  // 냉장고 진입 시 채팅 목록 조회하여 배지 상태 업데이트 (그룹 채팅만, MANAGER_CHAT 배지 보호)
  await store.dispatch('notification/updateChatBadgesOnFridgeEnter', currentFridgeId.value)
})
</script>

<style scoped>
.dash-top {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: var(--sf-section-gap);
  align-items: start;
}

@media (max-width: 960px) {
  .dash-top {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
