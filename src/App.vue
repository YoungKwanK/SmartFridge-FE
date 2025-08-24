<template>
  <v-app>
    <SidebarComponent/>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import SidebarComponent from './components/common/SidebarComponent.vue'
import { useStore } from 'vuex';
import { onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'App',
  components: {
    SidebarComponent
  }
  , setup() {
    const store = useStore();
    const route = useRoute();

    // 페이지 가시성 변경 감지
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('페이지가 숨겨짐');
      } else {
        console.log('페이지가 다시 보임');
        // 페이지가 다시 보일 때 SSE 연결 상태 확인
        const isConnected = store.getters['notification/isSSEConnected'];
        if (!isConnected) {
          console.log('페이지 복귀 후 SSE 재연결 시도...');
          store.dispatch('notification/initSSE', store);
        }
      }
    };

    // 네트워크 상태 변경 감지
    const handleOnline = () => {
      console.log('네트워크 연결 복구');
      const isConnected = store.getters['notification/isSSEConnected'];
      if (!isConnected) {
        console.log('네트워크 복구 후 SSE 재연결 시도...');
        store.dispatch('notification/initSSE', store);
      }
    };

    const handleOffline = () => {
      console.log('네트워크 연결 끊김');
    };

    onMounted(() => {
      // 초기 SSE 연결 (store 인스턴스 전달)
      store.dispatch('notification/initSSE', store);
      
      // 이벤트 리스너 등록
      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      
      // 연결 상태 모니터링 (더 자주 확인)
      const checkConnection = setInterval(() => {
        const isConnected = store.getters['notification/isSSEConnected'];
        if (!isConnected) {
          console.log('정기 연결 상태 확인: SSE 연결이 끊어짐, 재연결 시도...');
          store.dispatch('notification/initSSE', store);
        }
      }, 15000); // 15초마다 연결 상태 확인

      // cleanup 함수 저장
      window.sseCheckInterval = checkConnection;
    });

    onUnmounted(() => {
      // 컴포넌트 언마운트 시 정리
      if (window.sseCheckInterval) {
        clearInterval(window.sseCheckInterval);
      }
      
      // 이벤트 리스너 제거
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    });

    // 라우트 변경 시 SSE 연결 상태 확인
    watch(() => route.path, (newPath, oldPath) => {
      console.log('페이지 이동:', oldPath, '->', newPath);
      
      // 페이지 이동 후 잠시 대기 후 연결 상태 확인
      setTimeout(() => {
        const isConnected = store.getters['notification/isSSEConnected'];
        if (!isConnected) {
          console.log('페이지 이동 후 SSE 재연결 시도...');
          store.dispatch('notification/initSSE', store);
        }
      }, 1000); // 1초 후 확인
    });

    // 브라우저 탭/윈도우 포커스 변경 감지
    const handleFocus = () => {
      console.log('브라우저 포커스 획득');
      const isConnected = store.getters['notification/isSSEConnected'];
      if (!isConnected) {
        console.log('포커스 획득 후 SSE 재연결 시도...');
        store.dispatch('notification/initSSE', store);
      }
    };

    const handleBlur = () => {
      console.log('브라우저 포커스 상실');
    };

    // 포커스 이벤트 리스너 등록
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // cleanup 함수에 포커스 이벤트 리스너 제거 추가
    onUnmounted(() => {
      if (window.sseCheckInterval) {
        clearInterval(window.sseCheckInterval);
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    });
  }
}
</script>

<style>
</style>
