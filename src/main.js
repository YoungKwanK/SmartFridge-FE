import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from '@/router/index.js'
import store from '@/store/index.js'
import axios from 'axios';
import '@mdi/font/css/materialdesignicons.css'

const app = createApp(App);

// store를 전역으로 노출 (라우터에서 접근용)
window.$store = store;

axios.interceptors.request.use(
  config=>{
    // 인증이 필요 없는 API 경로들
    const publicPaths = ['/api/v1/email/send', '/api/v1/email/verify', '/member/create', '/member/doLogin'];
    
    // 디버깅을 위한 로그
    console.log('Axios interceptor - 요청 URL:', config.url);
    
    // 현재 요청 URL이 public API인지 확인
    const isPublicAPI = publicPaths.some(path => {
      const urlPath = config.url || '';
      const isMatch = urlPath.includes(path);
      console.log(`URL "${urlPath}" includes "${path}": ${isMatch}`);
      return isMatch;
    });
    
    console.log('Public API 여부:', isPublicAPI);
    
    // public API가 아닌 경우에만 토큰 추가
    if (!isPublicAPI) {
      const token = localStorage.getItem("accessToken");
      if(token){
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('토큰 추가됨:', token.substring(0, 20) + '...');
      } else {
        console.log('토큰 없음');
      }
    } else {
      console.log('Public API - 토큰 추가하지 않음');
    }
    
    return config;
  },
  error => {
    // 인터셉터를 무시하고, 사용자의 본래요청인 화면으로 라우팅
    return Promise.reject(error);
  }
)

app.use(store);
app.use(router);
app.use(vuetify);
app.mount('#app');