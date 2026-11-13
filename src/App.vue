<template>
  <v-app>
    <SidebarComponent v-if="!hideSidebar"/>
    <v-main>
      <router-view/>
    </v-main>
    <CommonSnackbar />
  </v-app>
</template>

<script>
import SidebarComponent from '@/components/layout/SidebarComponent.vue'
import CommonSnackbar from '@/components/layout/CommonSnackbar.vue'
import { useStore } from 'vuex';
import { onMounted, onUnmounted, watch } from 'vue';

export default {
  name: 'App',
  components: {
    SidebarComponent,
    CommonSnackbar
  },
  computed: {
    hideSidebar() {
      // 사이드바를 숨길 화면은 라우트의 meta.hideSidebar 로 지정한다 (src/router/routes/*)
      // 첫 진입 시 라우트가 아직 정해지지 않았으면(matched 비어 있음) 숨겨 둔다
      return this.$route.matched.length === 0 || Boolean(this.$route.meta.hideSidebar);
    }
  },
  setup() {
    const store = useStore();

    onMounted(() => {
      // 초기 SSE 연결 (store 인스턴스 전달)
      store.dispatch('notification/initSSE', store);
      
      // 연결 상태 모니터링 (더 자주 확인)
      const checkConnection = setInterval(() => {
        const isConnected = store.getters['notification/isSSEConnected'];
        if (!isConnected) {
          store.dispatch('notification/initSSE', store);
        }
      }, 15000); // 15초마다 연결 상태 확인

      // cleanup 함수 저장
      window.sseCheckInterval = checkConnection;
    });

    // 냉장고 변경 감지하여 알림 초기화
    watch(() => store.getters.getCurrentFridgeId, (newFridgeId, oldFridgeId) => {
      if (newFridgeId && oldFridgeId && newFridgeId !== oldFridgeId) {
        store.dispatch('notification/refreshSSEOnFridgeChange', newFridgeId);
      }
    });

    onUnmounted(() => {
      // 컴포넌트 언마운트 시 정리
      if (window.sseCheckInterval) {
        clearInterval(window.sseCheckInterval);
      }
    });
  }
}
</script>

