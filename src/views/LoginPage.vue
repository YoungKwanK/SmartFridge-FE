<template>
  <div class="login-page">
    <header class="brand">
      <img src="@/assets/images/SFlogo/smartFridge_logo.png" alt="" class="brand-logo" />
      <span class="brand-name">SmartFridge</span>
    </header>

    <main class="login-layout">
      <!-- 서비스가 하는 일을 실제 화면 모양으로 보여준다 -->
      <section class="intro" aria-labelledby="intro-title">
        <h1 id="intro-title" class="intro-title">
          같이 쓰는 냉장고,<br>누구 건지 언제까지인지<br>한눈에 보여요
        </h1>
        <p class="intro-desc">
          식품을 넣을 때 이름과 유통기한을 남기면, 곧 상하는 것부터 먼저 알려드려요.
          남는 식재료는 멤버와 나누고, 필요한 건 함께 사요.
        </p>

        <div class="sample" aria-label="오늘 확인할 식품 예시">
          <p class="sample-title">오늘 먼저 확인할 식품</p>
          <ul class="sample-list">
            <FoodRow v-for="food in sampleFoods" :key="food.id" :food="food" show-shared />
          </ul>
        </div>
      </section>

      <!-- 로그인 -->
      <section class="login-panel" aria-labelledby="login-title">
        <h2 id="login-title" class="login-title">{{ isAdminLogin ? '관리자 로그인' : '시작하기' }}</h2>
        <p class="login-desc">
          {{ isAdminLogin ? '관리자 계정의 이메일과 비밀번호를 입력하세요.' : '쓰던 계정으로 바로 로그인할 수 있어요.' }}
        </p>

        <v-alert
          v-if="errorMessage"
          type="error"
          variant="tonal"
          class="mb-4"
          :text="errorMessage"
          closable
          @click:close="errorMessage = ''"
        />

        <!-- 관리자 전용 이메일/비밀번호 로그인 폼 -->
        <v-form v-if="isAdminLogin" ref="loginForm" class="admin-form" @submit.prevent="doLogin">
          <v-text-field
            v-model="email"
            type="email"
            label="이메일"
            variant="outlined"
            :rules="emailRules"
            required
            hide-details="auto"
            autocomplete="username"
          />
          <v-text-field
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            label="비밀번호"
            variant="outlined"
            :append-inner-icon="showPassword ? 'mdi-eye-outline' : 'mdi-eye-off-outline'"
            :rules="passwordRules"
            required
            hide-details="auto"
            autocomplete="current-password"
            @click:append-inner="showPassword = !showPassword"
          />
          <v-btn type="submit" color="primary" variant="flat" block size="large" :loading="isLoading">
            로그인
          </v-btn>
        </v-form>

        <!-- 소셜 로그인: 각 서비스의 버튼 색을 따른다 -->
        <div v-else class="social-buttons">
          <button type="button" class="social-btn kakao" :disabled="socialLoading.kakao" @click="kakaoLogin()">
            <span class="social-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M12 3C6.48 3 2 6.48 2 10.77c0 2.76 1.84 5.18 4.6 6.55l-.94 3.44c-.08.3.26.54.52.37l4.1-2.72c.57.06 1.14.1 1.72.1 5.52 0 10-3.48 10-7.74S17.52 3 12 3z"/></svg>
            </span>
            {{ socialLoading.kakao ? '카카오로 이동 중' : '카카오로 계속하기' }}
          </button>
          <button type="button" class="social-btn naver" :disabled="socialLoading.naver" @click="naverLogin()">
            <span class="social-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M15.56 12.84 8.17 2H2v20h6.44V11.16L15.83 22H22V2h-6.44z"/></svg>
            </span>
            {{ socialLoading.naver ? '네이버로 이동 중' : '네이버로 계속하기' }}
          </button>
          <button type="button" class="social-btn google" :disabled="socialLoading.google" @click="googleLogin()">
            <span class="social-mark" aria-hidden="true">
              <svg viewBox="0 0 24 24" width="18" height="18"><path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.74-6-6.1s2.7-6.1 6-6.1c1.88 0 3.14.8 3.86 1.49l2.63-2.54C16.8 3.4 14.6 2.4 12 2.4 6.7 2.4 2.4 6.7 2.4 12s4.3 9.6 9.6 9.6c5.54 0 9.2-3.9 9.2-9.38 0-.63-.07-1.11-.15-1.6H12z"/></svg>
            </span>
            {{ socialLoading.google ? 'Google로 이동 중' : 'Google로 계속하기' }}
          </button>
        </div>

        <p v-if="!isAdminLogin" class="login-note">
          처음이면 로그인할 때 계정이 만들어져요. 냉장고는 로그인한 뒤 만들거나 초대 링크로 들어갈 수 있어요.
        </p>
      </section>
    </main>
  </div>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import FoodRow from '@/components/Food/FoodRow.vue';

