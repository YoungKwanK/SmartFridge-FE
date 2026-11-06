<template>
  <v-dialog v-model="dialog" max-width="700px" persistent scrollable>
    <v-card class="food-form-modal">
      <!-- 헤더 섹션 -->
      <div class="modal-header">
        <div class="header-content">
          <div class="header-icon">
            <v-icon size="32" color="primary">mdi-food-apple</v-icon>
          </div>
          <div class="header-text">
                      <h2 class="modal-title">{{ getModalTitle() }}</h2>
          <p class="modal-subtitle">{{ getModalSubtitle() }}</p>
          </div>
        </div>
        <v-btn icon="mdi-close" variant="text" @click="closeModal" class="close-btn"></v-btn>
      </div>

      <v-divider></v-divider>

      <v-card-text class="pa-6">
        <v-container fluid class="pa-0">
          <v-row>
            <!-- 식품명 -->
            <v-col cols="12">
              <div class="form-section">
                <label class="form-label">
                  <v-icon size="18" color="primary" class="mr-2">mdi-tag</v-icon>
                  식품명 *
                </label>
                <v-text-field
                  v-model="formData.name"
                  placeholder="식품명을 입력해주세요"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="custom-input"
                  :rules="[v => !!v || '식품명을 입력해주세요']"
                  :disabled="readOnly"
                ></v-text-field>
              </div>
            </v-col>

                         <!-- 수량과 보관위치 -->
             <v-col cols="12" md="6">
               <div class="form-section">
                 <label class="form-label">
                   <v-icon size="18" color="success" class="mr-2">mdi-scale</v-icon>
                   수량 *
                 </label>
                 <div class="quantity-input">
                   <v-btn 
                     icon="mdi-minus" 
                     variant="outlined" 
                     size="small"
                     @click="decreaseQuantity"
                     :disabled="formData.quantity <= 1"
                     class="quantity-btn"
                   ></v-btn>
                   <v-text-field
                     v-model.number="formData.quantity"
                     type="number"
                     min="1"
                     variant="outlined"
                     density="comfortable"
                     hide-details="auto"
                     class="quantity-field"
                     :rules="[v => v > 0 || '수량은 1개 이상이어야 합니다']"
                     :disabled="readOnly"
                   ></v-text-field>
                   <v-btn 
                     icon="mdi-plus" 
                     variant="outlined" 
                     size="small"
                     @click="increaseQuantity"
                     class="quantity-btn"
                   ></v-btn>
                 </div>
               </div>
             </v-col>

             <v-col cols="12" md="6">
               <div class="form-section">
                 <label class="form-label">
                   <v-icon size="18" color="info" class="mr-2">mdi-fridge</v-icon>
                   보관위치 *
                 </label>
                 <v-select
                   :items="storageTypes"
                   v-model="formData.storageType"
                   placeholder="보관위치를 선택해주세요"
                   variant="outlined"
                   density="comfortable"
                   hide-details="auto"
                   class="custom-input"
                   item-title="name"
                   item-value="value"
                   :rules="[v => !!v || '보관위치를 선택해주세요']"
                   :disabled="readOnly"
                 ></v-select>
               </div>
             </v-col>

             <!-- 유통기한 날짜와 시간 -->
             <v-col cols="12" md="6">
               <div class="form-section">
                  <label class="form-label">
                    <v-icon size="18" color="warning" class="mr-2">mdi-calendar</v-icon>
                    유통기한 날짜 *
                  </label>
                 <v-text-field
                   v-model="formData.expirationDate"
                   type="date"
                   variant="outlined"
                   density="comfortable"
                   hide-details="auto"
                   class="custom-input"
                   placeholder="날짜를 선택하세요"
                   :min="getTodayDate()"
                   :rules="getExpirationRules()"
                   :disabled="readOnly"
                 ></v-text-field>
               </div>
             </v-col>

             <v-col cols="12" md="6">
               <div class="form-section">
                 <label class="form-label">
                   <v-icon size="18" color="warning" class="mr-2">mdi-clock</v-icon>
                   유통기한 시간 (선택사항)
                 </label>
                 <v-text-field
                   v-model="formData.expirationTime"
                   type="time"
                   variant="outlined"
                   density="comfortable"
                   hide-details="auto"
                   class="custom-input"
                   placeholder="시간을 선택하세요 (선택하지 않으면 23:59로 설정됩니다)"
                   :disabled="readOnly"
                 ></v-text-field>
               </div>
             </v-col>

             <!-- 카테고리 -->
             <v-col cols="12" md="6">
               <div class="form-section">
                 <label class="form-label">
                   <v-icon size="18" color="purple" class="mr-2">mdi-shape</v-icon>
                   카테고리 *
                 </label>
                 <v-select
                   :items="categories"
                   v-model="formData.category"
                   placeholder="카테고리를 선택해주세요"
                   variant="outlined"
                   density="comfortable"
                   hide-details="auto"
                   class="custom-input"
                   item-title="name"
                   item-value="value"
                   :rules="[v => !!v || '카테고리를 선택해주세요']"
                   :disabled="readOnly"
                 ></v-select>
               </div>
             </v-col>

            <!-- 메모 -->
            <v-col cols="12">
              <div class="form-section">
                <label class="form-label">
                  <v-icon size="18" color="grey" class="mr-2">mdi-note-text</v-icon>
                  메모
                </label>
                <v-textarea
                  v-model="formData.memo"
                  placeholder="식품에 대한 메모를 입력해주세요"
                  rows="3"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  class="custom-input"
                  :disabled="readOnly"
                ></v-textarea>
              </div>
            </v-col>

            <!-- 공유 설정 -->
            <v-col cols="12">
              <div class="share-section">
                <v-checkbox
                  v-model="formData.shareable"
                  label="다른 멤버와 공유"
                  color="primary"
                  hide-details="auto"
                  class="share-checkbox"
                  :disabled="readOnly"
                >
                  <template v-slot:label>
                    <div class="checkbox-label">
                      <v-icon size="20" color="primary" class="mr-2">mdi-share-variant</v-icon>
                      <span>다른 멤버와 공유</span>
                      <span class="checkbox-description">체크하면 냉장고 멤버들과 식품 정보를 공유합니다</span>
                    </div>
                  </template>
                </v-checkbox>
              </div>
            </v-col>

            <!-- 목록에 담기 (등록 모드에서만) -->
            <v-col v-if="isCreateMode" cols="12" class="d-flex justify-end">
              <v-btn
                variant="tonal"
                color="primary"
                :prepend-icon="editingIndex !== null ? 'mdi-check' : 'mdi-plus'"
                class="action-btn"
                :disabled="editingIndex === null && pendingFoods.length >= maxCount"
                @click="addToList"
              >
                {{ editingIndex !== null ? '목록에 반영' : '목록에 담기' }}
              </v-btn>
              <v-btn
                v-if="editingIndex !== null"
                variant="text"
                class="action-btn ml-2"
                @click="cancelItemEdit"
              >
                수정 취소
              </v-btn>
            </v-col>
          </v-row>
        </v-container>

        <!-- 담은 식품 목록 -->
        <div v-if="isCreateMode && pendingFoods.length > 0" class="pending-section">
          <div class="pending-header">
            <v-icon size="18" color="primary" class="mr-2">mdi-format-list-bulleted</v-icon>
            담은 식품 {{ pendingFoods.length }}개
            <span class="pending-limit">(최대 {{ maxCount }}개)</span>
          </div>
          <div
            v-for="(item, index) in pendingFoods"
            :key="index"
            class="pending-item"
            :class="{ 'is-editing': editingIndex === index }"
          >
            <div class="pending-info">
              <span class="pending-name">{{ item.name }}</span>
              <span v-if="getItemSummary(item)" class="pending-meta">· {{ getItemSummary(item) }}</span>
              <span v-if="!isItemComplete(item)" class="pending-warning">
                <v-icon size="14" color="warning">mdi-alert</v-icon> {{ getMissingFields(item).join(', ') }} 입력 필요
              </span>
              <v-chip v-if="item.shareable" size="x-small" color="primary" variant="tonal" class="ml-2">공유</v-chip>
            </div>
            <div class="pending-actions">
              <v-btn icon="mdi-pencil" size="small" variant="text" @click="editListItem(index)"></v-btn>
              <v-btn icon="mdi-delete" size="small" variant="text" color="error" @click="removeListItem(index)"></v-btn>
            </div>
          </div>
        </div>
      </v-card-text>

      <!-- 액션 버튼 -->
      <v-divider></v-divider>
      
      <v-card-actions class="pa-6">
        <div class="action-buttons">
          <div class="right-buttons">
            <v-btn 
              variant="outlined" 
              @click="closeModal"
              class="action-btn cancel-btn"
            >
              {{ readOnly ? '닫기' : '취소' }}
            </v-btn>
            <v-btn 
              v-if="!readOnly"
              color="primary" 
              @click="save"
              class="action-btn save-btn"
              :loading="isLoading"
              prepend-icon="mdi-check"
            >
              {{ getSaveButtonText() }}
            </v-btn>
          </div>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- CommonSnackbar 컴포넌트 추가 -->
  <CommonSnackbar ref="snackbar" />
