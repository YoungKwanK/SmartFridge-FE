<template>
  <v-dialog v-model="dialog" max-width="1080" persistent scrollable>
    <v-card class="post-form">
      <header class="form-head">
        <h2 class="sf-form-title">{{ editingPost.id ? '글 수정' : (isPurchase ? '공동구매 모집하기' : '글쓰기') }}</h2>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="닫기" @click="closeModal" />
      </header>

      <v-card-text class="form-body">
        <v-form ref="form" v-model="isValid">
          <div class="form-layout">
            <div class="write-col">
              <div class="field">
                <label class="sf-field-label" for="post-board">게시판</label>
                <v-select
                  id="post-board"
                  v-model="formData.category"
                  :items="filteredBoardTypeOptions"
                  variant="outlined"
                  density="comfortable"
                  hide-details
                  :disabled="!!editingPost.id"
                />
              </div>

              <div v-if="isPurchase && !editingPost.id" class="purchase-fields">
                <div class="field-row">
                  <div class="field">
                    <label class="sf-field-label" for="post-max">모집 인원</label>
                    <v-text-field
                      id="post-max"
                      v-model.number="formData.maxParticipants"
                      type="number"
                      :min="MIN_PARTICIPANTS"
                      :max="MAX_PARTICIPANTS"
                      variant="outlined"
                      density="comfortable"
                      suffix="명 (나 포함)"
                      hide-details="auto"
                      :rules="participantRules"
                    />
                  </div>
                  <div class="field">
                    <label class="sf-field-label" for="post-url">상품 링크 <span class="sf-optional">선택</span></label>
                    <v-text-field
                      id="post-url"
                      v-model="formData.productUrl"
                      placeholder="https://"
                      variant="outlined"
                      density="comfortable"
                      hide-details="auto"
                      :rules="urlRules"
                    />
                  </div>
                </div>
                <p class="field-hint">글을 올리면 공동구매 채팅방이 같이 만들어지고, 내가 방장이 돼요.</p>
              </div>
              <p v-else-if="isPurchase && editingPost.id" class="field-hint is-block">
                모집 인원과 마감은 공동구매 채팅방에서 바꿀 수 있어요. 제목을 바꾸면 채팅방 이름도 같이 바뀌어요.
              </p>

              <div class="field">
                <label class="sf-field-label" for="post-title">제목</label>
                <v-text-field
                  id="post-title"
                  v-model="formData.title"
                  :placeholder="isPurchase ? '예: 코스트코 계란 30구 나눠 사실 분' : '제목을 입력하세요'"
                  variant="outlined"
                  density="comfortable"
                  hide-details="auto"
                  :rules="[v => !!v || '제목을 입력하세요']"
                />
              </div>

              <div class="field">
                <label class="sf-field-label" for="post-content">내용</label>
                <v-textarea
                  id="post-content"
                  ref="contentTextarea"
                  v-model="formData.content"
                  :placeholder="isPurchase ? '언제, 어디서 사는지, 한 사람당 얼마인지, 어떻게 나눌지 적어 주세요.' : '내용을 입력하세요'"
                  variant="outlined"
                  density="comfortable"
                  rows="10"
                  auto-grow
                  hide-details="auto"
                  :rules="[v => !!v || '내용을 입력하세요']"
                />
              </div>

              <div class="field">
                <label class="sf-field-label" for="post-images">사진 <span class="sf-optional">선택</span></label>
                <v-file-input
                  id="post-images"
                  :key="fileInputKey"
                  v-model="formData.imageFiles"
                  multiple
                  variant="outlined"
                  density="comfortable"
                  accept="image/*"
                  prepend-icon=""
                  prepend-inner-icon="mdi-image-outline"
                  placeholder="사진 고르기 (여러 장 가능)"
                  hide-details
                  @update:model-value="handleImageFilesChange"
                  @click:clear="clearFileInput"
                />
                <p class="field-hint">"본문에 넣기"를 누른 사진만 글에 들어가요. 본문에서 사진 줄을 지우면 그 사진은 빠져요.</p>
              </div>

              <ul v-if="formData.imageFiles && formData.imageFiles.length > 0" class="image-list">
                <li v-for="(file, index) in formData.imageFiles" :key="index" class="image-item">
                  <img :src="getImagePreview(file)" :alt="`사진 ${index + 1}`" />
                  <div class="image-actions">
                    <v-btn size="small" variant="tonal" color="primary" @click="insertImageToContent(file, index)">본문에 넣기</v-btn>
                    <v-btn size="small" variant="text" @click="removeImage(index)">빼기</v-btn>
                  </div>
                </li>
              </ul>
            </div>

            <aside class="preview-col" aria-label="미리보기">
              <p class="preview-label">미리보기</p>
              <div class="preview-body">
                <p class="preview-title">{{ formData.title || '제목' }}</p>
                <div v-if="formData.content" class="preview-content" v-html="convertMarkdownToHtml(formData.content)" />
                <p v-else class="preview-empty">내용을 쓰면 여기에 보여요.</p>
              </div>
            </aside>
          </div>
        </v-form>
      </v-card-text>

      <v-card-actions class="form-actions">
        <v-spacer />
        <v-btn variant="text" @click="closeModal">취소</v-btn>
        <v-btn
          :color="isPurchase && !editingPost.id ? 'cta' : 'primary'"
          variant="flat"
          :loading="isSaving"
          :disabled="!isValid"
          @click="savePost"
        >
          {{ editingPost.id ? '수정 내용 저장' : (isPurchase ? '모집 글 올리기' : '글 올리기') }}
        </v-btn>
      </v-card-actions>
    </v-card>

    <CommonSnackbar ref="commonSnackbar" />
  </v-dialog>
