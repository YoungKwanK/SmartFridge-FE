<template>
  <v-container class="py-6">
    <v-row justify="center">
      <v-col cols="12" md="10" lg="8">
        <!-- 헤더 섹션 -->
        <div class="header-section mb-8">
          <div class="d-flex justify-space-between align-center">
            <div>
              <h1 class="text-h3 font-weight-light text-grey-darken-3 mb-2">내 문의</h1>
              <p class="text-body-1 text-grey-darken-1">등록한 문의사항과 답변을 확인하세요</p>
            </div>
            <v-btn
              @click="showCreateModal = true"
              color="primary"
              variant="elevated"
              size="large"
              prepend-icon="mdi-plus"
              class="create-btn"
            >
              문의 등록
            </v-btn>
          </div>
        </div>

        <!-- 문의 목록 -->
        <div v-if="allInquiries.length > 0" class="inquiry-list">
          <!-- 로딩 상태 -->
          <div v-if="isLoading" class="text-center py-8">
            <v-progress-circular indeterminate color="primary" size="48"></v-progress-circular>
            <p class="text-body-1 text-grey-darken-1 mt-4">문의 목록을 불러오는 중...</p>
          </div>
          
          <!-- 문의 카드들 -->
          <div v-else>
            <v-card
              v-for="inquiry in paginatedInquiries"
              :key="inquiry.id"
              class="inquiry-card mb-4"
              variant="outlined"
              elevation="0"
            >
              <v-card-text class="pa-6">
                <!-- 문의 헤더 -->
                <div class="d-flex justify-space-between align-start mb-4">
                  <div class="flex-grow-1">
                    <h3 class="text-h6 font-weight-medium text-grey-darken-3 mb-2">
                      {{ inquiry.title }}
                    </h3>
                    <div class="d-flex align-center gap-3">
                      <v-chip
                        :color="getTypeColor(inquiry.type)"
                        variant="flat"
                        size="small"
                        class="type-chip"
                      >
                        {{ getTypeLabel(inquiry.type) }}
                      </v-chip>
                      <v-chip
                        :color="inquiry.hasAnswer ? 'info' : 'grey'"
                        variant="flat"
                        size="small"
                        class="status-chip"
                      >
                        {{ inquiry.hasAnswer ? '답변 완료' : '대기중' }}
                      </v-chip>
                      <span class="text-caption text-grey-darken-1">
                        {{ formatDate(inquiry.createdAt) }}
                      </span>
                    </div>
                  </div>
                </div>

                <!-- 문의 내용 -->
                <p class="text-body-1 text-grey-darken-2 mb-4 line-height-1-6">
                  {{ inquiry.contents }}
                </p>

                <!-- 답변 섹션 -->
                <div v-if="inquiry.hasAnswer && inquiry.answer" class="answer-section">
                  <v-divider class="mb-4"></v-divider>
                  <div class="d-flex align-center mb-3">
                    <v-icon icon="mdi-check-circle" color="info" size="20" class="mr-2"></v-icon>
                    <span class="text-subtitle-2 font-weight-medium text-info">답변</span>
                  </div>
                  <p class="text-body-1 text-grey-darken-2 mb-2 line-height-1-6">
                    {{ inquiry.answer }}
                  </p>
                  <span class="text-caption text-grey-darken-1">
                    {{ formatDate(inquiry.answeredAt) }}
                  </span>
                </div>
              </v-card-text>
            </v-card>

            <!-- 페이지네이션 -->
            <div class="text-center mt-6">
              <v-pagination
                v-model="currentPage"
                :length="totalPages"
                :total-visible="7"
                @update:model-value="changePage"
                class="mb-4"
                color="primary"
                rounded="circle"
              ></v-pagination>
              
              <!-- 페이지 정보 -->
              <div class="text-caption text-grey-darken-1">
                총 {{ allInquiries.length }}개의 문의 중 {{ (currentPage - 1) * itemsPerPage + 1 }}-{{ Math.min(currentPage * itemsPerPage, allInquiries.length) }}번째 표시
                <span v-if="totalPages > 1" class="ml-2">({{ currentPage }}/{{ totalPages }} 페이지)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 문의가 없는 경우 -->
        <v-card v-else-if="allInquiries.length === 0 && !isLoading" class="empty-state" variant="outlined" elevation="0">
          <v-card-text class="text-center pa-12">
            <v-icon icon="mdi-help-circle-outline" size="64" color="grey-lighten-2" class="mb-4"></v-icon>
            <h3 class="text-h5 text-grey-darken-2 mb-2 font-weight-light">등록된 문의가 없습니다</h3>
            <p class="text-body-1 text-grey mb-6">새로운 문의사항이 있으시면 문의 등록 버튼을 눌러주세요.</p>
            <v-btn
              @click="showCreateModal = true"
              color="primary"
              variant="elevated"
              size="large"
              prepend-icon="mdi-plus"
            >
              첫 문의 등록하기
            </v-btn>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- 문의 등록 모달 -->
    <v-dialog v-model="showCreateModal" max-width="500" persistent>
      <v-card class="create-modal" elevation="8">
        <v-card-title class="text-h5 pa-6 pb-4 text-center">
          문의 등록
        </v-card-title>

        <v-card-text class="pa-6 pt-0">
          <v-form @submit.prevent="submitInquiry" ref="form">
            <v-select
              v-model="inquiryData.type"
              :items="inquiryTypes"
              label="문의 종류"
              placeholder="문의 종류를 선택해주세요"
              :rules="[rules.required]"
              variant="outlined"
              class="mb-4"
              required
            ></v-select>

            <v-text-field
              v-model="inquiryData.title"
              label="제목"
              placeholder="문의 제목을 입력해주세요"
              :rules="[rules.required]"
              variant="outlined"
              class="mb-4"
              required
            ></v-text-field>

            <v-textarea
              v-model="inquiryData.contents"
              label="문의 내용"
              placeholder="문의 내용을 자세히 작성해주세요"
              :rules="[rules.required, rules.minLength]"
              variant="outlined"
              rows="5"
              class="mb-6"
              required
            ></v-textarea>
          </v-form>
        </v-card-text>

        <v-card-actions class="pa-6 pt-0">
          <v-spacer></v-spacer>
          <v-btn
            @click="closeCreateModal"
            variant="text"
            color="grey-darken-1"
            size="large"
          >
            취소
          </v-btn>
          <v-btn
            @click="submitInquiry"
            color="primary"
            variant="elevated"
            size="large"
            :loading="isSubmitting"
            :disabled="!isFormValid"
          >
            문의하기
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- 성공/에러 메시지 -->
    <v-snackbar
      v-model="showSnackbar"
      :color="snackbarColor"
      :timeout="3000"
      location="top"
    >
      {{ snackbarMessage }}
    </v-snackbar>
  </v-container>
