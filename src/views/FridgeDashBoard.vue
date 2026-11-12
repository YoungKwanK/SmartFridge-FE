<template>
  <div class="fridge-dashboard">
    <DashboardHeader :fridgeId="currentFridgeId" />

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
  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import { useStore } from 'vuex'
import { getFridgeId } from '@/utils/commonDataHandler'
import { freshnessStatus } from '@/utils/foodFreshness'
import DashboardHeader from '@/components/FridgeDashboard/DashboardHeader.vue'
import DashboardStats from '@/components/FridgeDashboard/DashboardStats.vue'
import ExpiringPanel from '@/components/FridgeDashboard/ExpiringPanel.vue'
import FoodPreviewTable from '@/components/FridgeDashboard/FoodPreviewTable.vue'

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
.fridge-dashboard {
  min-height: 100%;
  padding: 32px clamp(16px, 3vw, 40px) 48px;
  background: var(--sf-bg);
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 1280px;
}

.dash-top {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(280px, 1fr);
  gap: 20px;
  align-items: start;
}

@media (max-width: 960px) {
  .dash-top {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .fridge-dashboard {
    padding: 16px 12px 32px;
    gap: 12px;
  }
  .dash-top {
    gap: 12px;
  }
}
</style>
