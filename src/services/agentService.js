import axios from 'axios';

// AI 도우미 API. 인증 헤더와 토큰 갱신은 plugins/axios.js의 전역 인터셉터가 맡는다.
const base = (fridgeId) => `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/agent`;

export const agentService = {
  // 지금까지의 대화 (창을 열거나 새로고침했을 때). 확인 카드는 지금 상태로 온다
  // → { messages: [{ role, text, actions }], remainingToday }
  async history(fridgeId) {
    const response = await axios.get(`${base(fridgeId)}/chat`);
    return response.data.result;
  },

  // 질문 보내기 → { message, actions, remainingToday }
  async send(fridgeId, message) {
    const response = await axios.post(`${base(fridgeId)}/chat`, { message });
    return response.data.result;
  },

  // 새 대화 시작 (서버의 대화 기록 삭제)
  async reset(fridgeId) {
    await axios.delete(`${base(fridgeId)}/chat`);
  },

  // 확인 카드의 [확인] → { id, type, status, result: { count, names } }
  async confirm(fridgeId, actionId) {
    const response = await axios.post(`${base(fridgeId)}/actions/${actionId}/confirm`);
    return response.data.result;
  },

  // 확인 카드의 [취소]
  async cancel(fridgeId, actionId) {
    await axios.post(`${base(fridgeId)}/actions/${actionId}/cancel`);
  }
};

export default agentService;
