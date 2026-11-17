<template>
  <!--
    게시판 한 개(카테고리 하나)의 글 목록.
    공동구매 화면과 대시보드의 공지사항 탭이 같이 쓴다.
  -->
  <section class="sf-list-panel" :aria-label="`${category} 글 목록`">
    <div class="search-bar">
      <v-text-field
        v-model="searchQuery"
        placeholder="제목, 내용, 작성자로 찾기"
        aria-label="게시글 찾기"
        variant="outlined"
        density="compact"
        hide-details
        prepend-inner-icon="mdi-magnify"
        class="search-field"
        @input="onSearchInput"
      />
      <v-btn
        v-if="canWrite"
        :color="isGroupBuyBoard ? 'cta' : 'primary'"
        variant="flat"
        prepend-icon="mdi-plus"
        class="write-btn"
        @click="openCreateModal"
      >
        {{ writeLabel }}
      </v-btn>
    </div>

    <div v-if="isLoading" class="sf-state-box">
      <v-progress-circular indeterminate color="primary" size="36" />
      <p>게시글을 불러오는 중이에요</p>
    </div>

    <ul v-else-if="postList && postList.length > 0" class="post-list">
      <li
        v-for="post in postList"
        :key="post.id"
        class="post-item"
        :class="{ 'is-pinned': post.pinned }"
      >
        <button type="button" class="post-link" @click="viewPost(post)">
          <span class="post-icon" :class="iconClass" aria-hidden="true">
            <v-icon size="20">{{ iconName }}</v-icon>
          </span>
          <span class="post-body">
            <span class="post-title">
              <span v-if="post.pinned" class="pin-tag">고정</span>
              {{ post.title }}
            </span>
            <span class="post-meta">
              <span>{{ post.writer }}</span>
              <span>{{ post.timeAgo }}</span>
            </span>
          </span>
          <span class="post-views sf-num" :aria-label="`조회 ${post.viewCount}회`">
            <v-icon size="16" aria-hidden="true">mdi-eye-outline</v-icon>
            {{ post.viewCount }}
          </span>
        </button>
      </li>
    </ul>

    <div v-else class="sf-state-box">
      <p class="sf-empty-title">{{ emptyTitle }}</p>
      <p>{{ emptyHint }}</p>
      <v-btn
        v-if="canWrite && !searchQuery"
        :color="isGroupBuyBoard ? 'cta' : 'primary'"
        variant="flat"
        prepend-icon="mdi-plus"
        class="mt-2"
        @click="openCreateModal"
      >
        {{ writeLabel }}
      </v-btn>
    </div>

    <footer v-if="!isLoading && postList && postList.length > 0" class="list-foot">
      <span class="page-text sf-num">
        총 {{ totalElements }}개 중 {{ (currentPage - 1) * pageSize + 1 }}–{{ Math.min(currentPage * pageSize, totalElements) }}
      </span>
      <v-pagination
        v-model="currentPage"
        :length="totalPages"
        :total-visible="5"
        density="comfortable"
        rounded="lg"
        active-color="primary"
        @update:model-value="onPageChange"
      />
    </footer>

    <!-- 게시글 작성 모달: 이 게시판의 카테고리로 쓴다 -->
    <PostFormModal v-model="isModalOpen" :board-type="category" @save="handleSave" />
  </section>
</template>

<script>
import axios from 'axios';
import { getFridgeId } from '@/utils/commonDataHandler';
import PostFormModal from '@/components/community/PostFormModal.vue';
import { useStore } from 'vuex';
import { NOTICE_CATEGORY, PURCHASE_CATEGORY } from '@/utils/postCategory';
import { snackbar } from '@/composables/snackbar';

