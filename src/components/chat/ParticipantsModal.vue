<template>
  <v-menu
    v-model="isOpen"
    :close-on-content-click="false"
    location="bottom end"
    offset="8"
    width="360px"
    eager
  >
    <template #activator="{ props: activatorProps }">
      <slot name="activator" :props="activatorProps" />
    </template>

    <v-card class="people-card">
      <header class="people-head">
        <div class="people-head-text">
          <h2 class="people-title">
            참여자 <span class="sf-num">{{ participants.length }}</span>
          </h2>
          <p class="people-room">{{ roomName || '채팅방' }}</p>
        </div>
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="닫기" @click="closeModal" />
      </header>

      <div class="people-body">
        <div v-if="isLoading" class="people-state">
          <v-progress-circular indeterminate color="primary" size="28" />
          <p>참여자를 불러오는 중이에요</p>
        </div>

        <div v-else-if="error" class="people-state">
          <p>{{ error }}</p>
          <v-btn variant="text" color="primary" @click="fetchParticipants">다시 불러오기</v-btn>
        </div>

        <p v-else-if="participants.length === 0" class="people-state">아직 참여자가 없어요</p>

        <ul v-else class="people-list">
          <li
            v-for="(participant, index) in participants"
            :key="participant.email || index"
            class="person"
          >
            <span class="person-avatar" aria-hidden="true">
              <img
                v-if="participant.profileImage && (participant.profileImage.startsWith('http') || participant.profileImage.startsWith('data:'))"
                :src="participant.profileImage"
                alt=""
                @error="handleImageError(participant)"
              />
              <span v-else>{{ getInitial(participant.name || participant.userName) }}</span>
              <span v-if="participant.isOnline" class="online-dot" />
            </span>
            <span class="person-text">
              <span class="person-name">
                {{ participant.name || participant.userName }}
                <span v-if="participant.isCreator || participant.isManager" class="role-tag">
                  {{ participant.isCreator ? '방장' : '관리자' }}
                </span>
              </span>
              <span class="person-email">{{ participant.email }}</span>
            </span>
            <span class="person-status" :class="{ 'is-online': participant.isOnline }">
              {{ participant.isOnline ? '접속 중' : '' }}
            </span>
          </li>
        </ul>
      </div>
    </v-card>
  </v-menu>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import axios from 'axios'
import { getResultData } from '@/utils/commonDataHandler'

const props = defineProps({
  modelValue: { type: Boolean, required: true },
  roomId: { type: [String, Number], default: null },
  roomType: { type: String, default: null },
  roomName: { type: String, default: null }
});

const emit = defineEmits(['update:modelValue', 'participants-count-updated']);

const participants = ref([]);
const isLoading = ref(false);
const error = ref(null);

// v-menu를 위한 computed property
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

// 이름의 첫 글자를 반환하는 함수
const getInitial = (name) => {
  if (!name) return '?';
  return name.charAt(0).toUpperCase();
};

// 이미지 로딩 오류 처리
const handleImageError = (participant) => {
  // 이미지 로딩 실패 시 profileImage를 null로 설정하여 초기값으로 대체
  participant.profileImage = null;
};

// API 호출 함수 - 공동구매 채팅방만 처리
const fetchParticipants = async () => {
  if (!props.roomId || !props.roomType || props.roomType !== 'purchase') return;

  isLoading.value = true;
  error.value = null;
  participants.value = [];

  try {
    // 공동구매 채팅방의 경우 - 채팅방 정보 API에서 참여자 정보 추출
    const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/purchase/chat/participants/${props.roomId}`);
    const participantsData = getResultData(response);

    if (participantsData) {
      // map을 사용해 participantsData 배열을 새로운 형식의 배열로 변환한 뒤 한 번에 할당
      participants.value = participantsData.map(participant => {
        // 프로필 이미지 유효성 검사
        let profileImage = null;
        if (participant.profileImage && participant.profileImage.trim() !== '') {
          // URL이 유효한지 확인
          if (participant.profileImage.startsWith('http') || participant.profileImage.startsWith('data:')) {
            profileImage = participant.profileImage;
          }
        }
        
        return {
          name: participant.memberName,
          email: participant.memberEmail,
          isCreator: participant.isCreator,
          isOnline: participant.isOnline,
          profileImage: profileImage
        };
      });
    }
  } catch (err) {
    console.error("참여자 목록 조회 실패:", err);
    error.value = "참여자 목록을 불러오는 데 실패했습니다.";
  } finally {
    isLoading.value = false;
  }
};

// 참여자 수를 부모 컴포넌트에 전달
const participantCount = computed(() => participants.value.length);

// 모달이 열릴 때 API 호출
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    fetchParticipants();
  }
}, {
  immediate: true
});

// 참여자 수가 변경될 때 부모에게 알림
watch(participantCount, (newCount) => {
  emit('participants-count-updated', newCount);
});

const closeModal = () => {
  isOpen.value = false;
};
</script>

<style scoped>
.people-card {
  border-radius: var(--sf-radius-lg) !important;
  box-shadow: 0 8px 28px rgba(34, 34, 34, 0.14) !important;
}

.people-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
  padding: 16px 8px 12px 18px;
  border-bottom: 1px solid var(--sf-line);
}

.people-head-text {
  min-width: 0;
}

.people-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--sf-text);
}

.people-title span {
  color: var(--sf-text-faint);
}

.people-room {
  margin: 2px 0 0;
  font-size: 13px;
  color: var(--sf-text-sub);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.people-body {
  max-height: 340px;
  overflow-y: auto;
}

.people-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  margin: 0;
  padding: 32px 16px;
  font-size: 14px;
  text-align: center;
  color: var(--sf-text-sub);
}

.people-state p {
  margin: 0;
}

.people-list {
  margin: 0;
  padding: 6px 0;
  list-style: none;
}

.person {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 18px;
}

.person-avatar {
  position: relative;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--sf-mint-soft);
  font-size: 14px;
  font-weight: 700;
  color: var(--sf-primary);
}

.person-avatar img {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

.online-dot {
  position: absolute;
  right: -1px;
  bottom: -1px;
  width: 11px;
  height: 11px;
  border: 2px solid var(--sf-surface);
  border-radius: 50%;
  background: var(--sf-mint);
}

.person-text {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-width: 0;
}

.person-name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  font-weight: 600;
  color: var(--sf-text);
}

.role-tag {
  padding: 0 6px;
  border-radius: 6px;
  background: var(--sf-bg);
  font-size: 12px;
  color: var(--sf-text-sub);
}

.person-email {
  font-size: 12px;
  color: var(--sf-text-faint);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.person-status {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--sf-text-faint);
}

.person-status.is-online {
  font-weight: 600;
  color: var(--sf-primary);
}
</style>

