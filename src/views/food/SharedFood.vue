<template>
  <PageLayout
    title="식품 목록"
    :description="isSharedView ? '멤버 모두가 먹을 수 있는 식품이에요.' : '내가 등록한 개인식품이에요.'"
    width="wide"
  >
    <template #actions>
      <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreateModal">
        식품 등록
      </v-btn>
    </template>

    <!-- 공유 / 개인 전환 -->
    <div class="segmented" role="tablist" aria-label="식품 종류">
      <button
        v-for="option in viewOptions"
        :key="option.value"
        type="button"
        role="tab"
        class="segment"
        :class="{ 'is-on': isSharedView === option.value }"
        :aria-selected="isSharedView === option.value"
        @click="isSharedView !== option.value && onToggleChange()"
      >
        {{ option.label }}
      </button>
    </div>

    <section class="sf-list-panel" aria-label="식품 목록">
      <!-- 유통기한 필터 -->
      <div class="filter-bar">
        <div class="status-filters" role="radiogroup" aria-label="유통기한으로 거르기">
          <button
            v-for="filter in statusFilters"
            :key="filter.value"
            type="button"
            role="radio"
            class="status-chip"
            :class="[`tone-${filter.tone}`, { 'is-on': activeTab === filter.value }]"
            :aria-checked="activeTab === filter.value"
            @click="activeTab = filter.value"
          >
            <span v-if="filter.tone !== 'plain'" class="chip-dot" aria-hidden="true" />
            {{ filter.label }}
          </button>
        </div>

        <div class="search-row">
          <v-select
            v-model="selectedCategory"
            :items="categoryOptions"
            item-title="title"
            item-value="value"
            aria-label="카테고리"
            variant="outlined"
            density="compact"
            hide-details
            class="category-select"
          />
          <v-select
            v-model="selectedStorage"
            :items="storageOptions"
            item-title="title"
            item-value="value"
            aria-label="보관 위치"
            variant="outlined"
            density="compact"
            hide-details
            class="storage-select"
          />
          <v-text-field
            v-model="searchQuery"
            placeholder="식품 이름으로 찾기"
            aria-label="식품 이름으로 찾기"
            variant="outlined"
            density="compact"
            hide-details
            class="search-field"
            prepend-inner-icon="mdi-magnify"
          />
        </div>
      </div>

      <div v-if="isLoading" class="sf-state-box">
        <v-progress-circular indeterminate color="primary" size="36" />
        <p>식품을 불러오는 중이에요</p>
      </div>

      <template v-else-if="filteredFoods.length">
        <div class="list-head" aria-hidden="true">
          <span>식품</span>
          <span class="col-qty">수량</span>
          <span>유통기한</span>
          <span>보관</span>
          <span />
        </div>
        <ul class="food-list">
          <li
            v-for="food in filteredFoods"
            :key="food.id"
            class="food-item"
            :class="`is-${statusOf(food)}`"
          >
            <button type="button" class="item-main" @click="openDetailModal(food)">
              <span class="item-emoji" aria-hidden="true">{{ emojiOf(food) }}</span>
              <span class="item-text">
                <span class="item-name">{{ food.name || '이름 없음' }}</span>
                <span class="item-meta">{{ food.registeredName || '알 수 없음' }}<template v-if="food.storageStartDate">, {{ formatDay(food.storageStartDate) }} 등록</template></span>
              </span>
            </button>
            <span class="col-qty sf-num">{{ food.quantity || 0 }}개</span>
            <span class="col-exp">
              <DdayBadge :expiration-date-time="food.expirationDateTime" />
              <span class="exp-date sf-num">{{ formatDay(food.expirationDateTime) }}</span>
            </span>
            <span class="col-storage">
              <v-icon size="16" aria-hidden="true">{{ storageIconOf(food.storageType) }}</v-icon>
              {{ food.storageType || '미정' }}
            </span>
            <span class="col-actions">
              <v-btn size="small" variant="text" @click="openEditModal(food)">수정</v-btn>
              <v-btn size="small" variant="tonal" color="primary" @click="deleteFood(food)">정리</v-btn>
            </span>
          </li>
        </ul>

        <footer class="list-foot">
          <span class="page-text sf-num">
            <template v-if="isFiltered">전체 {{ foodList.length }}개 중 {{ filteredFoods.length }}개</template>
            <template v-else>총 {{ foodList.length }}개</template>
          </span>
        </footer>
      </template>

      <div v-else class="sf-state-box">
        <p class="sf-empty-title">{{ emptyTitle }}</p>
        <p>{{ emptyHint }}</p>
        <v-btn
          v-if="!isFiltered"
          color="primary"
          variant="flat"
          prepend-icon="mdi-plus"
          class="mt-2"
          @click="openCreateModal"
        >
          식품 등록
        </v-btn>
      </div>
    </section>

    <!-- 식품 등록/수정 모달 -->
    <FoodFormModal
      v-model="isModalOpen"
      :editing-food="selectedFood"
      :read-only="isReadOnly"
      @save="handleSave"
    />

    <!-- 식품 처리 다이얼로그 (다 먹었어요 / 버렸어요 / 잘못 등록했어요) -->
    <FoodFinishDialog
      v-model="deleteDialog"
      :food-name="selectedFood.name || ''"
      :loading="finishingType"
      @select="handleFinish"
      @cancel="deleteDialog = false"
    />

  </PageLayout>