export default {
  name: 'PostBoard',
  components: {
    PostFormModal,
  },
  props: {
    // 이 게시판의 카테고리 이름 (예: '공동구매', '공지사항')
    category: {
      type: String,
      required: true
    }
  },
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      searchQuery: '',
      postList: [],
      isModalOpen: false,
      isLoading: false,
      currentPage: 1,
      pageSize: 10,
      totalPages: 0,
      totalElements: 0,
      currentUserRole: 'COMMON' // 현재 사용자의 냉장고 역할
    }
  },
  computed: {
    isManager() {
      return this.currentUserRole === 'MANAGER';
    },
    isNoticeBoard() {
      return this.category === NOTICE_CATEGORY;
    },
    isGroupBuyBoard() {
      return this.category === PURCHASE_CATEGORY;
    },
    // 공지사항은 관리자만 쓸 수 있다
    canWrite() {
      return !(this.isNoticeBoard && !this.isManager);
    },
    writeLabel() {
      if (this.isGroupBuyBoard) return '공동구매 모집하기';
      if (this.isNoticeBoard) return '공지 쓰기';
      return '글쓰기';
    },
    iconName() {
      if (this.isGroupBuyBoard) return 'mdi-cart-outline';
      if (this.isNoticeBoard) return 'mdi-bullhorn-outline';
      return 'mdi-message-text-outline';
    },
    iconClass() {
      return {
        'is-groupbuy': this.isGroupBuyBoard,
        'is-notice': this.isNoticeBoard
      };
    },
    emptyTitle() {
      if (this.searchQuery) return `'${this.searchQuery}'에 맞는 글이 없어요`;
      if (this.isGroupBuyBoard) return '모집 중인 공동구매가 없어요';
      if (this.isNoticeBoard) return '공지사항이 없어요';
      return '아직 올라온 글이 없어요';
    },
    emptyHint() {
      if (this.searchQuery) return '다른 단어로 찾아 보세요.';
      if (this.isGroupBuyBoard) return '함께 살 식재료가 있다면 먼저 모집해 보세요.';
      if (this.isNoticeBoard) return this.isManager ? '멤버에게 알릴 내용을 올려 보세요.' : '관리자가 공지를 올리면 여기에 보여요.';
      return '첫 글을 남겨 보세요.';
    }
  },
  async created() {
    // 공지사항 쓰기 권한을 보려고 역할을 확인한다
    if (this.isNoticeBoard) {
      await this.checkUserRole();
    }
    await this.fetchPostList();

    // 게시글 삭제 완료 메시지 확인 및 표시
    this.checkPostDeletedMessage();

    // 대시보드의 '공지 쓰기'처럼 ?write=1 로 들어오면 작성 창을 바로 연다
    if (this.$route.query.write && this.canWrite) {
      this.isModalOpen = true;
      const query = { ...this.$route.query };
      delete query.write;
      this.$router.replace({ query });
    }
  },
  methods: {
    // 현재 사용자의 냉장고 역할 확인
    async checkUserRole() {
      try {
        const currentFridgeId = this.store.state.currentFridgeId;
        const userEmail = this.store.getters.getUserEmail || localStorage.getItem('email');
        if (!currentFridgeId || !userEmail) {
          this.currentUserRole = 'COMMON';
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${currentFridgeId}/members`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
          }
        );

        const members = response.data?.result || [];
        const currentUser = members.find(member => member.memberEmail === userEmail);
        this.currentUserRole = currentUser?.type || 'COMMON';
      } catch (error) {
        console.error('사용자 역할 확인 실패:', error);
        this.currentUserRole = 'COMMON';
      }
    },

    async fetchPostList() {
      try {
        this.isLoading = true;
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) {
          console.warn('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          return;
        }

        let url = `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/list?page=${this.currentPage - 1}&size=${this.pageSize}`;
        url += `&category=${encodeURIComponent(this.category)}`;

        if (this.searchQuery) {
          url += `&keyword=${encodeURIComponent(this.searchQuery)}`;
        }

        const response = await axios.get(url);

        // 백엔드 응답 구조: { result: { content: [...], totalPages: ..., totalElements: ... } }
        this.postList = response.data.result?.content || [];
        this.totalPages = response.data.result?.totalPages || 0;
        this.totalElements = response.data.result?.totalElements || 0;
      } catch (error) {
        console.error('게시글 목록 조회 실패:', error);
        this.postList = [];
      } finally {
        this.isLoading = false;
      }
    },

    openCreateModal() {
      this.isModalOpen = true;
    },

    async handleSave(postData) {
      try {
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) {
          console.warn('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          return;
        }

        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/create`, postData);

        await this.fetchPostList();
        this.isModalOpen = false;
        this.showSnackbar('게시글이 등록되었습니다.', 'success');
      } catch (error) {
        console.error('게시글 등록 실패:', error);
        this.showSnackbar('게시글 등록에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    viewPost(post) {
      this.$router.push(`/fridge/post/${post.id}`);
    },

    onSearchInput() {
      this.resetPagination();
      this.fetchPostList();
    },

    onPageChange() {
      this.fetchPostList();
    },

    resetPagination() {
      this.currentPage = 1;
    },

    showSnackbar(message, color) {
      snackbar.show(message, color);
    },

    // 게시글 삭제 완료 메시지 확인 및 표시
    checkPostDeletedMessage() {
      const postDeleted = localStorage.getItem('postDeleted');
      if (postDeleted === 'true') {
        this.showSnackbar('게시글이 삭제되었습니다.', 'error');
        localStorage.removeItem('postDeleted'); // 메시지 표시 후 제거
      }
    }
  }
}
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--sf-line);
}

.search-field {
  flex: 1;
  min-width: 0;
}

.write-btn {
  flex-shrink: 0;
}

.post-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.post-item {
  border-bottom: 1px solid var(--sf-line);
}

.post-item.is-pinned {
  background: var(--sf-bg);
}

.post-link {
  display: grid;
  grid-template-columns: 40px minmax(0, 1fr) auto;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 20px;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.post-link:hover .post-title {
  text-decoration: underline;
  text-underline-offset: 3px;
}

.post-icon {
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--sf-bg);
  color: var(--sf-text-sub);
}

/* 공동구매 글만 주황으로 구분 */
.post-icon.is-groupbuy {
  background: #FFF0E6;
  color: #C2501A;
}

.post-icon.is-notice {
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
}

.post-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.post-title {
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pin-tag {
  display: inline-block;
  margin-right: 6px;
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--sf-mint-soft);
  font-size: var(--sf-fs-xs);
  font-weight: 700;
  color: var(--sf-primary);
  vertical-align: 2px;
}

.post-meta {
  display: flex;
  gap: 10px;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
  white-space: nowrap;
  overflow: hidden;
}

.post-views {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.list-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
}

.page-text {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
  white-space: nowrap;
}

.sf-state-box {
  padding: 64px 24px;
}

@media (max-width: 600px) {
  .search-bar {
    padding: 12px 16px;
  }

  .post-link {
    padding: 12px 16px;
    gap: 12px;
  }

  .list-foot {
    flex-direction: column;
  }
}
</style>
