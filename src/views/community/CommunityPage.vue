<template>
  <PageLayout title="커뮤니티" :description="boardDescription" width="narrow">
    <template #actions>
      <v-btn
        v-if="canWrite"
        :color="isGroupBuyBoard ? 'cta' : 'primary'"
        variant="flat"
        prepend-icon="mdi-plus"
        @click="openCreateModal"
      >
        {{ isGroupBuyBoard ? '공동구매 모집하기' : '글쓰기' }}
      </v-btn>
    </template>

    <!-- 게시판 고르기 -->
    <div class="sf-tabs" role="tablist" aria-label="게시판">
      <button
        v-for="board in boardOptions"
        :key="board.value"
        type="button"
        role="tab"
        class="sf-tab"
        :class="{ 'is-on': activeBoard === board.value }"
        :aria-selected="activeBoard === board.value"
        @click="activeBoard !== board.value && selectBoard(board.value)"
      >
        {{ board.label }}
      </button>
    </div>

    <section class="sf-list-panel" aria-label="게시글 목록">
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
            <span class="post-icon" :class="iconClass(post)" aria-hidden="true">
              <v-icon size="20">{{ iconOf(post) }}</v-icon>
            </span>
            <span class="post-body">
              <span class="post-title">
                <span v-if="post.pinned" class="pin-tag">고정</span>
                {{ post.title }}
              </span>
              <span class="post-meta">
                <span v-if="activeBoard === '전체'" class="post-board">{{ post.categoryName }}</span>
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
          {{ isGroupBuyBoard ? '공동구매 모집하기' : '글쓰기' }}
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
    </section>

    <!-- 게시글 작성 모달 -->
    <PostFormModal v-model="isModalOpen" :board-type="activeBoard" @save="handleSave" />

  </PageLayout>
</template>

<script>
import PageLayout from '@/components/layout/PageLayout.vue';
import axios from 'axios';
import { getFridgeId } from '@/utils/commonDataHandler';
import PostFormModal from '@/components/community/PostFormModal.vue';
import { useStore } from 'vuex';
import { fetchPostCategories, NOTICE_CATEGORY, PURCHASE_CATEGORY } from '@/utils/postCategory';
import { snackbar } from '@/composables/snackbar';

