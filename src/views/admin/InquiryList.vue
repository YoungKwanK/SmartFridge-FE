<template>
  <div class="admin-layout">
    <div class="inquiry-list">
      <div class="header">
        <h1>문의 목록</h1>
        <button @click="logout" class="logout-btn">로그아웃</button>
      </div>
      
      <div class="navigation-menu">
        <router-link to="/admin" class="nav-item">대시보드</router-link>
        <router-link to="/admin/inquiry" class="nav-item active">문의 목록</router-link>
        <router-link to="/admin/notification" class="nav-item">알림 목록</router-link>
        <router-link to="/admin/users" class="nav-item">사용자 관리</router-link>
      </div>

      <div class="filters">
        <select v-model="statusFilter" @change="filterInquiries">
          <option value="">전체 상태</option>
          <option value="답변대기">답변대기</option>
          <option value="처리중">처리중</option>
          <option value="답변완료">답변완료</option>
          <option value="반려">반려</option>
        </select>
        <input type="text" v-model="searchQuery" placeholder="제목으로 검색..." @input="filterInquiries">
      </div>

      <div class="inquiry-table">
        <table>
          <thead>
            <tr>
              <th>번호</th>
              <th>제목</th>
              <th>작성자</th>
              <th>상태</th>
              <th>작성일</th>
              <th>작업</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="inquiry in filteredInquiries" :key="inquiry.id">
              <td>{{ inquiry.id }}</td>
              <td>{{ inquiry.title }}</td>
              <td>{{ inquiry.author }}</td>
              <td>
                <span :class="getStatusClass(inquiry.status)">
                  {{ inquiry.status }}
                </span>
              </td>
              <td>{{ inquiry.createdAt }}</td>
              <td>
                <div class="action-buttons">
                  <button @click="viewInquiry(inquiry)" class="view-btn">보기</button>
                  <button v-if="inquiry.status === '답변대기'" @click="replyInquiry(inquiry)" class="reply-btn">답변</button>
                  <select v-model="inquiry.newStatus" @change="updateStatus(inquiry)" class="status-select">
                    <option value="">상태 변경</option>
                    <option value="답변대기">답변대기</option>
                    <option value="처리중">처리중</option>
                    <option value="답변완료">답변완료</option>
                    <option value="반려">반려</option>
                  </select>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- 문의 상세 보기 모달 -->
      <div v-if="selectedInquiry" class="modal">
        <div class="modal-content">
          <div class="modal-header">
            <h2>{{ selectedInquiry.title }}</h2>
            <button @click="closeModal" class="close-btn">×</button>
          </div>
          <div class="modal-body">
            <div class="inquiry-detail">
              <p><strong>작성자:</strong> {{ selectedInquiry.author }}</p>
              <p><strong>냉장고:</strong> {{ selectedInquiry.fridgeName }}</p>
              <p><strong>작성일:</strong> {{ selectedInquiry.createdAt }}</p>
              <p><strong>내용:</strong></p>
              <div class="content">{{ selectedInquiry.content }}</div>
              
              <!-- 첨부 이미지 표시 -->
              <div v-if="selectedInquiry.imageUrls && selectedInquiry.imageUrls.length > 0" class="inquiry-images">
                <p><strong>첨부 이미지:</strong></p>
                <div class="image-gallery">
                  <div v-for="(imageUrl, index) in selectedInquiry.imageUrls" :key="index" class="image-item">
                    <img 
                      :src="imageUrl" 
                      :alt="`문의 이미지 ${index + 1}`"
                      @click="openImageModal(imageUrl)"
                      @error="handleImageError"
                      class="inquiry-image"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div v-if="selectedInquiry.reply" class="reply-detail">
              <h3>답변</h3>
              <div class="content">{{ selectedInquiry.reply }}</div>
              <p><strong>답변일:</strong> {{ selectedInquiry.replyDate }}</p>
              <div class="reply-actions">
                <button @click="editReply" class="edit-reply-btn">답변 수정</button>
              </div>
            </div>
            
            <div v-else-if="isReplyMode" class="reply-form">
              <h3>답변 작성</h3>
              <div class="no-reply-info">
                <p class="no-reply-message">답변이 아직 없습니다.</p>
              </div>
              <textarea v-model="replyContent" placeholder="답변을 입력하세요..." rows="5"></textarea>
              <div class="form-actions">
                <button @click="submitReply" class="submit-btn">답변 등록</button>
                <button @click="closeModal" class="cancel-btn">취소</button>
              </div>
            </div>
            
            <div v-else class="no-reply-view">
              <h3>답변</h3>
              <div class="no-reply-info">
                <p class="no-reply-message">답변이 아직 없습니다.</p>
              </div>
            </div>
            
            <!-- 답변 수정 모달 -->
            <div v-if="isEditReplyMode" class="reply-form">
              <h3>답변 수정</h3>
              <div class="no-reply-info">
                <p class="no-reply-message">기존 답변을 수정하세요.</p>
              </div>
              <textarea v-model="editReplyContent" placeholder="수정할 답변 내용을 입력하세요..." rows="5"></textarea>
              <div class="form-actions">
                <button @click="submitEditReply" class="submit-btn">수정 완료</button>
                <button @click="cancelEditReply" class="cancel-btn">취소</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 이미지 확대보기 모달 -->
      <div v-if="selectedImage" class="image-modal" @click="closeImageModal">
        <div class="image-modal-content" @click.stop>
          <button @click="closeImageModal" class="image-close-btn">×</button>
          <img :src="selectedImage" alt="확대 이미지" class="enlarged-image" />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import { snackbar } from '@/composables/snackbar';

