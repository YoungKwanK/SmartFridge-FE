<template>
  <v-dialog v-model="show" max-width="400" persistent>
    <v-card class="confirm-card">
      <h2 class="confirm-title">{{ title }}</h2>
      <p class="confirm-message">{{ message }}</p>
      <div class="confirm-actions">
        <v-btn variant="text" @click="$emit('cancel')">취소</v-btn>
        <v-btn color="error" variant="flat" @click="$emit('confirm')">삭제</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script>
export default {
  name: 'DeleteConfirmDialog',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: '삭제 확인'
    },
    message: {
      type: String,
      required: true
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
  emits: ['update:modelValue', 'confirm', 'cancel']
}
</script>

<style scoped>
.confirm-card {
  padding: 24px 24px 16px;
}

.confirm-title {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  color: var(--sf-text);
}

.confirm-message {
  margin: 8px 0 0;
  font-size: 15px;
  line-height: 1.6;
  white-space: pre-line;
  color: var(--sf-text-sub);
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}
</style>

