<template>
  <v-app>
    <div class="forgot-password-page-wrapper">
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
          <!-- 비밀번호 찾기 콘텐츠 영역 -->
          <div class="forgot-password-content-area">
            <div class="forgot-password-wrapper">
              <!-- 비밀번호 찾기 카드 -->
              <v-card class="forgot-password-card elevation-12">
                <v-card-text class="pa-8">
                  <!-- 헤더 -->
                  <div class="forgot-password-header mb-6">
                    <h2 class="forgot-password-title">비밀번호 찾기</h2>
                    <p class="forgot-password-subtitle">등록된 이메일로 비밀번호 재설정 링크를 보내드립니다</p>
                  </div>

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

                  <!-- 1단계: 이메일 입력 -->
                  <v-form 
                    v-if="step === 1" 
                    @submit.prevent="sendVerificationCode" 
                    ref="emailForm"
                  >
                    <div class="form-group mb-6">
                      <label class="form-label">이메일</label>
                      <v-text-field
                        v-model="email"
                        type="email"
                        variant="outlined"
                        placeholder="가입하신 이메일을 입력하세요"
                        :rules="emailRules"
                        required
                        color="primary"
                        bg-color="grey-lighten-5"
                        hide-details="auto"
                      ></v-text-field>
                    </div>
                    
                    <v-btn 
                      type="submit" 
                      color="primary" 
                      block 
                      size="large"
                      :loading="isLoading"
                      class="reset-btn mb-6"
                      elevation="0"
                    >
                      인증 코드 발송
                    </v-btn>
                  </v-form>

                  <!-- 2단계: 인증 코드 입력 -->
                  <div v-if="step === 2">
                    <div class="verification-info mb-6 text-center">
                      <v-icon color="primary" size="60" class="mb-3">mdi-email-lock-outline</v-icon>
                      <h3 class="mb-2">인증 코드 입력</h3>
                      <p class="text-grey-darken-1">
                        {{ email }}로<br>
                        인증 코드를 발송했습니다.
                      </p>
                    </div>

                    <v-form @submit.prevent="verifyCode" ref="codeForm">
                      <div class="form-group mb-4">
                        <label class="form-label">인증 코드</label>
                        <v-text-field
                          v-model="verificationCode"
                          variant="outlined"
                          placeholder="6자리 인증 코드를 입력하세요"
                          :rules="codeRules"
                          maxlength="6"
                          required
                          color="primary"
                          bg-color="grey-lighten-5"
                          hide-details="auto"
                          autocomplete="off"
                        >
                          <template v-slot:append-inner>
                            <v-icon v-if="verificationCode && verificationCode.length === 6" color="success">
                              mdi-check-circle
                            </v-icon>
                          </template>
                        </v-text-field>
                      </div>

                      <v-btn 
                        type="submit" 
                        color="primary" 
                        block 
                        size="large"
                        :loading="isVerifying"
                        class="reset-btn mb-4"
                        elevation="0"
                      >
                        인증 코드 확인
                      </v-btn>

                      <v-btn 
                        @click="resendCode" 
                        variant="outlined"
                        color="grey-darken-1"
                        block 
                        size="large"
                        :loading="isResending"
                        class="mb-4"
                        elevation="0"
                      >
                        인증 코드 재발송
                      </v-btn>

                      <v-btn 
                        @click="goBack" 
                        variant="text"
                        color="grey-darken-1"
                        block 
                        size="large"
                        class="mb-2"
                      >
                        이메일 다시 입력
                      </v-btn>
                    </v-form>
                  </div>

                  <!-- 로그인 페이지로 돌아가기 -->
                  <div class="back-to-login text-center">
                    <router-link to="/" class="back-link">로그인 페이지로 돌아가기</router-link>
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
import axios from 'axios';