</template>

<script>
import axios from 'axios'

export default {
  data() {
    return {
      inquiries: [],
      allInquiries: [], // 모든 문의 데이터
      showCreateModal: false,
      inquiryData: {
        type: '',
        title: '',
        contents: ''
      },
      inquiryTypes: [
        { title: '기술 지원', value: 'TECHNICAL' },
        { title: '계정 관련', value: 'ACCOUNT' },
        { title: '냉장고 관련', value: 'REFRIGERATOR' },
        { title: '버그 신고', value: 'BUG_REPORT' },
        { title: '기능 요청', value: 'FEATURE_REQUEST' },
        { title: '기타', value: 'ETC' }
      ],
      rules: {
        required: v => !!v || '필수 입력 항목입니다.',
        minLength: v => v.length >= 10 || '최소 10자 이상 입력해주세요.'
      },
      isSubmitting: false,
      showSnackbar: false,
      snackbarMessage: '',
      snackbarColor: 'success',
      // 프론트엔드 페이징 관련 데이터
      currentPage: 1,
      itemsPerPage: 15, // 한 페이지당 표시할 문의 수를 15개로 조정
      isLoading: false
    }
  },
  computed: {
    isFormValid() {
      return this.inquiryData.title && 
             this.inquiryData.type && 
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
    }
  },
  async mounted() {
    await this.fetchInquiries()
  },
  methods: {
    async fetchInquiries() {
      try {
        this.isLoading = true
        
        // 현재 로그인한 사용자의 문의 목록 조회 API 호출
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/inquiry/list`)
        
        // 서버에서 List<InquiryResDto>를 직접 반환하므로 response.data.result가 바로 배열
        let inquiries = []
        
        if (response.data.result && Array.isArray(response.data.result)) {
          inquiries = response.data.result
        }
        
        if (inquiries.length > 0) {
          // 모든 문의 데이터를 allInquiries에 저장
          this.allInquiries = inquiries.map(inquiry => ({
            id: inquiry.inquiryId || inquiry.id,
            type: inquiry.type,
            title: inquiry.title,
            contents: inquiry.contents,
            hasAnswer: inquiry.hasAnswer,
            createdAt: inquiry.createdAt || new Date().toISOString(),
            answer: inquiry.answer || null,
            answeredAt: inquiry.answeredAt || null
          }))
          
          // 첫 페이지로 초기화
          this.currentPage = 1
        } else {
          this.allInquiries = []
        }
        
      } catch (error) {
        console.error('문의 목록 조회 오류:', error)
        this.showMessage('문의 목록을 불러오는데 실패했습니다.', 'error')
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
        const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/inquiry/create`, this.inquiryData)
        
        if (response.status === 201 || response.data.status_code === 201) {
          this.showMessage('문의가 성공적으로 등록되었습니다.', 'success')
          this.closeCreateModal()
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
        type: '',
        title: '',
        contents: ''
      }
      this.$refs.form?.resetValidation()
    },

    getTypeLabel(type) {
      const typeItem = this.inquiryTypes.find(item => item.value === type)
      return typeItem ? typeItem.title : type
    },

    getTypeColor(type) {
      
      const colorMap = {
        'TECHNICAL': 'deep-purple',
        'ACCOUNT': 'teal',
        '냉장고 문의': 'orange',
        'BUG_REPORT': 'red',
        'FEATURE_REQUEST': 'indigo',
        'ETC': 'brown'
      }
      
      const color = colorMap[type] || 'grey'
      
      return color
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
      this.snackbarMessage = message
      this.snackbarColor = color
      this.showSnackbar = true
    }
  }
}
</script>

