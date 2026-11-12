<template>
  <div class="fridge-list-page">
    <header class="top-bar">
      <span class="brand-name">SmartFridge</span>
      <v-btn variant="text" size="small" prepend-icon="mdi-logout" @click="doLogout">로그아웃</v-btn>
    </header>

    <main class="picker">
      <div class="picker-head">
        <div>
          <h1 class="page-title">내 냉장고</h1>
          <p class="page-desc">들어갈 냉장고를 고르세요.</p>
        </div>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" @click="openCreateModal">
          냉장고 만들기
        </v-btn>
      </div>

      <div v-if="!fridgeList.length" class="empty-state">
        <v-icon size="40" class="empty-icon" aria-hidden="true">mdi-fridge-outline</v-icon>
        <p class="empty-title">아직 참여한 냉장고가 없어요</p>
        <p class="empty-desc">
          냉장고를 새로 만들거나, 초대 링크를 받았다면 그 링크를 열어 바로 참여하세요.
        </p>
        <v-btn color="primary" variant="flat" prepend-icon="mdi-plus" class="mt-2" @click="openCreateModal">
          냉장고 만들기
        </v-btn>
      </div>

      <ul v-else class="fridge-list">
        <li v-for="fridge in fridgeList" :key="fridge.fridgeId" class="fridge-item">
          <button type="button" class="fridge-enter" @click="enterFridge(fridge.fridgeId)">
            <span class="fridge-icon" aria-hidden="true">
              <v-icon size="24">mdi-fridge-outline</v-icon>
            </span>
            <span class="fridge-text">
              <span class="fridge-name-row">
                <span class="fridge-name">{{ fridge.fridgeName }}</span>
                <span class="role-tag" :class="{ 'is-manager': fridge.type === 'MANAGER' }">
                  {{ fridge.type === 'MANAGER' ? '관리자' : '멤버' }}
                </span>
              </span>
              <span class="fridge-desc">{{ fridge.description || '설명이 없어요' }}</span>
            </span>
            <span class="enter-label">
              들어가기
              <v-icon size="18" aria-hidden="true">mdi-chevron-right</v-icon>
            </span>
          </button>

          <div class="fridge-tools">
            <v-btn
              v-if="fridge.type === 'MANAGER'"
              variant="text"
              size="small"
              prepend-icon="mdi-link-variant"
              @click="copyInviteLink(fridge.inviteLink)"
            >
              초대 링크 복사
            </v-btn>
            <v-menu location="bottom end">
              <template #activator="{ props: menuProps }">
                <v-btn
                  v-bind="menuProps"
                  icon="mdi-dots-horizontal"
                  variant="text"
                  size="small"
                  :aria-label="`${fridge.fridgeName} 더보기`"
                />
              </template>
              <v-list density="compact" min-width="160">
                <v-list-item v-if="fridge.type === 'MANAGER'" prepend-icon="mdi-pencil-outline" title="정보 수정" @click="openEditModal(fridge)" />
                <v-list-item
                  v-if="fridge.type === 'MANAGER'"
                  prepend-icon="mdi-delete-outline"
                  title="냉장고 삭제"
                  base-color="error"
                  @click="openDeleteConfirmDialog(fridge)"
                />
                <v-list-item
                  v-else
                  prepend-icon="mdi-exit-to-app"
                  title="냉장고 나가기"
                  base-color="error"
                  @click="openLeaveConfirmDialog(fridge)"
                />
              </v-list>
            </v-menu>
          </div>
        </li>
      </ul>
    </main>

    <FridgeFormModal v-model="isFormModalOpen" :editing-fridge="selectedFridge" @save="handleSaveFridge" />

    <!-- 삭제 확인 다이얼로그 -->
    <DeleteConfirmDialog
      v-model="showDeleteDialog"
      title="냉장고를 삭제할까요?"
      :message="`'${selectedFridge?.fridgeName || ''}'의 멤버, 식품, 게시글이 모두 지워지고 되돌릴 수 없어요.`"
      @confirm="deleteFridge(selectedFridge?.fridgeId)"
      @cancel="showDeleteDialog = false"
    />

    <!-- 나가기 확인 다이얼로그 -->
    <DeleteConfirmDialog
      v-model="showLeaveDialog"
      title="냉장고에서 나갈까요?"
      :message="`'${selectedFridge?.fridgeName || ''}'에서 나가면 내가 남긴 데이터가 지워져요.`"
      @confirm="leaveFridge(selectedFridge?.fridgeId)"
      @cancel="showLeaveDialog = false"
    />

    <CommonSnackbar ref="commonSnackbar" />
  </div>
