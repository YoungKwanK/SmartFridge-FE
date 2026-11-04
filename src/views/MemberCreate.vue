<template>
  <v-app>
    <div class="signup-page-wrapper">
      <!-- 상단 로고 -->
      <div class="top-logo">
        <img 
          src="@/assets/images/SFlogo/smartFridge_logo.png" 
          alt="SmartFridge Logo"
          class="top-logo-image"
        />
        <span class="top-logo-text">SmartFridge</span>
      </div>

      <!-- 통합된 배경 컨테이너 -->
      <div class="unified-background">
        <div class="content-wrapper">
          <!-- 프로모션 콘텐츠 영역 -->
          <div class="promotion-content-area">
            <div class="promotion-content">
              <div class="promotion-text">
                <h1 class="promotion-title">
                  지금 시작하세요!<br>
                  스마트 냉장고 관리
                </h1>
                <p class="promotion-subtitle">
                  Share Refrigerator와 함께 더 스마트하고 효율적인 냉장고 관리를 경험해보세요.
                </p>
                <p class="promotion-description">
                  가족, 룸메이트와 함께 음식물 낭비를 줄이고 건강한 식생활을 만들어가세요.
                </p>
              </div>
              
              <!-- 기능 카드들 -->
              <div class="feature-cards">
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-clock-outline</v-icon>
                  <span class="feature-text">실시간 재고 시간</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-account-group-outline</v-icon>
                  <span class="feature-text">안전한 데이터 보호</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-chart-line</v-icon>
                  <span class="feature-text">모든 기기에서 접근</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-heart-outline</v-icon>
                  <span class="feature-text">개인 맞춤 관리</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 회원가입 콘텐츠 영역 -->
          <div class="signup-content-area">
            <div class="signup-wrapper">
              <!-- 회원가입 카드 -->
              <v-card class="signup-card elevation-12">
                <v-card-text class="pa-8">
                  <!-- 회원가입 헤더 -->
                  <div class="signup-header mb-6">
                    <h2 class="signup-title">회원가입</h2>
                    <p class="signup-subtitle">Share Refrigerator에 오신 것을 환영합니다</p>
                    <div class="email-verification-notice mt-3">
                      <v-icon class="notice-icon" color="primary" size="16">mdi-information-outline</v-icon>
                      <span class="notice-text">회원가입 후 이메일 인증이 필요합니다</span>
                    </div>
                  </div>

                  <!-- 에러 메시지 표시 -->
                  <v-alert
                    v-if="errorMessage"
                    type="error"
                    variant="tonal"
                    class="mb-6"
                    :text="errorMessage"
                    closable
                    @click:close="errorMessage = ''"
                  ></v-alert>

                  <!-- 성공 메시지 표시 -->
                  <v-alert
                    v-if="successMessage"
                    type="success"
                    variant="tonal"
                    class="mb-6"
                    :text="successMessage"
                    closable
                    @click:close="successMessage = ''"
                  ></v-alert>

                  <!-- 회원가입 폼 -->
                  <v-form @submit.prevent="memberCreate" ref="signupForm">
                    <div class="form-group mb-4">
                      <label class="form-label">이름</label>
                      <v-text-field
                        v-model="name"
                        variant="outlined"
                        placeholder="이름을 입력하세요"
                        :rules="nameRules"
                        required
                        color="primary"
                        bg-color="grey-lighten-5"
                        hide-details="auto"
                      ></v-text-field>
                    </div>

                    <div class="form-group mb-4">
                      <label class="form-label">이메일</label>
                      <v-text-field
                        v-model="email"
                        type="email"
                        variant="outlined"
                        placeholder="이메일을 입력하세요"
                        :rules="emailRules"
                        required
                        color="primary"
                        bg-color="grey-lighten-5"
                        hide-details="auto"
                      ></v-text-field>
                    </div>
                    
                    <div class="form-group mb-4">
                      <label class="form-label">비밀번호</label>
                      <v-text-field
                        v-model="password"
                        :type="showPassword ? 'text' : 'password'"
                        variant="outlined"
                        placeholder="비밀번호를 입력하세요"
                        :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                        @click:append-inner="showPassword = !showPassword"
                        :rules="passwordRules"
                        required
                        color="primary"
                        bg-color="grey-lighten-5"
                        hide-details="auto"
                      ></v-text-field>
                    </div>

                    <div class="form-group mb-4">
                      <label class="form-label">비밀번호 확인</label>
                      <v-text-field
                        v-model="passwordConfirm"
                        :type="showPasswordConfirm ? 'text' : 'password'"
                        variant="outlined"
                        placeholder="비밀번호를 다시 입력하세요"
                        :append-inner-icon="showPasswordConfirm ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
                        @click:append-inner="showPasswordConfirm = !showPasswordConfirm"
                        :rules="passwordConfirmRules"
                        required
                        color="primary"
                        bg-color="grey-lighten-5"
                        hide-details="auto"
                      ></v-text-field>
                    </div>

                    <!-- 약관 동의 체크박스 -->
                    <div class="form-group mb-6">
                      <v-checkbox
                        v-model="agreeTerms"
                        :rules="[v => !!v || '이용약관 및 개인정보처리방침에 동의해주세요.']"
                        hide-details="auto"
                        color="primary"
                        class="terms-checkbox"
                      >
                        <template v-slot:label>
                          <span class="terms-text">
                            <a href="#" class="terms-link">이용약관</a> 및 
                            <a href="#" class="terms-link">개인정보처리방침</a>에 동의합니다
                          </span>
                        </template>
                      </v-checkbox>

                      <v-checkbox
                        v-model="agreeMarketing"
                        hide-details="auto"
                        color="primary"
                        class="marketing-checkbox"
                      >
                        <template v-slot:label>
                          <span class="marketing-text">
                            마케팅 정보 수신에 동의합니다 (선택)
                          </span>
                        </template>
                      </v-checkbox>
                    </div>
                    
                    <v-btn 
                      type="submit" 
                      color="primary" 
                      block 
                      size="large"
                      :loading="isLoading"
                      class="signup-btn mb-4"
                      elevation="0"
                    >
                      회원가입
                    </v-btn>

                    <!-- 로그인 링크 -->
                    <div class="text-center">
                      <v-btn
                        variant="outlined"
                        color="primary"
                        block
                        size="large"
                        class="login-link-btn"
                        @click="goToLogin"
                      >
                        로그인
                      </v-btn>
                    </div>
                  </v-form>

                  <!-- 소셜 로그인 구분선 -->
                  <div class="divider-section my-6">
                    <span class="divider-text">또는</span>
                  </div>

                  <!-- 소셜 로그인 버튼들 -->
                  <div class="social-login-section mb-6">
                    <div class="social-buttons-row">
                      <v-btn
                        variant="outlined"
                        class="social-btn google-btn"
                        @click="googleLogin()"
                        :loading="socialLoading.google"
                        size="small"
                      >
                        <v-icon class="social-icon google-icon">mdi-google</v-icon>
                        Google
                      </v-btn>
                      
                      <v-btn
                        variant="outlined"
                        class="social-btn kakao-btn"
                        @click="kakaoLogin()"
                        :loading="socialLoading.kakao"
                        size="small"
                      >
                        <span class="social-icon kakao-icon">K</span>
                        Kakao
                      </v-btn>
                      
                      <v-btn
                        variant="outlined"
                        class="social-btn naver-btn"
                        @click="naverLogin()"
                        :loading="socialLoading.naver"
                        size="small"
                      >
                        <span class="social-icon naver-icon">N</span>
                        Naver
                      </v-btn>
                    </div>
                  </div>

                  <!-- 하단 링크 -->
                  <div class="bottom-section text-center">
                    <span class="bottom-text">이미 계정이 있으신가요?</span>
                    <router-link to="/" class="login-link">로그인하기</router-link>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </div>
      </div>
    </div>
  </v-app>
