<template>
  <PageLayout width="narrow">
    <template #head>
      <nav class="post-nav">
        <v-btn variant="text" prepend-icon="mdi-arrow-left" @click="goBack">목록으로</v-btn>
        <div v-if="postDetail && (isAuthor || canPin)" class="nav-actions">
          <v-btn
            v-if="canPin"
            variant="text"
            :prepend-icon="postDetail.pinned ? 'mdi-pin-off-outline' : 'mdi-pin-outline'"
            :loading="isPinning"
            @click="togglePin"
          >
            {{ postDetail.pinned ? '고정 풀기' : '맨 위에 고정' }}
          </v-btn>
          <v-menu v-if="isAuthor" location="bottom end">
            <template #activator="{ props }">
              <v-btn v-bind="props" icon="mdi-dots-vertical" variant="text" aria-label="글 관리" />
            </template>
            <v-list density="compact" min-width="160">
              <v-list-item prepend-icon="mdi-pencil-outline" title="글 수정" @click="openEditModal" />
              <v-list-item prepend-icon="mdi-trash-can-outline" title="글 삭제" base-color="error" @click="openDeleteDialog" />
            </v-list>
          </v-menu>
        </div>
      </nav>
    </template>

    <article v-if="postDetail" class="post panel">
      <header class="post-head">
        <p class="post-board">
          <span>{{ postDetail.categoryName }}</span>
          <span v-if="postDetail.pinned" class="pin-tag">고정</span>
        </p>
        <h1 class="post-title">{{ postDetail.title }}</h1>
        <div class="post-meta">
          <span class="post-author">{{ postDetail.writer }}</span>
          <span class="sf-num">{{ formatDate(postDetail.createdDate) }}</span>
          <span class="sf-num">조회 {{ postDetail.viewCount }}</span>
        </div>
      </header>

      <!-- 공동구매 모집 -->
      <section v-if="purchase" class="purchase" aria-label="공동구매 모집 현황">
        <div class="purchase-info">
          <p class="purchase-state" :class="{ 'is-open': purchaseStatus.canJoin }">{{ purchaseStatus.label }}</p>
          <p class="purchase-count sf-num">
            <strong>{{ purchase.currentParticipants }}</strong> / {{ purchase.maxParticipants }}명 참여
          </p>
          <div
            class="purchase-bar"
            role="progressbar"
            :aria-valuenow="purchase.currentParticipants"
            aria-valuemin="0"
            :aria-valuemax="purchase.maxParticipants"
            :aria-label="`모집 인원 ${purchase.maxParticipants}명 중 ${purchase.currentParticipants}명`"
          >
            <span :style="{ width: `${Math.min(100, (purchase.currentParticipants / Math.max(1, purchase.maxParticipants)) * 100)}%` }" />
          </div>
          <a v-if="purchase.productUrl" :href="purchase.productUrl" target="_blank" rel="noopener noreferrer" class="purchase-link">
            <v-icon size="16" aria-hidden="true">mdi-open-in-new</v-icon>
            상품 페이지 열기
          </a>
        </div>
        <v-btn
          v-if="purchase.isJoined"
          color="primary"
          variant="flat"
          size="large"
          prepend-icon="mdi-chat-outline"
          @click="goToChatRoom"
        >
          채팅방으로 가기
        </v-btn>
        <v-btn
          v-else
          color="cta"
          variant="flat"
          size="large"
          :disabled="!purchaseStatus.canJoin"
          :loading="isJoining"
          @click="joinPurchase"
        >
          {{ purchaseStatus.canJoin ? '공동구매 참여하기' : '참여할 수 없어요' }}
        </v-btn>
      </section>

      <div class="post-body" v-html="processedContent" />

      <footer class="post-foot">
        <button
          type="button"
          class="like-btn"
          :class="{ 'is-liked': postDetail.isLiked }"
          :aria-pressed="!!postDetail.isLiked"
          @click="toggleLike"
        >
          <v-icon size="20" aria-hidden="true">{{ postDetail.isLiked ? 'mdi-heart' : 'mdi-heart-outline' }}</v-icon>
          좋아요 <span class="sf-num">{{ postDetail.likeCount }}</span>
        </button>
      </footer>
    </article>

    <!-- 댓글 -->
    <section id="comments-section" class="comments panel" aria-labelledby="comments-title">
      <h2 id="comments-title" class="comments-title">
        댓글 <span class="sf-num">{{ postDetail?.commentCount || 0 }}</span>
      </h2>

      <div v-if="isLoadingComments" class="state-box">
        <v-progress-circular indeterminate color="primary" size="28" />
      </div>

      <ul v-else-if="comments && comments.length > 0" class="comment-list">
        <li v-for="comment in comments" :id="`comment-${comment.id}`" :key="comment.id" class="comment">
          <span class="comment-avatar" aria-hidden="true">{{ (comment.writer || '?').charAt(0) }}</span>
          <div class="comment-main">
            <div class="comment-head">
              <span class="comment-author">{{ comment.writer }}</span>
              <span class="comment-date sf-num">{{ formatDate(comment.createdDate) }}</span>
              <span v-if="isCommentAuthor(comment) && editingCommentId !== comment.id" class="comment-tools">
                <button type="button" class="text-btn" @click="startEditComment(comment)">수정</button>
                <button type="button" class="text-btn is-danger" @click="deleteComment(comment.id)">삭제</button>
              </span>
            </div>

            <p v-if="editingCommentId !== comment.id" class="comment-body">{{ comment.content }}</p>
            <div v-else class="comment-edit">
              <v-textarea
                v-model="editingCommentContent"
                variant="outlined"
                rows="2"
                auto-grow
                hide-details
                aria-label="댓글 수정"
              />
              <div class="comment-edit-actions">
                <v-btn size="small" variant="text" @click="cancelEditComment">취소</v-btn>
                <v-btn size="small" color="primary" variant="flat" @click="updateComment(comment.id)">저장</v-btn>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <p v-else class="empty-text">아직 댓글이 없어요. 첫 댓글을 남겨 보세요.</p>

      <div v-if="commentTotalPages > 1" class="comment-paging">
        <v-btn size="small" variant="text" :disabled="commentPage === 1" @click="refreshComments">처음으로</v-btn>
        <span class="sf-num">{{ commentPage }} / {{ commentTotalPages }}</span>
        <v-btn size="small" variant="text" :disabled="commentPage >= commentTotalPages" @click="loadMoreComments">댓글 더 보기</v-btn>
      </div>

      <div class="composer">
        <v-textarea
          v-model="newComment"
          placeholder="댓글을 입력하세요"
          variant="outlined"
          rows="2"
          auto-grow
          max-rows="6"
          hide-details
          aria-label="댓글 입력"
        />
        <v-btn color="primary" variant="flat" :disabled="!newComment.trim()" @click="submitComment">댓글 남기기</v-btn>
      </div>
    </section>

    <PostFormModal
      v-model="showEditModal"
      :editing-post="editingPost"
      :board-type="postDetail?.categoryName || '자유게시판'"
      @save="handlePostUpdate"
    />

    <DeleteConfirmDialog
      v-model="showDeleteDialog"
      title="글을 삭제할까요?"
      :message="deleteMessage"
      @confirm="deletePost"
      @cancel="showDeleteDialog = false"
    />


    <div v-if="isLoading" class="loading-overlay">
      <v-progress-circular indeterminate color="primary" size="40" />
      <p>글을 불러오는 중이에요</p>
    </div>
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/layout/PageLayout.vue';
import axios from 'axios';
import { mapGetters } from 'vuex';
import PostFormModal from '@/components/community/PostFormModal.vue';
import DeleteConfirmDialog from '@/components/common/DeleteConfirmDialog.vue';
import { getErrorMessage, getFridgeId } from '@/utils/commonDataHandler';
import { NOTICE_CATEGORY } from '@/utils/postCategory';
import { snackbar } from '@/composables/snackbar';

