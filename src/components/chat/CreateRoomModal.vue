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
        <v-form @submit.prevent="handleCreateRoom">
          <v-text-field
            v-model="newRoomData.title"
            label="방 제목"
            variant="outlined"
            density="compact"
            :rules="[v => !!v || '방 제목은 필수입니다.']"
          ></v-text-field>
          <v-textarea
            v-model="newRoomData.contents"
            label="설명"
            variant="outlined"
            density="compact"
            rows="4"
            no-resize
          ></v-textarea>
          <v-text-field
            v-model="newRoomData.productUrl"
            label="공동구매 링크"
            variant="outlined"
            density="compact"
          ></v-text-field>
          <v-text-field
            v-model.number="newRoomData.maxParticipants"
            label="모집 인원"
            variant="outlined"
            density="compact"
            type="number"
            min="2"
            max="20"
            :rules="[
              v => v >= 2 || '최소 2명 이상이어야 합니다.',
              v => v <= 20 || '최대 20명까지만 가능합니다.'
            ]"
            @input="validateParticipants"
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
const newRoomData = ref({
  title: '',
  contents: '',
  maxParticipants: 2,
  productUrl: ''
});

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
  if (!newRoomData.value.title) {
    alert('방 제목을 입력해주세요.');
    return;
  }
  
  // 최종 검증 (혹시 모르는 경우를 대비)
  validateParticipants();
  
  isCreating.value = true;
  try {
    const payload = {
      ...newRoomData.value,
      fridgeId: props.fridgeId // 생성 시 필요한 fridgeId 추가
    };
    await axios.post(`${process.env.VUE_APP_API_BASE_URL}/purchase/chat/create`, payload);
    alert('새로운 공동구매 채팅방이 생성되었습니다.');
    emit('room-created');
    closeModal();
    window.location.reload();
  } catch (err) {
    console.error("채팅방 생성 실패:", err);
    alert(getErrorMessage(err));
  } finally {
    isCreating.value = false;
  }
};
</script>