</template>

<style scoped>
.fridge-list-page {
  min-height: 100vh;
  background: var(--sf-bg);
  padding: 20px clamp(16px, 4vw, 48px) 48px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 760px;
  margin: 0 auto;
}

.brand-name {
  font-size: 18px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--sf-primary);
}

.picker {
  max-width: 760px;
  margin: clamp(24px, 6vh, 64px) auto 0;
}

.picker-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--sf-text);
}

.page-desc {
  margin: 6px 0 0;
  font-size: 15px;
  color: var(--sf-text-sub);
}

.fridge-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.fridge-item {
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
  overflow: hidden;
}

.fridge-enter {
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto;
  align-items: center;
  gap: 16px;
  width: 100%;
  padding: 20px 20px 12px;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.fridge-icon {
  display: grid;
  place-items: center;
  width: 48px;
  height: 48px;
  border-radius: var(--sf-radius-md);
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
}

.fridge-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.fridge-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.fridge-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--sf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.role-tag {
  flex-shrink: 0;
  padding: 2px 8px;
  border-radius: var(--sf-radius-sm);
  border: 1px solid var(--sf-line);
  font-size: 12px;
  font-weight: 600;
  color: var(--sf-text-sub);
}

.role-tag.is-manager {
  border-color: transparent;
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
}

.fridge-desc {
  font-size: 14px;
  color: var(--sf-text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.enter-label {
  display: inline-flex;
  align-items: center;
  font-size: 15px;
  font-weight: 700;
  color: var(--sf-primary);
}

.fridge-enter:hover .fridge-name {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.fridge-tools {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  padding: 0 12px 8px 84px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 56px 24px;
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
  text-align: center;
}

.empty-icon {
  color: var(--sf-text-faint);
}

.empty-title {
  margin: 4px 0 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--sf-text);
}

.empty-desc {
  max-width: 28em;
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--sf-text-sub);
}

@media (max-width: 600px) {
  .picker-head {
    flex-direction: column;
    align-items: stretch;
  }

  .page-title {
    font-size: 24px;
  }

  .fridge-enter {
    grid-template-columns: 40px minmax(0, 1fr);
    gap: 12px;
    padding: 16px 16px 8px;
  }

  .fridge-icon {
    width: 40px;
    height: 40px;
  }

  .enter-label {
    display: none;
  }

  .fridge-tools {
    padding-left: 60px;
  }
}
</style>


<script>
import axios from 'axios';
import FridgeFormModal from '@/components/Fridge/FridgeFormModal.vue';
import CommonSnackbar from '@/components/common/CommonSnackbar.vue';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog.vue';

export default {
  components: {
    FridgeFormModal,
    CommonSnackbar,
    DeleteConfirmDialog
  },
  data() {
    return {
      fridgeList: [],
      isFormModalOpen: false,
      showDeleteDialog: false,
      showLeaveDialog: false,
      selectedFridge: {},

    }
  },
  created() {
    this.fetchFridgeList();
  },
  methods: {
    async fetchFridgeList() {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/list`);
        this.fridgeList = response.data.result;
      } catch (error) {
        console.error("냉장고 목록을 불러오는 데 실패했습니다:", error);
      }
    },
    async enterFridge(fridgeId) {
      const currentFridge = this.fridgeList.find(f => f.fridgeId === fridgeId);
      
      // 기존 냉장고 ID 저장
      const previousFridgeId = this.$store.getters.getCurrentFridgeId;
      
      this.$store.commit('setCurrentFridgeId', fridgeId);
      if (currentFridge) {
        this.$store.commit('setCurrentFridgeInfo', currentFridge);
      }
      
      // 냉장고가 변경되었을 때만 SSE 재연결
      if (previousFridgeId && previousFridgeId !== fridgeId) {
        await this.$store.dispatch('notification/refreshSSEOnFridgeChange', fridgeId);
      } else if (!previousFridgeId) {
        // 첫 번째 냉장고 선택 시 SSE 연결
        const isSSEConnected = this.$store.getters['notification/isSSEConnected'];
        if (!isSSEConnected) {
          await this.$store.dispatch('notification/initSSE');
        }
      }
      
      // 냉장고 진입 시 채팅 목록 조회하여 배지 상태 업데이트
      await this.$store.dispatch('notification/updateChatBadgesOnFridgeEnter', fridgeId);
      
      // 유저 관리 페이지 배지 상태 초기 설정은 제거 (MANAGER_CHAT 배지 보호)
      // await this.$store.dispatch('notification/initializeUserManagementBadge', fridgeId);
      
      this.$router.push('/fridge/dashboard');
    },
    openCreateModal() {
      this.selectedFridge = { fridgeName: '', description: '' };
      this.isFormModalOpen = true;
    },
    openEditModal(fridge) {
      this.selectedFridge = { ...fridge };
      this.isFormModalOpen = true;
    },
    async handleSaveFridge(formData) {
      try {
        if (formData.fridgeId) {
          await axios.put(`${import.meta.env.VITE_API_BASE_URL}/fridge/${formData.fridgeId}/update`, formData);
          this.showSnackbar('냉장고 정보가 수정되었습니다.', 'success');
        } else {
          await axios.post(`${import.meta.env.VITE_API_BASE_URL}/fridge/create`, formData);
          this.showSnackbar('새로운 냉장고가 생성되었습니다!', 'success');
        }
        await this.fetchFridgeList();
      } catch (error) {
        console.error("냉장고 처리 중 오류:", error);
        const message = error.response?.data?.status_message || "오류가 발생했습니다.";
        this.showSnackbar(message, 'error');
      }
    },
    openLeaveConfirmDialog(fridge) {
      this.selectedFridge = fridge;
      this.showLeaveDialog = true;
    },

    openDeleteConfirmDialog(fridge) {
      console.log('openDeleteConfirmDialog 호출됨, fridge:', fridge);
      this.selectedFridge = fridge;
      this.showDeleteDialog = true;
      console.log('selectedFridge 설정됨:', this.selectedFridge);
      console.log('showDeleteDialog 설정됨:', this.showDeleteDialog);
    },

    async leaveFridge(fridgeId) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/leave`);
        this.showSnackbar('냉장고에서 나갔습니다.', 'success');
        this.showLeaveDialog = false; // 다이얼로그 닫기
        await this.fetchFridgeList();
      } catch (error) {
        console.error("냉장고 나가기에 실패했습니다:", error);
        this.showSnackbar(error.response?.data?.status_message || "나가기 처리 중 오류 발생", 'error');
      }
    },

    async deleteFridge(fridgeId) {
      try {
        await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}`);
        this.showSnackbar('냉장고가 삭제되었습니다.', 'success');
        this.showDeleteDialog = false; // 다이얼로그 닫기
        await this.fetchFridgeList();
      } catch (error) {
        console.error("냉장고 삭제에 실패했습니다:", error);
        this.showSnackbar(error.response?.data?.status_message || "삭제 처리 중 오류 발생", 'error');
      }
    },
    copyInviteLink(inviteLink) {
      if (!inviteLink) return;
      navigator.clipboard.writeText(inviteLink).then(() => {
        this.showSnackbar('초대 링크가 복사되었습니다!', 'info');
      }).catch(err => {
        console.error('링크 복사 실패:', err);
        this.showSnackbar('복사에 실패했습니다.', 'error');
      });
    },
    showSnackbar(message, color) {
      this.$refs.commonSnackbar.showSnackbar(message, color);
    },
    
    doLogout() {
      // 로그아웃 확인 다이얼로그
      if (confirm('정말 로그아웃 하시겠습니까?')) {
        // Vuex store의 logout 액션 호출
        this.$store.dispatch('user/logout');
        
        // 로컬 스토리지 정리
        localStorage.clear();
        sessionStorage.clear();
        
        // 로그인 페이지로 이동
        this.$router.push('/login').catch(() => {
          window.location.href = '/login';
        });
      }
    }
  }
}
</script>