</template>

<script>
import PageLayout from '@/components/layout/PageLayout.vue';
import axios from 'axios';
import FoodFormModal from '@/components/food/FoodFormModal.vue';
import FoodFinishDialog from '@/components/food/FoodFinishDialog.vue';
import { getFridgeId } from '@/utils/commonDataHandler';
import DdayBadge from '@/components/food/DdayBadge.vue';
import { categoryEmoji, freshnessStatus } from '@/utils/foodFreshness';
import { snackbar } from '@/composables/snackbar';

// 처리 선택지별 완료 메시지와 스낵바 색
const FINISH_MESSAGES = {
  소비: { text: '다 먹은 식품으로 기록했어요.', color: 'success' },
  폐기: { text: '버린 식품으로 기록했어요.', color: 'warning' },
  잘못등록: { text: '식품을 삭제했어요.', color: 'error' }
};

export default {
  components: {
    PageLayout,
    FoodFormModal,
    FoodFinishDialog,
    DdayBadge
  },
  data() {
    return {
      foodList: [],
      isModalOpen: false,
      selectedFood: {},
      isReadOnly: false,
      deleteDialog: false,
      finishingType: '', // 처리 요청 중인 선택지 ('소비' | '폐기' | '잘못등록')
      isLoading: false,
      activeTab: 'ALL', // 필터 탭 상태
      selectedCategory: 'ALL', // 카테고리 필터 상태
      selectedStorage: 'ALL', // 보관 위치 필터 상태
      searchQuery: '', // 검색어 상태
      categoryOptions: [{ title: '모든 카테고리', value: 'ALL' }],
      storageOptions: [{ title: '모든 보관 위치', value: 'ALL' }],
      isSharedView: true, // 공유/개인 토글 상태
      fridgeInfo: {}, // 냉장고 정보
    }
  },
  async created() {
    // URL 쿼리 파라미터 확인하여 개인식품 모드로 설정
    if (this.$route.query.mode === 'nonshared') {
      this.isSharedView = false;
    }
    
    // 냉장고 정보 가져오기
    await this.fetchFridgeInfo();
    
    await this.fetchEnums();
    await this.fetchFoodList();
  },
  computed: {
    isManager() {
      return this.fridgeInfo.type === 'MANAGER';
    },
    viewOptions() {
      return [
        { label: '공유식품', value: true },
        { label: '개인식품', value: false }
      ];
    },
    // 백엔드 filterType 값에 맞춘 유통기한 필터
    statusFilters() {
      const filters = [
        { label: '전체', value: 'ALL', tone: 'plain' },
        { label: '3일 이내', value: 'EXPIRES_IN_THREE_DAYS', tone: 'soon' },
        { label: '오늘까지', value: 'EXPIRES_TODAY', tone: 'soon' },
        { label: '만료', value: 'EXPIRED', tone: 'expired' }
      ];
      if (this.isManager) {
        filters.push({ label: '내가 등록한 식품', value: 'MY_FOODS', tone: 'plain' });
      }
      return filters;
    },
    // 화면에서 거르는 조건이 하나라도 걸려 있는지 ('내가 등록한 식품'은 서버에서 거름)
    isFiltered() {
      return (this.activeTab !== 'ALL' && this.activeTab !== 'MY_FOODS')
        || this.selectedCategory !== 'ALL'
        || this.selectedStorage !== 'ALL'
        || this.searchQuery.trim() !== '';
    },
    // 받아 온 식품 전체에서 유통기한, 카테고리, 보관 위치, 이름으로 거른다 (서버 순서: 유통기한이 가까운 순)
    filteredFoods() {
      const keyword = this.searchQuery.trim().toLowerCase();
      return this.foodList.filter(food =>
        this.matchesStatus(food)
        && (this.selectedCategory === 'ALL' || food.category === this.selectedCategory)
        && (this.selectedStorage === 'ALL' || food.storageType === this.selectedStorage)
        && (!keyword || (food.name || '').toLowerCase().includes(keyword))
      );
    },
    emptyTitle() {
      if (this.searchQuery.trim()) return `'${this.searchQuery.trim()}'에 맞는 식품이 없어요`;
      if (this.activeTab === 'EXPIRED') return '만료된 식품이 없어요';
      if (this.activeTab === 'EXPIRES_TODAY' || this.activeTab === 'EXPIRES_IN_THREE_DAYS') return '곧 상하는 식품이 없어요';
      if (this.isFiltered) return '조건에 맞는 식품이 없어요';
      return this.isSharedView ? '공유식품이 아직 없어요' : '개인식품이 아직 없어요';
    },
    emptyHint() {
      if (this.searchQuery.trim() || this.selectedCategory !== 'ALL' || this.selectedStorage !== 'ALL') {
        return '검색어, 카테고리, 보관 위치를 바꿔 보세요.';
      }
      if (this.activeTab !== 'ALL') return '다른 필터를 골라 전체 식품을 볼 수 있어요.';
      return this.isSharedView
        ? '함께 먹을 식품을 등록하면 멤버 모두에게 보여요.'
        : '식품을 등록하면 유통기한을 대신 챙겨드려요.';
    }
  },
  watch: {
    // '내가 등록한 식품'은 서버가 범위를 정하므로 그 탭을 켜고 끌 때만 다시 불러온다
    activeTab(next, prev) {
      if (next === 'MY_FOODS' || prev === 'MY_FOODS') {
        this.fetchFoodList();
      }
    }
  },
  methods: {
    async fetchEnums() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/enums`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // 백엔드에서 가져온 카테고리, 보관 위치에 '전체' 옵션 추가
        this.categoryOptions = [
          { title: '모든 카테고리', value: 'ALL' },
          ...response.data.categories
        ];
        this.storageOptions = [
          { title: '모든 보관 위치', value: 'ALL' },
          ...response.data.storageTypes
        ];
      } catch (error) {
        console.error("카테고리·보관 위치 목록을 불러오는 데 실패했습니다.", error);
      }
    },
    async fetchFoodList() {
      try {
        this.isLoading = true;
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) {
          console.warn('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.$router.push('/fridge/list');
          return;
        }

        // 공유/개인 식품을 한 번에 전부 받아 오고, 나머지 필터는 화면에서 거른다
        // viewAll: 관리자가 '내가 등록한 식품'을 고르면 false (다른 멤버 식품 제외)
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/food/list`, {
          params: {
            isShared: this.isSharedView,
            viewAll: this.activeTab !== 'MY_FOODS'
          }
        });
        this.foodList = response.data.result || [];
      } catch (error) {
        console.error('식품 목록 조회 실패:', error);
        this.foodList = [];
      } finally {
        this.isLoading = false;
      }
    },
    openCreateModal() {
      this.selectedFood = {
        name: '',
        quantity: 1,
        storageStartDate: '',
        expirationDateTime: '',
        storageType: '',
        category: '',
        shareable: this.isSharedView
      };
      this.isReadOnly = false;
      this.isModalOpen = true;
    },
    openEditModal(food) {
      this.selectedFood = { ...food };
      this.isReadOnly = false;
      this.isModalOpen = true;
    },
    openDetailModal(food) {
      this.selectedFood = { ...food };
      this.isReadOnly = true;
      this.isModalOpen = true;
    },
    async handleSave(foodData) {
      try {
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) { 
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.'); 
          return; 
        }
        let response;
        // 수정은 식품 하나(객체), 등록은 식품 목록(배열)으로 들어옴
        if (!Array.isArray(foodData) && foodData.id) {
          response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/food/update/${foodData.id}`, foodData);
          console.log('식품 수정 성공:', response.data);
          snackbar.success('식품이 성공적으로 수정되었습니다.');
        } else {
          response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/food/register`, foodData);
          console.log('식품 등록 성공:', response.data);
          snackbar.success(`식품 ${foodData.length}개가 성공적으로 등록되었습니다.`);
        }
        await this.fetchFoodList();
      } catch (error) {
        console.error('식품 저장 실패:', error);
        snackbar.error('식품 저장에 실패했습니다: ' + this.getErrorMessage(error));
      }
    },
    async deleteFood(food) {
      this.selectedFood = food;
      this.deleteDialog = true;
    },
    // type: '소비' | '폐기' → 기록을 남기고 삭제, '잘못등록' → 기록 없이 삭제
    async handleFinish(type) {
      if (this.finishingType) return;
      const fridgeId = getFridgeId(this.$store);
      if (!fridgeId) {
        console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
        return;
      }
      const baseUrl = `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/food`;
      this.finishingType = type;
      try {
        if (type === '잘못등록') {
          await axios.delete(`${baseUrl}/delete/${this.selectedFood.id}`);
        } else {
          await axios.post(`${baseUrl}/finish/${this.selectedFood.id}`, { result: type });
        }
        this.deleteDialog = false;
        this.selectedFood = {};
        await this.fetchFoodList();
        const done = FINISH_MESSAGES[type];
        this.showSnackbar(done.text, done.color);
      } catch (error) {
        console.error('식품 처리 실패:', error);
        snackbar.error('식품 처리에 실패했습니다: ' + this.getErrorMessage(error));
      } finally {
        this.finishingType = '';
      }
    },
    // 백엔드 오류 응답(CommonErrorDto)의 status_message를 우선 보여준다
    getErrorMessage(error) {
      return error.response?.data?.status_message || error.response?.data?.message || error.message;
    },
    formatDate(dateString) {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },
    formatDay(dateString) {
      if (!dateString) return '';
      const date = new Date(dateString);
      return `${date.getMonth() + 1}월 ${date.getDate()}일`;
    },
    statusOf(food) {
      return freshnessStatus(food.expirationDateTime);
    },
    emojiOf(food) {
      return categoryEmoji(food.category);
    },
    storageIconOf(storageType) {
      if (storageType === '냉동') return 'mdi-snowflake';
      if (storageType === '실온') return 'mdi-thermometer';
      return 'mdi-fridge-outline';
    },
    // 유통기한 탭 조건 (백엔드 FoodFilterType과 같은 기준)
    matchesStatus(food) {
      if (this.activeTab === 'ALL' || this.activeTab === 'MY_FOODS') return true;
      if (!food.expirationDateTime) return false;
      const exp = new Date(food.expirationDateTime);
      const now = new Date();
      const startOfDay = offset => new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
      if (this.activeTab === 'EXPIRED') return exp < now;
      if (this.activeTab === 'EXPIRES_TODAY') return exp >= startOfDay(0) && exp <= startOfDay(1);
      if (this.activeTab === 'EXPIRES_IN_THREE_DAYS') return exp >= now && exp <= startOfDay(3);
      return true;
    },
    onToggleChange() {
      this.isSharedView = !this.isSharedView;
      
      // URL 쿼리 파라미터 업데이트
      const query = { ...this.$route.query };
      if (this.isSharedView) {
        delete query.mode;
      } else {
        query.mode = 'nonshared';
      }
      
      // URL 업데이트 (브라우저 히스토리에 추가하지 않음)
      this.$router.replace({ query });

      this.fetchFoodList();
    },
    // 냉장고 정보 가져오기
    async fetchFridgeInfo() {
      try {
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) {
          console.warn('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          return;
        }
        
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/detail`);
        if (response.data.result) {
          this.fridgeInfo = response.data.result;
          console.log('냉장고 정보 로딩 완료:', this.fridgeInfo);
        }
      } catch (error) {
        console.error('냉장고 정보 로딩 실패:', error);
      }
    },
    
    // Snackbar 메시지 표시
    showSnackbar(message, color) {
      snackbar.show(message, color);
    }
  }
}
</script>

<style scoped>
/* 공유 / 개인 전환 */
.segmented {
  display: inline-flex;
  align-self: flex-start;
  padding: 4px;
  border-radius: var(--sf-radius-md);
  background: #ECEEF2;
}

.segment {
  min-width: 96px;
  height: 36px;
  padding: 0 16px;
  border: none;
  border-radius: var(--sf-radius-sm);
  background: transparent;
  font: inherit;
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-text-sub);
  cursor: pointer;
}

.segment.is-on {
  background: var(--sf-surface);
  color: var(--sf-text);
  box-shadow: 0 1px 3px rgba(34, 34, 34, 0.08);
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--sf-line);
}

.status-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.status-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--sf-line-strong);
  border-radius: 999px;
  background: var(--sf-surface);
  font: inherit;
  font-size: var(--sf-fs-md);
  font-weight: 500;
  color: var(--sf-text-sub);
  cursor: pointer;
}

.status-chip:hover {
  border-color: var(--sf-text-faint);
}

.status-chip.is-on {
  border-color: var(--sf-text);
  background: var(--sf-text);
  color: #fff;
  font-weight: 600;
}

.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.tone-soon .chip-dot { background: var(--sf-soon); }
.tone-expired .chip-dot { background: var(--sf-expired); }

.search-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1 1 480px;
  max-width: 640px;
}

.category-select {
  flex: 0 0 172px;
}

.storage-select {
  flex: 0 0 156px;
}

.search-field {
  flex: 1 1 180px;
}

/* 목록: 데스크톱은 열 정렬, 모바일은 두 줄 */
.list-head,
.food-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 64px 180px 80px 128px;
  align-items: center;
  gap: 12px;
  padding: 0 20px;
}

.list-head {
  height: 40px;
  font-size: var(--sf-fs-sm);
  font-weight: 500;
  color: var(--sf-text-faint);
  border-bottom: 1px solid var(--sf-line);
}

.food-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.food-item {
  min-height: 68px;
  border-bottom: 1px solid var(--sf-line);
}

.food-item:hover {
  background: #FAFBFC;
}

.item-main {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
  padding: 12px 0;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.item-emoji {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--sf-bg);
  font-size: 22px;
}

.item-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.item-name {
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.item-main:hover .item-name {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.is-expired .item-name {
  color: var(--sf-expired-ink);
}

.item-meta {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.col-qty {
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.col-exp {
  display: flex;
  align-items: center;
  gap: 10px;
}

.exp-date {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
  white-space: nowrap;
}

.col-storage {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.col-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}

.list-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
}

.page-text {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
  white-space: nowrap;
}

.sf-state-box {
  padding: 64px 24px;
}

@media (max-width: 960px) {
  .list-head {
    display: none;
  }

  /* 이름 줄 아래에 수량·유통기한·보관·버튼을 한 줄로 */
  .food-item {
    grid-template-columns: auto auto 1fr auto;
    grid-template-areas:
      'main main main main'
      'exp qty storage actions';
    gap: 4px 12px;
    padding: 4px 16px 12px;
  }

  .item-main { grid-area: main; padding-bottom: 4px; }
  .col-exp { grid-area: exp; }
  .col-qty { grid-area: qty; }
  .col-storage { grid-area: storage; }
  .col-actions { grid-area: actions; }

  .col-exp .exp-date {
    display: none;
  }

  .search-row {
    max-width: none;
  }
}

@media (max-width: 600px) {
  .filter-bar {
    padding: 12px 16px;
  }

  .status-filters {
    flex-wrap: nowrap;
    overflow-x: auto;
    margin: 0 -16px;
    padding: 0 16px 2px;
    scrollbar-width: none;
  }

  .status-chip {
    flex-shrink: 0;
  }

  .category-select,
  .storage-select {
    flex: 1 1 140px;
  }

  .list-foot {
    flex-direction: column;
  }
}
</style>
