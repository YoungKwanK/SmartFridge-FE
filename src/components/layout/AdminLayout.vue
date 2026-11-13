<template>
  <!-- 관리자 화면 공통 틀: 위쪽 머리글·탭은 한 번만 그리고, 각 화면은 router-view 자리에 들어온다 -->
  <div class="admin-shell">
    <header class="admin-topbar">
      <div class="admin-topbar-inner">
        <router-link to="/admin" class="admin-brand">
          <img :src="logoUrl" alt="" class="sf-brand-logo" />
          <span class="sf-brand-name">SmartFridge</span>
          <span class="admin-tag">관리자</span>
        </router-link>
        <v-btn variant="text" size="small" prepend-icon="mdi-logout" @click="logout">로그아웃</v-btn>
      </div>

      <nav class="admin-tabs" aria-label="관리자 메뉴">
        <router-link
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="admin-tab"
          :class="{ 'is-active': route.path === tab.to }"
          :aria-current="route.path === tab.to ? 'page' : undefined"
        >
          {{ tab.title }}
        </router-link>
      </nav>
    </header>

    <router-view />
  </div>
</template>

<script setup>
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import logoUrl from '@/assets/images/SFlogo/smartFridge_logo.png';

const store = useStore();
const route = useRoute();

const tabs = [
  { title: '대시보드', to: '/admin' },
  { title: '문의 목록', to: '/admin/inquiry' },
  { title: '알림 목록', to: '/admin/notification' },
  { title: '사용자 관리', to: '/admin/users' }
];

// 토큰 정리와 첫 화면 이동은 authService.logout이 맡는다
const logout = () => store.dispatch('logout');
</script>

<style scoped>
.admin-shell {
  min-height: 100vh;
  background: var(--sf-bg);
}

.admin-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  background: var(--sf-surface);
  border-bottom: 1px solid var(--sf-line);
}

.admin-topbar-inner,
.admin-tabs {
  max-width: var(--sf-page-wide);
  margin: 0 auto;
  padding-inline: var(--sf-page-pad-x);
}

.admin-topbar-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 60px;
}

.admin-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.admin-brand .sf-brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 9px;
}

.admin-tag {
  padding: 2px 8px;
  border-radius: var(--sf-radius-sm);
  background: var(--sf-bg);
  font-size: var(--sf-fs-xs);
  font-weight: 700;
  color: var(--sf-text-sub);
}

.admin-tabs {
  display: flex;
  gap: 4px;
  overflow-x: auto;
  scrollbar-width: none;
}

.admin-tab {
  flex-shrink: 0;
  padding: 10px 14px 12px;
  border-bottom: 2px solid transparent;
  font-size: var(--sf-fs-md);
  font-weight: 500;
  color: var(--sf-text-sub);
  text-decoration: none;
}

.admin-tab:hover {
  color: var(--sf-text);
}

.admin-tab.is-active {
  border-bottom-color: var(--sf-text);
  font-weight: 700;
  color: var(--sf-text);
}
</style>