export default {
  name: 'PostDetailPage',
  components: {
    PageLayout,
    PostFormModal,
    DeleteConfirmDialog
  },
  data() {
    return {
      postDetail: null,
      comments: [],
      newComment: '',
      isLoading: false,
      isLoadingComments: false,
      // 댓글 페이징 관련
      commentPage: 1,
      commentPageSize: 10,
      commentTotalPages: 0,
      commentTotalElements: 0,
      // 댓글 수정 관련
      editingCommentId: null,
      editingCommentContent: '',
      // 게시글 수정 관련
      showEditModal: false,
      showDeleteDialog: false,
      editingPost: {},
      // 상단 고정 관련
      memberType: 'COMMON', // 현재 냉장고에서의 내 역할 (MANAGER / COMMON)
      isPinning: false,
      // 공동구매 참여 중
      isJoining: false
    }
  },
  computed: {
    ...mapGetters(['getUserInfo', 'isLoggedIn']),
    
    // 마크다운 이미지를 HTML로 변환한 콘텐츠
    processedContent() {
      if (!this.postDetail?.content) return '';
      
      // 마크다운 이미지 형식 ![alt](url)을 HTML img 태그로 변환
      return this.postDetail.content.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 16px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: block;">'
      );
    },
    
    // 게시글 작성자 여부 확인
    isAuthor() {
      if (!this.postDetail || !this.userInfo) return false;
      return this.postDetail.writer === this.userInfo.name || 
             this.postDetail.writer === this.userInfo.email;
    },
    
    // 사용자 정보
    userInfo() {
      return this.getUserInfo;
    },

    // 상단 고정은 냉장고 관리자가 공지사항에만 할 수 있음
    canPin() {
      return this.memberType === 'MANAGER' && this.postDetail?.categoryName === NOTICE_CATEGORY;
    },

    // 공동구매 모집 정보 (공동구매 글이 아니거나 채팅방이 없으면 null)
    purchase() {
      return this.postDetail?.purchase || null;
    },

    // 모집 상태 표시와 참여 가능 여부
    purchaseStatus() {
      const p = this.purchase;
      if (!p) return { label: '', color: 'grey', canJoin: false };
      if (p.joinStatus !== 'OPEN' || !p.isActive) return { label: '모집 완료', color: 'grey', canJoin: false };
      if (p.currentParticipants >= p.maxParticipants) return { label: '정원 마감', color: 'error', canJoin: false };
      return { label: '모집 중', color: 'success', canJoin: true };
    },

    // 공동구매 글은 지워도 채팅방이 남는다는 점을 알려 준다
    deleteMessage() {
      const message = `'${this.postDetail?.title || ''}' 게시글을 정말 삭제하시겠습니까?`;
      return this.purchase ? `${message} 공동구매 채팅방은 삭제되지 않습니다.` : message;
    }
  },
  
  async created() {
    // 사용자 정보가 없으면 가져오기
    if (!this.isLoggedIn) {
      try {
        await this.$store.dispatch('fetchUserInfo');
      } catch (error) {
        console.error('사용자 정보 조회 실패:', error);
      }
    }
    
    await this.fetchPostDetail();
    await this.fetchComments();
    await this.fetchMemberType();
  },
  methods: {
    // 현재 냉장고에서의 내 역할 조회 (상단 고정 버튼 표시용)
    async fetchMemberType() {
      try {
        const fridgeId = getFridgeId(this.$store);
        if (!fridgeId) return;
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/member/type`,
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }
        );
        this.memberType = response.data.result || 'COMMON';
      } catch (error) {
        console.error('냉장고 역할 조회 실패:', error);
        this.memberType = 'COMMON';
      }
    },

    // 상단 고정 / 해제 전환
    async togglePin() {
      try {
        this.isPinning = true;
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        const response = await axios.patch(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/pin`,
          {},
          { headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` } }
        );
        this.postDetail.pinned = response.data.result;
        this.showSnackbar(response.data.status_message, 'success');
      } catch (error) {
        console.error('게시글 고정 실패:', error);
        this.showSnackbar(error.response?.data?.status_message || error.response?.data?.message || '게시글 고정에 실패했습니다.', 'error');
      } finally {
        this.isPinning = false;
      }
    },

    getFridgeId() {
      return this.$store?.getters?.getCurrentFridgeId || localStorage.getItem('currentFridgeId');
    },
    async fetchPostDetail() {
      try {
        this.isLoading = true;
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          alert('냉장고 정보를 찾을 수 없습니다.');
          return;
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/${postId}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        this.postDetail = response.data.result;
        
      } catch (error) {
        console.error('게시글 상세 정보 조회 실패:', error);
        alert('게시글을 불러오는데 실패했습니다.');
      } finally {
        this.isLoading = false;
      }
    },

    async fetchComments() {
      try {
        this.isLoadingComments = true;
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          return;
        }
        
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/comment/list?page=${this.commentPage - 1}&size=${this.commentPageSize}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        this.comments = response.data.result.content || [];
        this.commentTotalPages = response.data.result.totalPages;
        this.commentTotalElements = response.data.result.totalElements;
        
        // 댓글 로드 후 스크롤 처리
        this.$nextTick(() => {
          const qCommentId = this.$route.query?.commentId;
          const qScrollTo = this.$route.query?.scrollTo;
          if (qCommentId) {
            const el = document.getElementById(`comment-${qCommentId}`);
            if (el) {
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              el.style.transition = 'background-color 0.8s ease';
              const originalBg = el.style.backgroundColor;
              el.style.backgroundColor = '#fff8e1';
              setTimeout(() => { el.style.backgroundColor = originalBg || ''; }, 1200);
            }
          } else if (qScrollTo === 'comments') {
            const section = document.getElementById('comments-section');
            if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
        
      } catch (error) {
        console.error('댓글 목록 조회 실패:', error);
        this.comments = [];
      } finally {
        this.isLoadingComments = false;
      }
    },

    async submitComment() {
      if (!this.newComment.trim()) return;
      
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        const commentData = {
          content: this.newComment.trim()
        };
        
        await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/comment/create`,
          commentData,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 댓글 작성 성공 후 댓글 목록 새로고침
        this.newComment = '';
        this.commentPage = 1; // 첫 페이지로 리셋
        await this.fetchComments();
        
        // 게시글 정보도 새로고침 (댓글 수 업데이트)
        await this.fetchPostDetail();
        
        this.showSnackbar('댓글이 작성되었습니다.', 'success');
        
      } catch (error) {
        console.error('댓글 작성 실패:', error);
        this.showSnackbar('댓글 작성에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    async updateComment(commentId) {
      if (!this.editingCommentContent.trim()) return;
      
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        const updateData = {
          content: this.editingCommentContent.trim()
        };
        
        await axios.patch(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/comment/update/${commentId}`,
          updateData,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 수정 모드 종료
        this.editingCommentId = null;
        this.editingCommentContent = '';
        
        // 댓글 목록 새로고침
        await this.fetchComments();
        
        this.showSnackbar('댓글이 수정되었습니다.', 'success');
        
      } catch (error) {
        console.error('댓글 수정 실패:', error);
        this.showSnackbar('댓글 수정에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    async deleteComment(commentId) {
      if (!confirm('댓글을 삭제하시겠습니까?')) return;
      
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/comment/delete/${commentId}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 댓글 목록 새로고침
        await this.fetchComments();
        
        // 게시글 정보도 새로고침 (댓글 수 업데이트)
        await this.fetchPostDetail();
        
        this.showSnackbar('댓글이 삭제되었습니다.', 'error');
        
      } catch (error) {
        console.error('댓글 삭제 실패:', error);
        this.showSnackbar('댓글 삭제에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },

    startEditComment(comment) {
      this.editingCommentId = comment.id;
      this.editingCommentContent = comment.content;
    },

    cancelEditComment() {
      this.editingCommentId = null;
      this.editingCommentContent = '';
    },

    async loadMoreComments() {
      if (this.commentPage < this.commentTotalPages) {
        this.commentPage++;
        await this.fetchComments();
      }
    },

    async refreshComments() {
      this.commentPage = 1;
      await this.fetchComments();
    },

    async toggleLike() {
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          alert('냉장고 정보를 찾을 수 없습니다.');
          return;
        }
        
        if (this.postDetail.isLiked) {
          // 좋아요 취소
          await axios.delete(
            `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/like`,
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            }
          );
        } else {
          // 좋아요 추가
          await axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/like`,
            {},
            {
              headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
            }
          );
        }
        
        // 좋아요 상태 업데이트
        this.postDetail.isLiked = !this.postDetail.isLiked;
        this.postDetail.likeCount += this.postDetail.isLiked ? 1 : -1;
        
      } catch (error) {
        console.error('좋아요 토글 실패:', error);
        alert('좋아요 처리에 실패했습니다.');
      }
    },

    formatDate(dateString) {
      if (!dateString) return '';
      
      const date = new Date(dateString);
      
      // YYYY-MM-DD HH:MM 형식으로 반환
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}`;
    },

    goBack() {
      this.$router.go(-1);
    },

    // 게시글 수정 모달 열기
    openEditModal() {
      this.editingPost = {
        id: this.postDetail.id,
        title: this.postDetail.title,
        content: this.postDetail.content,
        category: this.postDetail.categoryName
      };
      this.showEditModal = true;
    },
    
    // 게시글 수정 처리
    async handlePostUpdate(updatedPost) {
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        await axios.put(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/${postId}/update`,
          updatedPost,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 게시글 정보 새로고침
        await this.fetchPostDetail();
        
        // 수정 모달 닫기
        this.showEditModal = false;
        
        this.showSnackbar('게시글이 수정되었습니다.', 'success');
        
      } catch (error) {
        console.error('게시글 수정 실패:', error);
        this.showSnackbar('게시글 수정에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },
    
    // 게시글 삭제 확인 다이얼로그 열기
    openDeleteDialog() {
      console.log('openDeleteDialog 호출됨');
      console.log('현재 showDeleteDialog:', this.showDeleteDialog);
      this.showDeleteDialog = true;
      console.log('변경 후 showDeleteDialog:', this.showDeleteDialog);
    },
    
    // 공동구매 채팅방 참여 후 채팅방으로 이동
    async joinPurchase() {
      if (!this.purchase) return;
      this.isJoining = true;
      try {
        await axios.post(`${import.meta.env.VITE_API_BASE_URL}/purchase/chat/${this.purchase.roomId}/join`);
        this.goToChatRoom();
      } catch (error) {
        console.error('공동구매 참여 실패:', error);
        this.showSnackbar(getErrorMessage(error), 'error');
        // 정원·모집 상태가 바뀌었을 수 있으니 다시 불러온다
        await this.fetchPostDetail();
      } finally {
        this.isJoining = false;
      }
    },

    goToChatRoom() {
      this.$router.push({ path: '/chatpage', query: { roomId: this.purchase.roomId } });
    },

    // 게시글 삭제
    async deletePost() {
      try {
        const fridgeId = getFridgeId(this.$store);
        const postId = this.$route.params.postId;
        
        if (!fridgeId) {
          console.error('Vuex store에서 냉장고 ID를 찾을 수 없습니다.');
          this.showSnackbar('냉장고 정보를 찾을 수 없습니다.', 'error');
          return;
        }
        
        await axios.delete(
          `${import.meta.env.VITE_API_BASE_URL}/fridge/${fridgeId}/post/delete/${postId}`,
          {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
          }
        );
        
        // 삭제 완료 상태를 localStorage에 저장하고 게시글 목록 페이지로 이동
        localStorage.setItem('postDeleted', 'true');
        this.$router.push('/fridge/community');
        
      } catch (error) {
        console.error('게시글 삭제 실패:', error);
        this.showSnackbar('게시글 삭제에 실패했습니다: ' + (error.response?.data?.message || error.message), 'error');
      }
    },
    
    // 댓글 작성자 여부 확인
    isCommentAuthor(comment) {
      if (!comment || !this.userInfo) return false;
      return comment.writer === this.userInfo.name || 
             comment.writer === this.userInfo.email;
    },

    showSnackbar(message, color) {
      snackbar.show(message, color);
    }
  }
}
</script>

<style scoped>
.post-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin: 0 0 12px -12px;
}

