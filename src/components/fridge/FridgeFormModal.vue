<template>
  <v-dialog v-model="dialog" max-width="480px" persistent>
    <v-card class="fridge-form">
      <header class="form-head">
        <h2 class="sf-form-title">{{ isEditMode ? '냉장고 정보 수정' : '새 냉장고 만들기' }}</h2>
        <p class="form-desc">
          {{ isEditMode ? '이름과 설명은 멤버 모두에게 보여요.' : '만든 사람이 관리자가 돼요. 다 만들면 초대 링크로 멤버를 부를 수 있어요.' }}
        </p>
      </header>

      <div class="form-body">
        <label class="sf-field-label" for="fridge-name">냉장고 이름</label>
        <v-text-field
          id="fridge-name"
          v-model="formData.fridgeName"
          placeholder="예: 3층 공용 냉장고"
          variant="outlined"
          density="comfortable"
          hide-details
          autofocus
        />

        <label class="sf-field-label" for="fridge-desc">설명 <span class="sf-optional">선택</span></label>
        <v-textarea
          id="fridge-desc"
          v-model="formData.description"
          placeholder="예: 305호~310호가 함께 써요. 이름 꼭 적어 주세요."
          rows="3"
          auto-grow
          variant="outlined"
          density="comfortable"
          hide-details
        />
      </div>

      <div class="form-actions">
        <v-btn variant="text" @click="closeModal">취소</v-btn>
        <v-btn color="primary" variant="flat" :disabled="!formData.fridgeName || !formData.fridgeName.trim()" @click="saveFridge">
          {{ isEditMode ? '수정 내용 저장' : '냉장고 만들기' }}
        </v-btn>
      </div>
    </v-card>
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
.fridge-form {
  padding: 24px;
}

.form-desc {
  margin: 6px 0 0;
  font-size: var(--sf-fs-md);
  line-height: 1.6;
  color: var(--sf-text-sub);
}

.form-body {
  margin-top: 20px;
}

.sf-field-label {
  margin: 16px 0 8px;
}

.sf-field-label:first-child {
  margin-top: 0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 24px;
}
</style>
