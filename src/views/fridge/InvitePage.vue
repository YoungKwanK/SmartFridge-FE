<template>
  <main class="invite-page">
    <section class="invite-panel" aria-live="polite">
      <template v-if="errorMessage">
        <v-icon size="40" color="error" aria-hidden="true">mdi-link-variant-off</v-icon>
        <h1 class="invite-title">초대 링크로 들어가지 못했어요</h1>
        <p class="invite-message">{{ errorMessage }}</p>
        <p class="invite-hint">링크가 만료됐을 수 있어요. 냉장고 관리자에게 새 링크를 받아 주세요.</p>
        <v-btn color="primary" variant="flat" @click="goToFridgeList">내 냉장고 목록으로</v-btn>
      </template>
      <template v-else>
        <v-progress-circular indeterminate color="primary" size="40" width="3" />
        <h1 class="invite-title">냉장고에 들어가는 중이에요</h1>
        <p class="invite-message">잠시만 기다려 주세요.</p>
      </template>
    </section>
  </main>
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
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 16px;
  background: var(--sf-bg);
}

.invite-panel {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: min(400px, 100%);
  padding: 36px 32px 32px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
  text-align: center;
}

.invite-title {
  margin: 20px 0 0;
  font-size: var(--sf-fs-xl);
  font-weight: 800;
  color: var(--sf-text);
}

.invite-message {
  margin: 6px 0 0;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.invite-hint {
  margin: 4px 0 24px;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}
</style>
