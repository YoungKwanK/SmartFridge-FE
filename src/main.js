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
    const token = localStorage.getItem("token");
    if(token){
      config.headers['Authorization'] = `Bearer ${token}`
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