<style scoped>
.header-section {
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 24px;
}

.create-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
  letter-spacing: 0.5px;
}

.inquiry-list {
  min-height: 200px;
}

.inquiry-card {
  border-radius: 12px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s ease;
}

.inquiry-card:hover {
  border-color: #1976d2;
  box-shadow: 0 4px 12px rgba(25, 118, 210, 0.1);
}

.type-chip, .status-chip {
  border-radius: 6px;
  font-weight: 500;
  text-transform: none;
}

.gap-3 {
  gap: 12px;
}

.line-height-1-6 {
  line-height: 1.6;
}

.answer-section {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.empty-state {
  border-radius: 16px;
  border: 2px dashed #e0e0e0;
  background-color: #fafafa;
}

.create-modal {
  border-radius: 16px;
}

.v-card-title {
  color: #424242;
  font-weight: 400;
}

.v-btn {
  border-radius: 8px;
  text-transform: none;
  font-weight: 500;
}

.v-text-field, .v-select, .v-textarea {
  border-radius: 8px;
}

/* 반응형 디자인 */
@media (max-width: 768px) {
  .header-section {
    text-align: center;
  }
  
  .header-section .d-flex {
    flex-direction: column;
    gap: 16px;
  }
  
  .create-btn {
    width: 100%;
  }
  
  .inquiry-card {
    margin-bottom: 16px;
  }
}
</style>
