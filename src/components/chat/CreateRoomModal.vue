<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="closeModal" 
    max-width="500px"
    persistent
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center pa-4">
        <span class="text-h6 font-weight-bold">새 공동구매 만들기</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeModal"></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="py-5">
        <v-form @submit.prevent="handleCreateRoom" ref="formRef">
          <v-text-field
            v-model="newRoomData.title"
            label="방 제목"
            variant="outlined"
            density="compact"
            :rules="titleRules"
            :counter="20"
            :maxlength="20"
            placeholder="예: 맛있는 과자 공동구매"
            class="mb-4"
          ></v-text-field>
          
          <v-textarea
            v-model="newRoomData.contents"
            label="설명 (선택사항)"
            variant="outlined"
            density="compact"
            rows="4"
            no-resize
            :counter="100"
            :maxlength="100"
            :rules="contentsRules"
            placeholder="공동구매에 대한 자세한 설명을 입력해주세요"
            class="mb-4"
          ></v-textarea>
          
          <v-text-field
            v-model="newRoomData.productUrl"
            label="공동구매 링크 (선택사항)"
            variant="outlined"
            density="compact"
            placeholder="https://example.com/product"
            :rules="urlRules"
            prepend-inner-icon="mdi-link"
            class="mb-4"
          ></v-text-field>
          
          <v-text-field
            v-model.number="newRoomData.maxParticipants"
            label="모집 인원"
            variant="outlined"
            density="compact"
            type="number"
            min="2"
            max="20"
            :rules="participantRules"
            @input="validateParticipants"
            prepend-inner-icon="mdi-account-group"
          ></v-text-field>
        </v-form>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn @click="closeModal" min-width="100">취소</v-btn>
        <v-btn 
          color="primary" 
          variant="flat" 
          @click="handleCreateRoom" 
          min-width="100"
          :loading="isCreating"
        >
          생성
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { getErrorMessage } from '@/utils/commonDataHandler';

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  fridgeId: { type: [String, Number], required: true }
});

const emit = defineEmits(['update:modelValue', 'room-created']);

const isCreating = ref(false);
const formRef = ref(null);
const newRoomData = ref({
  title: '',
  contents: '',
  maxParticipants: 2,
  productUrl: ''
});

// 유효성 검사 규칙들
const titleRules = [
  v => (v && v.length >= 2) || '방 제목은 최소 2글자 이상이어야 합니다.',
  v => (v && v.length <= 20) || '방 제목은 최대 20글자까지 가능합니다.'
];

const contentsRules = [
  v => !v || v.length <= 100 || '설명은 최대 100글자까지 가능합니다.'
];

const urlRules = [
  v => !v || isValidUrl(v) || '올바른 URL을 입력해주세요.'
];

const participantRules = [
  v => v >= 2 || '최소 2명 이상이어야 합니다.',
  v => v <= 20 || '최대 20명까지만 가능합니다.',
  v => Number.isInteger(v) || '정수를 입력해주세요.'
];

const closeModal = () => {
  emit('update:modelValue', false);
  // 모달이 닫힐 때 입력 데이터 초기화
  newRoomData.value = { title: '', contents: '', maxParticipants: 2, productUrl: '' };
};

const validateParticipants = () => {
  // 입력 값이 범위를 벗어나면 자동으로 보정
  if (newRoomData.value.maxParticipants < 2) {
    newRoomData.value.maxParticipants = 2;
  } else if (newRoomData.value.maxParticipants > 20) {
    newRoomData.value.maxParticipants = 20;
  }
};

const handleCreateRoom = async () => {
  // 폼 유효성 검사
  const { valid } = await formRef.value.validate();
  if (!valid) {
    return;
  }
  
  // 최종 검증 (혹시 모르는 경우를 대비)
  validateParticipants();
  
  isCreating.value = true;
  try {
    const payload = {
      title: newRoomData.value.title.trim(),
      contents: newRoomData.value.contents?.trim() || '',
      maxParticipants: newRoomData.value.maxParticipants,
      productUrl: newRoomData.value.productUrl?.trim() || '',
      fridgeId: props.fridgeId
    };
    
    await axios.post(`${import.meta.env.VITE_API_BASE_URL}/purchase/chat/create`, payload);
    
    // 성공 메시지 표시
    alert('새로운 공동구매 채팅방이 생성되었습니다.');
    
    // 이벤트 발생 및 모달 닫기
    emit('room-created');
    closeModal();
    
    // 페이지 새로고침 대신 부모 컴포넌트에서 목록 새로고침
    // window.location.reload(); // 제거
    
  } catch (err) {
    console.error("채팅방 생성 실패:", err);
    const errorMessage = getErrorMessage(err);
    
    // 구체적인 에러 메시지 표시
    if (errorMessage.includes('이미 존재')) {
      alert('이미 같은 이름의 채팅방이 존재합니다. 다른 제목을 사용해주세요.');
    } else if (errorMessage.includes('권한')) {
      alert('채팅방을 생성할 권한이 없습니다.');
    } else {
      alert(`채팅방 생성에 실패했습니다: ${errorMessage}`);
    }
  } finally {
    isCreating.value = false;
  }
};

// URL 유효성 검사 함수
const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
};
</script>