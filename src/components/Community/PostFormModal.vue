<template>
  <v-dialog v-model="dialog" max-width="1200" persistent>
    <v-card>
      <v-card-title class="modal-header">
        <span class="modal-title">{{ editingPost.id ? '게시글 수정' : '새 게시글 작성' }}</span>
        <v-btn icon @click="closeModal" class="close-btn">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-title>

      <v-card-text class="modal-content">
        <v-form ref="form" v-model="isValid">
          <div class="form-layout">
            <!-- 왼쪽: 작성 영역 -->
            <div class="form-section">
              <!-- 게시판 선택 -->
              <div class="form-row">
                <label class="form-label">게시판</label>
                <v-select
                  v-model="formData.category"
                  :items="filteredBoardTypeOptions"
                  variant="outlined"
                  density="compact"
                  class="form-field"
                  :disabled="!!editingPost.id"
                  required
                ></v-select>
              </div>

              <!-- 공동구매 모집 정보 (새 글일 때만. 등록하면 채팅방이 같이 생긴다) -->
              <template v-if="isPurchase && !editingPost.id">
                <div class="form-row">
                  <label class="form-label">모집 인원 <span class="required">*</span></label>
                  <v-text-field
                    v-model.number="formData.maxParticipants"
                    type="number"
                    :min="MIN_PARTICIPANTS"
                    :max="MAX_PARTICIPANTS"
                    variant="outlined"
                    density="compact"
                    class="form-field"
                    suffix="명 (본인 포함)"
                    :rules="participantRules"
                  ></v-text-field>
                </div>
                <div class="form-row">
                  <label class="form-label">상품 링크</label>
                  <v-text-field
                    v-model="formData.productUrl"
                    placeholder="https://"
                    variant="outlined"
                    density="compact"
                    class="form-field"
                    :rules="urlRules"
                  ></v-text-field>
                  <small class="text-body-small text-grey">
                    등록하면 공동구매 채팅방이 같이 만들어지고, 작성자가 방장이 됩니다.
                  </small>
                </div>
              </template>
              <div v-else-if="isPurchase && editingPost.id" class="form-row">
                <small class="text-body-small text-grey">
                  모집 인원·상태는 공동구매 채팅방에서 관리합니다. 제목을 바꾸면 채팅방 이름도 같이 바뀝니다.
                </small>
              </div>

              <!-- 제목 입력 -->
              <div class="form-row">
                <label class="form-label">제목 <span class="required">*</span></label>
                <v-text-field
                  v-model="formData.title"
                  placeholder="제목을 입력하세요"
                  variant="outlined"
                  density="compact"
                  class="form-field"
                  :rules="[v => !!v || '제목을 입력해주세요']"
                  required
                ></v-text-field>
              </div>

              <!-- 내용 입력 -->
              <div class="form-row">
                <label class="form-label">내용 <span class="required">*</span></label>
                <v-textarea
                  ref="contentTextarea"
                  v-model="formData.content"
                  placeholder="내용을 입력하세요"
                  variant="outlined"
                  density="compact"
                  class="form-field"
                  :rules="[v => !!v || '내용을 입력해주세요']"
                  rows="12"
                  auto-grow
                  required
                ></v-textarea>
              </div>

              <!-- 이미지 미리보기 및 삽입 -->
              <div class="form-row" v-if="formData.imageFiles && formData.imageFiles.length > 0">
                <label class="form-label">이미지 미리보기</label>
                <div class="image-preview-container">
                  <div 
                    v-for="(file, index) in formData.imageFiles" 
                    :key="index" 
                    class="image-preview-item"
                  >
                    <img 
                      :src="getImagePreview(file)" 
                      :alt="`이미지 ${index + 1}`"
                      class="image-preview"
                    />
                    <div class="image-actions">
                      <v-btn 
                        size="small" 
                        color="primary" 
                        @click="insertImageToContent(file, index)"
                        class="insert-btn"
                      >
                        내용에 삽입
                      </v-btn>
                      <v-btn 
                        size="small" 
                        color="error" 
                        @click="removeImage(index)"
                        class="remove-btn"
                      >
                        제거
                      </v-btn>
                    </div>
                  </div>
                </div>
              </div>

              <!-- 첨부파일 (선택사항) -->
              <div class="form-row">
                <label class="form-label">이미지 첨부</label>
                <v-file-input
                  :key="fileInputKey"
                  v-model="formData.imageFiles"
                  multiple
                  variant="outlined"
                  density="compact"
                  class="form-field"
                  accept="image/*"
                  prepend-icon="mdi-image"
                  placeholder="이미지 파일을 선택하세요 (여러 개 선택 가능)"
                  hide-details
                  @update:model-value="handleImageFilesChange"
                  @click:clear="clearFileInput"
                ></v-file-input>
                <small class="text-body-small text-grey">
                  여러 이미지를 선택할 수 있습니다. 각 이미지는 내용에 삽입하거나 첨부파일로 저장할 수 있습니다.<br>
                  <strong>참고:</strong> 이미지를 삽입한 후 내용에서 이미지 태그를 삭제하면 해당 이미지는 게시글에 포함되지 않습니다.
                </small>
              </div>
            </div>

            <!-- 오른쪽: 미리보기 영역 -->
            <div class="preview-section">
              <div class="preview-header">
                <h3 class="preview-title">미리보기</h3>
              </div>
              <div class="preview-content" v-html="convertMarkdownToHtml(formData.content)"></div>
            </div>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="modal-actions">
        <v-spacer></v-spacer>
        <v-btn @click="closeModal" variant="text" class="cancel-btn">
          취소
        </v-btn>
        <v-btn 
          @click="savePost" 
          color="primary" 
          :loading="isSaving"
          :disabled="!isValid"
          class="save-btn"
        >
          {{ editingPost.id ? '수정' : '등록' }}
        </v-btn>
      </v-card-actions>
    </v-card>
    
    <!-- Snackbar 컴포넌트 추가 -->
    <CommonSnackbar ref="commonSnackbar" />
  </v-dialog>
