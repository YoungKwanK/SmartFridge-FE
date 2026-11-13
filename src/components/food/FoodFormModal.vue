<template>
  <v-dialog v-model="dialog" max-width="640px" persistent scrollable>
    <v-card class="food-form">
      <header class="form-head">
        <div>
          <h2 class="sf-form-title">{{ getModalTitle() }}</h2>
          <p class="form-desc">{{ getModalSubtitle() }}</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="닫기" @click="closeModal" />
      </header>

      <v-card-text class="form-body">
        <div class="field">
          <label class="sf-field-label" for="food-name">식품 이름</label>
          <v-text-field
            id="food-name"
            v-model="formData.name"
            placeholder="예: 서울우유 1L"
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :rules="[v => !!v || '식품 이름을 입력하세요']"
            :disabled="readOnly"
          />
        </div>

        <div class="field">
          <span id="food-category-label" class="sf-field-label">종류</span>
          <div class="chip-group" role="radiogroup" aria-labelledby="food-category-label">
            <button
              v-for="category in categories"
              :key="category"
              type="button"
              role="radio"
              class="choice-chip"
              :class="{ 'is-on': formData.category === category }"
              :aria-checked="formData.category === category"
              :disabled="readOnly"
              @click="formData.category = category"
            >
              <span aria-hidden="true">{{ emojiOf(category) }}</span>{{ category }}
            </button>
          </div>
        </div>

        <div class="field-row">
          <div class="field">
            <span id="food-storage-label" class="sf-field-label">보관</span>
            <div class="segmented" role="radiogroup" aria-labelledby="food-storage-label">
              <button
                v-for="storage in storageTypes"
                :key="storage"
                type="button"
                role="radio"
                :class="{ 'is-on': formData.storageType === storage }"
                :aria-checked="formData.storageType === storage"
                :disabled="readOnly"
                @click="formData.storageType = storage"
              >
                {{ storage }}
              </button>
            </div>
          </div>

          <div class="field">
            <span id="food-qty-label" class="sf-field-label">수량</span>
            <div class="stepper" role="group" aria-labelledby="food-qty-label">
              <button type="button" aria-label="하나 줄이기" :disabled="readOnly || formData.quantity <= 1" @click="decreaseQuantity">
                <v-icon size="18">mdi-minus</v-icon>
              </button>
              <input
                v-model.number="formData.quantity"
                type="number"
                min="1"
                class="sf-num"
                aria-label="수량"
                :disabled="readOnly"
              />
              <button type="button" aria-label="하나 늘리기" :disabled="readOnly" @click="increaseQuantity">
                <v-icon size="18">mdi-plus</v-icon>
              </button>
            </div>
          </div>
        </div>

        <div class="field">
          <label class="sf-field-label" for="food-exp-date">유통기한</label>
          <div v-if="!readOnly" class="quick-dates">
            <button v-for="d in quickDays" :key="d.days" type="button" class="quick-chip" @click="setExpiryInDays(d.days)">
              {{ d.label }}
            </button>
          </div>
          <div class="field-row is-tight">
            <v-text-field
              id="food-exp-date"
              v-model="formData.expirationDate"
              type="date"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              :min="getTodayDate()"
              :rules="getExpirationRules()"
              :disabled="readOnly"
            />
            <v-text-field
              v-model="formData.expirationTime"
              type="time"
              variant="outlined"
              density="comfortable"
              hide-details="auto"
              aria-label="유통기한 시각 (선택)"
              :disabled="readOnly"
            />
          </div>
          <p class="field-hint">시각을 비워 두면 그날 23:59까지로 저장돼요.</p>
        </div>

        <div class="field">
          <label class="sf-field-label" for="food-memo">메모 <span class="sf-optional">선택</span></label>
          <v-textarea
            id="food-memo"
            v-model="formData.memo"
            placeholder="예: 반 남음, 금요일에 먹을 거예요"
            rows="2"
            auto-grow
            variant="outlined"
            density="comfortable"
            hide-details="auto"
            :disabled="readOnly"
          />
        </div>

        <div class="share-row">
          <div>
            <p class="share-title">다른 멤버와 나눠 먹기</p>
            <p class="share-desc">켜면 공유 식품 목록에 올라가서 다른 멤버도 볼 수 있어요.</p>
          </div>
          <v-switch
            v-model="formData.shareable"
            color="primary"
            inset
            hide-details
            density="compact"
            aria-label="다른 멤버와 나눠 먹기"
            :disabled="readOnly"
          />
        </div>

        <div v-if="isCreateMode" class="list-actions">
          <v-btn
            v-if="editingIndex !== null"
            variant="text"
            @click="cancelItemEdit"
          >
            고치기 취소
          </v-btn>
          <v-btn
            variant="tonal"
            color="primary"
            :prepend-icon="editingIndex !== null ? 'mdi-check' : 'mdi-plus'"
            :disabled="editingIndex === null && pendingFoods.length >= maxCount"
            @click="addToList"
          >
            {{ editingIndex !== null ? '목록에 반영' : '하나 더 담기' }}
          </v-btn>
        </div>

        <section v-if="isCreateMode && pendingFoods.length > 0" class="pending" aria-labelledby="pending-title">
          <h3 id="pending-title" class="pending-title">
            담은 식품 <span class="sf-num">{{ pendingFoods.length }}</span>
            <span class="pending-limit">최대 {{ maxCount }}개</span>
          </h3>
          <ul class="pending-list">
            <li
              v-for="(item, index) in pendingFoods"
              :key="index"
              class="pending-item"
              :class="{ 'is-editing': editingIndex === index }"
            >
              <span class="pending-emoji" aria-hidden="true">{{ emojiOf(item.category) }}</span>
              <span class="pending-info">
                <span class="pending-name">
                  {{ item.name }}
                  <span v-if="item.shareable" class="share-tag">공유</span>
                </span>
                <span v-if="!isItemComplete(item)" class="pending-warning">
                  {{ getMissingFields(item).join(', ') }} 입력이 필요해요
                </span>
                <span v-else class="pending-meta">{{ getItemSummary(item) }}</span>
              </span>
              <v-btn icon="mdi-pencil-outline" size="small" variant="text" :aria-label="`${item.name} 고치기`" @click="editListItem(index)" />
              <v-btn icon="mdi-close" size="small" variant="text" :aria-label="`${item.name} 빼기`" @click="removeListItem(index)" />
            </li>
          </ul>
        </section>
      </v-card-text>

      <v-card-actions class="form-actions">
        <v-spacer />
        <v-btn variant="text" @click="closeModal">{{ readOnly ? '닫기' : '취소' }}</v-btn>
        <v-btn v-if="!readOnly" color="primary" variant="flat" :loading="isLoading" @click="save">
          {{ getSaveButtonText() }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

</template>

<script>
import axios from 'axios';
import { categoryEmoji } from '@/utils/foodFreshness';
import { snackbar } from '@/composables/snackbar';

export default {
  components: {
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
      // 유통기한 빠른 선택
      quickDays: [
        { days: 0, label: '오늘' },
        { days: 3, label: '3일 뒤' },
        { days: 7, label: '1주 뒤' },
        { days: 14, label: '2주 뒤' },
        { days: 30, label: '한 달 뒤' }
      ],
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
        return '식품 정보';
      }
      return this.isEditMode ? '식품 정보 수정' : '식품 등록';
    },
    getModalSubtitle() {
      if (this.readOnly) {
        return '누가 언제 넣었는지, 언제까지인지 확인하세요.';
      }
      return this.isEditMode ? '바뀐 내용만 고치면 돼요.' : '여러 개를 넣을 땐 "하나 더 담기"로 모아서 한 번에 등록하세요.';
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
        snackbar.error("카테고리 및 보관위치 목록을 불러오는 데 실패했습니다.");
      }
    },
    emojiOf(category) {
      return categoryEmoji(category);
    },
    setExpiryInDays(days) {
      const d = new Date();
      d.setDate(d.getDate() + days);
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      this.formData.expirationDate = `${d.getFullYear()}-${month}-${day}`;
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
        snackbar.warning(failed[1]);
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
        snackbar.warning("식품명을 입력해주세요.");
        return false;
      }
      if (this.formData.expirationDate && new Date(this.formData.expirationDate) < new Date(this.getTodayDate())) {
        snackbar.warning("유통기한은 오늘 날짜 이후여야 합니다.");
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
          snackbar.warning(`식품은 한 번에 최대 ${this.maxCount}개까지 등록할 수 있습니다.`);
          return;
        }
        this.pendingFoods.push(item);
      }
      this.resetFormForNext();
    },
    editListItem(index) {
      if (this.editingIndex === null && !this.isFormEmpty()) {
        snackbar.warning("입력 중인 식품을 먼저 목록에 담거나 지워주세요.");
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
          snackbar.warning("수정 중인 식품을 목록에 반영하거나 수정을 취소해주세요.");
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
          snackbar.warning(`입력이 끝나지 않은 식품이 있습니다: ${names}. 목록에서 ✏를 눌러 채워주세요.`);
          return;
        }
        if (foods.length > this.maxCount) {
          snackbar.warning(`식품은 한 번에 최대 ${this.maxCount}개까지 등록할 수 있습니다.`);
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
        snackbar.error("식품 저장 중 오류가 발생했습니다. 다시 시도해주세요.");
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
.food-form {
  border-radius: var(--sf-radius-lg) !important;
}

.form-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 24px 16px 8px 24px;
}

.sf-form-title {
  letter-spacing: -0.01em;
}

.form-desc {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--sf-text-sub);
}

