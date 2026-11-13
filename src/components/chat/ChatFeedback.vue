<template>
  <v-snackbar
    v-model="feedbackState.notice.show"
    :color="feedbackState.notice.color"
    timeout="3000"
    location="top"
  >
    {{ feedbackState.notice.message }}
  </v-snackbar>

  <v-dialog
    :model-value="feedbackState.confirm.show"
    max-width="400"
    @update:model-value="value => !value && closeConfirm(false)"
  >
    <v-card rounded="lg">
      <v-card-title class="text-title-large font-weight-bold pt-5 px-5">
        {{ feedbackState.confirm.title }}
      </v-card-title>
      <v-card-text class="px-5 confirm-message">{{ feedbackState.confirm.message }}</v-card-text>
      <v-card-actions class="px-5 pb-4">
        <v-spacer />
        <v-btn variant="text" @click="closeConfirm(false)">취소</v-btn>
        <v-btn :color="feedbackState.confirm.color" variant="flat" @click="closeConfirm(true)">
          {{ feedbackState.confirm.confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { feedbackState, closeConfirm } from '@/composables/chatFeedback';
</script>

<style scoped>
.confirm-message {
  white-space: pre-line;
}
</style>