</template>

<script>
import axios from 'axios';
import CommonSnackbar from '@/components/common/CommonSnackbar.vue';
import { useStore } from 'vuex';
import { fetchPostCategories, NOTICE_CATEGORY, DEFAULT_CATEGORY, PURCHASE_CATEGORY } from '@/utils/postCategory';

// 공동구매 모집 인원 범위 (백엔드 ChatRoomCreateDto, 채팅 CreateRoomModal 과 같은 값)
const MIN_PARTICIPANTS = 2;
const MAX_PARTICIPANTS = 20;

export default {
  name: 'PostFormModal',
  components: {
    CommonSnackbar
  },
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    editingPost: {
      type: Object,
      default: () => ({})
    },
    boardType: {
      type: String,
      default: '자유게시판'
    }
  },
  emits: ['update:modelValue', 'save'],
  setup() {
    const store = useStore();
    return { store };
  },
  data() {
    return {
      isValid: false,
      isSaving: false,
      formData: {
        category: null, // 카테고리 이름 (예: '자유게시판'). fetchCategories에서 기본값 설정
        title: '',
        content: '',
        imageFiles: [],
        maxParticipants: MIN_PARTICIPANTS, // 공동구매 글일 때만 사용
        productUrl: ''
      },
      MIN_PARTICIPANTS,
      MAX_PARTICIPANTS,
      participantRules: [
        v => Number.isInteger(v) || '정수를 입력해주세요.',
        v => v >= MIN_PARTICIPANTS || `최소 ${MIN_PARTICIPANTS}명 이상이어야 합니다.`,
        v => v <= MAX_PARTICIPANTS || `최대 ${MAX_PARTICIPANTS}명까지만 가능합니다.`
      ],
      urlRules: [
        v => !v || /^https?:\/\/.+/.test(v.trim()) || 'http(s)로 시작하는 주소를 입력해주세요.'
      ],
      boardTypeOptions: [], // 카테고리 이름 목록 (예: ['공지사항', '자유게시판', '공동구매'])
      fileInputKey: 0, // 파일 입력 컴포넌트의 키를 위한 변수
      currentUserRole: 'COMMON', // 현재 사용자의 냉장고 역할
      fridgeInfo: null // 현재 냉장고 정보
    }
  },
  computed: {
    dialog: {
      get() {
        return this.modelValue;
      },
      set(value) {
        this.$emit('update:modelValue', value);
      }
    },
    // 공동구매 글인지 (등록하면 채팅방이 같이 생김)
    isPurchase() {
      return this.formData.category === PURCHASE_CATEGORY;
    },
    // 현재 사용자가 관리자인지 확인
    isManager() {
      return this.currentUserRole === 'MANAGER';
    },
    // 공지사항을 제외한 카테고리 목록 (관리자가 아닌 경우)
    filteredBoardTypeOptions() {
      if (this.isManager) {
        return this.boardTypeOptions;
      } else {
        // 관리자가 아닌 경우 공지사항 제외
        return this.boardTypeOptions.filter(category => category !== NOTICE_CATEGORY);
      }
    }
  },
  async created() {
    await this.checkUserRole();
    await this.fetchCategories();
  },
  watch: {
    editingPost: {
      handler(newPost) {
        if (newPost.id) {
          // 수정 모드
          this.formData = {
            category: newPost.category || DEFAULT_CATEGORY,
            title: newPost.title || '',
            content: newPost.content || '',
            imageFiles: [], // 수정 모드에서는 이미지 파일을 새로 선택하도록
            maxParticipants: MIN_PARTICIPANTS,
            productUrl: ''
          };
        } else {
          // 새 글 작성 모드
          this.resetForm();
        }
      },
      immediate: true
    },
    boardType(newBoardType) {
      if (!this.editingPost.id) {
        // 보고 있는 탭의 카테고리로 맞춤 (쓸 수 없는 카테고리면 자유게시판)
        this.formData.category = this.getDefaultCategory(newBoardType);
      }
    }
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

    // 이미지 업로드 메서드 추가
    async uploadImages(files) {
      try {
        // 파일이 없으면 빈 배열 반환
        if (!files || files.length === 0) {
          return [];
        }
        
        const formData = new FormData();
        files.forEach(file => {
          formData.append('images', file);
        });
        
        const token = localStorage.getItem('accessToken');
        const response = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL}/api/images/upload`,
          formData,
          {
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        );
        
        // CommonDto 구조에 맞춰 응답 처리
        return response.data.result; // 이미지 URL 배열 반환
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        throw error;
      }
    },



    // 카테고리 이름 목록 가져오기 (커뮤니티 화면과 같은 결과를 공유해서 요청은 한 번만 나감)
    async fetchCategories() {
      this.boardTypeOptions = await fetchPostCategories();
      if (!this.editingPost.id) {
        this.formData.category = this.getDefaultCategory(this.boardType);
      }
    },
    resetForm() {
      this.formData = {
        category: this.getDefaultCategory(this.boardType),
        title: '',
        content: '',
        imageFiles: [],
        maxParticipants: MIN_PARTICIPANTS,
        productUrl: ''
      };
      this.fileInputKey = 0; // 파일 입력 키 초기화
      this.$refs.form?.resetValidation();
    },

    // 새 글의 기본 카테고리: 보고 있는 탭의 카테고리. 쓸 수 없는 카테고리(전체, 일반 멤버의 공지사항)면 자유게시판
    getDefaultCategory(boardType) {
      return this.filteredBoardTypeOptions.includes(boardType) ? boardType : DEFAULT_CATEGORY;
    },
    
    closeModal() {
      this.dialog = false;
      this.resetForm();
      this.fileInputKey = 0; // 파일 입력 키 초기화
    },
    
    // savePost 메서드 수정 - 이미지 업로드 로직 추가
    async savePost() {
      if (!this.$refs.form.validate()) return;
      
      if (!this.formData.category) {
        this.showSnackbar('카테고리를 선택해주세요.', 'warning');
        return;
      }
      
      try {
        this.isSaving = true;
        
        // 내용에서 실제로 사용되는 이미지 URL만 추출
        const contentImageUrls = this.extractImageUrlsFromContent(this.formData.content);
        
        console.log('=== 이미지 URL 디버깅 ===');
        console.log('내용에서 추출된 이미지 URL:', contentImageUrls);
        
        // 게시글 데이터 준비 (실제 사용되는 이미지 URL만 포함)
        const postData = {
          title: this.formData.title,
          content: this.formData.content,
          category: this.formData.category,  // 카테고리 이름 (예: '자유게시판')
          imageUrls: contentImageUrls  // 내용에 실제로 삽입된 이미지 URL만
        };
        
        // 공동구매 새 글이면 모집 정보도 보낸다 (채팅방이 같이 생성됨)
        if (this.isPurchase && !this.editingPost.id) {
          postData.maxParticipants = this.formData.maxParticipants;
          postData.productUrl = this.formData.productUrl?.trim() || null;
        }

        // 수정 모드일 때만 id 포함
        if (this.editingPost.id) {
          postData.id = this.editingPost.id;
        }
        
        console.log('전송할 게시글 데이터:', postData); // 디버깅용
        this.$emit('save', postData);
        
        // 게시글 저장 성공 후 폼 초기화
        this.resetForm();
        this.fileInputKey = 0; // 파일 입력 키 초기화
      } catch (error) {
        console.error('게시글 저장 실패:', error);
      } finally {
        this.isSaving = false;
      }
    },

    // 이미지 미리보기 URL 생성
    getImagePreview(file) {
      if (file && file.url) {
        return file.url;
      } else if (file && file.name) {
        // 로컬 파일의 경우 미리보기 URL 생성
        return URL.createObjectURL(file);
      }
      return '';
    },

    // 이미지 삽입 메서드
    async insertImageToContent(file, index) {
      try {
        // 이미지를 S3에 먼저 업로드
        const uploadedUrls = await this.uploadImages([file]);
        
        if (uploadedUrls && uploadedUrls.length > 0) {
          const imageUrl = uploadedUrls[0]; // 업로드된 이미지 URL
          
          // 현재 커서 위치에 이미지 삽입
          const textarea = this.$refs.contentTextarea;
          if (textarea) {
            const cursorPos = textarea.selectionStart;
            const beforeCursor = this.formData.content.substring(0, cursorPos);
            const afterCursor = this.formData.content.substring(cursorPos);
            
            // 커서 위치에 이미지 태그 삽입 (공백 줄임)
            const imageTag = `\n![이미지 ${index + 1}](${imageUrl})\n`;
            this.formData.content = beforeCursor + imageTag + afterCursor;
            
            // 커서를 이미지 태그 다음으로 이동
            setTimeout(() => {
              const newCursorPos = cursorPos + imageTag.length;
              textarea.setSelectionRange(newCursorPos, newCursorPos);
              textarea.focus();
            }, 0);
          }
          
          // 이미지 삽입 후 미리보기에서 제거
          this.formData.imageFiles.splice(index, 1);
          this.fileInputKey++; // 파일 입력 컴포넌트의 키를 증가시켜 파일 입력 필드를 다시 렌더링
        }
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        // 에러 처리 (사용자에게 알림 등)
      }
    },

    // 이미지 제거 메서드
    removeImage(index) {
      this.formData.imageFiles.splice(index, 1);
      this.fileInputKey++; // 파일 입력 컴포넌트의 키를 증가시켜 파일 입력 필드를 다시 렌더링
    },

    // 파일 입력 변경 시 이미지 파일만 필터링
    handleImageFilesChange(files) {
      console.log('handleImageFilesChange 호출됨:', files);
      
      if (!files) {
        this.formData.imageFiles = [];
        return;
      }
      
      // Vuetify v-file-input에서는 files가 이미 배열 형태로 전달됨
      let fileArray;
      if (Array.isArray(files)) {
        fileArray = files;
      } else if (files instanceof FileList) {
        fileArray = Array.from(files);
      } else {
        console.error('예상치 못한 파일 타입:', typeof files, files);
        this.formData.imageFiles = [];
        return;
      }
      
      // 이미지 파일만 필터링
      this.formData.imageFiles = fileArray.filter(file => {
        const isValidImage = file.type.startsWith('image/');
        console.log('파일 검증:', file.name, file.type, isValidImage);
        return isValidImage;
      });
      
      console.log('최종 선택된 이미지 파일:', this.formData.imageFiles);
    },

    // 파일 입력 필드 클리어 시 호출되는 메서드
    clearFileInput() {
      this.formData.imageFiles = [];
      this.fileInputKey++; // 파일 입력 컴포넌트의 키를 증가시켜 파일 입력 필드를 다시 렌더링
    },

    // 내용에서 이미지 태그를 제거하고 해당 URL도 함께 제거하는 메서드 추가
    removeImageFromContent(imageUrl) {
      // 내용에서 해당 이미지 태그 제거
      const imageTagRegex = new RegExp(`\\n!\\[이미지 \\d+\\]\\(${imageUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)\\n`, 'g');
      this.formData.content = this.formData.content.replace(imageTagRegex, '');
    },

    // 마크다운 이미지 태그를 HTML로 변환
    convertMarkdownToHtml(content) {
      if (!content) return '';
      
      // ![alt](url) 형식을 <img src="url" alt="alt"> 형식으로 변환
      return content.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">'
      );
    },

    // 내용에서 이미지 URL을 추출하는 메서드 추가
    extractImageUrlsFromContent(content) {
      if (!content) return [];
      
      const imageUrlRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
      const imageUrls = [];
      let match;
      
      while ((match = imageUrlRegex.exec(content)) !== null) {
        imageUrls.push(match[2]); // URL 부분만 추출
      }
      
      return imageUrls;
    },

    showSnackbar(message, color) {
      this.$refs.commonSnackbar.showSnackbar(message, color);
    }
  }
}
</script>

<style scoped>
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px 0;
  border-bottom: 1px solid #e0e0e0;
}

.modal-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
}

.close-btn {
  margin: 0;
}

.modal-content {
  padding: 24px;
}

.form-layout {
  display: flex;
  gap: 20px; /* 작성 영역과 미리보기 사이의 간격 */
}

.form-section {
  flex: 1; /* 작성 영역과 미리보기 영역을 동일한 너비로 설정 */
  display: flex;
  flex-direction: column;
}

.form-row {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  color: #555;
  margin-bottom: 8px;
  font-weight: 500;
}

.required {
  color: #f44336;
}

.form-field {
  width: 100%;
}

.modal-actions {
  padding: 16px 24px 24px;
  border-top: 1px solid #e0e0e0;
}

.cancel-btn {
  margin-right: 12px;
}

.save-btn {
  text-transform: none;
  font-weight: 500;
}

.image-preview-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.image-preview-item {
  position: relative;
  width: 100px;
  height: 100px;
  border: 1px solid #ccc;
  border-radius: 4px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
}

.image-preview {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.image-actions {
  position: absolute;
  top: 5px;
  right: 5px;
  display: flex;
  gap: 5px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 4px;
  padding: 2px 5px;
  z-index: 1;
}

.insert-btn, .remove-btn {
  color: white;
  font-size: 12px;
  padding: 2px 5px;
  border-radius: 3px;
  text-transform: none;
}

.insert-btn:hover, .remove-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}

.preview-section {
  flex: 1; /* 미리보기 영역을 동일한 너비로 설정 */
  padding-left: 20px; /* 작성 영역과 미리보기 사이의 간격 */
  border-left: 1px solid #e0e0e0; /* 작성 영역과 미리보기 사이의 구분선 */
}

.preview-header {
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.preview-title {
  font-size: 18px;
  font-weight: 600;
  color: #333;
}

.preview-content {
  /* 마크다운 이미지 태그를 제외한 텍스트 스타일 */
  white-space: pre-wrap; /* 줄바꿈 유지 */
  word-break: break-all; /* 단어 단위로 줄바꿈 */
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  min-height: 400px; /* 미리보기 영역의 최소 높이 설정 */
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
}

.preview-content img {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.preview-content:empty::before {
  content: "내용을 입력하면 여기에 미리보기가 표시됩니다.";
  color: #999;
  font-style: italic;
}

@media (max-width: 600px) {
  .modal-header {
    padding: 16px 20px 0;
  }
  
  .modal-content {
    padding: 20px;
  }

  .form-layout {
    flex-direction: column;
  }

  .form-section {
    padding-left: 0;
    border-left: none;
  }

  .modal-actions {
    padding: 16px 20px 20px;
  }
}
</style>
