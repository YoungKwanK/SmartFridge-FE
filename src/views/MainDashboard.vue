<template>
  <v-container>
    <h1>메인페이지입니다</h1>
    <v-btn :to="{path:'/login'}">로그인</v-btn>
    <div class="mt-5">
      <v-badge color="red" :content="notificationCount">
        <v-btn>알림</v-btn>
      </v-badge>
    </div>
    <div class="mt-5">
      <v-btn :to="{path:'/inquiry'}">문의하기</v-btn>
    </div>
  </v-container>
</template>

<script setup>
// 메인 페이지 관련 로직은 여기에 작성합니다.
</script>

<style scoped>
/* 메인 페이지 전용 스타일은 여기에 작성합니다. */
</style>