.nav-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.panel {
  border-radius: var(--sf-radius-lg);
  background: var(--sf-surface);
  box-shadow: var(--sf-shadow);
}

.post {
  padding: 28px 32px 20px;
}

.post-board {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px;
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-primary);
}

.pin-tag {
  padding: 1px 6px;
  border-radius: 6px;
  background: var(--sf-bg);
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-sub);
}

.post-title {
  margin: 0;
  font-size: var(--sf-fs-2xl);
  font-weight: 800;
  line-height: 1.35;
  letter-spacing: -0.02em;
  color: var(--sf-text);
  word-break: keep-all;
}

.post-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  margin-top: 12px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--sf-line);
  font-size: var(--sf-fs-md);
  color: var(--sf-text-faint);
}

.post-author {
  font-weight: 600;
  color: var(--sf-text-sub);
}

/* 공동구매 */
.purchase {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-top: 20px;
  padding: 18px 20px;
  border: 1px solid #FFD9C2;
  border-radius: var(--sf-radius-md);
  background: #FFF7F2;
}

.purchase-info {
  flex: 1;
  min-width: 0;
}

.purchase-state {
  margin: 0;
  font-size: var(--sf-fs-sm);
  font-weight: 700;
  color: var(--sf-text-sub);
}

.purchase-state.is-open {
  color: #B4461A;
}

