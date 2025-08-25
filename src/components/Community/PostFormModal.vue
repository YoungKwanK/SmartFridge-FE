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
                  :items="boardTypeOptions"
                  item-title="category"
                  item-value="id"
                  variant="outlined"
                  density="compact"
                  class="form-field"
                  :disabled="!!editingPost.id"
                  required
                ></v-select>
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
                  v-model="formData.imageFiles"
                  multiple
                  variant="outlined"
                  density="compact"
                  class="form-field"
                  accept="image/*"
                  prepend-icon="mdi-image"
                  placeholder="이미지 파일을 선택하세요 (여러 개 선택 가능)"
                  hide-details
                  @change="handleImageFilesChange"
                ></v-file-input>
                <small class="text-caption text-grey">
                  여러 이미지를 선택할 수 있습니다. 각 이미지는 내용에 삽입하거나 첨부파일로 저장할 수 있습니다.
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
  </v-dialog>
</template>

<script>
import axios from 'axios';

export default {
  name: 'PostFormModal',
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
  data() {
    return {
      isValid: false,
      isSaving: false,
      formData: {
        category: 2, // 기본값을 숫자 ID로 설정
        title: '',
        content: '',
        imageFiles: []
      },
      boardTypeOptions: []
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
    }
  },
  async created() {
    await this.fetchCategories();
  },
  watch: {
    editingPost: {
      handler(newPost) {
        if (newPost.id) {
          // 수정 모드
          this.formData = {
            category: this.getCategoryId(newPost.category),
            title: newPost.title || '',
            content: newPost.content || '',
            imageFiles: newPost.attachments || []
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
        // boardType 문자열에 해당하는 카테고리 ID 찾기
        const categoryOption = this.boardTypeOptions.find(cat => cat.category === newBoardType);
        if (categoryOption) {
          this.formData.category = categoryOption.id;
        }
      }
    }
  },
  methods: {
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
          `${process.env.VUE_APP_API_BASE_URL}/api/images/upload`,
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



    async fetchCategories() {
      try {
        const token = localStorage.getItem('accessToken');
        const response = await axios.get(`${process.env.VUE_APP_API_BASE_URL}/api/categories`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // 백엔드에서 카테고리 데이터를 받아옴
        this.boardTypeOptions = response.data;
        
        // 기본 카테고리 설정
        if (this.boardTypeOptions.length > 0) {
          const defaultCategory = this.boardTypeOptions.find(cat => 
            cat.category === this.boardType || cat.id === 2
          );
          if (defaultCategory) {
            this.formData.category = defaultCategory.id;  // ID만 저장
            console.log('기본 카테고리 설정:', defaultCategory.id, typeof defaultCategory.id);
          }
        }
      } catch (error) {
        console.error("커뮤니티 카테고리 목록을 불러오는 데 실패했습니다.", error);
        // API 호출 실패 시 기본값으로 설정
        this.boardTypeOptions = [
          { id: 1, category: '공지사항' },
          { id: 2, category: '자유게시판' },
          { id: 3, category: '꿀팁' },
          { id: 4, category: '레시피' }
        ];
        this.formData.category = 2; // 자유게시판 기본값
      }
    },
    resetForm() {
      this.formData = {
        category: this.getDefaultCategoryId(),
        title: '',
        content: '',
        imageFiles: []
      };
      this.$refs.form?.resetValidation();
      
      // 디버깅용 로그
      console.log('폼 초기화 - 카테고리 ID:', this.formData.category, typeof this.formData.category);
      console.log('현재 boardTypeOptions:', this.boardTypeOptions);
    },

    // 카테고리 문자열이나 ID를 숫자 ID로 변환
    getCategoryId(categoryValue) {
      console.log('getCategoryId 호출 - 입력값:', categoryValue, typeof categoryValue);
      
      // 이미 숫자인 경우 그대로 반환
      if (typeof categoryValue === 'number') {
        console.log('숫자 타입 반환:', categoryValue);
        return categoryValue;
      }
      
      // 문자열인 경우 해당하는 카테고리 ID 찾기
      if (typeof categoryValue === 'string') {
        const categoryOption = this.boardTypeOptions.find(cat => cat.category === categoryValue);
        if (categoryOption) {
          console.log('문자열에서 ID 찾음:', categoryOption.id);
          return categoryOption.id;
        }
      }
      
      // 객체인 경우 ID 추출 시도
      if (typeof categoryValue === 'object' && categoryValue !== null) {
        console.log('객체에서 ID 추출 시도:', categoryValue);
        if (categoryValue.id !== undefined) {
          console.log('객체에서 ID 추출 성공:', categoryValue.id);
          return categoryValue.id;
        }
      }
      
      // 기본값 반환
      console.log('기본값 반환: 2');
      return 2; // 자유게시판 기본값
    },
    
    // 기본 카테고리 ID 반환
    getDefaultCategoryId() {
      if (this.boardTypeOptions.length > 0) {
        const defaultCategory = this.boardTypeOptions.find(cat => 
          cat.category === this.boardType || cat.id === 2
        );
        return defaultCategory ? defaultCategory.id : 2;
      }
      return 2; // 자유게시판 기본값
    },
    
    closeModal() {
      this.dialog = false;
      this.resetForm();
    },
    
    // savePost 메서드 수정 - 이미지 업로드 로직 추가
    async savePost() {
      if (!this.$refs.form.validate()) return;
      
      // 카테고리 ID 최종 검증 및 변환
      console.log('=== 카테고리 디버깅 ===');
      console.log('formData.category:', this.formData.category);
      console.log('formData.category 타입:', typeof this.formData.category);
      console.log('boardTypeOptions:', this.boardTypeOptions);
      
      const categoryId = this.getCategoryId(this.formData.category);
      console.log('변환된 categoryId:', categoryId, typeof categoryId);
      
      if (!categoryId || typeof categoryId !== 'number') {
        console.error('유효하지 않은 카테고리 ID:', this.formData.category, '변환된 값:', categoryId);
        alert('카테고리를 선택해주세요.');
        return;
      }
      
      try {
        this.isSaving = true;
        
                 // 이미지가 있다면 먼저 업로드
         let imageUrls = [];
         if (this.formData.imageFiles && this.formData.imageFiles.length > 0) {
           imageUrls = await this.uploadImages(this.formData.imageFiles);
         }
         
         // formData.imageUrls와 새로 업로드된 이미지 URL을 합침
         const allImageUrls = [
           ...(this.formData.imageUrls || []),  // 이미 삽입된 이미지들
           ...imageUrls  // 새로 업로드된 이미지들
         ];
         
         console.log('=== 이미지 URL 디버깅 ===');
         console.log('formData.imageUrls (삽입된 이미지):', this.formData.imageUrls);
         console.log('새로 업로드된 imageUrls:', imageUrls);
         console.log('최종 allImageUrls:', allImageUrls);
         
         // 게시글 데이터 준비 (이미지 URL 포함)
         const postData = {
           title: this.formData.title,
           content: this.formData.content,
           categoryId: categoryId,  // 검증된 카테고리 ID 사용
           imageUrls: allImageUrls  // 모든 이미지 URL 배열 추가
         };
        
        // 수정 모드일 때만 id 포함
        if (this.editingPost.id) {
          postData.id = this.editingPost.id;
        }
        
        console.log('전송할 게시글 데이터:', postData); // 디버깅용
        this.$emit('save', postData);
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
          
          // imageUrls 배열에 추가
          if (!this.formData.imageUrls) {
            this.formData.imageUrls = [];
          }
          this.formData.imageUrls.push(imageUrl);
          
          console.log('이미지 URL 추가 후 imageUrls:', this.formData.imageUrls);
          
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
          
          // 미리보기에서 제거
          this.formData.imageFiles.splice(index, 1);
        }
      } catch (error) {
        console.error('이미지 업로드 실패:', error);
        // 에러 처리 (사용자에게 알림 등)
      }
    },

    // 이미지 제거 메서드
    removeImage(index) {
      this.formData.imageFiles.splice(index, 1);
    },

    // 파일 입력 변경 시 이미지 파일만 필터링
    handleImageFilesChange(event) {
      this.formData.imageFiles = Array.from(event.target.files).filter(file => file.type.startsWith('image/'));
    },

    // 마크다운 이미지 태그를 HTML로 변환
    convertMarkdownToHtml(content) {
      if (!content) return '';
      
      // ![alt](url) 형식을 <img src="url" alt="alt"> 형식으로 변환
      return content.replace(
        /!\[([^\]]*)\]\(([^)]+)\)/g,
        '<img src="$2" alt="$1" style="max-width: 100%; height: auto; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">'
      );
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
