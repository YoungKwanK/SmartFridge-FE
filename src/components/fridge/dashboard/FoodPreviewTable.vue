<template>
  <div class="recent-section">
    <section
      v-for="group in groups"
      :key="group.key"
      class="recent-panel"
      :aria-labelledby="`recent-${group.key}`"
    >
      <header class="panel-head">
        <h2 :id="`recent-${group.key}`" class="sf-panel-title">{{ group.title }}</h2>
        <div class="panel-actions">
          <v-btn
            variant="text"
            color="primary"
            size="small"
            @click="group.goToList"
          >
            전체 보기
          </v-btn>
          <!-- 폰 폭에서는 제목이 한 줄에 들어가도록 아이콘 버튼으로 줄인다 -->
          <v-btn
            v-if="isPhone"
            color="primary"
            variant="flat"
            size="small"
            icon="mdi-plus"
            :aria-label="group.isShared ? '공유식품 등록' : '개인식품 등록'"
            @click="openFoodModal(group.isShared)"
          />
          <v-btn
            v-else
            color="primary"
            variant="flat"
            size="small"
            prepend-icon="mdi-plus"
            @click="openFoodModal(group.isShared)"
          >
            식품 등록
          </v-btn>
        </div>
      </header>

      <div v-if="loading" class="panel-loading">
        <v-progress-linear indeterminate color="primary" rounded />
      </div>
      <ul v-else-if="group.foods.length" class="food-list">
        <FoodRow v-for="food in group.foods" :key="food.id" :food="food" />
      </ul>
      <p v-else class="panel-empty">{{ group.empty }}</p>
    </section>

    <FoodFormModal
      v-model="isFoodModalOpen"
      :editing-food="selectedFood"
      @save="handleFoodSave"
    />

  </div>
</template>

<script setup>
import axios from 'axios';
import { computed, ref } from 'vue';
import { useDisplay } from 'vuetify';
import router from '@/router';
import FoodFormModal from '@/components/food/FoodFormModal.vue';
import FoodRow from '@/components/food/FoodRow.vue';
import { snackbar } from '@/composables/snackbar';

const props = defineProps({
  fridgeId: {
    type: String,
    required: true
  },
  personalFoods: { type: Array, default: () => [] },
  sharedFoods: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
});

const emit = defineEmits(['food-saved']);

// 600px 미만(xs)
const { xs: isPhone } = useDisplay();

const isFoodModalOpen = ref(false);
const selectedFood = ref({});

const goToSharedFoodList = () => {
  router.push(`/fridge/food/shared`);
};

const goToNonsharedFoodList = () => {
  // 전체식품 페이지로 이동하면서 개인식품 모드로 설정
  router.push({
    path: `/fridge/food/shared`,
    query: { mode: 'nonshared' }
  });
};

const groups = computed(() => [
  {
    key: 'personal',
    title: '최근 등록한 개인식품',
    isShared: false,
    foods: props.personalFoods,
    empty: '아직 등록한 개인식품이 없어요. 식품을 등록하면 유통기한을 대신 챙겨드려요.',
    goToList: goToNonsharedFoodList
  },
  {
    key: 'shared',
    title: '최근 등록한 공유식품',
    isShared: true,
    foods: props.sharedFoods,
    empty: '함께 먹을 공유식품이 없어요. 나눠 먹을 식품을 등록해 보세요.',
    goToList: goToSharedFoodList
  }
]);

// 식품 등록 모달 열기 (부모 컴포넌트에서 editingFood prop으로 초기화)
const openFoodModal = (isShared) => {
  selectedFood.value = {
    name: '',
    quantity: 1,
    storageStartDate: '',
    expirationDateTime: '',
    storageType: '',
    category: '',
    shareable: isShared
  };
  isFoodModalOpen.value = true;
};

// 식품 저장 처리 (foodData는 식품 목록 배열)
const handleFoodSave = async (foodData) => {
  try {
    if (!props.fridgeId) {
      console.warn('Props에서 냉장고 ID를 찾을 수 없습니다.');
      return;
    }

    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/fridge/${props.fridgeId}/food/register`, foodData);

    snackbar.success(`식품 ${foodData.length}개를 등록했어요.`);

    // 부모가 목록과 통계를 다시 불러온다
    emit('food-saved');
  } catch (error) {
    console.error('식품 등록에 실패했습니다:', error);
    if (error.response?.data?.message) {
      console.error('API 에러 메시지:', error.response.data.message);
    }
  }
};
</script>

<style scoped>
.recent-section {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.recent-panel {
  background: var(--sf-surface);
  border-radius: var(--sf-radius-lg);
  box-shadow: var(--sf-shadow);
  padding: 20px 24px 8px;
}

.panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 4px;
}

/* 제목은 한 줄로 두고, 그래도 좁으면 말줄임 */
.panel-head .sf-panel-title {
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.panel-actions {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.food-list {
  padding: 0;
  margin: 0;
}

.panel-loading {
  padding: 24px 0;
}

.panel-empty {
  margin: 12px 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--sf-text-sub);
}

@media (max-width: 1100px) {
  .recent-section {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 600px) {
  .recent-panel {
    padding: 16px 16px 4px;
  }
}
</style>
