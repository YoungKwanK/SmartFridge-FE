<template>
  <v-dialog 
    :model-value="modelValue" 
    @update:model-value="closeModal" 
    max-width="500px"
  >
    <v-card rounded="lg">
      <v-card-title class="d-flex align-center pa-4">
        <span class="text-h6 font-weight-bold">채팅방 정보</span>
        <v-spacer></v-spacer>
        <v-btn icon="mdi-close" variant="text" @click="closeModal"></v-btn>
      </v-card-title>
      
      <v-divider></v-divider>
      
      <v-card-text class="py-5" v-if="room">
        <v-list lines="two">
          <v-list-item title="방 제목" :subtitle="room.title"></v-list-item>
          <v-list-item title="개설자" :subtitle="room.name"></v-list-item>
          <v-list-item title="참여 현황">
            <template v-slot:subtitle>
              <v-progress-linear
                :model-value="(room.currentParticipants / room.maxParticipants) * 100"
                :color="isRoomFull ? 'red' : 'green'"
                height="8"
                rounded
                class="my-1"
              ></v-progress-linear>
              {{ room.currentParticipants }} / {{ room.maxParticipants }} 명
            </template>
          </v-list-item>
          <v-list-item title="공동구매 링크" :subtitle="room.url"></v-list-item>
        </v-list>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-spacer></v-spacer>
        <v-btn 
          color="primary" 
          variant="flat" 
          @click="closeModal" 
          min-width="100"
        >
          확인
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { computed } from 'vue';

// props: 부모 컴포넌트로부터 데이터를 전달받습니다.
// 1. modelValue: v-model을 통해 모달의 열림/닫힘 상태를 제어 (boolean)
// 2. room: 표시할 채팅방의 정보 (object)
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true,
  },
  room: {
    type: Object,
    default: null,
  },
});

// emit: 자식 컴포넌트가 부모 컴포넌트로 이벤트를 보냅니다.
// 'update:modelValue'는 v-model의 값을 변경하기 위한 표준 이벤트입니다.
const emit = defineEmits(['update:modelValue']);

// 모달을 닫을 때 'update:modelValue' 이벤트를 발생시켜 부모의 상태를 변경합니다.
const closeModal = () => {
  emit('update:modelValue', false);
};

// 방이 꽉 찼는지 계산하는 computed 속성
const isRoomFull = computed(() => {
  if (!props.room) return false;
  return props.room.currentParticipants >= props.room.maxParticipants;
});
</script>

<style scoped>
.v-list-item-title {
  font-weight: 500 !important;
  color: #555;
  margin-bottom: 2px;
}
</style>