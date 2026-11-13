<template>
  <!-- 모바일(md 미만)에서는 상단 앱 바의 햄버거 버튼으로 드로어를 연다 -->
  <v-app-bar v-if="isMobile" density="compact" flat border="b" class="mobile-app-bar">
    <v-app-bar-nav-icon aria-label="메뉴 열기" @click="drawer = !drawer" />
    <router-link to="/fridge/dashboard" class="sidebar-brand is-compact">
      <img :src="logoUrl" alt="" class="brand-logo" />
      <span class="sf-brand-name">SmartFridge</span>
    </router-link>
  </v-app-bar>

  <!-- 데스크톱에서는 항상 펼쳐 두고, 모바일에서는 본문 위에 잠깐 띄우는 temporary 드로어로 쓴다 -->
  <v-navigation-drawer
    v-model="drawer"
    :permanent="!isMobile"
    :temporary="isMobile"
    :width="248"
    class="sf-sidebar"
  >
    <div class="sidebar-top">
      <router-link v-if="!isMobile" to="/fridge/dashboard" class="sidebar-brand">
        <img :src="logoUrl" alt="" class="brand-logo" />
        <span class="sf-brand-name">SmartFridge</span>
      </router-link>

      <!-- 지금 들어와 있는 냉장고. 누르면 냉장고 목록에서 다른 냉장고를 고른다 -->
      <router-link to="/fridge/list" class="fridge-switch" :title="fridgeName">
        <span class="fridge-switch-icon" aria-hidden="true">
          <v-icon size="20">mdi-fridge-outline</v-icon>
        </span>
        <span class="fridge-switch-text">
          <span class="fridge-switch-label">지금 보는 냉장고</span>
          <span class="fridge-switch-name">{{ fridgeName }}</span>
        </span>
        <v-icon size="18" class="fridge-switch-chevron" aria-label="냉장고 바꾸기">mdi-swap-horizontal</v-icon>
      </router-link>
    </div>

    <v-list v-model:selected="selectedItem" density="compact" nav class="sidebar-nav" aria-label="메뉴">
      <template v-for="item in menuItems" :key="item.value">
        <v-list-item
          v-if="item.value !== 'usermanagement' || userType === 'MANAGER'"
          :title="item.title"
          :value="item.value"
          :to="item.to"
          :active="selectedItem[0] === item.value"
          class="nav-link"
          rounded="lg"
        >
          <template v-slot:prepend>
            <v-icon :icon="item.icon" size="20"></v-icon>
          </template>
          <template v-slot:append v-if="item.badgeCount > 0">
            <span class="notification-indicator" aria-label="새 소식 있음"></span>
          </template>
        </v-list-item>
      </template>
    </v-list>

    <template v-slot:append>
      <div class="sidebar-user">
        <router-link to="/mypage" class="user-link" aria-label="내 정보로 가기">
          <span v-if="!userProfileImage" class="user-avatar user-avatar-initial" aria-hidden="true">{{ userInitial }}</span>
          <v-img
            v-else
            :src="userProfileImage"
            alt=""
            class="user-avatar"
            width="36"
            height="36"
            cover
          />
          <span class="user-name">{{ displayUserName }}</span>
        </router-link>
        <v-btn
          icon="mdi-logout"
          variant="text"
          size="small"
          class="logout-button"
          aria-label="로그아웃"
          title="로그아웃"
          @click="doLogout"
        />
      </div>
    </template>
  </v-navigation-drawer>

  <!-- 모바일 하단 탭: 자주 쓰는 4곳. 나머지 메뉴는 상단 햄버거 드로어에 있다 -->
  <v-bottom-navigation
    v-if="isMobile"
    :model-value="activeTab"
    grow
    height="64"
    class="bottom-tabs"
    aria-label="주요 메뉴"
  >
    <v-btn
      v-for="tab in bottomTabs"
      :key="tab.value"
      :value="tab.value"
      :to="tab.to"
      class="bottom-tab"
    >
      <v-badge :model-value="!!tab.badge" dot color="error" offset-x="-2" offset-y="2">
        <v-icon :icon="tab.icon" size="22" />
      </v-badge>
      <span class="bottom-tab-label">{{ tab.title }}</span>
    </v-btn>
  </v-bottom-navigation>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useDisplay } from 'vuetify';
import axios from 'axios';
import { getResultData } from '@/utils/commonDataHandler';
import logoUrl from '@/assets/images/SFlogo/smartFridge_logo.png';

