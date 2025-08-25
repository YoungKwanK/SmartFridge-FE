<template>
  <div class="community-container">
    <!-- 헤더 섹션 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-info">
          <h1 class="page-title">커뮤니티</h1>
          <p class="page-subtitle">냉장고 멤버들과 소통하고 정보를 공유해보세요</p>
        </div>
        <div class="header-actions">
          <v-btn 
            @click="openCreateModal" 
            color="primary" 
            prepend-icon="mdi-plus"
            size="large"
            class="write-post-btn"
          >
            글쓰기
          </v-btn>
        </div>
      </div>
    </div>

    <!-- 메인 콘텐츠 -->
    <v-card class="main-content-card">
      <!-- 게시판 종류 탭 -->
      <v-card-title class="board-tabs-header">
        <v-tabs v-model="activeBoard" class="board-tabs" color="primary" density="compact" @change="onBoardChange">
          <v-tab 
            v-for="category in boardCategories" 
            :key="category" 
            :value="category" 
            class="board-tab"
          >
            {{ category }}
          </v-tab>
        </v-tabs>
      </v-card-title>

      <!-- 검색 및 필터 -->
      <v-card-text class="search-section">
        <div class="search-row">
          <div class="search-item">
            <v-text-field
              v-model="searchQuery"
              placeholder="제목, 내용, 작성자로 검색"
              variant="outlined"
              density="compact"
              class="search-field"
              prepend-inner-icon="mdi-magnify"
              @input="onSearchInput"
              hide-details
            ></v-text-field>
          </div>
          <div class="search-item">
            <v-select
              v-model="sortBy"
              :items="sortOptions"
              variant="outlined"
              density="compact"
              class="sort-select"
              @update:model-value="onSortChange"
              hide-details
            ></v-select>
          </div>
        </div>
      </v-card-text>
      
      <v-card-text>
        <!-- 로딩 상태 표시 -->
        <div v-if="isLoading" class="loading-container">
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
          ></v-progress-circular>
          <p class="loading-text">게시글을 불러오는 중...</p>
        </div>

        <!-- 게시글 목록 -->
        <div v-else-if="postList && postList.length > 0" class="post-list">
          <div v-for="post in postList" :key="post.id" class="post-item" @click="viewPost(post)">
            <div class="post-content">
              <div class="post-header">
                <h3 class="post-title">{{ post.title }}</h3>
                <div class="post-meta">
                  <span class="post-author">{{ post.authorName }}</span>
                  <span class="post-time">{{ formatTime(post.createdAt) }}</span>
                </div>
              </div>
              <div class="post-preview">
                {{ post.content.substring(0, 100) }}{{ post.content.length > 100 ? '...' : '' }}
              </div>
              <div class="post-stats">
                <div class="stat-item">
                  <v-icon size="16" color="red">mdi-heart</v-icon>
                  <span>{{ post.likeCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <v-icon size="16" color="blue">mdi-eye</v-icon>
                  <span>{{ post.viewCount || 0 }}</span>
                </div>
                <div class="stat-item">
                  <v-icon size="16" color="green">mdi-comment</v-icon>
                  <span>{{ post.commentCount || 0 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 데이터가 없을 때 표시 -->
        <div v-else class="no-data-container">
          <v-icon size="64" color="grey-lighten-1" class="mb-4">mdi-post-outline</v-icon>
          <h3 class="no-data-title">등록된 게시글이 없습니다</h3>
          <p class="no-data-subtitle">첫 번째 게시글을 작성해보세요</p>
          <v-btn 
            color="primary" 
            @click="openCreateModal"
            prepend-icon="mdi-plus"
            class="mt-4"
          >
            첫 게시글 작성하기
          </v-btn>
        </div>

        <!-- 페이징 컴포넌트 -->
        <div v-if="!isLoading && postList && postList.length > 0" class="pagination-container">
          <v-pagination
            v-model="currentPage"
            :length="totalPages"
            :total-visible="7"
            @update:model-value="onPageChange"
            color="primary"
            class="pagination-controls"
          ></v-pagination>
          
          <!-- 페이지 정보 표시 -->
          <div class="page-info">
            <span class="page-text">
              {{ (currentPage - 1) * pageSize + 1 }}-{{ Math.min(currentPage * pageSize, totalElements) }} / 총 {{ totalElements }}개
            </span>
          </div>
        </div>
      </v-card-text>
    </v-card>

    <!-- 게시글 작성 모달 -->
    <PostFormModal 
      v-model="isModalOpen" 
      :board-type="activeBoard"
      @save="handleSave"
    />
  </div>
</template>

<script>
import axios from 'axios';
import PostFormModal from '../components/Community/PostFormModal.vue';

export default {
  components: {
    PostFormModal
  },
  data() {
    return {
      activeBoard: '자유게시판', // 기본값: 자유게시판
      boardCategories: [], // API에서 가져올 카테고리 목록
      searchQuery: '',
      sortBy: 'latest',
      postList: [],
      isModalOpen: false,
      isLoading: false,
      currentPage: 1,
      pageSize: 10,
      totalPages: 0,
      totalElements: 0,
      sortOptions: [
        { title: '최신순', value: 'latest' },
        { title: '인기순', value: 'popular' },
        { title: '조회순', value: 'views' },
        { title: '좋아요순', value: 'likes' }
      ]
    }
  },
  async created() {
    await this.fetchCategories();
    await this.fetchPostList();
  },
  methods: {
    async fetchCategories() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/api/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        this.boardCategories = response.data;
        // 첫 번째 카테고리를 기본값으로 설정
        if (this.boardCategories.length > 0 && !this.boardCategories.includes(this.activeBoard)) {
          this.activeBoard = this.boardCategories[0];
        }
      } catch (error) {
        console.error("커뮤니티 카테고리 목록을 불러오는 데 실패했습니다.", error);
        // API 호출 실패 시 기본값으로 설정
        this.boardCategories = ['공지사항', '자유게시판', '꿀팁', '레시피'];
      }
    },
    async fetchPostList() {
      try {
        this.isLoading = true;
        const fridgeId = this.$route.params.fridgeId;
        if (!fridgeId) return;

        let url = `${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post?category=${encodeURIComponent(this.activeBoard)}&page=${this.currentPage - 1}&size=${this.pageSize}`;
        
        if (this.searchQuery) {
          url += `&search=${encodeURIComponent(this.searchQuery)}`;
        }
        
        if (this.sortBy !== 'latest') {
          url += `&sort=${this.sortBy}`;
        }

        const response = await axios.get(url);
        this.postList = response.data.content || [];
        this.totalPages = response.data.totalPages;
        this.totalElements = response.data.totalElements;

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
        const fridgeId = this.$route.params.fridgeId;
        if (!fridgeId) return;
        
        const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/fridge/${fridgeId}/post/create`, postData,
          
        );
        console.log('게시글 등록 성공:', response.data);
        
        await this.fetchPostList();
        this.isModalOpen = false;
        alert('게시글이 등록되었습니다.');
      } catch (error) {
        console.error('게시글 등록 실패:', error);
        alert('게시글 등록에 실패했습니다: ' + (error.response?.data?.message || error.message));
      }
    },
    
    viewPost(post) {
      this.$router.push(`/fridge/${this.$route.params.fridgeId}/community/post/${post.id}`);
    },
    
    formatTime(dateString) {
      if (!dateString) return '';
      
      const now = new Date();
      const postDate = new Date(dateString);
      const diffMs = now - postDate;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffMins < 1) return '방금 전';
      if (diffMins < 60) return `${diffMins}분 전`;
      if (diffHours < 24) return `${diffHours}시간 전`;
      if (diffDays < 7) return `${diffDays}일 전`;
      
      return postDate.toLocaleDateString('ko-KR');
    },
    
    onBoardChange() {
      this.resetPagination();
      this.fetchPostList();
    },
    
    onSearchInput() {
      this.resetPagination();
      this.fetchPostList();
    },
    
    onSortChange() {
      this.resetPagination();
      this.fetchPostList();
    },
    
    onPageChange() {
      this.fetchPostList();
    },
    
    resetPagination() {
      this.currentPage = 1;
    }
  }
}
</script>

<style scoped>
.community-container {
  padding: 24px;
  background: #f5f5f5;
  min-height: 100vh;
  position: relative;
}

.page-header {
  background: white;
  padding: 20px 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-info {
  flex: 1;
}

.page-title {
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
}

.write-post-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.main-content-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.board-tabs-header {
  padding: 20px 24px 0;
  background: white;
  border-bottom: none;
  margin-bottom: 0;
}

.board-tabs {
  background: transparent;
  border-radius: 0;
  overflow: visible;
  box-shadow: none;
}

.board-tab {
  font-weight: 500;
  color: #666;
  text-transform: none;
  font-size: 14px;
  padding: 12px 16px;
  border-radius: 0;
  margin: 0;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.board-tab:hover {
  background-color: transparent;
  color: #333;
}

.board-tab.v-tab--active {
  background-color: transparent;
  color: #1976d2;
  font-weight: 600;
  border-bottom: 2px solid #1976d2;
}

.search-section {
  padding: 20px 24px 0;
}

.search-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.search-item {
  flex: 1;
}

.search-field, .sort-select {
  width: 100%;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.post-item {
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.post-item:hover {
  border-color: #1976d2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.1);
}

.post-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.post-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0;
  flex: 1;
  margin-right: 16px;
}

.post-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.post-author {
  font-size: 14px;
  color: #666;
  font-weight: 500;
}

.post-time {
  font-size: 12px;
  color: #999;
}

.post-preview {
  font-size: 14px;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16px;
}

.post-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.no-data-container {
  text-align: center;
  padding: 60px 20px;
  color: #888;
}

.no-data-title {
  margin-top: 16px;
  margin-bottom: 8px;
  font-size: 20px;
  font-weight: 600;
}

.no-data-subtitle {
  margin-bottom: 24px;
  font-size: 16px;
  color: #666;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #888;
}

.loading-text {
  margin-top: 16px;
  font-size: 18px;
  font-weight: 500;
}

.pagination-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  padding: 16px 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
}

.pagination-controls {
  margin: 0;
}

.page-info {
  position: absolute;
  right: 24px;
  font-size: 14px;
  color: #666;
}

.page-text {
  font-weight: 500;
}

@media (max-width: 600px) {
  .community-container {
    padding: 16px;
  }
  
  .header-content {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }

  .search-row {
    flex-direction: column;
    gap: 16px;
  }

  .post-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }

  .post-meta {
    align-items: flex-start;
  }

  .pagination-container {
    flex-direction: column;
    gap: 16px;
    align-items: center;
    text-align: center;
    padding: 20px 16px;
  }

  .page-info {
    position: static;
    right: auto;
    margin-top: 8px;
  }
}
</style>