</template>

<script>
import axios from 'axios';
import CommonSnackbar from '@/components/layout/CommonSnackbar.vue';
import { useStore } from 'vuex';
import { fetchPostCategories, NOTICE_CATEGORY, DEFAULT_CATEGORY, PURCHASE_CATEGORY } from '@/utils/postCategory';

// 공동구매 모집 인원 범위 (백엔드 PurchasePost.MIN/MAX_PARTICIPANTS 와 같은 값)
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
.post-form {
  border-radius: var(--sf-radius-lg) !important;
}

.form-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 16px 8px 24px;
}

.form-body {
  padding: 8px 24px 16px !important;
}

.form-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 0.8fr);
  gap: 24px;
  align-items: start;
}

.field {
  margin-bottom: 18px;
  min-width: 0;
}

.field-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 12px;
}

.field-row .field {
  margin-bottom: 0;
}

.field-hint {
  margin: 6px 0 0;
  font-size: 13px;
  line-height: 1.5;
  color: var(--sf-text-faint);
}

.field-hint.is-block {
  margin: 0 0 18px;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--sf-bg);
  color: var(--sf-text-sub);
}

.purchase-fields {
  margin-bottom: 18px;
  padding: 14px;
  border: 1px solid #FFD9C2;
  border-radius: var(--sf-radius-md);
  background: #FFF7F2;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin: -6px 0 0;
  padding: 0;
  list-style: none;
}

.image-item {
  width: 148px;
}

.image-item img {
  display: block;
  width: 100%;
  height: 100px;
  border-radius: 10px;
  object-fit: cover;
  background: var(--sf-line);
}

.image-actions {
  display: flex;
  gap: 4px;
  margin-top: 6px;
}

.preview-col {
  position: sticky;
  top: 0;
  min-height: 320px;
  padding: 16px;
  border-radius: var(--sf-radius-md);
  background: var(--sf-bg);
}

.preview-label {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  color: var(--sf-text-faint);
}

.preview-body {
  padding: 18px;
  border-radius: 10px;
  background: var(--sf-surface);
}

.preview-title {
  margin: 0 0 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--sf-line);
  font-size: 18px;
  font-weight: 800;
  word-break: keep-all;
  color: var(--sf-text);
}

.preview-content {
  font-size: 15px;
  line-height: 1.7;
  white-space: pre-wrap;
  word-break: break-word;
  color: var(--sf-text);
}

.preview-content :deep(img) {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 12px 0;
  border-radius: 10px;
  box-shadow: none !important;
}

.preview-empty {
  margin: 0;
  font-size: 14px;
  color: var(--sf-text-faint);
}

.form-actions {
  padding: 12px 24px 20px !important;
  border-top: 1px solid var(--sf-line);
}

@media (max-width: 960px) {
  .form-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .preview-col {
    position: static;
    min-height: 0;
  }
}

@media (max-width: 600px) {
  .form-head {
    padding: 16px 8px 4px 16px;
  }

  .form-body {
    padding: 8px 16px 12px !important;
  }

  .field-row {
    grid-template-columns: minmax(0, 1fr);
    gap: 18px;
  }

  .form-actions {
    padding: 12px 16px 16px !important;
  }
}
</style>