export default {
  name: 'ForgotPasswordPage',
  data() {
    return {
      step: 1, // 1: 이메일 입력, 2: 인증 코드 입력
      email: "",
      verificationCode: "",
      isLoading: false,
      isVerifying: false,
      isResending: false,
      errorMessage: "",
      successMessage: "",
      
      // 폼 유효성 검사 규칙
      emailRules: [
        v => !!v || '이메일을 입력해주세요.',
        v => /.+@.+\..+/.test(v) || '올바른 이메일 형식을 입력해주세요.'
      ],
      codeRules: [
        v => !!v || '인증 코드를 입력해주세요.',
        v => (v && v.length === 6) || '인증 코드는 6자리입니다.',
        v => /^[A-Za-z0-9]{6}$/.test(v) || '영문자와 숫자만 입력 가능합니다.'
      ]
    }
  },
  
  methods: {
    // 1단계: 인증 코드 발송
    async sendVerificationCode() {
      const { valid } = await this.$refs.emailForm.validate();
      if (!valid) return;

      this.isLoading = true;
      this.errorMessage = "";
      this.successMessage = "";

      try {
        const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';
        
        // 비밀번호 재설정용 인증 코드 발송 API 호출
        const response = await axios.create({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }).post(`${apiBaseUrl}/member/forgot-password-code`, {
          email: this.email
        });

        console.log('Verification code sent:', response.data);

        if (response.data.result === true && response.data.status_code === 200) {
          this.successMessage = "인증 코드가 이메일로 전송되었습니다.";
          this.step = 2; // 인증 코드 입력 단계로 이동
        } else {
          this.errorMessage = response.data.status_message || "인증 코드 발송에 실패했습니다.";
        }
      } catch (error) {
        console.error('Send verification code error:', error);
        
        if (error.response) {
          const errorData = error.response.data;
          if (errorData.status_code === 404) {
            this.errorMessage = "등록되지 않은 이메일입니다. 이메일을 확인해주세요.";
          } else {
            this.errorMessage = errorData.status_message || "인증 코드 발송에 실패했습니다.";
          }
        } else {
          this.errorMessage = "서버와의 연결에 실패했습니다. 네트워크 상태를 확인해주세요.";
        }
      } finally {
        this.isLoading = false;
      }
    },

    // 2단계: 인증 코드 검증
    async verifyCode() {
      const { valid } = await this.$refs.codeForm.validate();
      if (!valid) return;

      this.isVerifying = true;
      this.errorMessage = "";

      try {
        const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';
        
        // 비밀번호 재설정용 인증 코드 검증 API 호출
        const response = await axios.create({
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json'
          }
        }).post(`${apiBaseUrl}/member/verify-password-reset-code`, {
          email: this.email,
          verifyCode: this.verificationCode
        });

        console.log('Code verification response:', response.data);

        if (response.data.result === true && response.data.status_code === 200) {
          // 인증 성공 시 비밀번호 변경 페이지로 이동 (이메일 정보를 쿼리로 전달)
          this.$router.push({
            path: '/reset-password',
            query: { 
              email: this.email,
              verified: 'true'
            }
          });
        } else {
          this.errorMessage = response.data.status_message || "인증 코드가 올바르지 않습니다.";
        }
      } catch (error) {
        console.error('Code verification error:', error);
        
        if (error.response) {
          const errorData = error.response.data;
          this.errorMessage = errorData.status_message || "인증 코드 확인에 실패했습니다.";
        } else {
          this.errorMessage = "서버와의 연결에 실패했습니다. 네트워크 상태를 확인해주세요.";
        }
      } finally {
        this.isVerifying = false;
      }
    },

    // 인증 코드 재발송
    async resendCode() {
      this.isResending = true;
      this.errorMessage = "";
      
      try {
        await this.sendVerificationCode();
        if (this.step === 2) {
          this.successMessage = "인증 코드를 다시 발송했습니다.";
        }
      } catch (error) {
        console.error('Resend code error:', error);
      } finally {
        this.isResending = false;
      }
    },

    // 이전 단계로 돌아가기
    goBack() {
      this.step = 1;
      this.verificationCode = "";
      this.errorMessage = "";
      this.successMessage = "";
    }
  }
}
</script>

<style scoped>
/* 전체 페이지 래퍼 */
.forgot-password-page-wrapper {
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
  max-width: 500px;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
}

/* 비밀번호 찾기 콘텐츠 영역 */
.forgot-password-content-area {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.forgot-password-wrapper {
  width: 100%;
  max-width: 400px;
}

/* 비밀번호 찾기 카드 */
.forgot-password-card {
  background: white !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
}

/* 헤더 */
.forgot-password-header {
  text-align: center;
}

.forgot-password-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.forgot-password-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
  margin: 0;
  line-height: 1.4;
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

/* 재설정 버튼 */
.reset-btn {
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

.reset-btn:hover {
  background: #1a9b94 !important;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(32, 178, 170, 0.3) !important;
}

/* 돌아가기 링크 */
.back-to-login {
  margin-top: 8px;
}

.back-link {
  font-size: 14px;
  color: #7f8c8d;
  text-decoration: none !important;
  font-weight: 500;
  transition: color 0.3s ease;
}

.back-link:hover {
  color: #667eea !important;
  text-decoration: underline !important;
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .top-logo {
    position: relative;
    top: 0;
    left: 0;
    justify-content: center;
    padding: 16px 0;
  }
  
  .top-logo-image {
    height: 28px;
  }
  
  .top-logo-text {
    font-size: 18px;
  }
  
  .forgot-password-content-area {
    padding: 20px;
  }
}

/* 애니메이션 */
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.forgot-password-card {
  animation: slideInUp 0.6s ease-out;
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