.purchase-count {
  margin: 2px 0 8px;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.purchase-count strong {
  font-size: var(--sf-fs-2xl);
  font-weight: 800;
  color: var(--sf-text);
}

.purchase-bar {
  height: 6px;
  max-width: 280px;
  border-radius: 999px;
  background: #FBE3D5;
  overflow: hidden;
}

.purchase-bar span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--sf-cta);
}

.purchase-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  margin-top: 10px;
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-primary);
  text-decoration: none;
}

.purchase-link:hover {
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* 본문 */
.post-body {
  max-width: 68ch;
  padding: 24px 0;
  font-size: var(--sf-fs-md);
  line-height: 1.8;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--sf-text);
}

.post-body :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 16px 0;
  border-radius: 12px;
  box-shadow: none !important;
}

.post-foot {
  display: flex;
  padding-top: 16px;
  border-top: 1px solid var(--sf-line);
}

.like-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 16px;
  border: 1px solid var(--sf-line-strong);
  border-radius: 999px;
  background: var(--sf-surface);
  font: inherit;
  font-size: var(--sf-fs-md);
  font-weight: 600;
  color: var(--sf-text-sub);
  cursor: pointer;
}

.like-btn:hover {
  border-color: var(--sf-text-faint);
}

.like-btn.is-liked {
  border-color: #F3C2C4;
  background: #FFF3F3;
  color: var(--sf-expired);
}

