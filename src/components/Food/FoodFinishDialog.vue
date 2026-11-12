<template>
  <v-dialog v-model="show" max-width="400" persistent>
    <v-card class="finish-card">
      <h2 class="finish-title">{{ foodName }}, 어떻게 정리할까요?</h2>
      <p class="finish-desc">정리하면 냉장고 목록에서 빠지고, 먹었는지 버렸는지가 기록으로 남아요.</p>

      <div class="finish-options">
        <button type="button" class="finish-option" :disabled="!!loading" @click="$emit('select', '소비')">
          <span class="option-emoji" aria-hidden="true">🍽️</span>
          <span class="option-text">
            <span class="option-title">다 먹었어요</span>
            <span class="option-desc">먹은 식품으로 기록돼요</span>
          </span>
          <v-progress-circular v-if="loading === '소비'" indeterminate size="18" width="2" color="primary" />
        </button>
        <button type="button" class="finish-option" :disabled="!!loading" @click="$emit('select', '폐기')">
          <span class="option-emoji" aria-hidden="true">🗑️</span>
          <span class="option-text">
            <span class="option-title">버렸어요</span>
            <span class="option-desc">버린 식품으로 기록돼요</span>
          </span>
          <v-progress-circular v-if="loading === '폐기'" indeterminate size="18" width="2" color="primary" />
        </button>
      </div>

      <div class="finish-foot">
        <v-btn
          variant="text"
          size="small"
          class="mistake-btn"
          :loading="loading === '잘못등록'"
          :disabled="!!loading"
          @click="$emit('select', '잘못등록')"
        >
          잘못 등록했어요 (기록 없이 삭제)
        </v-btn>
        <v-btn variant="text" :disabled="!!loading" @click="$emit('cancel')">취소</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
/**
 * 식품을 냉장고에서 뺄 때 이유를 고르는 확인창.
 * 고른 값을 select 이벤트로 보낸다: '소비' | '폐기' | '잘못등록'
 * 소비·폐기는 기록이 남고(통계·폐기 예측에 사용), 잘못등록은 기록 없이 삭제한다.
 */
export default {
  name: 'FoodFinishDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    foodName: {
      type: String,
      default: ''
    },
    // 처리 중인 선택지 ('소비' | '폐기' | '잘못등록'), 처리 중이 아니면 빈 문자열
    loading: {
      type: String,
      default: ''
    }
  },
  computed: {
    show: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    }
  },
  emits: ['update:modelValue', 'select', 'cancel']
}
</script>

<style scoped>
.finish-card {
  padding: 24px 24px 12px;
}

.finish-title {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.4;
  word-break: keep-all;
  color: var(--sf-text);
}

.finish-desc {
  margin: 6px 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--sf-text-sub);
}

.finish-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.finish-option {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  border: 1px solid var(--sf-line-strong);
  border-radius: var(--sf-radius-md);
  background: var(--sf-surface);
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.finish-option:hover:not(:disabled) {
  border-color: var(--sf-primary);
  background: var(--sf-mint-soft);
}

.finish-option:disabled {
  cursor: default;
  opacity: 0.6;
}

.option-emoji {
  font-size: 24px;
}

.option-text {
  display: flex;
  flex: 1;
  flex-direction: column;
}

.option-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--sf-text);
}

.option-desc {
  font-size: 13px;
  color: var(--sf-text-sub);
}

.finish-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.mistake-btn {
  margin-left: -8px;
  color: var(--sf-text-sub);
}
</style>

