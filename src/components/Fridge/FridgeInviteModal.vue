<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <div class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <div class="header-icon">
            <v-icon size="32" color="primary">mdi-account-plus</v-icon>
          </div>
          <h2 class="modal-title">냉장고 참여하기</h2>
          <p class="modal-subtitle">초대 코드를 입력하여 냉장고에 참여하세요</p>
        </div>

        <div class="modal-body">
          <div class="form-section">
            <label class="form-label">참여 코드 *</label>
            <v-text-field
              v-model="inviteCode"
              placeholder="참여 코드를 입력하세요"
              variant="outlined"
              density="comfortable"
              class="form-input"
              hide-details
              required
            ></v-text-field>
            <div class="form-hint">
              <v-icon size="16" color="info">mdi-information</v-icon>
              <span>관리자로부터 받은 초대 코드를 입력해주세요</span>
            </div>
          </div>
        </div>

        <div class="modal-actions">
          <v-btn 
            variant="outlined" 
            class="cancel-btn"
            @click="closeModal"
          >
            취소
          </v-btn>
          <v-btn 
            color="primary" 
            class="join-btn"
            @click="joinFridge"
          >
            참여하기
          </v-btn>
        </div>
      </div>
    </div>
  </v-dialog>
</template>

<script>
export default {
  props: {
    modelValue: Boolean,
  },
  data() {
    return {
      inviteCode: '',
    };
  },
  computed: {
    dialog: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  },
  methods: {
    joinFridge() {
      // 부모에게 'join' 이벤트와 함께 초대 코드를 전달
      this.$emit('join', this.inviteCode);
      this.closeModal();
    },
    closeModal() {
      this.dialog = false;
    }
  }
};
</script>

<style scoped>
/* .modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
} */



.modal-container {
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  margin: 20px;
}

.modal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 32px 32px 24px 32px;
  text-align: center;
}

.header-icon {
  margin-bottom: 16px;
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 8px 0;
  color: white;
}

.modal-subtitle {
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
  font-weight: 400;
}

.modal-body {
  padding: 32px;
}

.form-section {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
}

.form-input :deep(.v-field) {
  border-radius: 12px;
  background: rgba(248, 249, 250, 0.8);
}

.form-input :deep(.v-field__outline) {
  border-color: rgba(102, 126, 234, 0.3);
}

.form-input :deep(.v-field--focused .v-field__outline) {
  border-color: #667eea;
}
.form-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 13px;
  color: #666;
}

.modal-actions {
  display: flex;
  gap: 16px;
  justify-content: flex-end;
  padding: 0 32px 32px 32px;
}

.cancel-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  padding: 12px 24px;
  border: 2px solid #e0e0e0;
  color: #666;
  height: auto;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.join-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  padding: 12px 24px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  height: auto;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .modal-container {
    margin: 10px;
  }
  
  .modal-header {
    padding: 24px 24px 20px 24px;
  }
  
  .modal-body {
    padding: 24px;
  }
  
  .modal-actions {
    padding: 0 24px 24px 24px;
    flex-direction: column;
  }
  
  .cancel-btn, .join-btn {
    width: 100%;
  }
}
</style>