.form-body {
  padding: 12px 24px 8px !important;
}

.field {
  margin-bottom: 20px;
  min-width: 0;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 13px;
  color: var(--sf-text-faint);
}

.field-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.field-row.is-tight {
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: 8px;
}

.field-row > .field {
  margin-bottom: 20px;
}

/* 종류 칩 */
.chip-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.choice-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 36px;
  padding: 0 12px;
  border: 1px solid var(--sf-line-strong);
  border-radius: 999px;
  background: var(--sf-surface);
  font: inherit;
  font-size: 14px;
  color: var(--sf-text);
  cursor: pointer;
}

.choice-chip:hover:not(:disabled) {
  border-color: var(--sf-text-faint);
}

.choice-chip.is-on {
  border-color: var(--sf-primary);
  background: var(--sf-mint-soft);
  font-weight: 600;
  color: var(--sf-primary);
}

.choice-chip:disabled {
  cursor: default;
  opacity: 0.6;
}

/* 보관 */
.segmented {
  display: flex;
  height: 44px;
  padding: 3px;
  border-radius: 10px;
  background: var(--sf-bg);
}

.segmented button {
  flex: 1;
  border: none;
  border-radius: 8px;
  background: none;
  font: inherit;
  font-size: 15px;
  color: var(--sf-text-sub);
  cursor: pointer;
}