</template>

<script>
import axios from 'axios';
import CommonSnackbar from '../common/CommonSnackbar.vue';

export default {
  components: {
    CommonSnackbar
  },
  props: {
    modelValue: Boolean,
    editingFood: {
      type: Object,
      default: () => ({})
    },
    readOnly: {
      type: Boolean,
      default: false
    },
  },
  data() {
    return {
      formData: {
        name: '',
        quantity: 1,
        expirationDate: '',
        expirationTime: '',
        storageType: null,
        category: null,
        memo: '',
        shareable: false
      },
      storageTypes: [],
      categories: [],
      isLoading: false,
      // 여러 개 등록: 담은 식품 목록과 수정 중인 항목 위치
      pendingFoods: [],
      editingIndex: null,
      maxCount: 30
    }
  },
  created() {
    this.fetchEnums();
  },
  computed: {
    isEditMode() {
      return this.editingFood && this.editingFood.id;
    },
    isCreateMode() {
      return !this.isEditMode && !this.readOnly;
    },
    // 등록 버튼을 누르면 저장될 개수 (담은 식품 + 입력칸에 쓴 식품)
    totalCount() {
      const formCount = (this.editingIndex === null && !this.isFormEmpty()) ? 1 : 0;
      return this.pendingFoods.length + formCount;
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
  watch: {
    // 모달을 새로 열 때 담은 목록 초기화
    modelValue(isOpen) {
      if (isOpen) {
        this.pendingFoods = [];
        this.editingIndex = null;
      }
    },
    editingFood: {
      handler(newFoodData) {
        const defaultFormData = this.$options.data().formData;
        this.formData = {
          ...defaultFormData,
          ...newFoodData
        };

        // expirationDateTime을 expirationDate와 expirationTime으로 분리
        if (newFoodData.expirationDateTime) {
          const dateTime = new Date(newFoodData.expirationDateTime);
          this.formData.expirationDate = dateTime.toISOString().split('T')[0]; // YYYY-MM-DD
          this.formData.expirationTime = dateTime.toTimeString().slice(0, 5); // HH:MM
        }

        // shareable이 명시적으로 설정되지 않은 경우에만 기본값 설정
        if (this.formData.shareable === undefined) {
          this.formData.shareable = false;
        }
        // null이나 false는 그대로 유지 (SharedFood에서 true로 설정한 경우 보존)
      },
      immediate: true,
      deep: true
    }
  },
  methods: {
    getModalTitle() {
      if (this.readOnly) {
        return '식품 상세 정보';
      }
      return this.isEditMode ? '식품 수정' : '새로운 식품 등록';
    },
    getModalSubtitle() {
      if (this.readOnly) {
        return '등록된 식품의 자세한 정보를 확인할 수 있습니다';
      }
      return this.isEditMode ? '식품 정보를 수정해주세요' : '냉장고에 새로운 식품을 추가해주세요';
    },
    async fetchEnums() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/enums`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        this.categories = response.data.categories;
        this.storageTypes = response.data.storageTypes;
      } catch (error) {
        console.error("카테고리 및 보관위치 목록을 불러오는 데 실패했습니다.", error);
        this.$refs.snackbar.showError("카테고리 및 보관위치 목록을 불러오는 데 실패했습니다.");
      }
    },
    increaseQuantity() {
      this.formData.quantity++;
    },
    decreaseQuantity() {
      if (this.formData.quantity > 1) {
        this.formData.quantity--;
      }
    },
    getTodayDate() {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    },
    getExpirationRules() {
      return [
        v => !!v || '유통기한 날짜를 선택해주세요',
        v => !v || new Date(v) >= new Date(this.getTodayDate()) || '유통기한은 오늘 날짜 이후여야 합니다'
      ];
    },
    getSaveButtonText() {
      if (this.isEditMode) return '수정 완료';
      if (this.pendingFoods.length > 0) return `${this.totalCount}개 등록`;
      return '등록 완료';
    },
    formatShortDate(date) {
      const [, month, day] = date.split('-');
      return `${month}/${day}`;
    },
    // 목록 한 줄 요약: 입력된 항목만 보여줌 (예: 유제품 · 냉장 · 11/15)
    getItemSummary(item) {
      return [
        item.quantity > 1 ? `${item.quantity}개` : null,
        item.category,
        item.storageType,
        item.expirationDate ? this.formatShortDate(item.expirationDate) : null
      ].filter(Boolean).join(' · ');
    },
    // 입력칸이 완전히 비어 있는지 (보관위치, 카테고리, 공유는 다음 식품에도 남기므로 제외)
    isFormEmpty() {
      const f = this.formData;
      return !(f.name && f.name.trim()) && !f.expirationDate && !f.expirationTime && !(f.memo && f.memo.trim());
    },
    // 필수 항목 검사. 문제가 있으면 경고를 띄우고 false
    validateForm() {
      const checks = [
        [!this.formData.name || !this.formData.name.trim(), "식품명을 입력해주세요."],
        [!this.formData.quantity || this.formData.quantity <= 0, "수량을 입력해주세요."],
        [!this.formData.storageType, "보관위치를 선택해주세요."],
        [!this.formData.expirationDate, "유통기한 날짜를 선택해주세요."],
        [this.formData.expirationDate && new Date(this.formData.expirationDate) < new Date(this.getTodayDate()), "유통기한은 오늘 날짜 이후여야 합니다."],
        [!this.formData.category, "카테고리를 선택해주세요."]
      ];
      const failed = checks.find(([isInvalid]) => isInvalid);
      if (failed) {
        this.$refs.snackbar.showWarning(failed[1]);
        return false;
      }
      return true;
    },
    // 목록의 식품이 등록할 수 있는 상태인지 (나중에 영수증으로 들어온 식품은 비어 있을 수 있음)
    isItemComplete(item) {
      return this.getMissingFields(item).length === 0;
    },
    // 비어 있는 필수 항목 이름 목록
    getMissingFields(item) {
      const missing = [];
      if (!item.name || !item.name.trim()) missing.push('식품명');
      if (!item.quantity || item.quantity <= 0) missing.push('수량');
      if (!item.storageType) missing.push('보관위치');
      if (!item.category) missing.push('카테고리');
      if (!item.expirationDate) missing.push('유통기한');
      return missing;
    },
    // 다음 식품 입력을 위해 입력칸 비우기. 보관위치, 카테고리, 공유는 그대로 둔다
    resetFormForNext() {
      this.formData = {
        ...this.formData,
        name: '',
        quantity: 1,
        expirationDate: '',
        expirationTime: '',
        memo: ''
      };
    },
    // 목록에 담을 때는 식품명만 필수. 나머지는 등록 전에 채우면 됨
    validateForListItem() {
      if (!this.formData.name || !this.formData.name.trim()) {
        this.$refs.snackbar.showWarning("식품명을 입력해주세요.");
        return false;
      }
      if (this.formData.expirationDate && new Date(this.formData.expirationDate) < new Date(this.getTodayDate())) {
        this.$refs.snackbar.showWarning("유통기한은 오늘 날짜 이후여야 합니다.");
        return false;
      }
      return true;
    },
    addToList() {
      if (!this.validateForListItem()) return;
      const item = { ...this.formData };
      if (this.editingIndex !== null) {
        this.pendingFoods.splice(this.editingIndex, 1, item);
        this.editingIndex = null;
      } else {
        if (this.pendingFoods.length >= this.maxCount) {
          this.$refs.snackbar.showWarning(`식품은 한 번에 최대 ${this.maxCount}개까지 등록할 수 있습니다.`);
          return;
        }
        this.pendingFoods.push(item);
      }
      this.resetFormForNext();
    },
    editListItem(index) {
      if (this.editingIndex === null && !this.isFormEmpty()) {
        this.$refs.snackbar.showWarning("입력 중인 식품을 먼저 목록에 담거나 지워주세요.");
        return;
      }
      this.editingIndex = index;
      this.formData = { ...this.pendingFoods[index] };
    },
    cancelItemEdit() {
      this.editingIndex = null;
      this.resetFormForNext();
    },
    removeListItem(index) {
      this.pendingFoods.splice(index, 1);
      if (this.editingIndex === index) {
        this.cancelItemEdit();
      } else if (this.editingIndex !== null && this.editingIndex > index) {
        this.editingIndex--;
      }
    },
    // 화면 입력값을 API 형식으로 변환 (시간을 시와 분으로 나눔)
    toSaveData(item) {
      let expirationHour = null;
      let expirationMinute = null;
      if (item.expirationTime) {
        const [hour, minute] = item.expirationTime.split(':');
        expirationHour = parseInt(hour);
        expirationMinute = parseInt(minute);
      }
      const saveData = { ...item, expirationHour, expirationMinute };
      delete saveData.expirationTime;
      return saveData;
    },
    async save() {
      // 등록 모드: 담은 식품 + 입력칸 식품을 목록으로 만들어 보냄
      let foods = null;
      if (this.isCreateMode) {
        if (this.editingIndex !== null) {
          this.$refs.snackbar.showWarning("수정 중인 식품을 목록에 반영하거나 수정을 취소해주세요.");
          return;
        }
        foods = [...this.pendingFoods];
        if (!this.isFormEmpty() || foods.length === 0) {
          if (!this.validateForm()) return;
          foods.push({ ...this.formData });
        }
        const incomplete = foods.filter(item => !this.isItemComplete(item));
        if (incomplete.length > 0) {
          const names = incomplete.map(item => item.name).join(', ');
          this.$refs.snackbar.showWarning(`입력이 끝나지 않은 식품이 있습니다: ${names}. 목록에서 ✏를 눌러 채워주세요.`);
          return;
        }
        if (foods.length > this.maxCount) {
          this.$refs.snackbar.showWarning(`식품은 한 번에 최대 ${this.maxCount}개까지 등록할 수 있습니다.`);
          return;
        }
      } else if (!this.validateForm()) {
        return;
      }

      this.isLoading = true;

      try {
        if (this.isEditMode) {
          this.$emit('save', this.toSaveData(this.formData));
        } else {
          // 등록은 항상 배열로 보냄 (하나만 등록해도 한 칸짜리 배열)
          this.$emit('save', foods.map(item => this.toSaveData(item)));
        }
        this.closeModal();
      } catch (error) {
        console.error("식품 저장 중 오류가 발생했습니다:", error);
        this.$refs.snackbar.showError("식품 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
      } finally {
        this.isLoading = false;
      }
    },
    closeModal() {
      this.dialog = false;
    }
  }
}
</script>

<style scoped>
.food-form-modal {
  border-radius: 16px;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}

.modal-title {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 4px 0;
}

.modal-subtitle {
  font-size: 14px;
  margin: 0;
  opacity: 0.9;
}

.close-btn {
  color: white;
}

.form-section {
  margin-bottom: 24px;
}

.form-label {
  display: flex;
  align-items: center;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
  font-size: 14px;
}

.custom-input {
  border-radius: 12px;
}

.quantity-input {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quantity-btn {
  border-radius: 8px;
  min-width: 40px;
}

.quantity-field {
  flex: 1;
  border-radius: 12px;
}

.share-section {
  background: rgba(102, 126, 234, 0.05);
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.share-checkbox {
  margin: 0;
}

.checkbox-label {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.checkbox-description {
  font-size: 12px;
  color: #666;
  font-weight: 400;
  margin-left: 28px;
  opacity: 0.8;
}

.pending-section {
  margin-top: 16px;
  border: 1px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  overflow: hidden;
}

.pending-header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 14px;
  color: #333;
  background: rgba(102, 126, 234, 0.05);
}

.pending-limit {
  margin-left: 6px;
  font-size: 12px;
  font-weight: 400;
  color: #888;
}

.pending-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 8px 8px 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.pending-item.is-editing {
  background: rgba(102, 126, 234, 0.1);
}

.pending-info {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px;
  min-width: 0;
  font-size: 14px;
}

.pending-name {
  font-weight: 600;
  color: #333;
  word-break: break-all;
}

.pending-meta {
  color: #666;
}

.pending-warning {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  color: #e65100;
  font-size: 13px;
}

.pending-actions {
  display: flex;
  flex-shrink: 0;
}

.action-buttons {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
}

.right-buttons {
  display: flex;
  gap: 12px;
}

.action-btn {
  border-radius: 12px;
  font-weight: 600;
  text-transform: none;
  padding: 12px 24px;
  height: auto;
  min-height: 44px;
}

.cancel-btn {
  border: 2px solid #ddd;
  color: #666;
}

.save-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
  color: white !important;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

/* 반응형 디자인 */
@media (max-width: 600px) {
  .modal-header {
    padding: 20px 24px;
  }
  
  .header-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
  
  .action-buttons {
    flex-direction: column;
    gap: 16px;
  }
  
  .right-buttons {
    width: 100%;
    justify-content: stretch;
  }
  
  .action-btn {
    flex: 1;
  }
}
</style>