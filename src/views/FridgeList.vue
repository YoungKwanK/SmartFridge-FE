<template>
  <v-container>
    <v-card>
      <v-card-title>
        <v-row align="center" class="pa-2">
          <v-col class="text-h5">
            내 냉장고 목록
          </v-col>
          <v-col class="text-right">
            <v-btn class="ml-2" variant="outlined" @click="openJoinModal">참여하기</v-btn>
            <v-btn class="ml-2" color="primary" @click="openCreateModal">냉장고 만들기</v-btn>
          </v-col>
        </v-row>
      </v-card-title>

      <v-card-text>
        <v-row v-if="!fridgeList.length">
          <v-col class="text-center text-grey py-8">
            <p>참여중인 냉장고가 없습니다.</p>
            <p>'냉장고 만들기' 또는 '참여하기'를 통해 새 냉장고를 추가해보세요.</p>
          </v-col>
        </v-row>
        <v-row v-else>
          <v-col v-for="fridge in fridgeList" :key="fridge.fridgeId" cols="12" sm="6" md="4" lg="3">
            <v-card class="d-flex flex-column mx-auto" outlined>
              <v-card-title class="pb-1">
                <v-row no-gutters align="center">
                  <v-col>
                    <div class="text-h6">{{ fridge.fridgeName }}</div>
                    <div class="text-body-2">{{ fridge.type }}</div>
                  </v-col>
                  <v-col v-if="fridge.type === 'MANAGER'" class="text-right">
                    <span class="text-caption mr-2">초대코드</span>
                    <v-btn icon="mdi-content-copy" variant="text" size="small"
                      @click="copyInviteCode(fridge.inviteLink)" title="초대코드 복사"></v-btn>
                  </v-col>
                </v-row>
              </v-card-title>

              <v-card-text class="py-2 flex-grow-1">
                <div>{{ fridge.description || '냉장고 설명이 없습니다.' }}</div>
              </v-card-text>

              <v-card-actions>
                <v-btn v-if="fridge.type === 'COMMON'" color="error" variant="text"
                  @click="openLeaveConfirmDialog(fridge)">
                  나가기
                </v-btn>

                <v-btn v-else-if="fridge.type === 'MANAGER'" color="error" variant="text"
                  @click="openDeleteConfirmDialog(fridge)">
                  삭제
                </v-btn>

                <v-spacer></v-spacer>
                <v-btn v-if="fridge.type === 'MANAGER'" variant="text" color="primary"
                  @click="openEditModal(fridge)">수정</v-btn>
                <v-btn color="primary" @click="enterFridge(fridge.fridgeId)">들어가기</v-btn>
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <FridgeFormModal v-model="isFormModalOpen" :editing-fridge="selectedFridge" @save="handleSaveFridge" />
    <FridgeInviteModal v-model="isJoinModalOpen" @join="handleJoinFridge" />

    <v-snackbar v-model="snackbar.show" :timeout="2500" :color="snackbar.color">
      {{ snackbar.message }}
      <template v-slot:actions>
        <v-btn color="white" variant="text" @click="snackbar.show = false">닫기</v-btn>
      </template>
    </v-snackbar>

  </v-container>
</template>

<script>
import axios from 'axios';
import FridgeFormModal from '@/components/Fridge/FridgeFormModal.vue';
import FridgeInviteModal from '@/components/Fridge/FridgeInviteModal.vue';

export default {
  components: {
    FridgeFormModal,
    FridgeInviteModal,
  },
  data() {
    return {
      fridgeList: [],
      isFormModalOpen: false,
      isJoinModalOpen: false,
      selectedFridge: {},
      snackbar: {
        show: false,
        message: '',
        color: 'success',
      },
    }
  },
  created() {
    this.fetchFridgeList();
  },
  methods: {
    async fetchFridgeList() {
      try {
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/fridge/list`);
        this.fridgeList = response.data.result;
      } catch (error) {
        console.error("냉장고 목록을 불러오는 데 실패했습니다:", error);
      }
    },
    enterFridge(fridgeId) {
      this.$router.push(`/fridge/${fridgeId}`);
    },
    openCreateModal() {
      this.selectedFridge = { fridgeName: '', description: '' };
      this.isFormModalOpen = true;
    },
    openEditModal(fridge) {
      this.selectedFridge = { ...fridge };
      this.isFormModalOpen = true;
    },
    openJoinModal() {
      this.isJoinModalOpen = true;
    },
    async handleSaveFridge(formData) {
      try {
        if (formData.fridgeId) {
          await axios.put(`${process.env.VUE_APP_API_BASE_URL}/fridge/${formData.fridgeId}/update`, formData);
          this.showSnackbar('냉장고 정보가 수정되었습니다.', 'success');
        } else {
          await axios.post(`${process.env.VUE_APP_API_BASE_URL}/fridge/create`, formData);
          this.showSnackbar('새로운 냉장고가 생성되었습니다!', 'success');
        }
        await this.fetchFridgeList();
      } catch (error) {
        console.error("냉장고 처리 중 오류:", error);
        const message = error.response?.data?.status_message || "오류가 발생했습니다.";
        this.showSnackbar(message, 'error');
      }
    },
    async handleJoinFridge(inviteCode) {
      try {
        await axios.post(`${process.env.VUE_APP_API_BASE_URL}/fridge/join`, null, {
          params: { code: inviteCode }
        });
        this.showSnackbar('냉장고에 성공적으로 참여했습니다!', 'success');
        await this.fetchFridgeList();
      } catch (error) {
        console.error("냉장고 참여에 실패했습니다:", error);
        const message = error.response?.data?.status_message || "냉장고 참여 중 오류가 발생했습니다.";
        this.showSnackbar(message, 'error');
      }
    },
    openLeaveConfirmDialog(fridge) {
      if (confirm(`'${fridge.fridgeName}' 냉장고에서 나가시겠습니까? 작성한 모든 데이터가 삭제됩니다.`)) {
        this.leaveFridge(fridge.fridgeId);
      }
    },

    openDeleteConfirmDialog(fridge) {
      if (confirm(`'${fridge.fridgeName}' 냉장고를 정말 삭제하시겠습니까? 모든 멤버와 데이터가 영구적으로 삭제됩니다.`)) {
        this.deleteFridge(fridge.fridgeId);
      }
    },

    async leaveFridge(fridgeId) {
      try {
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/leave`);
        this.showSnackbar('냉장고에서 나갔습니다.', 'success');
        await this.fetchFridgeList(); 
      } catch (error) {
        console.error("냉장고 나가기에 실패했습니다:", error);
        this.showSnackbar(error.response?.data?.status_message || "나가기 처리 중 오류 발생", 'error');
      }
    },

    async deleteFridge(fridgeId) {
      try {
        await axios.delete(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}`);
        this.showSnackbar('냉장고가 삭제되었습니다.', 'success');
        await this.fetchFridgeList(); 
      } catch (error) {
        console.error("냉장고 삭제에 실패했습니다:", error);
        this.showSnackbar(error.response?.data?.status_message || "삭제 처리 중 오류 발생", 'error');
      }
    },
    copyInviteCode(inviteCode) {
      if (!inviteCode) return;
      navigator.clipboard.writeText(inviteCode).then(() => {
        this.showSnackbar('초대 코드가 복사되었습니다!', 'info');
      }).catch(err => {
        console.error('코드 복사 실패:', err);
        this.showSnackbar('복사에 실패했습니다.', 'error');
      });
    },
    showSnackbar(message, color) {
      this.snackbar.message = message;
      this.snackbar.color = color;
      this.snackbar.show = true;
    }
  }
}
</script>