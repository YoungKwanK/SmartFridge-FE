<template>
  <v-app>
    <div class="no-fridge-page-wrapper">
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
                  냉장고를<br>
                  시작해보세요!
                </h1>
                <p class="promotion-subtitle">
                  새로운 냉장고를 만들거나 초대받은 냉장고에 참여하여 스마트한 냉장고 관리를 시작하세요.
                </p>
                <p class="promotion-description">
                  가족, 룸메이트, 동료들과 함께 식재료를 효율적으로 관리하고 음식 낭비를 줄여보세요.
                </p>
              </div>
              
              <!-- 기능 카드들 -->
              <div class="feature-cards">
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-plus-circle-outline</v-icon>
                  <span class="feature-text">새 냉장고 생성</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-account-multiple-plus-outline</v-icon>
                  <span class="feature-text">냉장고 초대받기</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-share-variant-outline</v-icon>
                  <span class="feature-text">식재료 공유 관리</span>
                </div>
                <div class="feature-card">
                  <v-icon class="feature-icon" color="white" size="24">mdi-bell-ring-outline</v-icon>
                  <span class="feature-text">유통기한 알림</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 메인 콘텐츠 영역 -->
          <div class="main-content-area">
            <div class="main-content-wrapper">
              <!-- 메인 카드 -->
              <v-card class="main-card elevation-12">
                <v-card-text class="pa-8">
                  <!-- 헤더 -->
                  <div class="header-section mb-6">
                    <div class="welcome-icon-wrapper mb-4">
                      <v-icon class="welcome-icon" color="primary" size="64">mdi-fridge-outline</v-icon>
                    </div>
                    <h2 class="main-title">참여한 냉장고가 없습니다</h2>
                    <p class="main-subtitle">새로운 냉장고를 만들거나 기존 냉장고에 참여해보세요</p>
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

                  <!-- 액션 버튼들 -->
                  <div class="action-buttons-section mb-6">
                    <v-btn 
                      color="primary" 
                      block 
                      size="large"
                      class="action-btn create-btn mb-4"
                      elevation="0"
                      @click="showCreateFridgeDialog = true"
                      :loading="isLoading"
                    >
                      <v-icon class="mr-2">mdi-plus-circle-outline</v-icon>
                      새 냉장고 만들기
                    </v-btn>

                    <v-btn 
                      variant="outlined"
                      color="primary" 
                      block 
                      size="large"
                      class="action-btn join-btn mb-4"
                      elevation="0"
                      @click="showJoinFridgeDialog = true"
                    >
                      <v-icon class="mr-2">mdi-account-multiple-plus-outline</v-icon>
                      초대코드로 참여하기
                    </v-btn>

                    <v-btn 
                      variant="text"
                      color="grey-darken-1" 
                      block 
                      size="large"
                      class="refresh-btn"
                      @click="checkFridgeStatus"
                      :loading="isRefreshing"
                    >
                      <v-icon class="mr-2">mdi-refresh</v-icon>
                      냉장고 상태 새로고침
                    </v-btn>
                  </div>

                  <!-- 도움말 섹션 -->
                  <div class="help-section">
                    <div class="help-card">
                      <v-icon class="help-icon" color="info" size="20">mdi-information-outline</v-icon>
                      <div class="help-text">
                        <p class="help-title">도움이 필요하신가요?</p>
                        <p class="help-description">냉장고 생성이나 참여에 문제가 있다면 고객센터에 문의해주세요.</p>
                      </div>
                    </div>
                  </div>
                </v-card-text>
              </v-card>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 새 냉장고 생성 다이얼로그 -->
    <v-dialog v-model="showCreateFridgeDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-6 pb-4">새 냉장고 만들기</v-card-title>
        <v-card-text class="px-6 pb-4">
          <v-form ref="createFridgeForm" @submit.prevent="createFridge">
            <v-text-field
              v-model="newFridgeName"
              label="냉장고 이름"
              placeholder="예: 우리집 냉장고"
              variant="outlined"
              :rules="fridgeNameRules"
              required
              hide-details="auto"
              class="mb-4"
            ></v-text-field>
            
            <v-textarea
              v-model="newFridgeDescription"
              label="냉장고 설명 (선택사항)"
              placeholder="냉장고에 대한 간단한 설명을 입력하세요"
              variant="outlined"
              rows="3"
              hide-details="auto"
            ></v-textarea>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-2">
          <v-spacer></v-spacer>
          <v-btn 
            variant="text" 
            @click="showCreateFridgeDialog = false"
            :disabled="isCreatingFridge"
          >
            취소
          </v-btn>
          <v-btn 
            color="primary" 
            @click="createFridge"
            :loading="isCreatingFridge"
          >
            생성하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 냉장고 참여 다이얼로그 -->
    <v-dialog v-model="showJoinFridgeDialog" max-width="500px" persistent>
      <v-card>
        <v-card-title class="text-h6 pa-6 pb-4">냉장고 참여하기</v-card-title>
        <v-card-text class="px-6 pb-4">
          <v-form ref="joinFridgeForm" @submit.prevent="joinFridge">
            <v-text-field
              v-model="inviteCode"
              label="초대 코드"
              placeholder="초대 코드를 입력하세요"
              variant="outlined"
              :rules="inviteCodeRules"
              required
              hide-details="auto"
            ></v-text-field>
          </v-form>
        </v-card-text>
        <v-card-actions class="pa-6 pt-2">
          <v-spacer></v-spacer>
          <v-btn 
            variant="text" 
            @click="showJoinFridgeDialog = false"
            :disabled="isJoiningFridge"
          >
            취소
          </v-btn>
          <v-btn 
            color="primary" 
            @click="joinFridge"
            :loading="isJoiningFridge"
          >
            참여하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-app>
