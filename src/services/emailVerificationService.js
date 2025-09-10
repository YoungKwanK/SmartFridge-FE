import axios from 'axios';

const API_BASE_URL = process.env.VUE_APP_API_BASE_URL;

// 이메일 인증용 axios 인스턴스 (interceptor 없음)
const emailAxios = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * 이메일 인증 관련 API 서비스
 */
class EmailVerificationService {
  /**
   * 이메일 인증 코드 발송
   * @param {string} email - 사용자 이메일
   * @returns {Promise} API 응답
   */
  async sendVerificationCode(email) {
    try {
      console.log('이메일 발송 요청 시작 - URL:', '/api/v1/email/send');
      console.log('요청 데이터:', { mail: email });
      
      // interceptor가 없는 별도 axios 인스턴스 사용
      const response = await emailAxios.post('/api/v1/email/send', {
        mail: email
      });
      
      console.log('이메일 발송 성공 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('이메일 발송 API 에러:', error.response || error);
      throw this.handleError(error);
    }
  }

  /**
   * 이메일 인증 코드 검증
   * @param {string} email - 사용자 이메일
   * @param {string} verifyCode - 인증 코드 (6자리)
   * @returns {Promise} API 응답
   */
  async verifyEmailCode(email, verifyCode) {
    try {
      console.log('이메일 인증 요청 시작 - URL:', '/api/v1/email/verify');
      console.log('요청 데이터:', { mail: email, verifyCode: verifyCode });
      
      // interceptor가 없는 별도 axios 인스턴스 사용
      const response = await emailAxios.post('/api/v1/email/verify', {
        mail: email,
        verifyCode: verifyCode
      });
      
      console.log('이메일 인증 성공 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('이메일 인증 API 에러:', error.response || error);
      throw this.handleError(error);
    }
  }

  /**
   * 회원가입 완료 처리
   * @param {Object} memberCreateDto - 회원가입 데이터
   * @returns {Promise} API 응답
   */
  async completeMemberSignup(memberCreateDto) {
    try {
      console.log('회원가입 완료 요청 시작 - URL:', '/member/create');
      console.log('요청 데이터:', memberCreateDto);
      
      // interceptor가 없는 별도 axios 인스턴스 사용
      const response = await emailAxios.post('/member/create', memberCreateDto);
      
      console.log('회원가입 완료 성공 응답:', response.data);
      return response.data;
    } catch (error) {
      console.error('회원가입 완료 API 에러:', error.response || error);
      throw this.handleError(error);
    }
  }

  /**
   * API 에러 처리
   * @param {Error} error - axios 에러 객체
   * @returns {Error} 처리된 에러
   */
  handleError(error) {
    if (error.response) {
      // 서버에서 응답을 받은 경우
      const errorData = error.response.data;
      let errorMessage = '요청 처리 중 오류가 발생했습니다.';
      
      // 백엔드 응답 형태에 따른 에러 메시지 추출
      if (typeof errorData === 'string') {
        errorMessage = errorData;
      } else if (errorData.status_message) {
        errorMessage = errorData.status_message;
        
        // Redis 관련 에러 메시지를 사용자 친화적으로 변경
        if (errorMessage.includes('non null key required')) {
          errorMessage = '이메일 인증 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        }
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      const customError = new Error(errorMessage);
      customError.statusCode = error.response.status;
      customError.data = errorData;
      
      return customError;
    } else if (error.request) {
      // 요청은 보냈지만 응답을 받지 못한 경우
      return new Error('서버와의 연결에 실패했습니다. 네트워크 상태를 확인해주세요.');
    } else {
      // 요청 설정 중 오류가 발생한 경우
      return new Error('요청 처리 중 오류가 발생했습니다.');
    }
  }

  /**
   * 이메일 유효성 검사
   * @param {string} email - 검사할 이메일
   * @returns {boolean} 유효성 여부
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 인증 코드 유효성 검사 (6자리 영문자+숫자)
   * @param {string} code - 검사할 인증 코드
   * @returns {boolean} 유효성 여부
   */
  isValidVerificationCode(code) {
    const codeRegex = /^[A-Za-z0-9]{6}$/;
    return codeRegex.test(code);
  }
}

export default new EmailVerificationService();
