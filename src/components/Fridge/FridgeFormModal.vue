<template>
  <v-dialog v-model="dialog" max-width="600px" persistent>
    <div class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <div class="header-icon">
            <v-icon size="32" color="primary">mdi-fridge-outline</v-icon>
          </div>
          <h2 class="modal-title">
            {{ isEditMode ? '냉장고 수정' : '새 냉장고 만들기' }}
          </h2>
          <p class="modal-subtitle">
            {{ isEditMode ? '냉장고 정보를 수정해주세요' : '새로운 냉장고를 만들어보세요' }}
          </p>
        </div>

        <div class="modal-body">
          <div class="form-section">
            <label class="form-label">냉장고 이름 *</label>
            <v-text-field
              v-model="formData.fridgeName"
              placeholder="냉장고 이름을 입력하세요"
              variant="outlined"
              density="comfortable"
              class="form-input"
              hide-details
              required
            ></v-text-field>
          </div>

          <div class="form-section">
            <label class="form-label">설명</label>
            <v-textarea
              v-model="formData.description"
              placeholder="냉장고에 대한 설명을 입력하세요"
              rows="4"
              variant="outlined"
              density="comfortable"
              class="form-input"
              hide-details
            ></v-textarea>
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
            class="save-btn"
            @click="saveFridge"
          >
            {{ isEditMode ? '수정하기' : '만들기' }}
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
    editingFridge: {
      type: Object,
      default: () => ({}) 
    },
  },  
  data() {
    return {
      formData: {
        fridgeName: '',
        description: ''
      },
    };
  },
  computed: {
    isEditMode() {
      return this.editingFridge && this.editingFridge.fridgeId;
    },
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
    saveFridge() {
      this.$emit('save', this.formData);
      this.closeModal();
    },
    closeModal() {
      this.formData = { fridgeName: '', description: '' };
      this.dialog = false;
    }
  },
  watch: {
    editingFridge: {
      handler(newFridgeData) {
        this.formData = { ...newFridgeData };
      },
      immediate: true, 
      deep: true
    }
  },
}
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

.save-btn {
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
  
  .cancel-btn, .save-btn {
    width: 100%;
  }
}
</style>