export default {
  components: {
    PageLayout,
    PostFormModal,
  },
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      activeBoard: '전체', // 기본값: 전체
      boardCategories: [], // API에서 가져올 카테고리 목록
      searchQuery: '',
      postList: [],
      isModalOpen: false,
      isLoading: false,
      currentPage: 1,
      pageSize: 10,
      totalPages: 0,
      totalElements: 0,
      currentUserRole: 'COMMON', // 현재 사용자의 냉장고 역할
      fridgeInfo: null // 현재 냉장고 정보
    }
  },
  watch: {
    // 커뮤니티 화면에 있는 상태에서 하단 탭으로 게시판을 바꾼 경우
    '$route.query.board'(board) {
      this.onBoardChange(board || '전체');
    }
  },
  computed: {
    // 현재 사용자가 관리자인지 확인
    isManager() {
      return this.currentUserRole === 'MANAGER';
    },
    // 공지사항 탭인지 확인
    isNoticeTab() {
      return this.activeBoard === NOTICE_CATEGORY;
    },
    isGroupBuyBoard() {
      return this.activeBoard === PURCHASE_CATEGORY;
    },
    // 공지사항은 관리자만 쓸 수 있다
    canWrite() {
      return !(this.isNoticeTab && !this.isManager);
    },
    boardOptions() {
      return [
        { label: '전체', value: '전체' },
        ...this.boardCategories.map(category => ({ label: category, value: category }))
      ];
    },
    boardDescription() {
      if (this.isGroupBuyBoard) return '같이 사면 더 싼 식재료를 멤버와 나눠 사요. 글을 올리면 참여자 채팅방이 함께 열려요.';
      if (this.isNoticeTab) return '냉장고 관리자가 올린 안내예요.';
      return '냉장고 멤버들과 이야기를 나눠요.';
    },
    emptyTitle() {
      if (this.searchQuery) return `'${this.searchQuery}'에 맞는 글이 없어요`;
      if (this.isGroupBuyBoard) return '모집 중인 공동구매가 없어요';
      if (this.isNoticeTab) return '공지사항이 없어요';
      return '아직 올라온 글이 없어요';
    },
    emptyHint() {
      if (this.searchQuery) return '다른 단어로 찾아 보세요.';
      if (this.isGroupBuyBoard) return '함께 살 식재료가 있다면 먼저 모집해 보세요.';
      if (this.isNoticeTab) return this.isManager ? '멤버에게 알릴 내용을 올려 보세요.' : '관리자가 공지를 올리면 여기에 보여요.';
      return '첫 글을 남겨 보세요.';
    }
  },
  async created() {
    console.log('=== CommunityPage created 시작 ===');
    console.log('현재 activeBoard:', this.activeBoard);
    console.log('현재 boardCategories:', this.boardCategories);
    
    await this.checkUserRole();
    await this.fetchCategories();
    console.log('카테고리 로드 완료 후 activeBoard:', this.activeBoard);
    console.log('카테고리 로드 완료 후 boardCategories:', this.boardCategories);
    
    await this.fetchPostList();
    console.log('게시글 목록 로드 완료');
    
    // 게시글 삭제 완료 메시지 확인 및 표시
    this.checkPostDeletedMessage();
  },
  methods: {
    // 현재 사용자의 냉장고 역할 확인
    async checkUserRole() {
      try {
        // 현재 냉장고 ID 가져오기
        const currentFridgeId = this.store.state.currentFridgeId;
        if (!currentFridgeId) {
          console.warn('현재 냉장고 ID가 없습니다.');
          this.currentUserRole = 'COMMON';
          return;
        }

        // 현재 사용자 이메일 가져오기
        const userEmail = this.store.getters.getUserEmail || localStorage.getItem('email');
        if (!userEmail) {
          console.warn('사용자 이메일이 없습니다.');
          this.currentUserRole = 'COMMON';
          return;
        }

        // 냉장고 멤버 목록에서 현재 사용자의 역할 확인
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${currentFridgeId}/members`,
          {
            headers: { 
              'Authorization': `Bearer ${localStorage.getItem('accessToken')}` 
            }
          }
        );

        if (response.data && response.data.result) {
          const members = response.data.result;
          const currentUser = members.find(member => member.memberEmail === userEmail);
          
          if (currentUser) {
            this.currentUserRole = currentUser.type || 'COMMON';
            console.log('현재 사용자 냉장고 역할:', this.currentUserRole);
          } else {
            console.warn('현재 사용자를 냉장고 멤버 목록에서 찾을 수 없습니다.');
            this.currentUserRole = 'COMMON';
          }
        } else {
          console.warn('냉장고 멤버 목록을 가져올 수 없습니다.');
          this.currentUserRole = 'COMMON';
        }
      } catch (error) {
        console.error('사용자 역할 확인 실패:', error);
        this.currentUserRole = 'COMMON';
      }
    },

    // 카테고리 이름 목록 가져오기 (작성 모달과 같은 결과를 공유해서 요청은 한 번만 나감)
    async fetchCategories() {
      this.boardCategories = await fetchPostCategories();
      // 하단 탭 '공동구매'처럼 ?board=공동구매 로 들어오면 그 게시판을 연다.
      // 카테고리를 받기 전에는 v-tabs가 첫 탭(전체)을 강제로 고르므로, 받은 뒤에 적용한다.
      const board = this.$route.query.board;
      if (board && this.boardCategories.includes(board)) {
        this.activeBoard = board;
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

        // 전체가 아닐 때만 카테고리 파라미터 추가
        if (this.activeBoard !== '전체') {
          url += `&category=${encodeURIComponent(this.activeBoard)}`;
          console.log('카테고리 필터 적용:', this.activeBoard);
          console.log('필터링된 URL:', url);
        }

        if (this.searchQuery) {
          url += `&keyword=${encodeURIComponent(this.searchQuery)}`;
        }

        console.log('최종 요청 URL:', url);
        const response = await axios.get(url);
        console.log('게시글 목록 조회 응답:', response.data);

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

        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/create`, postData);

        console.log('게시글 등록 성공:', response.data);

        await this.fetchPostList();
        this.isModalOpen = false;
        this.showSnackbar('게시글이 등록되었습니다.', 'success');
      } catch (error) {
        console.error('게시글 등록 실패:', error);
        this.showSnackbar('게시글 등록에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    viewPost(post) {
      console.log('=== viewPost 메서드 호출 ===');
      console.log('클릭된 게시글:', post);
      const fridgeId = getFridgeId(this.$store);
      console.log('현재 fridgeId:', fridgeId);
      console.log('게시글 ID:', post.id);
      
      if (!fridgeId) {
        console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
        alert('냉장고 정보를 찾을 수 없습니다.');
        return;
      }
      
      const targetUrl = `/fridge/post/${post.id}`;
      console.log('이동할 URL:', targetUrl);
      
      try {
        this.$router.push(targetUrl);
        console.log('라우터 이동 성공');
      } catch (error) {
        console.error('라우터 이동 실패:', error);
      }
    },



    iconOf(post) {
      if (post.categoryName === PURCHASE_CATEGORY) return 'mdi-cart-outline';
      if (post.categoryName === NOTICE_CATEGORY) return 'mdi-bullhorn-outline';
      return 'mdi-message-text-outline';
    },
    iconClass(post) {
      return {
        'is-groupbuy': post.categoryName === PURCHASE_CATEGORY,
        'is-notice': post.categoryName === NOTICE_CATEGORY
      };
    },
    // 게시판 탭을 누르면 주소(?board=)를 바꾼다. 실제 전환은 $route.query.board watch가 한다.
    // 주소와 게시판이 늘 같아야 사이드바·하단 탭의 '공동구매'와 '커뮤니티' 선택 표시가 맞는다.
    selectBoard(board) {
      const query = { ...this.$route.query };
      if (board === '전체') delete query.board;
      else query.board = board;
      this.$router.replace({ query });
    },
    onBoardChange(newValue) {
      console.log('=== 카테고리 변경 이벤트 발생 ===');
      console.log('이전 값:', this.activeBoard);
      console.log('새로운 값:', newValue);
      console.log('현재 activeBoard:', this.activeBoard);
      console.log('사용 가능한 카테고리들:', this.boardCategories);
      
      // 값이 실제로 변경되었는지 확인
      if (newValue !== this.activeBoard) {
        console.log('값이 변경되었습니다. activeBoard를 업데이트합니다.');
        this.activeBoard = newValue;
      }
      
      this.resetPagination();
      this.fetchPostList();
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
  padding: 16px 20px;
  border-bottom: 1px solid var(--sf-line);
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

.post-board {
  font-weight: 600;
  color: var(--sf-text-sub);
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
