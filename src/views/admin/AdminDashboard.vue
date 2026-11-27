<template>
  <PageLayout title="관리자 대시보드" width="wide" class="admin-dashboard">
    <template #actions>
      <v-btn
        color="primary"
        variant="flat"
        prepend-icon="mdi-download"
        :loading="importing"
        @click="importRecipes"
      >
        레시피 가져오기
      </v-btn>
    </template>

    <div class="dashboard-stats">
      <div class="stat-card">
        <h3>총 문의 수</h3>
        <p>{{ inquiryCount }}</p>
      </div>
      <div class="stat-card">
        <h3>미답변 문의</h3>
        <p>{{ unansweredCount }}</p>
      </div>
      <div class="stat-card">
        <h3>총 사용자 수</h3>
        <p>{{ userCount }}</p>
      </div>
      <div class="stat-card">
        <h3>새 알림</h3>
        <p>{{ newNotificationCount }}</p>
      </div>
    </div>

    <section v-if="importResult" class="import-result" aria-live="polite">
      <h3>레시피 가져오기 결과</h3>
      <p v-if="importResult.sampleKey" class="import-warn">
        시험용 키로 실행해서 몇 건만 들어왔어요. 서버에 FOOD_SAFETY_API_KEY 를 설정하세요.
      </p>
      <ul class="import-counts">
        <li>원본 전체 <strong>{{ importResult.totalCount }}</strong>건</li>
        <li>새로 추가 <strong>{{ importResult.created }}</strong>건</li>
        <li>덮어씀 <strong>{{ importResult.updated }}</strong>건</li>
      </ul>
      <p v-if="importResult.failedRanges.length" class="import-warn">
        못 가져온 구간: {{ importResult.failedRanges.join(', ') }} (다시 누르면 이어서 채워져요)
      </p>
      <details v-if="importResult.unknownIngredients.length">
        <summary>재료 사전에 없는 이름 {{ importResult.unknownIngredients.length }}개</summary>
        <p class="import-unknown">
          {{ importResult.unknownIngredients.map(i => `${i.name}(${i.recipeCount})`).join(', ') }}
        </p>
      </details>
    </section>
  </PageLayout>
</template>

<script>
import axios from 'axios';
import PageLayout from '@/components/layout/PageLayout.vue';
import { snackbar } from '@/composables/snackbar';

export default {
  name: 'AdminDashboard',
  components: { PageLayout },
  data() {
    return {
      inquiryCount: 0,
      unansweredCount: 0,
      userCount: 0,
      newNotificationCount: 0,
      unreadNotificationCount: 0,
      loading: true,
      importing: false,
      importResult: null
    }
  },
  mounted() {
    this.loadDashboardData();
    this.loadUnreadNotificationCount();
    this.setupNotificationListener();
  },
  beforeUnmount() {
    this.removeNotificationListener();
  },
  methods: {
    async loadDashboardData() {
      try {
        this.loading = true;
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/dashboard`);
        
        if (response.data.status_code === 200) {
          const data = response.data.result;
          this.inquiryCount = data.inquiryCount || 0;
          this.unansweredCount = data.unansweredCount || 0;
          this.userCount = data.userCount || 0;
          this.newNotificationCount = data.newNotification || 0;
        }
      } catch (error) {
        console.error('대시보드 데이터 로드 실패:', error);
        snackbar.show('대시보드 데이터 로드에 실패했습니다.', 'error');
      } finally {
        this.loading = false;
      }
    },
    

    // 식품안전나라 레시피를 받아 DB에 넣는다 (여러 번 눌러도 중복되지 않음, 전체 적재는 몇 분 걸릴 수 있음)
    async importRecipes() {
      if (this.importing) return;
      this.importing = true;
      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/admin/recipes/import`);
        this.importResult = response.data.result;
        const failed = this.importResult.failedRanges.length;
        snackbar.show(
          failed ? `레시피를 가져왔지만 ${failed}개 구간이 실패했어요.` : '레시피를 가져왔어요.',
          failed ? 'warning' : 'success'
        );
      } catch (error) {
        console.error('레시피 가져오기 실패:', error);
        snackbar.show(error.response?.data?.status_message || '레시피 가져오기에 실패했습니다.', 'error');
      } finally {
        this.importing = false;
      }
    },

    // 읽지 않은 알림 개수 로드
    async loadUnreadNotificationCount() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/notification/count`);
        if (response.data.status_code === 200) {
          this.unreadNotificationCount = response.data.result.unreadCount || 0;
        }
      } catch (error) {
        console.error('읽지 않은 알림 개수 로드 실패:', error);
      }
    },

    // 전역 SSE 이벤트 리스너 설정
    setupNotificationListener() {
      this.notificationListener = (event) => {
        const notification = event.detail;
        this.handleNewNotification(notification);
      };
      window.addEventListener('realtime-notification', this.notificationListener);
    },

    // 전역 SSE 이벤트 리스너 제거
    removeNotificationListener() {
      if (this.notificationListener) {
        window.removeEventListener('realtime-notification', this.notificationListener);
        this.notificationListener = null;
      }
    },

    // 새 알림 처리
    handleNewNotification(notification) {
      if (notification.type === 'NEW_INQUIRY') {
        // 실시간 카운트 업데이트
        this.inquiryCount++;
        this.unansweredCount++;
        this.newNotificationCount++;
        this.unreadNotificationCount++;
      }
    },
  }
}
</script>

<style scoped src="@/styles/pages/admin.css"></style>
