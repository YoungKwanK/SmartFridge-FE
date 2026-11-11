<template>
  <v-dialog v-model="show" max-width="420" persistent>
    <v-card>
      <v-card-title class="text-title-large font-weight-bold">
        식품 처리
      </v-card-title>
      <v-card-text class="text-body-large">
        '{{ foodName }}' 식품을 어떻게 처리할까요?
      </v-card-text>
      <v-card-actions class="finish-actions">
        <v-btn
          color="primary"
          variant="elevated"
          block
          :loading="loading === '소비'"
          :disabled="!!loading"
          @click="$emit('select', '소비')"
        >
          🍽️ 다 먹었어요
        </v-btn>
        <v-btn
          color="error"
          variant="elevated"
          block
          :loading="loading === '폐기'"
          :disabled="!!loading"
          @click="$emit('select', '폐기')"
        >
          🗑️ 버렸어요
        </v-btn>
        <div class="sub-actions">
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
          <v-btn
            variant="outlined"
            size="small"
            :disabled="!!loading"
            @click="$emit('cancel')"
          >
            취소
          </v-btn>
        </div>
      </v-card-actions>
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
.v-card-title {
  border-bottom: 1px solid #eeeeee;
  padding-bottom: 16px;
}

.v-card-text {
  padding: 20px 24px 8px;
  color: #424242;
  line-height: 1.6;
}

.finish-actions {
  flex-direction: column;
  gap: 8px;
  padding: 16px 24px 20px;
}

.finish-actions > .v-btn {
  margin-inline-start: 0 !important;
}

.sub-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  margin-top: 4px;
}

.mistake-btn {
  color: #757575;
}
</style>
