import { reactive } from 'vue';

// 채팅 화면 공용 알림(스낵바)과 확인 창 상태. ChatFeedback.vue가 화면에 그린다.
export const feedbackState = reactive({
  notice: { show: false, message: '', color: 'success' },
  confirm: { show: false, title: '', message: '', confirmText: '확인', color: 'primary', resolve: null },
});

// 짧은 안내 (성공: success, 실패: error)
export const notify = (message, color = 'success') => {
  Object.assign(feedbackState.notice, { show: true, message, color });
};

export const notifyError = (message) => notify(message, 'error');

// 브라우저 confirm 대신 쓰는 확인 창. 확인을 누르면 true, 취소·바깥 클릭은 false
export const confirmAction = ({ title, message, confirmText = '확인', color = 'primary' }) =>
  new Promise((resolve) => {
    // 이미 열린 확인 창이 있으면 취소로 닫는다
    feedbackState.confirm.resolve?.(false);
    Object.assign(feedbackState.confirm, { show: true, title, message, confirmText, color, resolve });
  });

export const closeConfirm = (result) => {
  const { resolve } = feedbackState.confirm;
  feedbackState.confirm.show = false;
  feedbackState.confirm.resolve = null;
  resolve?.(result);
};