const store = useStore();
const route = useRoute();

const selectedItem = ref(['dashboard']);


// 라우트 경로를 사이드바 value로 매핑하는 함수
const getSidebarValueFromRoute = (path, query = {}) => {
  // 공동구매 게시판은 커뮤니티와 같은 화면이지만 메뉴는 따로 둔다 (모바일 하단 탭과 같게)
  if (path.startsWith('/fridge/community') && query.board === '공동구매') {
    return 'groupbuy';
  }

  const routeMapping = {
    '/fridge/dashboard': 'dashboard',
    '/fridge/food/shared': 'sharedfoodlist',
    '/fridge/food/nonshared': 'sharedfoodlist',
    '/notification/list': 'notifications',
    '/fridge/community': 'community',
    '/fridge/post': 'community', // 게시글 상세보기 페이지도 커뮤니티로 매핑

    '/chatpage': 'chat',
    '/mypage': 'mypage',
    '/inquiry': 'inquiry',
    '/fridge/member/list': 'usermanagement'
  };
  
  // 정확한 매칭을 먼저 시도
  if (routeMapping[path]) {
    return routeMapping[path];
  }
  
  // 부분 매칭 시도 (예: /fridge/food/shared?mode=nonshared)
  for (const [routePath, value] of Object.entries(routeMapping)) {
    if (path.startsWith(routePath)) {
      return value;
    }
  }
  
  return 'dashboard'; // 기본값
};

// 현재 라우트에 따라 selectedItem 업데이트
const updateSelectedItem = () => {
  const currentValue = getSidebarValueFromRoute(route.path, route.query);
  selectedItem.value = [currentValue];
};

// 모바일 여부: 채팅 화면(ChatPage)과 같은 기준(md 미만)을 쓴다
const { smAndDown: isMobile } = useDisplay();
const drawer = ref(!isMobile.value);

// 화면 폭이 바뀌면 데스크톱에서는 펼치고 모바일에서는 접는다
watch(isMobile, (mobile) => {
  drawer.value = !mobile;
});

// 라우트 변경 감지
watch(() => route.fullPath, () => {
  updateSelectedItem();
  // 모바일에서 메뉴를 고르면 드로어를 닫는다
  if (isMobile.value) {
    drawer.value = false;
  }
}, { immediate: true });

// Store에서 사용자 정보 가져오기
const userInfo = computed(() => store.getters.getUserInfo);
const userName = computed(() => store.getters.getUserName);
const userProfileImage = computed(() => store.getters.getUserProfileImage);
const userInitial = computed(() => store.getters.getUserInitial);

const userType = ref([]);

// 표시할 사용자 이름 (기본값 설정)
const displayUserName = computed(() => {
  if (userName.value) {
    return `${userName.value}님`;
  }
  return '사용자님';
});

// 지금 들어와 있는 냉장고 이름 (냉장고 목록에서 고를 때 저장한 정보)
const fridgeName = computed(() => store.getters.getCurrentFridgeInfo?.fridgeName || '냉장고를 골라 주세요');

const doLogout = () => {
  store.dispatch('logout');
  window.location.href = '/login';
};

