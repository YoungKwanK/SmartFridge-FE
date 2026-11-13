<template>
  <v-snackbar
    v-model="snackbarState.show"
    :timeout="snackbarState.timeout"
    :color="snackbarState.color"
    :location="snackbarState.location"
    :class="snackbarState.class"
  >
    {{ snackbarState.message }}
    <template v-slot:actions>
      <v-btn
        color="white"
        variant="text"
        @click="snackbar.hide()"
      >
        닫기
      </v-btn>
    </template>
  </v-snackbar>
</template>

<script setup>
// 앱 전체 스낵바. App.vue에 한 번만 둔다.
// 띄울 때는 어디서든 `import { snackbar } from '@/composables/snackbar'` 후 snackbar.success('...') 처럼 호출한다.
import { snackbarState, snackbar } from '@/composables/snackbar';
</script>
