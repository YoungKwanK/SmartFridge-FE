<template>
  <v-container class="py-8">
    <v-row justify="center">
      <v-col cols="12" md="8" lg="6">
        <v-card class="pa-6" elevation="2">
          <v-card-title class="text-h5 text-center mb-6">
            관리자 문의
          </v-card-title>
          
          <v-form @submit.prevent="submitInquiry" ref="form">
            <v-text-field
              v-model="inquiryData.title"
              label="제목"
              placeholder="문의 제목을 입력해주세요"
              :rules="[rules.required]"
              variant="outlined"
              class="mb-4"
              required
            ></v-text-field>

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

            <v-textarea
              v-model="inquiryData.contents"
              label="문의 내용"
              placeholder="문의 내용을 자세히 작성해주세요"
              :rules="[rules.required, rules.minLength]"
              variant="outlined"
              rows="6"
              class="mb-6"
              required
            ></v-textarea>

            <v-row>
              <v-col cols="6">
                <v-btn
                  @click="resetForm"
                  variant="outlined"
                  color="grey"
                  block
                  size="large"
                >
                  초기화
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn
                  @click="submitInquiry"
                  color="primary"
                  block
                  size="large"
                  :loading="isSubmitting"
                  :disabled="!isFormValid"
                >
                  문의하기
                </v-btn>
              </v-col>
            </v-row>
          </v-form>
        </v-card>
      </v-col>
    </v-row>

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
      inquiryData: {
        title: '',
        type: '',
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
      snackbarColor: 'success'
    }
  },
  computed: {
    isFormValid() {
      return this.inquiryData.title && 
             this.inquiryData.type && 
             this.inquiryData.contents &&
             this.inquiryData.contents.length >= 10
    }
  },
  methods: {
    async submitInquiry() {
      if (!this.isFormValid) {
        this.showMessage('모든 필수 항목을 입력해주세요.', 'error')
        return
      }

      this.isSubmitting = true
      
      try {
        // 백엔드 API 호출
        const response = await this.sendInquiryToBackend()
        
        if (response.status_code === 201) {
          this.showMessage('문의가 성공적으로 전송되었습니다.', 'success')
          this.resetForm()
        } else {
          this.showMessage('문의 전송에 실패했습니다. 다시 시도해주세요.', 'error')
        }
      } catch (error) {
        console.error('문의 전송 오류:', error)
        this.showMessage('문의 전송 중 오류가 발생했습니다.', 'error')
      } finally {
        this.isSubmitting = false
      }
    },

    async sendInquiryToBackend() {
        try{
            const response = await axios.post(`${process.env.VUE_APP_API_BASE_URL}/inquiry/create/1`, this.inquiryData)
            return response.data
        }catch(error){
            console.error('문의 전송 오류:', error)
        }
    },

    resetForm() {
      this.inquiryData = {
        title: '',
        type: '',
        contents: ''
      }
      this.$refs.form?.resetValidation()
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
.v-card {
  border-radius: 12px;
}

.v-card-title {
  color: #1976d2;
  font-weight: 600;
}

.v-btn {
  border-radius: 8px;
  font-weight: 500;
}
</style>
