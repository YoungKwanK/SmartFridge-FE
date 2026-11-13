import { createApp } from 'vue';
import App from '@/App.vue';
import router from '@/router';
import store from '@/store';
import vuetify from '@/plugins/vuetify';
import { setupAxios } from '@/plugins/axios';
import tokenManager from '@/utils/tokenManager.js';
import '@mdi/font/css/materialdesignicons.css';
import '@/styles/index.css';

// store를 전역으로 노출 (라우터에서 접근용)
window.$store = store;
// tokenManager를 전역으로 노출 (로그인 페이지에서 접근용)
window.tokenManager = tokenManager;

setupAxios();

createApp(App)
  .use(store)
  .use(router)
  .use(vuetify)
  .mount('#app');

// 로그인 상태인 경우 토큰 모니터링 시작
if (localStorage.getItem('accessToken')) {
  tokenManager.startMonitoring();
}
