<template>
    <div>구글 로그인 진행중...</div>
</template>

<script>
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

export default {
    created() {
        console.log("Google OAuth redirect created");
        const code = new URL(window.location.href).searchParams.get("code");
        console.log("Authorization code:", code);
        this.sendCodeToServer(code);
    },
    methods: {
        async sendCodeToServer(code) {
            try {
                console.log("서버로 코드 전송 중...");
                
                // API 기본 URL 설정 (환경변수가 없는 경우 기본값 사용)
                const apiBaseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8080';
                
                // 백엔드 컨트롤러에 맞춰 code를 전송
                const response = await axios.post(`${apiBaseUrl}/member/google/doLogin`, {
                    code: code
                });
                
                console.log('Google OAuth response:', response.data);
                
                // 백엔드 응답 구조: { result: { id, token }, status_code: 200, status_message: "구글 로그인 성공" }
                if (response.data.status_code === 200 && response.data.result) {
                    const { token } = response.data.result;
                    
                    // JWT 토큰에서 사용자 정보 추출
                    const decodedToken = jwtDecode(token);
                    const role = decodedToken.role;
                    const email = decodedToken.sub;
                    
                    // 일반 로그인과 동일한 방식으로 토큰 저장
                    localStorage.setItem("accessToken", token);
                    localStorage.setItem("role", role);
                    localStorage.setItem("email", email);
                    
                    // 사용자 정보를 store에 로드
                    try {
                        await this.$store.dispatch('fetchUserInfo');
                    } catch (error) {
                        console.warn('Failed to fetch user info:', error);
                    }
                    
                    console.log("구글 로그인 성공, 냉장고 상태 확인");
                    
                    // FridgeList로 리다이렉트
                    await this.checkUserFridgeStatus();
                } else {
                    throw new Error(response.data.status_message || "구글 로그인에 실패했습니다.");
                }
                
            } catch (error) {
                console.error('Google OAuth 에러:', error);
                
                let errorMessage = "구글 로그인 처리 중 오류가 발생했습니다.";
                
                if (error.response) {
                    const errorData = error.response.data;
                    errorMessage = errorData.status_message || errorData.message || "서버 오류가 발생했습니다.";
                } else if (error.request) {
                    errorMessage = "서버와의 연결에 실패했습니다. 네트워크 상태를 확인해주세요.";
                }
                
                alert(errorMessage);
                // 에러 시 로그인 페이지로 돌아가기
                window.location.href = "/";
            }
        },
        
        async checkUserFridgeStatus() {
            try {
                // 로그인 성공 후 바로 FridgeList 페이지로 이동
                this.$router.push('/fridge/list').catch(() => {
                    window.location.href = "/fridge/list";
                });
            } catch (error) {
                console.error('페이지 이동 오류:', error);
                // 오류 발생 시에도 FridgeList로 이동
                window.location.href = "/fridge/list";
            }
        }
    }
}
</script>