.segmented button.is-on {
  background: var(--sf-surface);
  box-shadow: 0 1px 3px rgba(34, 34, 34, 0.12);
  font-weight: 700;
  color: var(--sf-text);
}

/* 수량 */
.stepper {
  display: flex;
  align-items: center;
  height: 44px;
  border: 1px solid var(--sf-line-strong);
  border-radius: 10px;
  overflow: hidden;
}

.stepper button {
  display: grid;
  place-items: center;
  width: 44px;
  height: 100%;
  border: none;
  background: none;
  color: var(--sf-text-sub);
  cursor: pointer;
}

.stepper button:disabled {
  color: var(--sf-line-strong);
  cursor: default;
}

.stepper input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  border-inline: 1px solid var(--sf-line);
  font: inherit;
  font-size: 16px;
  font-weight: 700;
  text-align: center;
  color: var(--sf-text);
  -moz-appearance: textfield;
  appearance: textfield;
}

.stepper input::-webkit-outer-spin-button,
.stepper input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* 유통기한 빠른 선택 */
.quick-dates {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.quick-chip {
  height: 30px;
  padding: 0 12px;
  border: none;
  border-radius: 999px;
  background: var(--sf-bg);
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--sf-text-sub);
  cursor: pointer;
}

.quick-chip:hover {
  background: var(--sf-line);
  color: var(--sf-text);
}

/* 공유 */
.share-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border-radius: var(--sf-radius-md);
  background: var(--sf-bg);
}

.share-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text);
}

.share-desc {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--sf-text-sub);
}

.list-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
}

/* 담은 식품 */
.pending {
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--sf-line);
}

.pending-title {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 700;
  color: var(--sf-text);
}

.pending-limit {
  font-size: 13px;
  font-weight: 400;
  color: var(--sf-text-faint);
}

.pending-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.pending-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 4px 8px 10px;
  border-radius: 10px;
}

.pending-item + .pending-item {
  margin-top: 2px;
}

.pending-item.is-editing {
  background: var(--sf-mint-soft);
}

.pending-emoji {
  font-size: 20px;
}

.pending-info {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.pending-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 15px;
  font-weight: 600;
  color: var(--sf-text);
}

.share-tag {
  padding: 0 6px;
  border-radius: 6px;
  background: var(--sf-mint-soft);
  font-size: 12px;
  color: var(--sf-primary);
}

.pending-meta {
  font-size: 13px;
  color: var(--sf-text-faint);
}

.pending-warning {
  font-size: 13px;
  font-weight: 600;
  color: var(--sf-soon-ink);
}

.form-actions {
  padding: 12px 24px 20px !important;
  border-top: 1px solid var(--sf-line);
}

@media (max-width: 600px) {
  .form-head {
    padding: 20px 8px 4px 16px;
  }

  .form-body {
    padding: 8px 16px !important;
  }

  .field-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  /* 날짜·시각을 한 줄에 두면 시각 칸이 좁아 시계 아이콘이 잘린다 */
  .field-row.is-tight {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .form-actions {
    padding: 12px 16px 16px !important;
  }
}
</style>
