<template>
  <PageLayout
    :title="role === 'ADMIN' ? '문의 관리' : '문의하기'"
    :description="role === 'ADMIN' ? '사용자 문의를 확인하고 답변을 남겨 주세요.' : '불편한 점이나 바라는 기능을 알려 주세요. 답변이 달리면 알림으로 알려드려요.'"
    width="narrow"
  >
    <template #actions>
      <v-btn
        icon="mdi-refresh"
        variant="text"
        aria-label="새로 고침"
        :loading="isLoading"
        @click="refreshInquiries"
      />
      <v-btn v-if="role !== 'ADMIN'" color="primary" variant="flat" prepend-icon="mdi-plus" @click="showCreateModal = true">
        문의 남기기
      </v-btn>
    </template>

    <dl v-if="allInquiries.length > 0" class="status-summary">
      <div><dt>답변 대기</dt><dd class="sf-num">{{ statusCounts.PENDING }}</dd></div>
      <div><dt>확인 중</dt><dd class="sf-num">{{ statusCounts.IN_PROGRESS }}</dd></div>
      <div><dt>답변 완료</dt><dd class="sf-num">{{ statusCounts.COMPLETED }}</dd></div>
      <div v-if="statusCounts.CANCELLED"><dt>취소</dt><dd class="sf-num">{{ statusCounts.CANCELLED }}</dd></div>
    </dl>

    <section v-if="allInquiries.length > 0" class="sf-list-panel" aria-label="문의 목록">
      <div v-if="isLoading" class="sf-state-box">
        <v-progress-circular indeterminate color="primary" size="32" />
        <p>문의를 불러오는 중이에요</p>
      </div>

      <ul v-else class="inquiry-list">
        <li
          v-for="inquiry in paginatedInquiries"
          :key="inquiry.id"
          class="inquiry-item"
          :class="{ 'is-open': inquiry.isExpanded }"
        >
          <button
            type="button"
            class="inquiry-summary"
            :aria-expanded="!!inquiry.isExpanded"
            @click="toggleInquiryDetail(inquiry.id)"
          >
            <span class="inquiry-main">
              <span class="inquiry-tags">
                <span class="status-tag" :class="getStatusClass(inquiry.status)">{{ getStatusLabel(inquiry.status) }}</span>
                <span class="type-tag">{{ getTypeLabel(inquiry.inquiryType) || '알 수 없음' }}</span>
              </span>
              <span class="inquiry-title">{{ inquiry.title }}</span>
              <span class="inquiry-preview">{{ inquiry.contents }}</span>
            </span>
            <span class="inquiry-side">
              <span class="inquiry-date sf-num">{{ formatDate(inquiry.createdAt) }}</span>
              <v-icon size="20" class="chevron" aria-hidden="true">mdi-chevron-down</v-icon>
            </span>
          </button>

          <v-expand-transition>
            <div v-show="inquiry.isExpanded" class="inquiry-detail">
              <p class="detail-body">{{ inquiry.contents }}</p>

              <div v-if="inquiry.imageUrls && inquiry.imageUrls.length > 0" class="image-grid">
                <button
                  v-for="(imageUrl, index) in inquiry.imageUrls"
                  :key="index"
                  type="button"
                  class="image-item"
                  :aria-label="`첨부 사진 ${index + 1} 크게 보기`"
                  @click="openImageModal(inquiry.imageUrls, index)"
                >
                  <img :src="imageUrl" alt="" />
                </button>
              </div>

              <div v-if="inquiry.status === 'COMPLETED'" class="answer-block">
                <div class="answer-head">
                  <span class="answer-label">관리자 답변</span>
                  <span class="answer-date sf-num">{{ getReplyDate(inquiry) }}</span>
                </div>
                <p class="answer-body">{{ getAnswerContent(inquiry) }}</p>
              </div>
              <p v-else-if="role !== 'ADMIN'" class="waiting-note">
                아직 답변 전이에요. 답변이 달리면 알림으로 알려드릴게요.
              </p>

              <div class="detail-actions">
                <template v-if="role !== 'ADMIN'">
                  <v-btn
                    v-if="inquiry.status !== 'COMPLETED'"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-pencil-outline"
                    @click="openEditModal(inquiry)"
                  >
                    수정
                  </v-btn>
                  <v-btn
                    variant="text"
                    size="small"
                    color="error"
                    prepend-icon="mdi-trash-can-outline"
                    @click="openDeleteConfirmModal(inquiry)"
                  >
                    삭제
                  </v-btn>
                </template>
                <v-btn
                  v-else-if="inquiry.status !== 'COMPLETED'"
                  color="primary"
                  variant="flat"
                  size="small"
                  prepend-icon="mdi-reply-outline"
                  @click="openAnswerModal(inquiry)"
                >
                  답변 남기기
                </v-btn>
              </div>
            </div>
          </v-expand-transition>
        </li>
      </ul>

      <footer v-if="totalPages > 1" class="list-foot">
        <v-pagination
          v-model="currentPage"
          :length="totalPages"
          :total-visible="7"
          density="comfortable"
          color="primary"
          @update:model-value="changePage"
        />
      </footer>
    </section>

    <section v-else-if="!isLoading" class="sf-list-panel sf-state-box">
      <p class="sf-empty-title">{{ role === 'ADMIN' ? '들어온 문의가 없어요' : '남긴 문의가 없어요' }}</p>
      <p class="empty-desc">
        {{ role === 'ADMIN' ? '새 문의가 들어오면 여기에 보여요.' : '쓰다가 막히거나 고쳤으면 하는 점이 있으면 알려 주세요.' }}
      </p>
      <v-btn v-if="role !== 'ADMIN'" color="primary" variant="flat" prepend-icon="mdi-plus" @click="showCreateModal = true">
        문의 남기기
      </v-btn>
    </section>

    <section v-else class="sf-list-panel sf-state-box">
      <v-progress-circular indeterminate color="primary" size="32" />
      <p>문의를 불러오는 중이에요</p>
    </section>

    <!-- 문의 등록 -->
    <v-dialog v-model="showCreateModal" max-width="560" persistent>
      <v-card class="form-card">
        <header class="dialog-head">
          <h2 class="sf-dialog-title">문의 남기기</h2>
          <v-btn icon="mdi-close" variant="text" size="small" aria-label="닫기" @click="closeCreateModal" />
        </header>
        <v-card-text class="dialog-body">
          <v-form ref="form" @submit.prevent="submitInquiry">
            <v-select
              v-model="inquiryData.inquiryType"
              :items="inquiryTypes"
              label="종류"
              :rules="[rules.required]"
              variant="outlined"
              class="form-field"
            />
            <v-text-field
              v-model="inquiryData.title"
              label="제목"
              :rules="[rules.required]"
              variant="outlined"
              class="form-field"
            />
            <v-textarea
              v-model="inquiryData.contents"
              label="내용"
              placeholder="어떤 화면에서 무엇을 하다가 생긴 일인지 적어 주면 빨리 확인할 수 있어요."
              :rules="[rules.required, rules.minLength]"
              variant="outlined"
              rows="6"
              class="form-field"
            />
            <v-file-input
              v-model="inquiryData.imageFiles"
              multiple
              accept="image/*"
              label="사진 첨부 (선택)"
              variant="outlined"
              prepend-icon=""
              prepend-inner-icon="mdi-image-outline"
              show-size
              counter
              :rules="[rules.imageFiles]"
              class="form-field"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn variant="text" @click="closeCreateModal">취소</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSubmitting" :disabled="!isFormValid" @click="submitInquiry">
            문의 남기기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 문의 수정 -->
    <v-dialog v-model="showEditModal" max-width="560" persistent>
      <v-card class="form-card">
        <header class="dialog-head">
          <h2 class="sf-dialog-title">문의 수정</h2>
          <v-btn icon="mdi-close" variant="text" size="small" aria-label="닫기" @click="closeEditModal" />
        </header>
        <v-card-text class="dialog-body">
          <v-form ref="editForm" @submit.prevent="submitEditInquiry">
            <v-select
              v-model="editData.inquiryType"
              :items="inquiryTypes"
              label="종류"
              :rules="[rules.required]"
              variant="outlined"
              class="form-field"
            />
            <v-text-field
              v-model="editData.title"
              label="제목"
              :rules="[rules.required]"
              variant="outlined"
              class="form-field"
            />
            <v-textarea
              v-model="editData.contents"
              label="내용"
              :rules="[rules.required, rules.minLength]"
              variant="outlined"
              rows="6"
              class="form-field"
            />

            <div v-if="editData.existingImages && editData.existingImages.length > 0" class="existing-images">
              <p class="field-label">첨부한 사진</p>
              <div class="image-grid">
                <div v-for="(imageUrl, index) in editData.existingImages" :key="index" class="image-item is-editable">
                  <img
                    :src="imageUrl"
                    :alt="`첨부 사진 ${index + 1}`"
                    @click="openImageModal(editData.existingImages, index)"
                  />
                  <button type="button" class="image-remove" aria-label="사진 빼기" @click.stop="removeExistingImage(index)">
                    <v-icon size="14">mdi-close</v-icon>
                  </button>
                </div>
              </div>
            </div>

            <v-file-input
              v-model="editData.newImageFiles"
              multiple
              accept="image/*"
              label="사진 더 첨부 (선택)"
              variant="outlined"
              prepend-icon=""
              prepend-inner-icon="mdi-image-outline"
              show-size
              counter
              :rules="[rules.imageFiles]"
              class="form-field"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn variant="text" @click="closeEditModal">취소</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSubmittingEdit" :disabled="!isEditFormValid" @click="submitEditInquiry">
            수정 내용 저장
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 삭제 확인 -->
    <v-dialog v-model="showDeleteConfirmModal" max-width="400" persistent>
      <v-card class="pa-2">
        <v-card-title class="sf-dialog-title">문의를 삭제할까요?</v-card-title>
        <v-card-text class="confirm-text">삭제한 문의와 답변은 되돌릴 수 없어요.</v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="closeDeleteConfirmModal">취소</v-btn>
          <v-btn color="error" variant="flat" :loading="isDeleting" @click="confirmDeleteInquiry">삭제</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 관리자 답변 -->
    <v-dialog v-model="showAnswerModal" max-width="600" persistent>
      <v-card class="form-card">
        <header class="dialog-head">
          <h2 class="sf-dialog-title">답변 남기기</h2>
          <v-btn icon="mdi-close" variant="text" size="small" aria-label="닫기" @click="closeAnswerModal" />
        </header>
        <v-card-text class="dialog-body">
          <div class="quoted">
            <p class="quoted-title">{{ selectedInquiry?.title }}</p>
            <p class="quoted-body">{{ selectedInquiry?.contents }}</p>
          </div>
          <v-form ref="answerForm" @submit.prevent="submitAnswer">
            <v-textarea
              v-model="answerData.contents"
              label="답변"
              :rules="[rules.required, rules.minLength]"
              variant="outlined"
              rows="6"
              class="form-field"
            />
          </v-form>
        </v-card-text>
        <v-card-actions class="dialog-actions">
          <v-spacer />
          <v-btn variant="text" @click="closeAnswerModal">취소</v-btn>
          <v-btn color="primary" variant="flat" :loading="isSubmittingAnswer" :disabled="!isAnswerValid" @click="submitAnswer">
            답변 남기기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>


    <ImageModal
      v-model="showImageModal"
      :images="selectedImages"
      :start-index="selectedImageIndex"
      @update:model-value="closeImageModal"
    />
  </PageLayout>
