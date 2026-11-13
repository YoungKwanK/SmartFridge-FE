<template>
  <AuthRedirectScreen
    :provider="providerLabel"
    :current-step="currentStep"
    :progress="progressValue"
    :status-message="statusMessage"
  />
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { getPostLoginPath } from '@/utils/inviteHandler';
import AuthRedirectScreen from '@/components/common/AuthRedirectScreen.vue';

// 소셜 로그인 제공자별 화면 이름. 경로 /oauth/:provider/redirect 의 provider 값과 맞춘다
const PROVIDER_LABELS = {
    google: '구글',
    kakao: '카카오',
    naver: '네이버'
};

export default {
    name: 'OAuthRedirect',
    components: { AuthRedirectScreen },
    data() {
        return {
            currentStep: 1,
            progressValue: 0,
            statusMessage: '',
            progressInterval: null
        }
    },
    computed: {
        provider() {
            return this.$route.params.provider;
        },
        providerLabel() {
            return PROVIDER_LABELS[this.provider];
        }
    },
    created() {
        const params = new URL(window.location.href).searchParams;
        // 네이버는 CSRF 방지용 state도 함께 보내야 한다 (NaverRedirectDto)
        const payload = { code: params.get('code') };
        if (this.provider === 'naver') {
            payload.state = params.get('state');
        }

        this.startLoadingAnimation();
        this.sendCodeToServer(payload);
    },
    beforeUnmount() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    },
    methods: {
        startLoadingAnimation() {
            this.progressInterval = setInterval(() => {
                if (this.progressValue < 90) {
                    this.progressValue += Math.random() * 10;
                }
            }, 200);
        },

        updateStep(step, message) {
            this.currentStep = step;
            this.statusMessage = message;
        },

        async sendCodeToServer(payload) {
            try {
                this.updateStep(1, `${this.providerLabel} 인증 코드를 확인하고 있습니다...`);

                await new Promise(resolve => setTimeout(resolve, 500));
                this.updateStep(2, '서버에서 인증을 처리하고 있습니다...');

                const response = await axios.post(
                    `${import.meta.env.VITE_API_BASE_URL}/member/${this.provider}/doLogin`,
                    payload
                );

                // 백엔드 응답 구조: { result: { accessToken, refreshToken }, status_code: 200, status_message }
                if (response.data.status_code === 200 && response.data.result) {
                    const { accessToken, refreshToken } = response.data.result;

                    // JWT 토큰에서 사용자 정보 추출
                    const decodedToken = jwtDecode(accessToken);

                    // 토큰과 사용자 정보 저장 (RT는 AT 만료 시 재발급에 사용)
                    localStorage.setItem("accessToken", accessToken);
                    localStorage.setItem("refreshToken", refreshToken);
                    localStorage.setItem("role", decodedToken.role);
                    localStorage.setItem("email", decodedToken.sub);

                    if (window.tokenManager) {
                        window.tokenManager.startMonitoring();
                    }

                    try {
                        await this.$store.dispatch('fetchUserInfo');
                    } catch (error) {
                        console.warn('Failed to fetch user info:', error);
                    }

                    this.updateStep(3, '대시보드로 이동중...');
                    this.progressValue = 100;

                    this.moveToNextPage();
                } else {
                    throw new Error(response.data.status_message || `${this.providerLabel} 로그인에 실패했습니다.`);
                }
            } catch (error) {
                console.error(`${this.provider} OAuth 에러:`, error);

                // 서버가 보낸 사유(이메일 미동의, 미인증 이메일 등)가 있으면 그대로 보여줌
                this.statusMessage = error.response?.data?.status_message
                    || "로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
                this.progressValue = 0;

                // 3초 후 첫 화면으로 이동
                setTimeout(() => {
                    window.location.href = "/";
                }, 3000);
            }
        },

        moveToNextPage() {
            // 로그인 성공 후 초대 페이지 또는 냉장고 목록으로 이동
            const nextPath = getPostLoginPath();
            this.$router.push(nextPath).catch(() => {
                window.location.href = nextPath;
            });
        }
    }
}
</script>