/* 댓글 */
.comments {
  padding: 24px 32px;
}

.comments-title {
  margin: 0 0 8px;
  font-size: var(--sf-fs-lg);
  font-weight: 700;
  color: var(--sf-text);
}

.comments-title span {
  color: var(--sf-text-faint);
}

.comment-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.comment {
  display: flex;
  gap: 12px;
  padding: 16px 0;
  border-bottom: 1px solid var(--sf-line);
}

.comment-avatar {
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--sf-mint-soft);
  font-size: 14px;
  font-weight: 700;
  color: var(--sf-primary);
}

.comment-main {
  flex: 1;
  min-width: 0;
}

.comment-head {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 4px 10px;
}

.comment-author {
  font-size: var(--sf-fs-md);
  font-weight: 700;
  color: var(--sf-text);
}

.comment-date {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.comment-tools {
  display: flex;
  gap: 8px;
  margin-left: auto;
}

.text-btn {
  padding: 0;
  border: none;
  background: none;
  font: inherit;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
  cursor: pointer;
}

.text-btn:hover {
  color: var(--sf-text);
  text-decoration: underline;
  text-underline-offset: 3px;
}

.text-btn.is-danger:hover {
  color: var(--sf-expired);
}

.comment-body {
  margin: 4px 0 0;
  font-size: var(--sf-fs-md);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--sf-text);
}

.comment-edit {
  margin-top: 8px;
}

.comment-edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 8px;
}

.comment-paging {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 0 0;
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

.empty-text {
  margin: 8px 0 0;
  padding: 16px 0;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.state-box {
  display: grid;
  place-items: center;
  padding: 32px 0;
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  margin-top: 16px;
}

.composer .v-textarea {
  flex: 1;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(247, 248, 250, 0.8);
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.loading-overlay p {
  margin: 0;
}

@media (max-width: 600px) {
  .post,
  .comments {
    padding: 20px 16px;
  }

  .post-title {
    font-size: var(--sf-fs-2xl);
  }

  .purchase {
    flex-direction: column;
    align-items: stretch;
  }

  .composer {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>