</template>
<script>

export default {
  name: 'MemberCreate',
  data() {
    return {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
      showPassword: false,
      showPasswordConfirm: false,
      isLoading: false,
      errorMessage: "",
      successMessage: "",
      agreeTerms: false,
      agreeMarketing: false,
      
      // 폼 유효성 검사 규칙
      nameRules: [
        v => !!v || '이름을 입력해주세요.',
        v => v.length >= 2 || '이름은 최소 2자 이상이어야 합니다.'
      ],
      emailRules: [
        v => !!v || '이메일을 입력해주세요.',
        v => /.+@.+\..+/.test(v) || '올바른 이메일 형식을 입력해주세요.'
      ],
      passwordRules: [
        v => !!v || '비밀번호를 입력해주세요.',
        v => v.length >= 8 || '비밀번호는 최소 8자 이상이어야 합니다.',
        v => /[A-Za-z]/.test(v) || '비밀번호는 영문자를 포함해야 합니다.',
        v => /[0-9]/.test(v) || '비밀번호는 숫자를 포함해야 합니다.',
        v => /[!@#$%^&*(),.?":{}|<>]/.test(v) || '비밀번호는 특수문자를 포함해야 합니다.'
      ],
      
      // 소셜 로그인 로딩 상태
      socialLoading: {
        google: false,
        kakao: false,
        naver: false
      },
      
      // OAuth 설정 (로그인 페이지와 동일)
      googleUrl: "https://accounts.google.com/o/oauth2/auth",
      googleClientId: "374485739574-jumcdbdoujbiibr15dhncieme5t1n3vb.apps.googleusercontent.com",
      googleRedirectUrl: `${import.meta.env.VITE_OAUTH_URL}/oauth/google/redirect`,
      googleScope: "openid email profile",
      
      kakaoUrl: "https://kauth.kakao.com/oauth/authorize",
      kakaoClientId: "1db026f5c4d2e11d7e597cdd4488d193",
      kakaoRedirectUrl: `${import.meta.env.VITE_OAUTH_URL}/oauth/kakao/redirect`,
      
      naverUrl: "https://nid.naver.com/oauth2.0/authorize",
      naverClientId: "GbQ_01jKVCMgOVze1pio",
      naverRedirectUrl: `${import.meta.env.VITE_OAUTH_URL}/oauth/naver/redirect`,
    }
  },
  
  computed: {
    passwordConfirmRules() {
      return [
        v => !!v || '비밀번호 확인을 입력해주세요.',
        v => v === this.password || '비밀번호가 일치하지 않습니다.'
      ];
    }
  },
  
  methods: {
    async memberCreate() {
      // 폼 유효성 검사
      const { valid } = await this.$refs.signupForm.validate();
      if (!valid) {
        return;
      }

      // 약관 동의 확인
      if (!this.agreeTerms) {
        this.errorMessage = "이용약관 및 개인정보처리방침에 동의해주세요.";
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";
      this.successMessage = "";

      // 회원가입 데이터를 세션 스토리지에 임시 저장 (이메일 인증 후 사용)
      const memberCreateDto = {
        name: this.name?.trim() || '',
        email: this.email?.trim() || '',
        password: this.password?.trim() || '',
        passwordConfirm: this.passwordConfirm?.trim() || ''
      };

      // null/undefined/빈값 체크
      if (!memberCreateDto.name || !memberCreateDto.email || !memberCreateDto.password || !memberCreateDto.passwordConfirm) {
        this.errorMessage = "모든 필수 정보를 입력해주세요.";
        this.isLoading = false;
        return;
      }

      try {
        console.log('세션에 저장할 데이터:', {
          name: memberCreateDto.name,
          email: memberCreateDto.email,
          password: '[보안상 숨김]',
          passwordConfirm: '[보안상 숨김]'
        });
        
        // 회원가입 정보를 세션 스토리지에 저장
        sessionStorage.setItem('pendingSignupData', JSON.stringify(memberCreateDto));
        
        // 저장 확인
        const savedData = sessionStorage.getItem('pendingSignupData');
        console.log('세션에 저장된 데이터 확인:', savedData ? '저장됨' : '저장 실패');
        
        // 성공 메시지 표시
        this.successMessage = "이메일 인증 단계로 이동합니다...";
        
        // 이메일 인증 페이지로 이동
        setTimeout(() => {
          this.$router.push({
            path: '/member/verify-email',
            query: { email: this.email }
          }).catch(() => {
            window.location.href = `/member/verify-email?email=${encodeURIComponent(this.email)}`;
          });
        }, 1500);
        
      } catch (error) {
        console.error('회원가입 준비 에러:', error);
        this.errorMessage = "회원가입 처리 중 오류가 발생했습니다.";
      } finally {
        this.isLoading = false;
      }
    },
    
    goToLogin() {
      this.$router.push('/').catch(() => {
        window.location.href = "/";
      });
    },
    
    // 소셜 로그인 메서드들 (로그인 페이지와 동일)
    googleLogin() {
      this.socialLoading.google = true;
      const auth_uri = `${this.googleUrl}?client_id=${this.googleClientId}&redirect_uri=${this.googleRedirectUrl}&response_type=code&scope=${this.googleScope}`;
      window.location.href = auth_uri;
    },

    kakaoLogin() {
      this.socialLoading.kakao = true;
      const auth_uri = `${this.kakaoUrl}?client_id=${this.kakaoClientId}&redirect_uri=${this.kakaoRedirectUrl}&response_type=code`;
      window.location.href = auth_uri;
    },

    naverLogin() {
      this.socialLoading.naver = true;
      const auth_uri = `${this.naverUrl}?client_id=${this.naverClientId}&redirect_uri=${this.naverRedirectUrl}&response_type=code`;
      window.location.href = auth_uri;
    }
  }
}
</script>

<style scoped>
/* 전체 페이지 래퍼 */
.signup-page-wrapper {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
}

/* 상단 로고 */
.top-logo {
  position: absolute;
  top: 24px;
  left: 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.top-logo-image {
  height: 32px;
  width: auto;
}

.top-logo-text {
  color: white;
  font-size: 20px;
  font-weight: 600;
}

/* 통합된 배경 컨테이너 */
.unified-background {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
}

/* 콘텐츠 래퍼 */
.content-wrapper {
  display: flex;
  width: 100%;
  max-width: 1400px;
  min-height: 100vh;
  align-items: center;
}

/* 프로모션 콘텐츠 영역 */
.promotion-content-area {
  flex: 0 0 58.33%; /* 약 7/12 비율 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 80px 60px;
  color: white;
}

.promotion-content {
  max-width: 500px;
}

.promotion-title {
  font-size: 48px;
  font-weight: 700;
  line-height: 1.2;
  margin-bottom: 24px;
  color: white;
}

.promotion-subtitle {
  font-size: 18px;
  font-weight: 400;
  line-height: 1.5;
  margin-bottom: 16px;
  color: rgba(255, 255, 255, 0.9);
}

.promotion-description {
  font-size: 16px;
  font-weight: 400;
  line-height: 1.5;
  margin-bottom: 48px;
  color: rgba(255, 255, 255, 0.8);
}

/* 기능 카드들 */
.feature-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: translateY(-2px);
}

.feature-icon {
  opacity: 0.9;
}

.feature-text {
  font-size: 14px;
  font-weight: 500;
  color: white;
}

/* 회원가입 콘텐츠 영역 */
.signup-content-area {
  flex: 0 0 41.67%; /* 약 5/12 비율 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.signup-wrapper {
  width: 100%;
  max-width: 400px;
}

/* 회원가입 카드 */
.signup-card {
  background: white !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
}

/* 회원가입 헤더 */
.signup-header {
  text-align: center;
}

.signup-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.signup-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
  margin: 0;
}

/* 이메일 인증 안내 */
.email-verification-notice {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: #f0f4ff;
  border: 1px solid #e3f2fd;
  border-radius: 8px;
  padding: 8px 12px;
  margin-top: 12px;
}

.notice-icon {
  flex-shrink: 0;
}

.notice-text {
  font-size: 12px;
  color: #667eea;
  font-weight: 500;
}

/* 폼 그룹 */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 8px;
}

/* 입력 필드 */
.v-text-field .v-field {
  border-radius: 8px !important;
  background-color: #f8f9fa !important;
  border: 1px solid #e9ecef !important;
}

.v-text-field .v-field--focused {
  border-color: #667eea !important;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1) !important;
}

.v-text-field input::placeholder {
  color: #adb5bd !important;
  font-size: 14px;
}

/* 회원가입 버튼 */
.signup-btn {
  height: 48px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  background: #20B2AA !important;
  color: white !important;
  box-shadow: none !important;
  transition: all 0.3s ease !important;
}

.signup-btn:hover {
  background: #1a9b94 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(32, 178, 170, 0.3) !important;
}

/* 로그인 링크 버튼 */
.login-link-btn {
  height: 48px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  border: 2px solid #667eea !important;
  color: #667eea !important;
  transition: all 0.3s ease !important;
}

.login-link-btn:hover {
  background: #667eea !important;
  color: white !important;
  transform: translateY(-1px);
}

/* 약관 동의 체크박스 */
.terms-checkbox, .marketing-checkbox {
  margin-bottom: 12px;
}

.terms-text, .marketing-text {
  font-size: 14px;
  color: #2c3e50;
}

.terms-link {
  color: #667eea;
  text-decoration: none;
  font-weight: 500;
}

.terms-link:hover {
  text-decoration: underline;
}

/* 구분선 */
.divider-section {
  position: relative;
  text-align: center;
}

.divider-section::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  right: 0;
  height: 1px;
  background: #e9ecef;
}

.divider-text {
  background: white;
  color: #7f8c8d;
  font-size: 14px;
  padding: 0 16px;
  position: relative;
  z-index: 1;
}

/* 소셜 로그인 버튼들 */
.social-buttons-row {
  display: flex;
  gap: 8px;
}

.social-btn {
  flex: 1;
  height: 36px !important;
  text-transform: none !important;
  font-weight: 500 !important;
  font-size: 12px !important;
  border-radius: 6px !important;
  border: 1px solid #e9ecef !important;
  transition: all 0.3s ease !important;
}

.social-icon {
  margin-right: 4px;
  font-size: 14px;
  font-weight: 700;
}

.google-btn {
  color: #4285f4 !important;
  border-color: #e9ecef !important;
}

.google-btn:hover {
  background-color: #4285f4 !important;
  color: white !important;
  border-color: #4285f4 !important;
}

.google-icon {
  color: #4285f4;
}

.google-btn:hover .google-icon {
  color: white !important;
}

.kakao-btn {
  color: #3c1e1e !important;
  background-color: #fee500 !important;
  border-color: #fee500 !important;
}

.kakao-btn:hover {
  background-color: #fdd835 !important;
  border-color: #fdd835 !important;
}

.kakao-icon {
  background: #3c1e1e;
  color: #fee500;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
}

.naver-btn {
  color: white !important;
  background-color: #03c75a !important;
  border-color: #03c75a !important;
}

.naver-btn:hover {
  background-color: #02b050 !important;
  border-color: #02b050 !important;
}

.naver-icon {
  background: white;
  color: #03c75a;
  border-radius: 2px;
  width: 16px;
  height: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 900;
}

/* 하단 링크 섹션 */
.bottom-section {
  margin-top: 16px;
}

.bottom-text {
  font-size: 14px;
  color: #7f8c8d;
  margin-right: 8px;
}

.login-link {
  color: #667eea !important;
  text-decoration: none !important;
  font-weight: 600 !important;
  transition: color 0.3s ease;
}

.login-link:hover {
  color: #764ba2 !important;
  text-decoration: underline !important;
}

/* 에러/성공 알림 */
.v-alert {
  border-radius: 8px !important;
  font-size: 14px;
}

/* 반응형 디자인 */
@media (max-width: 960px) {
  .content-wrapper {
    flex-direction: column;
    justify-content: center;
  }
  
  .promotion-content-area {
    display: none;
  }
  
  .signup-content-area {
    flex: 1;
    width: 100%;
    max-width: 500px;
  }
  
  .top-logo {
    position: relative;
    top: 0;
    left: 0;
    justify-content: center;
    padding: 24px 0;
  }
}

@media (max-width: 600px) {
  .top-logo {
    padding: 16px 0;
  }
  
  .top-logo-image {
    height: 28px;
  }
  
  .top-logo-text {
    font-size: 18px;
  }
  
  .signup-content-area {
    padding: 20px;
  }
  
  .promotion-title {
    font-size: 36px;
  }
  
  .promotion-subtitle {
    font-size: 16px;
  }
  
  .feature-cards {
    grid-template-columns: 1fr;
  }
  
  .social-buttons-row {
    flex-direction: column;
    gap: 8px;
  }
  
  .social-btn {
    height: 40px !important;
    font-size: 14px !important;
  }
}

/* 애니메이션 */
@keyframes slideInRight {
  from {
    opacity: 0;
    transform: translateX(30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.signup-card {
  animation: slideInRight 0.6s ease-out;
}

.promotion-content {
  animation: slideInLeft 0.6s ease-out;
}

/* 포커스 상태 */
.v-btn:focus-visible {
  outline: 2px solid #667eea;
  outline-offset: 2px;
}

.v-text-field input:focus {
  outline: none;
}
</style>