// 첫 화면에 보여줄 예시 식품 (오늘 기준으로 날짜를 만든다)
const daysFromNow = (days, hour = 21) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};

export default {
  name: 'LoginPage',
  components: { FoodRow },
  data() {
    return {
      email: "",
      password: "",
      showPassword: false,
      isLoading: false,
      errorMessage: "",
      
      // 폼 유효성 검사 규칙
      emailRules: [
        v => !!v || '이메일을 입력해주세요.',
        v => /.+@.+\..+/.test(v) || '올바른 이메일 형식을 입력해주세요.'
      ],
      passwordRules: [
        v => !!v || '비밀번호를 입력해주세요.',
        v => v.length >= 4 || '비밀번호는 최소 4자 이상이어야 합니다.'
      ],
      
      // 소셜 로그인 로딩 상태
      socialLoading: {
        google: false,
        kakao: false,
        naver: false
      },
      
      // OAuth 설정
      googleUrl: "https://accounts.google.com/o/oauth2/auth",
      googleClientId: "135548742889-hvh4kecrrcetaqv8dla9uggr483fukll.apps.googleusercontent.com",
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
    sampleFoods() {
      return [
        { id: 1, name: '우유 1L', registeredName: '305호 민지', quantity: 1, category: '유제품', storageType: '냉장', shareable: false, expirationDateTime: daysFromNow(-1) },
        { id: 2, name: '두부', registeredName: '307호 준호', quantity: 2, category: '가공식품', storageType: '냉장', shareable: true, expirationDateTime: daysFromNow(0, 23) },
        { id: 3, name: '시금치 한 단', registeredName: '310호 서연', quantity: 1, category: '채소', storageType: '냉장', shareable: false, expirationDateTime: daysFromNow(2) }
      ];
    },
    // /admin/login 에서만 이메일/비밀번호 폼을 보여줌
    isAdminLogin() {
      return this.$route.path === '/admin/login';
    }
  },

  methods: {
    async doLogin() {
      // 폼 유효성 검사
      const { valid } = await this.$refs.loginForm.validate();
      if (!valid) {
        return;
      }

      this.isLoading = true;
      this.errorMessage = "";

      const loginData = {
        email: this.email,
        password: this.password
      };

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/member/doLogin`, loginData);
        
        // 백엔드 응답 구조에 맞춰 데이터 추출
        if (response.data.status_code === 200 && response.data.result) {
          const { accessToken, refreshToken } = response.data.result;
          
          // JWT 토큰에서 사용자 정보 추출
          const decodedToken = jwtDecode(accessToken);
          const role = decodedToken.role;
          const email = decodedToken.sub;
          
          // 토큰과 사용자 정보를 localStorage에 저장
          localStorage.setItem("accessToken", accessToken);
          localStorage.setItem("refreshToken", refreshToken);
          localStorage.setItem("role", role);
          localStorage.setItem("email", email);
          
          // 토큰 모니터링 시작
          if (window.tokenManager) {
            window.tokenManager.startMonitoring();
          }
          
          // 로그인 성공 후 FridgeList로 이동
          this.$nextTick(async () => {
            await this.checkUserFridgeStatus();
          });
        } else {
          this.errorMessage = response.data.status_message || "로그인에 실패했습니다.";
        }
      } catch (error) {
        console.error('Login error:', error);
        
        if (error.response) {
          // 서버에서 응답을 받은 경우
          const errorData = error.response.data;
          this.errorMessage = errorData.status_message || "로그인에 실패했습니다.";
        } else if (error.request) {
          // 요청은 보냈지만 응답을 받지 못한 경우
          this.errorMessage = "서버와의 연결에 실패했습니다. 네트워크 상태를 확인해주세요.";
        } else {
          // 요청 설정 중 오류가 발생한 경우
          this.errorMessage = "로그인 중 오류가 발생했습니다.";
        }
      } finally {
        this.isLoading = false;
      }
    },
    
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
    },
    
    async checkUserFridgeStatus() {
      try {
        // 사용자 역할에 따라 다른 페이지로 이동
        const role = localStorage.getItem('role');
        if (role === 'ADMIN') {
          // 관리자인 경우 관리자 대시보드로 이동
          this.$router.push('/admin').catch(() => {
            window.location.href = "/admin";
          });
        } else {
          // 일반 사용자인 경우 냉장고 목록으로 이동
          this.$router.push('/fridge/list').catch(() => {
            window.location.href = "/fridge/list";
          });
        }
      } catch (error) {
        console.error('페이지 이동 오류:', error);
        // 오류 발생 시 역할에 따라 이동
        const role = localStorage.getItem('role');
        if (role === 'ADMIN') {
          window.location.href = "/admin";
        } else {
          window.location.href = "/fridge/list";
        }
      }
    }
  },
  
  // 컴포넌트가 마운트될 때 이미 로그인된 사용자인지 확인
  async mounted() {
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const decodedToken = jwtDecode(token);
        const currentTime = Date.now() / 1000;
        
        // 토큰이 만료되지 않았다면 역할에 따라 적절한 페이지로 리다이렉트
        if (decodedToken.exp > currentTime) {
          await this.checkUserFridgeStatus();
        } else {
          // 만료된 토큰 제거
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("role");
          localStorage.removeItem("email");
        }
      } catch (error) {
        console.error('Token validation error:', error);
        // 잘못된 토큰 제거
        localStorage.clear();
      }
    }
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: var(--sf-bg);
  padding: 24px clamp(16px, 4vw, 56px) 48px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 8px;
  max-width: 1120px;
  margin: 0 auto;
}

.brand-logo {
  width: 36px;
  height: 36px;
  border-radius: 10px;
}

.brand-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--sf-primary);
}

.login-layout {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(320px, 400px);
  gap: clamp(32px, 6vw, 96px);
  align-items: center;
  max-width: 1120px;
  margin: clamp(32px, 8vh, 96px) auto 0;
}

/* 소개 */
.intro-title {
  margin: 0;
  font-size: clamp(32px, 4.2vw, 48px);
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.035em;
  color: var(--sf-text);
}

.intro-desc {
  max-width: 34em;
  margin: 20px 0 0;
  font-size: 17px;
  line-height: 1.7;
  color: var(--sf-text-sub);
}

.sample {
  max-width: 480px;
  margin-top: 36px;
  padding: 20px 20px 8px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  border-left: 4px solid var(--sf-soon);
  box-shadow: var(--sf-shadow);
}

.sample-title {
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 700;
  color: var(--sf-text);
}

.sample-list {
  margin: 0;
  padding: 0;
}

/* 로그인 */
.login-panel {
  padding: 32px 28px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
}

.login-title {
  margin: 0;
  font-size: 24px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--sf-text);
}

.login-desc {
  margin: 8px 0 24px;
  font-size: 15px;
  color: var(--sf-text-sub);
}

.admin-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.social-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.social-btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 52px;
  border: none;
  border-radius: var(--sf-radius-md);
  font: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
}

.social-btn:disabled {
  opacity: 0.7;
  cursor: progress;
}

.social-mark {
  position: absolute;
  left: 18px;
  display: grid;
  place-items: center;
}

.social-btn.kakao {
  background: #FEE500;
  color: rgba(0, 0, 0, 0.85);
}

.social-btn.naver {
  background: #03C75A;
  color: #FFFFFF;
}

.social-btn.google {
  background: var(--sf-surface);
  color: var(--sf-text);
  border: 1px solid var(--sf-line-strong);
}

.social-btn:hover:not(:disabled) {
  filter: brightness(0.97);
}

.login-note {
  margin: 20px 0 0;
  font-size: 13px;
  line-height: 1.6;
  color: var(--sf-text-faint);
}

@media (max-width: 900px) {
  .login-layout {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 28px;
  }

  .sample {
    max-width: none;
    margin-top: 24px;
  }

  /* 모바일: 제목 → 로그인 → 예시 순서 */
  .intro {
    display: contents;
  }

  .intro-title,
  .intro-desc {
    order: 1;
  }

  .login-panel {
    order: 2;
  }

  .sample {
    order: 3;
  }

  .intro-desc {
    margin-top: -12px;
  }
}

@media (max-width: 600px) {
  .login-page {
    padding: 16px 16px 32px;
  }

  .intro-desc {
    font-size: 15px;
  }

  .login-panel {
    padding: 24px 20px;
  }
}
</style>
