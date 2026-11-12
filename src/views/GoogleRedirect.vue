<template>
  <AuthRedirectScreen
    provider="구글"
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

export default {
    name: 'GoogleRedirect',
    components: { AuthRedirectScreen },
    data() {
        return {
            currentStep: 1,
            progressValue: 0,
            statusMessage: '구글 인증 코드를 확인하고 있습니다...',
            progressInterval: null
        }
    },
    created() {
        const code = new URL(window.location.href).searchParams.get("code");
        
        // 로딩 애니메이션 시작
        this.startLoadingAnimation();
        
        // 서버로 코드 전송
        this.sendCodeToServer(code);
    },
    beforeUnmount() {
        // 컴포넌트가 언마운트되기 전에 인터벌 정리
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    },
    methods: {
        startLoadingAnimation() {
            // 진행률 애니메이션 시작
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
        
        async sendCodeToServer(code) {
            try {
                console.log("서버로 코드 전송 중...");
                this.updateStep(1, '구글 인증 코드를 확인하고 있습니다...');
                
                // API 기본 URL 설정 (환경변수가 없는 경우 기본값 사용)
                const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;
                
                // 1단계 완료
                await new Promise(resolve => setTimeout(resolve, 500));
                this.updateStep(2, '서버에서 인증을 처리하고 있습니다...');
                
                // 백엔드 컨트롤러에 맞춰 code를 전송
                const response = await axios.post(`${apiBaseUrl}/member/google/doLogin`, {
                    code: code
                });
                
                // 백엔드 응답 구조: { result: { accessToken, refreshToken }, status_code: 200, status_message: "구글 로그인 성공" }
                if (response.data.status_code === 200 && response.data.result) {
                    const { accessToken, refreshToken } = response.data.result;
                    
                    // JWT 토큰에서 사용자 정보 추출
                    const decodedToken = jwtDecode(accessToken);
                    const role = decodedToken.role;
                    const email = decodedToken.sub;
                    
                    // 토큰과 사용자 정보 저장 (RT는 AT 만료 시 재발급에 사용)
                    localStorage.setItem("accessToken", accessToken);
                    localStorage.setItem("refreshToken", refreshToken);
                    localStorage.setItem("role", role);
                    localStorage.setItem("email", email);
                    
                    // 토큰 모니터링 시작
                    if (window.tokenManager) {
                        window.tokenManager.startMonitoring();
                    }
                    
                    // 사용자 정보를 store에 로드
                    try {
                        await this.$store.dispatch('fetchUserInfo');
                    } catch (error) {
                        console.warn('Failed to fetch user info:', error);
                    }
                    
                    console.log("구글 로그인 성공, 냉장고 상태 확인");
                    
                    // 3단계 완료
                    this.updateStep(3, '대시보드로 이동중...');
                    this.progressValue = 100;
                    
                    // FridgeList로 리다이렉트
                    await this.checkUserFridgeStatus();
                } else {
                    throw new Error(response.data.status_message || "구글 로그인에 실패했습니다.");
                }
                
            } catch (error) {
                console.error('Google OAuth 에러:', error);
                
                // 서버가 보낸 사유(이메일 미동의, 미인증 이메일 등)가 있으면 그대로 보여줌
                this.statusMessage = error.response?.data?.status_message
                    || "로그인 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.";
                this.progressValue = 0;
                
                // 3초 후 로그인 페이지로 이동
                setTimeout(() => {
                    window.location.href = "/";
                }, 3000);
            }
        },
        
        async checkUserFridgeStatus() {
            const nextPath = getPostLoginPath();
            try {
                // 로그인 성공 후 초대 페이지 또는 FridgeList 페이지로 이동
                this.$router.push(nextPath).catch(() => {
                    window.location.href = nextPath;
                });
            } catch (error) {
                console.error('페이지 이동 오류:', error);
                // 오류 발생 시에도 같은 페이지로 이동
                window.location.href = nextPath;
            }
        }
    }
}
</script>