const fetchUserType = async (fridgeId) => {
  try {
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/member/type`);
    userType.value = getResultData(response);
    console.log('userType', userType.value);
  } catch (error) {
    console.error('Failed to load user type:', error);
  }
}

// 채팅방 상태 동기화 함수 (MANAGER_CHAT은 유저 관리 탭에서 별도 관리)
const syncChatBadgeStatus = async () => {
  // 냉장고 ID가 있을 때만 채팅 배지 상태 동기화
  const currentFridgeId = store.getters.getCurrentFridgeId;
  if (currentFridgeId) {
    // 그룹 채팅 배지만 동기화 (MANAGER_CHAT은 유저 관리 페이지에서 관리)
    await store.dispatch('notification/updateGroupChatBadgeOnly', currentFridgeId);
    
    // MANAGER_CHAT 배지는 유저 관리 페이지에서만 관리 (사이드바에서는 건드리지 않음)
    console.log('🔄 syncChatBadgeStatus - MANAGER_CHAT 배지 상태 유지:', {
      currentBadge: store.getters['notification/typeCounts']?.MANAGER_CHAT || 0,
      message: 'MANAGER_CHAT 배지는 유저 관리 페이지에서만 관리'
    });
  }
};

// 전역 MANAGER_CHAT 알림 처리 함수
const handleGlobalManagerChatNotification = (event) => {
  const notification = event.detail;
  if (notification.type === 'MANAGER_CHAT') {
    console.log('📨 사이드바에서 전역 MANAGER_CHAT 알림 수신:', notification);
    
    // 유저 관리 페이지에서 설정한 배지 상태가 있으면 업데이트
    const userManagementState = store.getters['notification/userManagementBadgeState'];
    if (userManagementState?.isSetByUserManagement) {
      // hasUnreadMessages를 true로 설정하고 배지 표시
      store.commit('notification/setUserManagementBadgeState', {
        hasUnreadMessages: true,
        isSetByUserManagement: true
      });
      store.commit('notification/setAdminChatCount', 1);
    }
  }
};

// 컴포넌트 마운트 시 사용자 정보 로드 및 냉장고 ID 확인
onMounted(async () => {
  const token = localStorage.getItem('accessToken');
  if (token && !userInfo.value) {
    try {
      await store.dispatch('fetchUserInfo');
    } catch (error) {
      console.error('Failed to load user info:', error);
      // 에러가 발생해도 기본값으로 표시되도록 함
    }
  }
  
  // 냉장고 ID가 없으면 냉장고 목록 페이지로 리다이렉트
  const currentFridgeId = store.getters.getCurrentFridgeId;
  if (!currentFridgeId && window.location.pathname !== '/fridge/list') {
    window.location.href = '/fridge/list';
  }
  await fetchUserType(currentFridgeId);
  
  // sessionStorage에서 배지 상태 복원 (페이지 이동 시에도 유지)
  await store.dispatch('notification/restoreBadgeStateFromStorage');
  
  // 채팅 배지 상태 동기화 (초기 로드 시) - MANAGER_CHAT 배지는 제외
  await syncChatBadgeStatus();
  
  // 유저 관리 배지 초기 설정 (관리자인 경우) - 냉장고 진입 시 배지 상태 초기화
  if (userType.value === 'MANAGER') {
    // 냉장고 진입 시 채팅 배지 상태 동기화 (그룹 채팅만, MANAGER_CHAT 배지 보호)
    await store.dispatch('notification/updateChatBadgesOnFridgeEnter', currentFridgeId);
    console.log('🔍 사이드바 초기 로드 - 냉장고 진입 시 배지 상태 초기화 (MANAGER_CHAT 배지 보호):', {
      currentBadge: store.getters['notification/typeCounts']?.MANAGER_CHAT || 0,
      userType: userType.value,
      fridgeId: currentFridgeId,
      userManagementState: store.getters['notification/userManagementBadgeState']
    });
  }
  
  // 전역 MANAGER_CHAT 알림 이벤트 리스너 등록
  window.addEventListener('admin-chat-notification', handleGlobalManagerChatNotification);
  
  // 주기적으로 채팅 배지 상태 동기화 (10분마다로 변경하여 배지가 너무 자주 사라지는 문제 방지)
  const syncInterval = setInterval(syncChatBadgeStatus, 600000);
  
  // 컴포넌트 언마운트 시 인터벌 정리
  onUnmounted(() => {
    clearInterval(syncInterval);
    window.removeEventListener('admin-chat-notification', handleGlobalManagerChatNotification);
    
    // 사이드바 종료 시 배지 상태를 sessionStorage에 저장하여 로그아웃 후에도 유지
    const currentBadgeState = store.getters['notification/typeCounts']?.MANAGER_CHAT || 0;
    const userManagementState = store.getters['notification/userManagementBadgeState'];
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('managerChatBadgeState', JSON.stringify({
        count: currentBadgeState,
        timestamp: Date.now()
      }));
      
      sessionStorage.setItem('userManagementBadgeState', JSON.stringify({
        hasUnreadMessages: userManagementState?.hasUnreadMessages || false,
        isSetByUserManagement: userManagementState?.isSetByUserManagement || false,
        timestamp: Date.now()
      }));
      
      console.log('💾 사이드바 종료 시 배지 상태 저장:', {
        managerChatBadge: currentBadgeState,
        userManagementState
      });
    }
  });
});

// 하단 탭: 냉장고 | 공동구매 | 채팅 | 내 정보
const bottomTabs = computed(() => {
  const chatItem = menuItems.value.find(item => item.value === 'chat');
  return [
    { title: '냉장고', value: 'fridge', icon: 'mdi-fridge-outline', to: '/fridge/dashboard' },
    { title: '공동구매', value: 'groupbuy', icon: 'mdi-cart-outline', to: { path: '/fridge/community', query: { board: '공동구매' } } },
    { title: '채팅', value: 'chat', icon: 'mdi-chat-outline', to: '/chatpage', badge: (chatItem?.badgeCount || 0) > 0 },
    { title: '내 정보', value: 'me', icon: 'mdi-account-outline', to: '/mypage' }
  ];
});

const activeTab = computed(() => {
  const path = route.path;
  if (path.startsWith('/fridge/community') || path.startsWith('/fridge/post')) {
    return route.query.board === '공동구매' ? 'groupbuy' : null;
  }
  if (path.startsWith('/chatpage')) return 'chat';
  if (path.startsWith('/mypage')) return 'me';
  if (path.startsWith('/fridge/dashboard') || path.startsWith('/fridge/food')) return 'fridge';
  return null;
});

const menuItems = computed(() => {
  const inquiryBadgeCount = store.getters['notification/inquiryBadgeCount'];
  const chatBadgeCount = store.getters['notification/chatBadgeCount'];

  const fridgeInfo = store.getters.getCurrentFridgeInfo;
  
  let isManager;
  let isUser;
  
  if (fridgeInfo && fridgeInfo.type) {
    isManager = fridgeInfo.type === 'MANAGER';
    isUser = fridgeInfo.type === 'USER' || fridgeInfo.type === 'COMMON';
  } else {
    isUser = true;
    isManager = false;
  }
  
  // 유저 관리 탭 배지 (실제 채팅방 unReadCount 기반)
  let userManagementBadgeCount = 0;
  if (isManager) {
    // 유저 관리 탭은 실제 채팅방의 unReadCount를 기반으로 배지 표시
    // store에서 관리자 채팅 배지 상태를 가져옴 (실시간 동기화됨)
    const adminChatBadge = store.getters['notification/typeCounts']?.MANAGER_CHAT || 0;
    const userManagementState = store.getters['notification/userManagementBadgeState'];
    
    // 배지 표시 로직 단순화: MANAGER_CHAT 배지가 있으면 표시
    userManagementBadgeCount = adminChatBadge > 0 ? 1 : 0;
    
    console.log('📱 사이드바 유저 관리 탭 배지:', { 
      adminChatBadge, 
      userManagementBadgeCount,
      userManagementState,
      typeCounts: store.getters['notification/typeCounts'],
      currentPath: window.location.pathname,
      isManager
    });
  }
  
  let finalChatBadgeCount;
  if (isUser) {
    // 사용자는 MANAGER_CHAT 알림을 받지 않음 (관리자용 알림)
    const hasGroupChat = store.getters['notification/typeCounts']?.GROUP_CHAT > 0;
    const hasRoomFull = store.getters['notification/typeCounts']?.ROOM_FULL > 0;
    finalChatBadgeCount = (hasGroupChat || hasRoomFull) ? 1 : 0;
  } else if (isManager) {
    const hasGroupChat = store.getters['notification/typeCounts']?.GROUP_CHAT > 0;
    const hasRoomFull = store.getters['notification/typeCounts']?.ROOM_FULL > 0;
    finalChatBadgeCount = (hasGroupChat || hasRoomFull) ? 1 : 0;
  } else {
    finalChatBadgeCount = chatBadgeCount > 0 ? 1 : 0;
  }
  

  
  // 메뉴 이름은 각 화면 제목과 같게 둔다
  const baseMenuItems = [
    { title: '대시보드', icon: 'mdi-view-dashboard-outline', value: 'dashboard', to: '/fridge/dashboard' },
    { title: '식품 목록', icon: 'mdi-food-fork-drink', value: 'sharedfoodlist', to: '/fridge/food/shared', badgeCount: 0 },
    { title: '알림', icon: 'mdi-bell-outline', value: 'notifications', to: '/notification/list' },
    { title: '커뮤니티', icon: 'mdi-account-group-outline', value: 'community', to: '/fridge/community' },
    { title: '공동구매', icon: 'mdi-cart-outline', value: 'groupbuy', to: { path: '/fridge/community', query: { board: '공동구매' } } },
    { title: '채팅', icon: 'mdi-chat-outline', value: 'chat', to: '/chatpage', badgeCount: finalChatBadgeCount },
    { title: '내 정보', icon: 'mdi-account', value: 'mypage', to: '/mypage' },
    {
      title: '문의하기', icon: 'mdi-email-outline', value: 'inquiry',
      to: '/inquiry',
      badgeCount: inquiryBadgeCount > 0 ? 1 : 0
    }
  ];

  // 관리자(MANAGER)인 경우에만 멤버 관리 메뉴 추가
  if (isManager) {
    baseMenuItems.splice(-1, 0, {
      title: '멤버 관리', icon: 'mdi-account-cog-outline', value: 'usermanagement', to: '/fridge/member/list',
      badgeCount: userManagementBadgeCount
    });
  }

  return baseMenuItems;
});
</script>

<style scoped>
.sf-sidebar {
  background: var(--sf-surface);
  border-right: 1px solid var(--sf-line) !important;
}

/* 로고 + 서비스 이름 */
.sidebar-brand {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.brand-logo {
  width: 32px;
  height: 32px;
  border-radius: 9px;
}

.sidebar-brand.is-compact .brand-logo {
  width: 28px;
  height: 28px;
  border-radius: 8px;
}

.sidebar-brand.is-compact .sf-brand-name {
  font-size: var(--sf-fs-lg);
}

.sidebar-top {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px 16px 12px;
}

/* 지금 보는 냉장고 */
.fridge-switch {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 10px 10px 12px;
  border: 1px solid var(--sf-line);
  border-radius: var(--sf-radius-md);
  background: var(--sf-bg);
  color: var(--sf-text);
  text-decoration: none;
  transition: border-color 0.15s;
}

.fridge-switch:hover {
  border-color: var(--sf-line-strong);
}

.fridge-switch-icon {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--sf-radius-sm);
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
}

.fridge-switch-text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.3;
}

.fridge-switch-label {
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-faint);
}

.fridge-switch-name {
  overflow: hidden;
  font-size: var(--sf-fs-md);
  font-weight: 700;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.fridge-switch-chevron {
  flex-shrink: 0;
  color: var(--sf-text-faint);
}

/* 메뉴 */
.sidebar-nav {
  padding: 4px 0 12px;
}

.nav-link {
  min-height: 44px;
  margin: 0 12px 2px;
  color: var(--sf-text-sub);
}

.nav-link :deep(.v-list-item__overlay) {
  display: none;
}

.nav-link:hover {
  background: var(--sf-bg);
}

.nav-link :deep(.v-list-item-title) {
  font-size: var(--sf-fs-md);
  font-weight: 500;
  color: var(--sf-text);
}

.nav-link.v-list-item--active {
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
}

.nav-link.v-list-item--active :deep(.v-list-item-title) {
  color: var(--sf-primary);
  font-weight: 700;
}

.notification-indicator {
  display: block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: var(--sf-expired);
}

/* 아래쪽 사용자 정보 */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 8px 12px 16px;
  border-top: 1px solid var(--sf-line);
}

.user-link {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  padding: 4px;
  margin-left: -4px;
  border-radius: var(--sf-radius-sm);
  color: var(--sf-text);
  text-decoration: none;
}

.user-link:hover {
  background: var(--sf-bg);
}

.user-avatar {
  /* v-img(.v-responsive)는 기본이 flex: 1이라 옆으로 늘어난다 */
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
}

.user-avatar-initial {
  display: grid;
  place-items: center;
  background: var(--sf-mint-soft);
  font-size: 15px;
  font-weight: 700;
  color: var(--sf-primary);
}

.user-name {
  overflow: hidden;
  font-size: var(--sf-fs-md);
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.logout-button {
  flex-shrink: 0;
  color: var(--sf-text-faint);
}

/* 모바일 */
.mobile-app-bar {
  background: var(--sf-surface) !important;
}

.mobile-app-bar .sidebar-brand {
  margin-left: 4px;
}

.bottom-tabs {
  border-top: 1px solid var(--sf-line);
  box-shadow: none !important;
  padding-bottom: env(safe-area-inset-bottom);
}

.bottom-tab {
  color: var(--sf-text-faint) !important;
  min-width: 0 !important;
}

.bottom-tab :deep(.v-btn__content) {
  flex-direction: column;
  gap: 2px;
}

.bottom-tab :deep(.v-btn__overlay) {
  display: none;
}

.bottom-tab.v-btn--active {
  color: var(--sf-primary) !important;
}

.bottom-tab-label {
  font-size: var(--sf-fs-xs);
  font-weight: 600;
  letter-spacing: 0;
}
</style>