</template>

<script>
import { jwtDecode } from 'jwt-decode';
import { fridgeService } from '@/services/fridgeService';

export default {
  name: 'NoFridgePage',
  data() {
    return {
      isLoading: false,
      isRefreshing: false,
      isCreatingFridge: false,
      isJoiningFridge: false,
      errorMessage: "",
      successMessage: "",
      
      // 다이얼로그 상태
      showCreateFridgeDialog: false,
      showJoinFridgeDialog: false,
      
      // 새 냉장고 생성 데이터
      newFridgeName: "",
      newFridgeDescription: "",
      
      // 냉장고 참여 데이터
      inviteCode: "",
      
      // 폼 유효성 검사 규칙
      fridgeNameRules: [
        v => !!v || '냉장고 이름을 입력해주세요.',
        v => v.length >= 2 || '냉장고 이름은 최소 2자 이상이어야 합니다.',
        v => v.length <= 50 || '냉장고 이름은 50자 이하여야 합니다.'
      ],
      inviteCodeRules: [
        v => !!v || '초대 코드를 입력해주세요.',
        v => v.length >= 6 || '초대 코드는 최소 6자 이상이어야 합니다.'
      ]
    }
  },
  
  methods: {
    async checkFridgeStatus() {
      this.isRefreshing = true;
      this.errorMessage = "";
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const decodedToken = jwtDecode(token);
        const memberId = decodedToken.memberId || decodedToken.sub;
        
        const response = await fridgeService.getFridgesByMember(memberId);
        
        if (response.status_code === 200 && response.result && response.result.length > 0) {
          // 냉장고가 있으면 첫 번째 냉장고의 대시보드로 이동
          const firstFridge = response.result[0];
          this.$router.push(`/fridge/${firstFridge.fridgeId}/dashboard`);
        } else {
          this.successMessage = "현재 참여한 냉장고가 없습니다.";
        }
      } catch (error) {
        console.error('냉장고 상태 확인 오류:', error);
        this.errorMessage = "냉장고 상태를 확인하는데 실패했습니다.";
      } finally {
        this.isRefreshing = false;
      }
    },
    
    async createFridge() {
      const { valid } = await this.$refs.createFridgeForm.validate();
      if (!valid) return;
      
      this.isCreatingFridge = true;
      this.errorMessage = "";
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const fridgeData = {
          name: this.newFridgeName,
          description: this.newFridgeDescription || ""
        };
        
        const response = await fridgeService.createFridge(fridgeData);
        
        if (response.status_code === 201 && response.result) {
          const fridgeId = response.result.fridgeId;
          this.successMessage = "냉장고가 성공적으로 생성되었습니다!";
          this.showCreateFridgeDialog = false;
          
          // 생성된 냉장고 대시보드로 이동
          setTimeout(() => {
            this.$router.push(`/fridge/${fridgeId}/dashboard`);
          }, 1500);
        } else {
          this.errorMessage = response.status_message || "냉장고 생성에 실패했습니다.";
        }
      } catch (error) {
        console.error('냉장고 생성 오류:', error);
        this.errorMessage = error.response?.data?.status_message || "냉장고 생성에 실패했습니다.";
      } finally {
        this.isCreatingFridge = false;
      }
    },
    
    async joinFridge() {
      const { valid } = await this.$refs.joinFridgeForm.validate();
      if (!valid) return;
      
      this.isJoiningFridge = true;
      this.errorMessage = "";
      
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          this.$router.push('/login');
          return;
        }
        
        const response = await fridgeService.joinFridgeByInviteCode(this.inviteCode);
        
        if (response.status_code === 200 && response.result) {
          const fridgeId = response.result.fridgeId;
          this.successMessage = "냉장고에 성공적으로 참여했습니다!";
          this.showJoinFridgeDialog = false;
          
          // 참여한 냉장고 대시보드로 이동
          setTimeout(() => {
            this.$router.push(`/fridge/${fridgeId}/dashboard`);
          }, 1500);
        } else {
          this.errorMessage = response.status_message || "냉장고 참여에 실패했습니다.";
        }
      } catch (error) {
        console.error('냉장고 참여 오류:', error);
        this.errorMessage = error.response?.data?.status_message || "냉장고 참여에 실패했습니다.";
      } finally {
        this.isJoiningFridge = false;
      }
    }
  },
  
  mounted() {
    // 페이지 로드 시 냉장고 상태 확인
    this.checkFridgeStatus();
  }
}
</script>

