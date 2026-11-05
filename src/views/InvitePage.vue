<template>
  <div class="invite-page">
    <template v-if="errorMessage">
      <v-icon size="64" color="error">mdi-alert-circle-outline</v-icon>
      <p class="invite-message">{{ errorMessage }}</p>
      <v-btn color="primary" @click="goToFridgeList">내 냉장고 목록으로</v-btn>
    </template>
    <template v-else>
      <v-progress-circular indeterminate color="primary" size="64"></v-progress-circular>
      <p class="invite-message">냉장고에 참여하는 중입니다...</p>
    </template>
  </div>
</template>

<script>
import axios from 'axios';
import { getErrorMessage } from '@/utils/commonDataHandler';
import { savePendingInviteCode, clearPendingInviteCode } from '@/utils/inviteHandler';

export default {
  name: 'InvitePage',
  data() {
    return {
      errorMessage: ''
    }
  },
  created() {
    this.joinByInviteLink();
  },
  methods: {
    async joinByInviteLink() {
      // 로그인 또는 토큰 재발급 실패로 페이지를 떠나도 다시 돌아올 수 있도록 먼저 저장
      savePendingInviteCode(this.$route.params.code);

      if (!localStorage.getItem('accessToken')) {
        this.$router.push('/login');
        return;
      }

      try {
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/fridge/join`, null, {
          params: { code: this.$route.params.code }
        });
        clearPendingInviteCode();
        await this.enterFridge(response.data.result);
      } catch (error) {
        // 토큰 재발급에 실패하면 인터셉터가 로그아웃시키므로, 코드를 남겨 두고 로그인 후 이어서 처리
        if (!localStorage.getItem('accessToken')) {
          return;
        }
        console.error('초대 링크 참여에 실패했습니다:', error);
        clearPendingInviteCode();
        this.errorMessage = getErrorMessage(error);
      }
    },
    async enterFridge(fridgeId) {
      const previousFridgeId = this.$store.getters.getCurrentFridgeId;
      const listResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/list`);
      const currentFridge = listResponse.data.result.find(f => f.fridgeId === fridgeId);

      this.$store.commit('setCurrentFridgeId', fridgeId);
      if (currentFridge) {
        this.$store.commit('setCurrentFridgeInfo', currentFridge);
      }

      if (previousFridgeId && previousFridgeId !== fridgeId) {
        await this.$store.dispatch('notification/refreshSSEOnFridgeChange', fridgeId);
      } else if (!previousFridgeId && !this.$store.getters['notification/isSSEConnected']) {
        await this.$store.dispatch('notification/initSSE');
      }

      await this.$store.dispatch('notification/updateChatBadgesOnFridgeEnter', fridgeId);

      this.$router.replace('/fridge/dashboard');
    },
    goToFridgeList() {
      this.$router.replace('/fridge/list');
    }
  }
}
</script>

<style scoped>
.invite-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 24px;
  padding: 16px;
  text-align: center;
}

.invite-message {
  font-size: 16px;
  color: #666;
}
</style>
