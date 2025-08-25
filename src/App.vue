<template>
  <v-app>
    <SidebarComponent v-if="!isLoginPage"/>
    <v-main>
      <router-view/>
    </v-main>
  </v-app>
</template>

<script>
import SidebarComponent from './components/common/SidebarComponent.vue'

export default {
  name: 'App',
  components: {
    SidebarComponent
  },
  computed: {
    isLoginPage() {
      // 로그인 관련 페이지들과 NoFridgePage에서는 사이드바를 숨김
      const hideSidebarRoutes = ['/', '/login', '/member/create', '/no-fridge', '/oauth/google/redirect', '/oauth/kakao/redirect', '/oauth/naver/redirect'];
      return hideSidebarRoutes.includes(this.$route.path);
    }
  }
}
</script>

<style>
</style>