<style scoped>
/* 전체 페이지 래퍼 */
.no-fridge-page-wrapper {
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

/* 메인 콘텐츠 영역 */
.main-content-area {
  flex: 0 0 41.67%; /* 약 5/12 비율 */
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
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

.main-content-wrapper {
  width: 100%;
  max-width: 500px;
}

/* 메인 카드 */
.main-card {
  background: white !important;
  border-radius: 24px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1) !important;
  border: none !important;
}

/* 헤더 섹션 */
.header-section {
  text-align: center;
}

.welcome-icon-wrapper {
  display: flex;
  justify-content: center;
}

.welcome-icon {
  background: rgba(102, 126, 234, 0.1);
  border-radius: 50%;
  padding: 16px;
}

.main-title {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.main-subtitle {
  font-size: 14px;
  color: #7f8c8d;
  font-weight: 400;
  margin: 0;
}

/* 액션 버튼들 */
.action-btn {
  height: 56px !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  text-transform: none !important;
  border-radius: 12px !important;
  transition: all 0.3s ease !important;
}

.create-btn {
  background: #20B2AA !important;
  color: white !important;
  box-shadow: none !important;
}

.create-btn:hover {
  background: #1a9b94 !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(32, 178, 170, 0.3) !important;
}

.join-btn {
  border: 2px solid #667eea !important;
  color: #667eea !important;
}

.join-btn:hover {
  background: #667eea !important;
  color: white !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.3) !important;
}

.refresh-btn {
  height: 48px !important;
  font-size: 14px !important;
  font-weight: 500 !important;
  text-transform: none !important;
  border-radius: 8px !important;
  color: #7f8c8d !important;
}

.refresh-btn:hover {
  background: rgba(127, 140, 141, 0.1) !important;
}

/* 도움말 섹션 */
.help-section {
  margin-top: 24px;
}

.help-card {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.help-icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.help-text {
  flex: 1;
}

.help-title {
  font-size: 14px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 4px;
}

.help-description {
  font-size: 13px;
  color: #7f8c8d;
  line-height: 1.4;
  margin: 0;
}

/* 다이얼로그 스타일 */
.v-dialog .v-card {
  border-radius: 16px !important;
}

.v-dialog .v-card-title {
  font-weight: 600 !important;
  color: #2c3e50 !important;
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
  
  .main-content-area {
    flex: 1;
    width: 100%;
    max-width: 600px;
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
  
  .main-content-area {
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
  
  .main-card .pa-8 {
    padding: 24px !important;
  }
  
  .action-btn {
    height: 52px !important;
    font-size: 15px !important;
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

.main-card {
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

/* 알림 스타일 */
.v-alert {
  border-radius: 12px !important;
  font-size: 14px;
}
</style>