</template>

<script>
import PageLayout from '@/components/layout/PageLayout.vue';
import axios from 'axios'
import ImageModal from '@/components/chat/ImageModal.vue'
import { snackbar } from '@/composables/snackbar'

export default {
  components: {
    PageLayout,
    ImageModal
  },
  data() {
    return {
      inquiries: [],
      allInquiries: [], // 모든 문의 데이터
      showCreateModal: false,
      inquiryTypes: [
        { title: '기능 관련', value: 'FUNCTION' },
        { title: '버그 신고', value: 'BUG' },
        { title: '기타', value: 'ETC' }
      ],
      inquiryStatuses: [
        { title: '답변 대기', value: 'PENDING', color: 'warning' },
        { title: '확인 중', value: 'IN_PROGRESS', color: 'info' },
        { title: '답변 완료', value: 'COMPLETED', color: 'success' },
        { title: '취소', value: 'CANCELLED', color: 'error' }
      ],
      rules: {
        required: v => !!v || '필수 입력 항목입니다.',
        minLength: v => v.length >= 10 || '최소 10자 이상 입력해주세요.',
        imageFiles: v => {
          if (!v || v.length === 0) return true; // 이미지가 없어도 됨
          if (v.length > 5) return '이미지는 최대 5개까지 첨부할 수 있습니다.';
          const maxSize = 5 * 1024 * 1024; // 5MB
          for (let file of v) {
            if (file.size > maxSize) return '각 이미지 파일은 5MB 이하여야 합니다.';
          }
          return true;
        }
      },
      isSubmitting: false,
      // 프론트엔드 페이징 관련 데이터
      currentPage: 1,
      itemsPerPage: 15, // 한 페이지당 표시할 문의 수를 15개로 조정
      isLoading: false,
      autoRefreshInterval: null, // 자동 새로고침 인터벌
      inquiryData: {
        inquiryType: '',
        title: '',
        contents: '',
        imageFiles: []
      },
      showDetailModal: false, // 문의 상세 보기 모달 상태
      selectedInquiry: null, // 상세 보기 모달에 표시할 문의 데이터
      showAnswerModal: false, // ADMIN용 답변 모달 상태
      answerData: {
        contents: ''
      },
      isSubmittingAnswer: false,
      showEditModal: false, // 문의 수정 모달 상태
      editData: { // 수정할 문의 데이터
        inquiryType: '',
        title: '',
        contents: '',
        existingImages: [], // 기존 이미지 URL들
        newImageFiles: [], // 새로 업로드할 이미지 파일들
        removedImageIndexes: [] // 삭제할 이미지 인덱스들
      },
      isSubmittingEdit: false, // 수정 제출 중 상태
      showDeleteConfirmModal: false, // 삭제 확인 모달 상태
      isDeleting: false, // 삭제 중 상태
      showImageModal: false, // 이미지 모달 상태
      selectedImages: [], // 선택된 이미지들
      selectedImageIndex: 0 // 선택된 이미지 인덱스
    }
  },
  computed: {
    role() {
      return this.$store.state.user.userInfo?.role || 'USER';
    },
    
    isFormValid() {
      return this.inquiryData.title && 
             this.inquiryData.inquiryType && 
             this.inquiryData.contents &&
             this.inquiryData.contents.length >= 10
    },
    
    // 페이징된 문의 목록
    paginatedInquiries() {
      const start = (this.currentPage - 1) * this.itemsPerPage
      const end = start + this.itemsPerPage
      return this.allInquiries.slice(start, end)
    },
    
    // 전체 페이지 수
    totalPages() {
      return Math.ceil(this.allInquiries.length / this.itemsPerPage)
    },
    
    // 페이지 범위 (1~5, 6~10 등)
    pageRange() {
      const range = []
      const start = Math.max(1, this.currentPage - 2)
      const end = Math.min(this.totalPages, this.currentPage + 2)
      
      for (let i = start; i <= end; i++) {
        range.push(i)
      }
      return range
    },
    
    // 상태별 문의 개수
    statusCounts() {
      const counts = {
        PENDING: 0,
        IN_PROGRESS: 0,
        COMPLETED: 0,
        CANCELLED: 0
      }
      
      this.allInquiries.forEach(inquiry => {
        if (inquiry.status && Object.prototype.hasOwnProperty.call(counts, inquiry.status)) {
          counts[inquiry.status]++
        }
      })
      
      return counts
    },
    isAnswerValid() {
      return this.answerData.contents && this.answerData.contents.length >= 10;
    },
    isEditFormValid() {
      return this.editData.title && 
             this.editData.inquiryType && 
             this.editData.contents &&
             this.editData.contents.length >= 10;
    }
  },
  async mounted() {
    await this.fetchInquiries()
    // 30초마다 자동 새로고침 (상태 업데이트 확인용)
    this.startAutoRefresh()
    // 페이지 진입 시 문의 알림 제거
    this.$store.dispatch('notification/clearInquiryNotificationsOnEnter')
  },
  
  beforeUnmount() {
    this.stopAutoRefresh()
  },
  methods: {
    async fetchInquiries() {
      try {
        this.isLoading = true

        const role = this.$store.state.user.userInfo?.role;

        const url = role === 'ADMIN'
        ? `${import.meta.env.VITE_API_BASE_URL}/inquiry/list`
        : `${import.meta.env.VITE_API_BASE_URL}/inquiry/myInquiry`
        
        // 현재 로그인한 사용자의 문의 목록 조회 API 호출
        const response = await axios.get(url)
        
        let inquiries = []
        
        if (response.data.result && Array.isArray(response.data.result)) {
          inquiries = response.data.result
        }
        
        if (inquiries.length > 0) {
          
          // 디버깅을 위한 콘솔 로그
          console.log('Raw inquiries data:', inquiries);
          if (inquiries[0]) {
            console.log('First inquiry full data:', inquiries[0]);
            console.log('First inquiry comments field:', inquiries[0].comments);
            console.log('Comments type:', typeof inquiries[0].comments);
            console.log('Comments is null:', inquiries[0].comments === null);
            console.log('Comments is undefined:', inquiries[0].comments === undefined);
          }
          
          // 모든 문의 데이터를 allInquiries에 저장
          this.allInquiries = inquiries.map(inquiry => {
            const mappedInquiry = {
              id: inquiry.inquiryId || inquiry.id,
              inquiryType: inquiry.inquiryType,
              title: inquiry.title,
              contents: inquiry.contents,
              memberId: inquiry.memberId,
              imageUrls: inquiry.imageUrls || [],
              status: inquiry.status || 'PENDING',
              // 백엔드에서 comments → comment로 필드명 변경됨
              comment: inquiry.comment || null,
              comments: inquiry.comments || null, // 기존 호환성 유지
              createdAt: inquiry.createdAt || new Date().toISOString(),
              updatedAt: inquiry.updatedAt || inquiry.createdAt || new Date().toISOString(),
              isExpanded: false // 아코디언 상태 추가
            };
            return mappedInquiry;
          });
          
          // 첫 페이지로 초기화
          this.currentPage = 1
        } else {
          this.allInquiries = []
        }
        
      } catch (error) {
        console.error('문의 목록 조회 오류:', error)
      } finally {
        this.isLoading = false
      }
    },

    // 페이지 변경 메서드
    changePage(page) {
      if (page >= 1 && page <= this.totalPages) {
        this.currentPage = page
      }
    },

    async submitInquiry() {
      if (!this.isFormValid) {
        this.showMessage('모든 필수 항목을 입력해주세요.', 'error')
        return
      }

      this.isSubmitting = true
      
      try {
        const formData = new FormData();
        formData.append('inquiryType', this.inquiryData.inquiryType);
        formData.append('title', this.inquiryData.title);
        formData.append('contents', this.inquiryData.contents);

        // 관리자가 어느 냉장고의 문의인지 볼 수 있도록 현재 냉장고를 함께 전송
        const fridgeId = this.$store.getters.getCurrentFridgeId;
        if (fridgeId) {
          formData.append('fridgeId', fridgeId);
        }

        // 파일이 여러 개인 경우
        this.inquiryData.imageFiles.forEach(file => {
          formData.append('imageFiles', file);
        });

        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/inquiry/create`, formData)
        
        if (response.status === 201 || response.data.status_code === 201) {
          this.showMessage('문의가 성공적으로 등록되었습니다.', 'success')
          this.closeCreateModal()
          
          // ADMIN에게 새로운 문의 알림 발송
          this.$store.commit('notification/addNotification', {
            id: Date.now(),
            type: 'NEW_INQUIRY',
            content: `새로운 문의 "${this.inquiryData.title}"가 등록되었습니다.`,
            isRead: false,
            createdAt: new Date().toISOString(),
            fridgeId: this.$store.state.user.userInfo?.fridgeId || 1
          });
          
          await this.fetchInquiries() // 목록 새로고침
        } else {
          this.showMessage('문의 등록에 실패했습니다. 다시 시도해주세요.', 'error')
        }
      } catch (error) {
        console.error('문의 등록 오류:', error)
        this.showMessage('문의 등록 중 오류가 발생했습니다.', 'error')
      } finally {
        this.isSubmitting = false
      }
    },

    closeCreateModal() {
      this.showCreateModal = false
      this.resetForm()
    },

    resetForm() {
      this.inquiryData = {
        inquiryType: '',
        title: '',
        contents: '',
        imageFiles: []
      }
      this.$refs.form?.resetValidation()
    },

    getTypeLabel(inquiryType) {
      if (!inquiryType) {
        console.warn('inquiryType이 undefined 또는 null입니다');
        return '알 수 없음';
      }
      
      const typeItem = this.inquiryTypes.find(item => item.value === inquiryType);
      
      if (typeItem) {
        return typeItem.title;
      } else {
        // 백엔드에서 오는 실제 값과 매핑
        const fallbackMap = {
          'FUNCTION': '기능 관련',
          'BUG': '버그 신고',
          'ETC': '기타'
        };
        
        const fallbackLabel = fallbackMap[inquiryType];
        if (fallbackLabel) {
          return fallbackLabel;
        }
        
        console.warn('알 수 없는 타입:', inquiryType);
        return inquiryType; // 원본 값 반환
      }
    },

    getTypeColor(type) {
      const colorMap = {
        'FUNCTION': 'indigo',
        'BUG': 'red',
        'ETC': 'brown'
      }
      
      const color = colorMap[type] || 'grey'
      
      return color
    },

    getTypeClass(type) {
      const classMap = {
        'FUNCTION': 'type-function',
        'BUG': 'type-bug',
        'ETC': 'type-etc'
      }
      
      return classMap[type] || 'type-default'
    },

    getStatusClass(status) {
      const classMap = {
        'PENDING': 'status-pending',
        'IN_PROGRESS': 'status-progress',
        'COMPLETED': 'status-completed',
        'CANCELLED': 'status-cancelled'
      }
      
      return classMap[status] || 'status-default'
    },

    getStatusLabel(status) {
      if (!status) {
        return '알 수 없음';
      }
      
      const statusItem = this.inquiryStatuses.find(item => item.value === status);
      if (statusItem) {
        return statusItem.title;
      }
      
      // fallback 매핑
      const fallbackMap = {
        'PENDING': '답변 대기',
        'IN_PROGRESS': '확인 중',
        'COMPLETED': '답변 완료',
        'CANCELLED': '취소'
      };
      
      return fallbackMap[status] || status;
    },

    getStatusColor(status) {
      if (!status) {
        return 'grey';
      }
      
      const statusItem = this.inquiryStatuses.find(item => item.value === status);
      if (statusItem) {
        return statusItem.color;
      }
      
      // fallback 색상 매핑
      const colorMap = {
        'PENDING': 'warning',
        'IN_PROGRESS': 'info',
        'COMPLETED': 'success',
        'CANCELLED': 'error'
      };
      
      return colorMap[status] || 'grey';
    },

    toggleInquiryDetail(inquiryId) {
      const inquiry = this.allInquiries.find(i => i.id === inquiryId);
      if (inquiry) {
        inquiry.isExpanded = !inquiry.isExpanded;
      }
    },

    formatDate(dateString) {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    },

    showMessage(message, color = 'success') {
      snackbar.show(message, color);
    },

    async refreshInquiries() {
      this.isLoading = true;
      await this.fetchInquiries();
      this.isLoading = false;
      this.showMessage('문의 목록이 새로고침되었습니다.', 'info');
    },

    startAutoRefresh() {
      this.stopAutoRefresh() // 기존 인터벌 정리
      this.autoRefreshInterval = setInterval(async () => {
        await this.fetchInquiries()
      }, 30000) // 30초마다 실행
    },

    stopAutoRefresh() {
      if (this.autoRefreshInterval) {
        clearInterval(this.autoRefreshInterval)
        this.autoRefreshInterval = null
      }
    },

    closeDetailModal() {
      // 모달 창을 제거하고 아코디언 방식으로 변경
      // 아코디언 상태를 토글하는 대신 모든 문의의 isExpanded를 false로 설정
      this.allInquiries.forEach(inquiry => {
        inquiry.isExpanded = false;
      });
    },

    getAnswerContent(inquiry) {
      // 백엔드에서 comments → comment로 필드명 변경됨
      if (!inquiry) {
        return '아직 답변이 등록되지 않았습니다.';
      }
      
      // comment 필드 확인 (새로운 구조)
      if (inquiry.comment && typeof inquiry.comment === 'string') {
        return inquiry.comment;
      }
      
      // 기존 comments 필드와의 호환성 유지
      if (inquiry.comments) {
        if (typeof inquiry.comments === 'string') {
          return inquiry.comments;
        }
        
        // comments가 객체인 경우 (OneToOne 관계)
        if (typeof inquiry.comments === 'object' && !Array.isArray(inquiry.comments)) {
          const answerContent = inquiry.comments.contents || 
                               inquiry.comments.commentContents || 
                               inquiry.comments.content ||
                               inquiry.comments.commentContent ||
                               inquiry.comments.answer ||
                               inquiry.comments.reply;
          
          if (answerContent) {
            return answerContent;
          }
        }
        
        // comments가 배열인 경우 (OneToMany 관계)
        if (Array.isArray(inquiry.comments)) {
          if (inquiry.comments.length === 0) {
            return '아직 답변이 등록되지 않았습니다.';
          }
          
          const latestComment = inquiry.comments[inquiry.comments.length - 1];
          
          // 디버깅을 위한 콘솔 로그
          console.log('Latest comment structure:', latestComment);
          console.log('Available fields:', Object.keys(latestComment));
          
          const answerContent = latestComment.commentContents || 
                               latestComment.contents || 
                               latestComment.content ||
                               latestComment.commentContent ||
                               latestComment.answer ||
                               latestComment.reply;
          
          if (!answerContent) {
            console.warn('답변 내용을 찾을 수 없습니다. Comment object:', latestComment);
            return '답변 내용을 불러올 수 없습니다.';
          }
          
          return answerContent;
        }
      }
      
      return '아직 답변이 등록되지 않았습니다.';
    },

    getReplyDate(inquiry) {
      if (!inquiry) {
        return '-';
      }
      
      // comments가 객체인 경우 (OneToOne 관계)
      if (inquiry.comments && typeof inquiry.comments === 'object' && !Array.isArray(inquiry.comments)) {
        if (inquiry.comments.createdTime) {
          return this.formatDate(inquiry.comments.createdTime);
        }
        // createdTime이 없으면 문의의 updatedAt 사용 (임시)
        if (inquiry.updatedAt) {
          return this.formatDate(inquiry.updatedAt);
        }
      }
      
      // comments가 배열인 경우 (OneToMany 관계)
      if (inquiry.comments && Array.isArray(inquiry.comments) && inquiry.comments.length > 0) {
        const latestComment = inquiry.comments[inquiry.comments.length - 1];
        if (latestComment.createdTime) {
          return this.formatDate(latestComment.createdTime);
        }
        // createdTime이 없으면 문의의 updatedAt 사용 (임시)
        if (inquiry.updatedAt) {
          return this.formatDate(inquiry.updatedAt);
        }
      }
      
      // comment 필드 확인 (새로운 구조)
      if (inquiry.comment && typeof inquiry.comment === 'object' && inquiry.comment.createdTime) {
        return this.formatDate(inquiry.comment.createdTime);
      }
      
      // 모든 경우에 해당하지 않으면 문의의 updatedAt 사용 (임시)
      if (inquiry.updatedAt) {
        return this.formatDate(inquiry.updatedAt);
      }
      
      return '-';
    },

    openAnswerModal(inquiry) {
      this.selectedInquiry = inquiry;
      this.answerData.contents = ''; // 모달 열릴 때 답변 내용 초기화
      this.showAnswerModal = true;
    },

    closeAnswerModal() {
      this.showAnswerModal = false;
      this.answerData.contents = '';
      this.$refs.answerForm?.resetValidation();
    },

    async submitAnswer() {
      if (!this.isAnswerValid) {
        this.showMessage('답변 내용을 입력해주세요.', 'error');
        return;
      }

      this.isSubmittingAnswer = true;

      try {
        const requestData = {
          commentContents: this.answerData.contents
        };
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/admin/inquiry/${this.selectedInquiry.id}/reply`, 
          requestData,
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        // 답변 등록 응답 로깅
        console.log('Answer registration response:', response.data);
        
        if (response.data.status_code === 201) {
          this.showMessage('답변이 성공적으로 등록되었습니다.', 'success');
          this.closeAnswerModal();
          
          // 문의 작성자에게 답변 알림 발송
          this.$store.commit('notification/addNotification', {
            id: Date.now(),
            type: 'ADMIN_REPLY',
            content: `문의 "${this.selectedInquiry?.title}"에 답변이 등록되었습니다.`,
            isRead: false,
            createdAt: new Date().toISOString(),
            fridgeId: this.$store.state.user.userInfo?.fridgeId || 1
          });
          
          await this.fetchInquiries(); // 목록 새로고침
        } else {
          this.showMessage('답변 등록에 실패했습니다. 다시 시도해주세요.', 'error');
        }
      } catch (error) {
        console.error('답변 등록 오류:', error);
        console.error('Error response:', error.response?.data);
        console.error('Error status:', error.response?.status);
        console.error('Error headers:', error.response?.headers);
        this.showMessage('답변 등록 중 오류가 발생했습니다.', 'error');
      } finally {
        this.isSubmittingAnswer = false;
      }
    },

    testNotification() {
      // 역할에 맞는 테스트 알림 생성
      if (this.role === 'ADMIN') {
        // ADMIN: NEW_INQUIRY 테스트 알림
        this.$store.commit('notification/addNotification', {
          id: Date.now(),
          type: 'NEW_INQUIRY',
          content: '테스트: 새로운 문의가 등록되었습니다.',
          isRead: false,
          createdAt: new Date().toISOString(),
          fridgeId: this.$store.state.user.userInfo?.fridgeId || 1
        });
        this.showMessage('ADMIN용 NEW_INQUIRY 테스트 알림이 추가되었습니다.', 'info');
      } else {
        // USER: ADMIN_REPLY 테스트 알림
        this.$store.commit('notification/addNotification', {
          id: Date.now(),
          type: 'ADMIN_REPLY',
          content: '테스트: 문의에 답변이 등록되었습니다.',
          isRead: false,
          createdAt: new Date().toISOString(),
          fridgeId: this.$store.state.user.userInfo?.fridgeId || 1
        });
        this.showMessage('USER용 ADMIN_REPLY 테스트 알림이 추가되었습니다.', 'info');
      }
  
    },

    openEditModal(inquiry) {
      this.selectedInquiry = inquiry; // 수정할 문의 데이터 설정
      this.editData.inquiryType = inquiry.inquiryType;
      this.editData.title = inquiry.title;
      this.editData.contents = inquiry.contents;
      this.editData.existingImages = inquiry.imageUrls || []; // 기존 이미지 URL들
      this.editData.newImageFiles = []; // 새 이미지 파일들 초기화
      this.editData.removedImageIndexes = []; // 삭제할 이미지 인덱스들 초기화
      this.showEditModal = true;
    },

    closeEditModal() {
      this.showEditModal = false;
      this.resetEditForm();
    },

    resetEditForm() {
      this.editData = {
        inquiryType: '',
        title: '',
        contents: '',
        existingImages: [],
        newImageFiles: [],
        removedImageIndexes: []
      };
      this.$refs.editForm?.resetValidation();
    },

    removeExistingImage(index) {
      this.editData.removedImageIndexes.push(index);
      this.editData.existingImages.splice(index, 1);
    },

    async submitEditInquiry() {
      if (!this.isEditFormValid) {
        this.showMessage('모든 필수 항목을 입력해주세요.', 'error');
        return;
      }

      this.isSubmittingEdit = true;

      try {
        const formData = new FormData();
        formData.append('inquiryType', this.editData.inquiryType);
        formData.append('title', this.editData.title);
        formData.append('contents', this.editData.contents);

        // 새로 업로드할 이미지 파일들
        this.editData.newImageFiles.forEach(file => {
          formData.append('imageFiles', file);
        });

        // 삭제할 이미지 인덱스들
        if (this.editData.removedImageIndexes.length > 0) {
          formData.append('removedImageIndexes', JSON.stringify(this.editData.removedImageIndexes));
        }

        const response = await axios.patch(`${import.meta.env.VITE_API_BASE_URL}/inquiry/update/${this.selectedInquiry.id}`, formData);
        
        if (response.status === 200 || response.data.status_code === 200) {
          this.showMessage('문의가 성공적으로 수정되었습니다.', 'success');
          this.closeEditModal();
          await this.fetchInquiries(); // 목록 새로고침
        } else {
          this.showMessage('문의 수정에 실패했습니다. 다시 시도해주세요.', 'error');
        }
      } catch (error) {
        console.error('문의 수정 오류:', error);
        this.showMessage('문의 수정 중 오류가 발생했습니다.', 'error');
       } finally {
         this.isSubmittingEdit = false;
       }
     },

     openDeleteConfirmModal(inquiry) {
       this.selectedInquiry = inquiry;
       this.showDeleteConfirmModal = true;
     },

     closeDeleteConfirmModal() {
       this.showDeleteConfirmModal = false;
     },

     async confirmDeleteInquiry() {
       this.isDeleting = true;

       try {
         const response = await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/inquiry/delete/${this.selectedInquiry.id}`);
         
         if (response.status === 200 || response.data.status_code === 200) {
           this.showMessage('문의가 성공적으로 삭제되었습니다.', 'success');
           this.closeDeleteConfirmModal();
           await this.fetchInquiries(); // 목록 새로고침
         } else {
           this.showMessage('문의 삭제에 실패했습니다. 다시 시도해주세요.', 'error');
         }
       } catch (error) {
         console.error('문의 삭제 오류:', error);
         this.showMessage('문의 삭제 중 오류가 발생했습니다.', 'error');
       } finally {
         this.isDeleting = false;
       }
     },

     // 이미지 클릭 핸들러
     openImageModal(images, imageIndex = 0) {
       this.selectedImages = images;
       this.selectedImageIndex = imageIndex;
       this.showImageModal = true;
     },

     // 이미지 모달 닫기
     closeImageModal() {
       this.showImageModal = false;
       this.selectedImages = [];
       this.selectedImageIndex = 0;
     }
   }
 }
</script>

<style scoped>
.status-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 24px;
  margin: 0;
  font-size: var(--sf-fs-md);
}

.status-summary div {
  display: flex;
  gap: 6px;
}

.status-summary dt {
  color: var(--sf-text-sub);
}

.status-summary dd {
  margin: 0;
  font-weight: 700;
  color: var(--sf-text);
}

.inquiry-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.inquiry-item + .inquiry-item {
  border-top: 1px solid var(--sf-line);
}

.inquiry-summary {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  width: 100%;
  padding: 18px 20px;
  border: none;
  background: none;
  font: inherit;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.inquiry-summary:hover {
  background: var(--sf-bg);
}

.inquiry-main {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.inquiry-tags {
  display: flex;
  gap: 6px;
  margin-bottom: 2px;
}

.status-tag,
.type-tag {
  padding: 1px 8px;
  border-radius: 6px;
  font-size: var(--sf-fs-xs);
  font-weight: 600;
}

.type-tag {
  background: var(--sf-bg);
  color: var(--sf-text-sub);
}

.status-tag {
  border: 1px solid var(--sf-line-strong);
  color: var(--sf-text-sub);
}

.status-tag.status-completed {
  border-color: transparent;
  background: var(--sf-mint-soft);
  color: var(--sf-primary);
}

.status-tag.status-progress {
  border-color: transparent;
  background: #E8F1FA;
  color: #285E8E;
}

.status-tag.status-cancelled {
  color: var(--sf-text-faint);
  text-decoration: line-through;
}

.inquiry-title {
  font-size: var(--sf-fs-md);
  font-weight: 700;
  color: var(--sf-text);
}

.inquiry-preview {
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-open .inquiry-preview {
  display: none;
}

.inquiry-side {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.inquiry-date {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-faint);
}

.chevron {
  color: var(--sf-text-faint);
  transition: transform 0.2s ease;
}

.is-open .chevron {
  transform: rotate(180deg);
}

.inquiry-detail {
  padding: 0 20px 18px;
}

.detail-body {
  max-width: 68ch;
  margin: 0 0 16px;
  font-size: var(--sf-fs-md);
  line-height: 1.7;
  white-space: pre-wrap;
  color: var(--sf-text);
}

.image-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.image-item {
  position: relative;
  width: 88px;
  height: 88px;
  padding: 0;
  border: none;
  border-radius: 10px;
  background: var(--sf-line);
  cursor: zoom-in;
}

.image-item img {
  display: block;
  width: 100%;
  height: 100%;
  border-radius: 10px;
  object-fit: cover;
}

.image-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  display: grid;
  place-items: center;
  width: 22px;
  height: 22px;
  border: 2px solid var(--sf-surface);
  border-radius: 50%;
  background: var(--sf-text);
  color: #fff;
  cursor: pointer;
}

.answer-block {
  padding: 14px 16px;
  border-left: 3px solid var(--sf-primary);
  border-radius: 0 10px 10px 0;
  background: var(--sf-mint-soft);
}

.answer-head {
  display: flex;
  align-items: baseline;
  gap: 10px;
  margin-bottom: 6px;
}

.answer-label {
  font-size: var(--sf-fs-md);
  font-weight: 700;
  color: var(--sf-primary);
}

.answer-date {
  font-size: var(--sf-fs-sm);
  color: var(--sf-text-sub);
}

.answer-body {
  margin: 0;
  font-size: var(--sf-fs-md);
  line-height: 1.7;
  white-space: pre-wrap;
  color: var(--sf-text);
}

.waiting-note {
  margin: 0;
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.detail-actions {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 12px;
}

.detail-actions:empty {
  display: none;
}

.list-foot {
  padding: 12px;
  border-top: 1px solid var(--sf-line);
}

.empty-desc {
  margin-bottom: 8px !important;
}

/* 다이얼로그 */
.form-card {
  padding: 8px;
}

.dialog-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 4px 16px;
}

.sf-dialog-title {
  margin: 0;
  color: var(--sf-text);
}

.dialog-body {
  padding-top: 12px !important;
}

.form-field {
  margin-bottom: 4px;
}

.field-label {
  margin: 0 0 8px;
  font-size: var(--sf-fs-sm);
  font-weight: 600;
  color: var(--sf-text-sub);
}

.existing-images {
  margin-bottom: 8px;
}

.dialog-actions {
  padding: 8px 16px 12px;
}

.confirm-text {
  font-size: var(--sf-fs-md);
  color: var(--sf-text-sub);
}

.quoted {
  margin-bottom: 16px;
  padding: 12px 14px;
  border-radius: 10px;
  background: var(--sf-bg);
}

.quoted-title {
  margin: 0 0 4px;
  font-size: var(--sf-fs-md);
  font-weight: 700;
  color: var(--sf-text);
}

.quoted-body {
  margin: 0;
  max-height: 160px;
  overflow-y: auto;
  font-size: var(--sf-fs-md);
  line-height: 1.6;
  white-space: pre-wrap;
  color: var(--sf-text-sub);
}

@media (max-width: 600px) {
  .inquiry-summary {
    padding: 16px;
  }

  .inquiry-date {
    display: none;
  }

  .inquiry-detail {
    padding: 0 16px 16px;
  }
}
</style>

