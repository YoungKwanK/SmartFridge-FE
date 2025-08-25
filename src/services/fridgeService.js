import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';

// Axios 인스턴스 생성
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터 - 토큰 자동 추가
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터 - 토큰 만료 처리
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // 토큰 만료 시 로그인 페이지로 이동
      localStorage.clear();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const fridgeService = {
  /**
   * 특정 회원이 참여한 냉장고 목록 조회
   * @param {string} memberId - 회원 ID
   * @returns {Promise} API 응답
   */
  async getFridgesByMember(memberId) {
    try {
      const response = await apiClient.get(`/fridge-member/by-member/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('회원 냉장고 목록 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 특정 냉장고의 멤버 목록 조회
   * @param {string} fridgeId - 냉장고 ID
   * @returns {Promise} API 응답
   */
  async getMembersByFridge(fridgeId) {
    try {
      const response = await apiClient.get(`/fridge-member/by-fridge/${fridgeId}`);
      return response.data;
    } catch (error) {
      console.error('냉장고 멤버 목록 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 새 냉장고 생성
   * @param {Object} fridgeData - 냉장고 데이터
   * @param {string} fridgeData.name - 냉장고 이름
   * @param {string} fridgeData.description - 냉장고 설명
   * @returns {Promise} API 응답
   */
  async createFridge(fridgeData) {
    try {
      const response = await apiClient.post('/fridge/create', fridgeData);
      return response.data;
    } catch (error) {
      console.error('냉장고 생성 오류:', error);
      throw error;
    }
  },

  /**
   * 초대코드로 냉장고 참여
   * @param {string} inviteCode - 초대 코드
   * @returns {Promise} API 응답
   */
  async joinFridgeByInviteCode(inviteCode) {
    try {
      const response = await apiClient.post('/fridge/join', { inviteCode });
      return response.data;
    } catch (error) {
      console.error('냉장고 참여 오류:', error);
      throw error;
    }
  },

  /**
   * 냉장고 상세 정보 조회
   * @param {string} fridgeId - 냉장고 ID
   * @returns {Promise} API 응답
   */
  async getFridgeById(fridgeId) {
    try {
      const response = await apiClient.get(`/fridge/${fridgeId}`);
      return response.data;
    } catch (error) {
      console.error('냉장고 정보 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 냉장고 목록 조회
   * @returns {Promise} API 응답
   */
  async getAllFridges() {
    try {
      const response = await apiClient.get('/fridge/list');
      return response.data;
    } catch (error) {
      console.error('냉장고 목록 조회 오류:', error);
      throw error;
    }
  },

  /**
   * 냉장고 수정
   * @param {string} fridgeId - 냉장고 ID
   * @param {Object} fridgeData - 수정할 냉장고 데이터
   * @returns {Promise} API 응답
   */
  async updateFridge(fridgeId, fridgeData) {
    try {
      const response = await apiClient.put(`/fridge/${fridgeId}`, fridgeData);
      return response.data;
    } catch (error) {
      console.error('냉장고 수정 오류:', error);
      throw error;
    }
  },

  /**
   * 냉장고 삭제
   * @param {string} fridgeId - 냉장고 ID
   * @returns {Promise} API 응답
   */
  async deleteFridge(fridgeId) {
    try {
      const response = await apiClient.delete(`/fridge/${fridgeId}`);
      return response.data;
    } catch (error) {
      console.error('냉장고 삭제 오류:', error);
      throw error;
    }
  },

  /**
   * 냉장고에서 멤버 제거
   * @param {string} fridgeId - 냉장고 ID
   * @param {string} memberId - 멤버 ID
   * @returns {Promise} API 응답
   */
  async removeMemberFromFridge(fridgeId, memberId) {
    try {
      const response = await apiClient.delete(`/fridge-member/fridge/${fridgeId}/member/${memberId}`);
      return response.data;
    } catch (error) {
      console.error('냉장고 멤버 제거 오류:', error);
      throw error;
    }
  },

  /**
   * 냉장고 초대 코드 생성
   * @param {string} fridgeId - 냉장고 ID
   * @returns {Promise} API 응답
   */
  async generateInviteCode(fridgeId) {
    try {
      const response = await apiClient.post(`/fridge/${fridgeId}/invite-code`);
      return response.data;
    } catch (error) {
      console.error('초대 코드 생성 오류:', error);
      throw error;
    }
  },

  /**
   * 냉장고 초대 코드 조회
   * @param {string} fridgeId - 냉장고 ID
   * @returns {Promise} API 응답
   */
  async getInviteCode(fridgeId) {
    try {
      const response = await apiClient.get(`/fridge/${fridgeId}/invite-code`);
      return response.data;
    } catch (error) {
      console.error('초대 코드 조회 오류:', error);
      throw error;
    }
  }
};

export default fridgeService;
