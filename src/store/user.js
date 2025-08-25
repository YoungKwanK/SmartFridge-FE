import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const user = {
    state: {
        userInfo: null,
        isLoggedIn: false
    },
    
    mutations: {
        SET_USER_INFO(state, userInfo) {
            state.userInfo = userInfo;
            state.isLoggedIn = true;
        },
        
        CLEAR_USER_INFO(state) {
            state.userInfo = null;
            state.isLoggedIn = false;
        }
    },
    
    actions: {
        async fetchUserInfo({ commit }) {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    throw new Error('No access token found');
                }
                
                // JWT 토큰에서 이메일 추출
                const decodedToken = jwtDecode(token);
                const email = decodedToken.sub || localStorage.getItem('email');
                
                if (!email) {
                    throw new Error('No email found in token or localStorage');
                }
                
                // 백엔드 API에서 사용자 정보를 가져오기 (이메일을 쿼리 파라미터로 전달)
                try {
                    console.log('🔍 Fetching user info for email:', email);
                    
                    const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/member/info`, {
                        params: {
                            email: email
                        },
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });
                    
                    console.log('✅ API Response:', response.data);
                    
                    if (response.data.status_code === 200 && response.data.result) {
                        const userInfo = response.data.result;
                        console.log('✅ User info loaded from API:', userInfo);
                        commit('SET_USER_INFO', userInfo);
                        return userInfo;
                    }
                } catch (apiError) {
                    console.error('❌ API fetch failed:', {
                        message: apiError.message,
                        status: apiError.response?.status,
                        statusText: apiError.response?.statusText,
                        responseData: apiError.response?.data,
                        requestUrl: apiError.config?.url,
                        requestParams: apiError.config?.params
                    });
                    console.warn('🔄 Using fallback method');
                }
                
                // API가 실패하면 JWT 토큰과 localStorage에서 기본 정보 생성
                if (email) {
                    // 이메일에서 사용자 이름 추출 (@ 앞 부분)
                    const username = email.split('@')[0];
                    
                    const fallbackUserInfo = {
                        email: email,
                        name: username,
                        profileImage: null,
                        role: decodedToken.role || localStorage.getItem('role') || 'USER'
                    };
                    
                    commit('SET_USER_INFO', fallbackUserInfo);
                    console.log('⚠️ Using fallback user info:', fallbackUserInfo);
                    return fallbackUserInfo;
                }
                
                throw new Error('Failed to fetch user info from API and fallback methods');
                
            } catch (error) {
                console.error('Error fetching user info:', error);
                // 토큰이 유효하지 않거나 만료된 경우 로그아웃 처리
                if (error.response && error.response.status === 401) {
                    commit('CLEAR_USER_INFO');
                    localStorage.clear();
                    window.location.href = '/login';
                }
                throw error;
            }
        },
        
        logout({ commit }) {
            commit('CLEAR_USER_INFO');
            localStorage.clear();
        }
    },
    
    getters: {
        getUserInfo: state => state.userInfo,
        isLoggedIn: state => state.isLoggedIn,
        getUserName: state => state.userInfo ? state.userInfo.name : '',
        getUserEmail: state => state.userInfo ? state.userInfo.email : '',
        getUserProfileImage: state => state.userInfo ? state.userInfo.profileImage : null,
        getUserInitial: state => {
            if (state.userInfo && state.userInfo.name) {
                return state.userInfo.name.charAt(0);
            }
            return '';
        }
    }
};

export default user;