export default {
  name: 'InquiryList',
  data() {
    return {
      inquiries: [],
      filteredInquiries: [],
      statusFilter: '',
      searchQuery: '',
      selectedInquiry: null,
      replyContent: '',
      isReplyMode: false,
      isEditReplyMode: false,
      editReplyContent: '',
      loading: true,
      selectedImage: null // 이미지 확대보기용
    }
  },
  mounted() {
    this.loadInquiries();
  },
  methods: {
    // 작성자를 이름(이메일) 형식으로 표시
    formatAuthor(inquiry) {
      return inquiry.memberName ? `${inquiry.memberName}(${inquiry.memberEmail})` : inquiry.memberEmail;
    },

    async loadInquiries() {
      try {
        this.loading = true;
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/inquiry/list`);
        
        console.log('Admin Inquiry API Response:', response.data);
        
        if (response.data.status_code === 200) {
          console.log('First inquiry item:', response.data.result[0]);
          
          this.inquiries = await Promise.all(response.data.result.map(async (inquiry) => {
            return {
              // InquiryResDto 구조에 맞게 수정
              id: inquiry.inquiryId,
              title: inquiry.title,
              author: this.formatAuthor(inquiry),
              fridgeName: inquiry.fridgeName || '정보 없음',
              status: this.mapStatus(inquiry.status),
              createdAt: inquiry.createdTime ? this.formatDate(inquiry.createdTime) : '-',
              content: inquiry.contents,
              imageUrls: inquiry.imageUrls || [], // 이미지 URL 배열 추가
              // OneToOne 관계로 변경된 comments 처리
              reply: inquiry.comments ? 
                    (inquiry.comments.commentContents || inquiry.comments.contents) : null,
              replyDate: inquiry.comments && inquiry.comments.createdTime 
                        ? this.formatDate(inquiry.comments.createdTime) : null,
              newStatus: '' // 상태 변경용
            };
          }));
          this.filteredInquiries = [...this.inquiries];
        }
      } catch (error) {
        console.error('문의 목록 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        snackbar.show('문의 목록 로드에 실패했습니다.', 'error');
      } finally {
        this.loading = false;
      }
    },
    
    filterInquiries() {
      let filtered = [...this.inquiries];
      
      if (this.statusFilter) {
        filtered = filtered.filter(inquiry => inquiry.status === this.statusFilter);
      }
      
      if (this.searchQuery) {
        filtered = filtered.filter(inquiry => 
          inquiry.title.toLowerCase().includes(this.searchQuery.toLowerCase())
        );
      }
      
      this.filteredInquiries = filtered;
    },
    
    async viewInquiry(inquiry) {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/admin/inquiry/detail/${inquiry.id}`);
        
        console.log('Inquiry Detail API Response:', response.data);
        console.log('Inquiry Detail Result:', response.data.result);
        console.log('Comments in detail:', response.data.result?.comments);
        console.log('Comments keys:', response.data.result?.comments ? Object.keys(response.data.result.comments) : 'No comments');
        console.log('Comments full object:', JSON.stringify(response.data.result?.comments, null, 2));
        
        if (response.data.status_code === 200) {
          const inquiryDetail = response.data.result;
          this.selectedInquiry = {
            ...inquiry,
            content: inquiryDetail.contents,
            title: inquiryDetail.title,
            author: this.formatAuthor(inquiryDetail),
            fridgeName: inquiryDetail.fridgeName || '정보 없음',
            createdAt: inquiryDetail.createdTime ? this.formatDate(inquiryDetail.createdTime) : '-',
            imageUrls: inquiryDetail.imageUrls || [], // 이미지 URL 배열 추가
            // OneToOne 관계로 변경된 comments 처리
            reply: inquiryDetail.comments ? 
                  (inquiryDetail.comments.commentContents || inquiryDetail.comments.contents) : null,
            replyDate: inquiryDetail.comments && inquiryDetail.comments.createdTime 
                      ? this.formatDate(inquiryDetail.comments.createdTime) 
                      : (inquiryDetail.comments ? inquiryDetail.createdTime ? this.formatDate(inquiryDetail.createdTime) : '답변일 정보 없음' : null)
          };
        } else {
          this.selectedInquiry = inquiry;
        }
        this.isReplyMode = false; // 보기 모드
        this.replyContent = '';
      } catch (error) {
        console.error('문의 상세 정보 로드 실패:', error);
        console.error('Error details:', error.response?.data);
        this.selectedInquiry = inquiry;
        this.isReplyMode = false; // 보기 모드
        this.replyContent = '';
      }
    },
    
    replyInquiry(inquiry) {
      this.selectedInquiry = inquiry;
      this.isReplyMode = true; // 답변 모드
      this.replyContent = '';
    },
    
    async submitReply() {
      if (!this.replyContent.trim()) {
        alert('답변 내용을 입력해주세요.');
        return;
      }
      
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/admin/inquiry/reply/${this.selectedInquiry.id}`,
          {
            commentContents: this.replyContent
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.status_code === 201) {
          // OneToOne 관계에 맞게 답변 정보 업데이트
          this.selectedInquiry.reply = this.replyContent;
          this.selectedInquiry.replyDate = this.formatDate(new Date());
          this.selectedInquiry.status = '답변완료';
          
          // comments 객체도 업데이트 (백엔드에서 반환된 데이터가 있다면)
          if (response.data.result && response.data.result.comments) {
            this.selectedInquiry.comments = response.data.result.comments;
          } else {
            // 임시로 현재 시간으로 설정
            this.selectedInquiry.comments = {
              commentContents: this.replyContent,
              createdTime: new Date().toISOString()
            };
          }
          
          // 목록 업데이트
          const index = this.inquiries.findIndex(i => i.id === this.selectedInquiry.id);
          if (index !== -1) {
            this.inquiries[index] = { ...this.selectedInquiry };
          }
          
          this.filterInquiries();
          this.closeModal();
          
          snackbar.show('답변이 성공적으로 등록되었습니다.', 'success');
        }
      } catch (error) {
        console.error('답변 등록 실패:', error);
        snackbar.show('답변 등록에 실패했습니다.', 'error');
      }
    },
    
    closeModal() {
      this.selectedInquiry = null;
      this.replyContent = '';
      this.isReplyMode = false;
      this.isEditReplyMode = false;
      this.editReplyContent = '';
    },

    editReply() {
      this.isEditReplyMode = true;
      this.editReplyContent = this.selectedInquiry.reply;
    },

    cancelEditReply() {
      this.isEditReplyMode = false;
      this.editReplyContent = '';
    },

    async submitEditReply() {
      if (!this.editReplyContent.trim()) {
        alert('수정할 답변 내용을 입력해주세요.');
        return;
      }

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/admin/inquiry/${this.selectedInquiry.id}/reply/update`,
          {
            newCommentContents: this.editReplyContent
          },
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );

        if (response.data.status_code === 200) {
          // 답변 정보 업데이트
          this.selectedInquiry.reply = this.editReplyContent;
          this.selectedInquiry.replyDate = this.formatDate(new Date());
          
          // 목록 업데이트
          const index = this.inquiries.findIndex(i => i.id === this.selectedInquiry.id);
          if (index !== -1) {
            this.inquiries[index] = { ...this.selectedInquiry };
          }
          
          this.filterInquiries();
          this.cancelEditReply();
          
          snackbar.show('답변이 성공적으로 수정되었습니다.', 'success');
        }
      } catch (error) {
        console.error('답변 수정 실패:', error);
        snackbar.show('답변 수정에 실패했습니다.', 'error');
      }
    },
    
    openImageModal(imageUrl) {
      this.selectedImage = imageUrl;
    },
    
    closeImageModal() {
      this.selectedImage = null;
    },
    
    handleImageError(event) {
      console.error('이미지 로드 실패:', event.target.src);
      event.target.style.display = 'none';
    },
    
    logout() {
      localStorage.clear();
      this.$store.dispatch('user/logout');
      this.$router.push('/');
    },
    
    // 상태 매핑 메서드
    mapStatus(status) {
      const statusMap = {
        'PENDING': '답변대기',
        'IN_PROGRESS': '처리중',
        'COMPLETED': '답변완료',
        'CANCELLED': '반려'
      };
      return statusMap[status] || '답변대기';
    },
    
    // 상태를 서버 형식으로 변환하는 메서드
    mapStatusToServer(status) {
      const statusMap = {
        '답변대기': 'PENDING',
        '처리중': 'IN_PROGRESS',
        '답변완료': 'COMPLETED',
        '반려': 'CANCELLED'
      };
      return statusMap[status] || 'PENDING';
    },
    
    // 날짜 포맷팅 메서드
    formatDate(dateString) {
      try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
          return '-';
        }
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (error) {
        console.error('날짜 포맷팅 오류:', error);
        return '-';
      }
    },
    
    // 상태 클래스 반환 메서드
    getStatusClass(status) {
      const statusClasses = {
        '답변대기': 'pending',
        '처리중': 'processing',
        '답변완료': 'completed',
        '반려': 'rejected'
      };
      return statusClasses[status] || 'pending';
    },
    
    // 상태 업데이트 메서드
    async updateStatus(inquiry) {
      if (!inquiry.newStatus || inquiry.newStatus === inquiry.status) {
        return;
      }
      
      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/admin/inquiry/${inquiry.id}/update`,
          this.mapStatusToServer(inquiry.newStatus),
          {
            headers: {
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.data.status_code === 200) {
          inquiry.status = inquiry.newStatus;
          inquiry.newStatus = '';
          
          // 목록 업데이트
          const index = this.inquiries.findIndex(i => i.id === inquiry.id);
          if (index !== -1) {
            this.inquiries[index] = { ...inquiry };
          }
          
          this.filterInquiries();
          
          snackbar.show('상태가 성공적으로 변경되었습니다.', 'success');
        }
      } catch (error) {
        console.error('상태 변경 실패:', error);
        inquiry.newStatus = ''; // 실패 시 선택 초기화
        snackbar.show('상태 변경에 실패했습니다.', 'error');
      }
    }
  }
}
</script>

<style scoped src="@/styles/pages/admin.css"></style>
