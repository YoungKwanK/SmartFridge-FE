import axios from 'axios';
import authService from '@/services/authService.js';

// 인증 헤더를 붙이지 않는 API
const PUBLIC_PATHS = ['/member/doLogin', '/member/refresh-at'];

const isPublicAPI = (url = '') => PUBLIC_PATHS.some(path => url.includes(path));

// 토큰 갱신 중 들어온 401 요청은 큐에 쌓았다가 새 토큰으로 다시 보낸다
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// 요청 인터셉터 - access token 첨부
const attachToken = (config) => {
  if (!isPublicAPI(config.url)) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return config;
};

// 응답 인터셉터 - 토큰 만료(401) 시 자동 갱신 후 재시도
const refreshOn401 = async (error) => {
  const originalRequest = error.config;

  if (error.response?.status !== 401 || originalRequest._retry) {
    return Promise.reject(error);
  }

  // 이미 토큰 갱신 중이면 끝날 때까지 기다렸다가 재시도
  if (isRefreshing) {
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    }).then(token => {
      originalRequest.headers['Authorization'] = `Bearer ${token}`;
      return axios(originalRequest);
    });
  }

  originalRequest._retry = true;
  isRefreshing = true;

  try {
    const newToken = await authService.refreshAccessToken();
    processQueue(null, newToken);
    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
    return axios(originalRequest);
  } catch (refreshError) {
    processQueue(refreshError, null);
    authService.logout();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
};

export const setupAxios = () => {
  axios.interceptors.request.use(attachToken, error => Promise.reject(error));
  axios.interceptors.response.use(response => response, refreshOn401);
};
