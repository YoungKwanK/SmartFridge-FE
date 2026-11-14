<template>
  <v-dialog v-model="show" max-width="400" persistent>
    <v-card class="reduce-card">
      <h2 class="reduce-title">{{ foodName }} {{ reducedCount }}개는 어떻게 됐나요?</h2>
      <p class="reduce-desc">수량이 {{ fromCount }}개에서 {{ toCount }}개로 줄었어요. 먹었는지 버렸는지 고르면 기록으로 남아요.</p>

      <div class="reduce-options">
        <button type="button" class="reduce-option" :disabled="!!loading" @click="$emit('select', '소비')">
          <span class="option-emoji" aria-hidden="true">🍽️</span>
          <span class="option-text">
            <span class="option-title">먹었어요</span>
            <span class="option-desc">{{ reducedCount }}개를 먹은 식품으로 기록해요</span>
          </span>
          <v-progress-circular v-if="loading === '소비'" indeterminate size="18" width="2" color="primary" />
        </button>
        <button type="button" class="reduce-option" :disabled="!!loading" @click="$emit('select', '폐기')">
          <span class="option-emoji" aria-hidden="true">🗑️</span>
          <span class="option-text">
            <span class="option-title">버렸어요</span>
            <span class="option-desc">{{ reducedCount }}개를 버린 식품으로 기록해요</span>
          </span>
          <v-progress-circular v-if="loading === '폐기'" indeterminate size="18" width="2" color="primary" />
        </button>
      </div>

      <div class="reduce-foot">
        <v-btn
          variant="text"
          size="small"
          class="fix-btn"
          :loading="loading === '수량정정'"
          :disabled="!!loading"
          @click="$emit('select', null)"
        >
          수량만 고칠게요 (기록 없음)
        </v-btn>
        <v-btn variant="text" :disabled="!!loading" @click="$emit('cancel')">취소</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
/**
 * 수정 화면에서 수량을 줄였을 때, 줄어든 만큼을 먹었는지 버렸는지 묻는 확인창.
 * select 이벤트로 '소비' | '폐기' | null(잘못 입력한 수량을 고친 것, 기록 없음)을 보낸다.
 */
export default {
  name: 'FoodReduceDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    foodName: {
      type: String,
      default: ''
    },
    fromCount: {
      type: Number,
      default: 0
    },
    toCount: {
      type: Number,
      default: 0
    },
    // 저장 중인 선택지 ('소비' | '폐기' | '수량정정'), 저장 중이 아니면 빈 문자열
    loading: {
      type: String,
      default: ''
    }
  },
  computed: {
    reducedCount() {
      return this.fromCount - this.toCount;
    },
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
.reduce-card {
  padding: 24px 24px 12px;
}

.reduce-title {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.4;
  word-break: keep-all;
  color: var(--sf-text);
}

.reduce-desc {
  margin: 6px 0 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--sf-text-sub);
}

.reduce-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reduce-option {
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

.reduce-option:hover:not(:disabled) {
  border-color: var(--sf-primary);
  background: var(--sf-mint-soft);
}

.reduce-option:disabled {
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

.reduce-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-top: 12px;
}

.fix-btn {
  margin-left: -8px;
  color: var(--sf-text-sub);
}
</style>
