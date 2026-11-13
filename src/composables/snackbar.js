import { reactive } from 'vue';

// 앱 전체에서 하나만 쓰는 하단 알림(스낵바) 상태. App.vue의 CommonSnackbar가 화면에 그린다.
export const snackbarState = reactive({
  show: false,
  message: '',
  color: 'success',
  timeout: 3000,
  location: 'bottom',
  class: ''
});

/**
 * 스낵바 표시
 * @param {string} message - 표시할 메시지
 * @param {string} color - 색상 (success, error, warning, info)
 * @param {number} timeout - 자동 닫힘 시간 (ms)
 * @param {string} location - 위치 (top, bottom)
 * @param {string} customClass - 추가 CSS 클래스
 */
const show = (message, color = 'success', timeout = 3000, location = 'bottom', customClass = '') => {
  Object.assign(snackbarState, { message, color, timeout, location, class: customClass, show: true });
};

export const snackbar = {
  show,
  success: (message, timeout = 3000) => show(message, 'success', timeout),
  error: (message, timeout = 4000) => show(message, 'error', timeout),
  warning: (message, timeout = 3000) => show(message, 'warning', timeout),
  info: (message, timeout = 3000) => show(message, 'info', timeout),
  hide: () => { snackbarState.show = false; }
};
