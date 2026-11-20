<template>
  <!-- 오른쪽 아래 AI 버튼. 누르면 오른쪽에서 대화 패널이 열린다 -->
  <button
    v-show="!open"
    type="button"
    class="agent-fab"
    aria-label="AI 도우미 열기"
    @click="open = true"
  >
    <v-icon size="26" aria-hidden="true">mdi-robot-happy-outline</v-icon>
  </button>

  <!--
    넓은 화면(1280px 이상): 본문을 왼쪽으로 밀어 옆에 붙는다 (목록을 가리지 않아서, 확인을 누르면 바뀌는 게 바로 보인다)
    그보다 좁으면: 본문 위에 겹쳐 띄운다 (밀면 목록이 너무 좁아진다). 모바일은 화면 전체를 덮는다
    화면을 옮기거나(공유 ↔ 개인 탭 등) 창 크기가 바뀌어도 닫히지 않게, 주소·크기 변화로 여닫지 않는다
  -->
  <v-navigation-drawer
    v-model="open"
    location="right"
    :mobile="!canPush"
    :temporary="!canPush"
    :scrim="false"
    disable-route-watcher
    disable-resize-watcher
    :width="isMobile ? undefined : 400"
    :class="['agent-panel', { 'is-mobile': isMobile }]"
  >
    <div class="panel">
      <header class="panel-head">
        <div class="panel-title">
          <span class="panel-name">AI 도우미</span>
          <span v-if="remainingToday !== null" class="panel-remaining sf-num">오늘 {{ remainingToday }}번 남음</span>
        </div>
        <v-btn
          icon="mdi-refresh"
          variant="text"
          size="small"
          title="새 대화"
          aria-label="새 대화 시작"
          :disabled="sending || messages.length === 0"
          @click="resetConversation"
        />
        <v-btn icon="mdi-close" variant="text" size="small" aria-label="AI 도우미 닫기" @click="open = false" />
      </header>

      <div ref="scrollBox" class="panel-body">
        <div v-if="loadingHistory" class="panel-loading">
          <v-progress-circular indeterminate size="24" width="2" color="primary" />
        </div>

        <div v-else-if="messages.length === 0" class="panel-empty">
          <p class="empty-title">냉장고에 대해 물어보세요</p>
          <p class="empty-desc">
            식품을 찾아 주고, 다 먹거나 버린 식품은 정리를 제안해요.
            정리는 확인 카드를 눌러야만 처리돼요.
          </p>
          <div class="examples">
            <button
              v-for="example in EXAMPLES"
              :key="example"
              type="button"
              class="example"
              :disabled="!canSend"
              @click="send(example)"
            >
              {{ example }}
            </button>
          </div>
        </div>

        <template v-else>
          <div
            v-for="(item, index) in messages"
            :key="index"
            class="msg"
            :class="item.role === 'user' ? 'is-user' : 'is-assistant'"
          >
            <div class="bubble">{{ display(item.text) }}</div>
            <AgentActionCard
              v-for="action in item.actions"
              :key="action.id"
              :action="action"
              :now="now"
              :busy="busy[action.id] || ''"
              @confirm="confirmAction"
              @cancel="cancelAction"
            />
          </div>
        </template>

        <div v-if="sending" class="msg is-assistant">
          <div class="bubble is-typing" aria-label="답변을 만드는 중">
            <span /><span /><span />
          </div>
        </div>
      </div>

      <footer class="panel-foot">
        <p v-if="remainingToday === 0" class="limit-note">오늘 질문을 모두 썼어요. 내일 다시 이용해 주세요.</p>
        <form class="composer" @submit.prevent="send()">
          <textarea
            ref="inputBox"
            v-model="draft"
            class="composer-input"
            rows="1"
            :maxlength="MAX_LENGTH"
            :disabled="remainingToday === 0"
            placeholder="예: 우유 다 마셨어"
            aria-label="AI 도우미에게 보낼 메시지"
            @keydown.enter.exact="onEnter"
            @input="fitHeight"
          />
          <v-btn
            type="submit"
            icon="mdi-arrow-up"
            color="primary"
            variant="flat"
            size="small"
            aria-label="보내기"
            :disabled="!canSend || !draft.trim()"
          />
        </form>
        <p class="composer-hint">Enter로 보내고, Shift+Enter로 줄을 바꿔요.</p>
      </footer>
    </div>
  </v-navigation-drawer>
</template>

<script setup>
import { computed, nextTick, onUnmounted, ref, watch } from 'vue';
import { useStore } from 'vuex';
import { useDisplay } from 'vuetify';
import AgentActionCard from '@/components/agent/AgentActionCard.vue';
import agentService from '@/services/agentService.js';
import { notifyFoodsChanged } from '@/composables/foodEvents.js';
import { snackbar } from '@/composables/snackbar.js';
import { getErrorMessage } from '@/utils/commonDataHandler.js';

const MAX_LENGTH = 500;
const EXAMPLES = ['유통기한 지난 거 뭐 있어?', '이번 주 안에 먹어야 할 거 알려줘', '우유 다 마셨어'];

const store = useStore();
const { smAndDown: isMobile, lgAndUp: canPush } = useDisplay();
const fridgeId = computed(() => store.getters.getCurrentFridgeId);

const open = ref(false);
const messages = ref([]);
const remainingToday = ref(null);
const draft = ref('');
const sending = ref(false);
const loadingHistory = ref(false);
// 카드별로 누르고 있는 버튼 { [actionId]: 'confirm' | 'cancel' }
const busy = ref({});
// 어느 냉장고의 대화를 불러 왔는지 (냉장고를 바꾸면 다시 불러온다)
const loadedFridgeId = ref(null);

const scrollBox = ref(null);
const inputBox = ref(null);

const canSend = computed(() => !sending.value && !loadingHistory.value && remainingToday.value !== 0);

// 답변에 굵게(**) 표시가 섞여 와도 기호가 보이지 않게
const display = (text) => (text || '').replace(/\*\*(.+?)\*\*/g, '$1');

// ---- 확인 카드 남은 시간: 패널이 열려 있을 때만 1초마다 갱신 ----
const now = ref(Date.now());
let timer = null;
const startTimer = () => {
  now.value = Date.now();
  timer ??= setInterval(() => { now.value = Date.now(); }, 1000);
};
const stopTimer = () => {
  clearInterval(timer);
  timer = null;
};
onUnmounted(stopTimer);

const scrollToBottom = async () => {
  await nextTick();
  if (scrollBox.value) scrollBox.value.scrollTop = scrollBox.value.scrollHeight;
};

const fitHeight = () => {
  const box = inputBox.value;
  if (!box) return;
  box.style.height = 'auto';
  box.style.height = `${Math.min(box.scrollHeight, 120)}px`;
};

// ---- 대화 기록 (창을 열 때, 새로고침 뒤에도 서버에서 다시 받아 그린다) ----
const loadHistory = async () => {
  if (!fridgeId.value) return;
  const target = fridgeId.value;
  loadingHistory.value = true;
  try {
    const result = await agentService.history(target);
    if (target !== fridgeId.value) return;
    messages.value = result.messages || [];
    remainingToday.value = result.remainingToday;
    loadedFridgeId.value = target;
    scrollToBottom();
  } catch (error) {
    snackbar.error(getErrorMessage(error));
  } finally {
    loadingHistory.value = false;
  }
};

watch(open, (isOpen) => {
  if (isOpen) {
    startTimer();
    if (loadedFridgeId.value !== fridgeId.value) loadHistory();
    else scrollToBottom();
    nextTick(() => inputBox.value?.focus());
  } else {
    stopTimer();
  }
});

// 다른 냉장고로 옮기면 이전 냉장고 대화를 비우고, 열려 있으면 새로 불러온다
watch(fridgeId, () => {
  messages.value = [];
  remainingToday.value = null;
  loadedFridgeId.value = null;
  if (open.value) loadHistory();
});

// ---- 질문 보내기 ----
const send = async (text = draft.value) => {
  const message = text.trim();
  if (!message || !canSend.value) return;

  messages.value.push({ role: 'user', text: message, actions: [] });
  draft.value = '';
  nextTick(fitHeight);
  sending.value = true;
  scrollToBottom();

  try {
    const result = await agentService.send(fridgeId.value, message);
    messages.value.push({ role: 'assistant', text: result.message, actions: result.actions || [] });
    remainingToday.value = result.remainingToday;
  } catch (error) {
    // 보내지 못한 질문은 지우고 입력칸에 돌려놓는다 (서버 기록에도 남지 않았다)
    messages.value.pop();
    draft.value = message;
    if (error.response?.status === 429) remainingToday.value = 0;
    snackbar.error(getErrorMessage(error));
  } finally {
    sending.value = false;
    scrollToBottom();
  }
};

// 한글 입력 중(글자 조합 중)에 누른 Enter는 조합을 끝내는 키라서 보내지 않는다
const onEnter = (event) => {
  if (event.isComposing || event.keyCode === 229) return;
  event.preventDefault();
  send();
};

const resetConversation = async () => {
  try {
    await agentService.reset(fridgeId.value);
    messages.value = [];
  } catch (error) {
    snackbar.error(getErrorMessage(error));
  }
};

// ---- 확인 카드 ----
const setBusy = (actionId, value) => {
  busy.value = { ...busy.value, [actionId]: value };
};

const confirmAction = async (action) => {
  setBusy(action.id, 'confirm');
  try {
    const result = await agentService.confirm(fridgeId.value, action.id);
    action.status = result.status;
    const names = result.result?.names || [];
    snackbar.success(names.length ? `${names.join(', ')} 처리했어요` : '처리했어요');
    notifyFoodsChanged();
  } catch (error) {
    const status = error.response?.status;
    if (status === 410) {
      action.status = 'EXPIRED';
    } else if (status === 409) {
      // 다른 곳(다른 탭 등)에서 이미 처리했다. 서버의 지금 상태로 다시 그린다
      await loadHistory();
    } else {
      action.status = 'FAILED';
    }
    snackbar.error(getErrorMessage(error));
  } finally {
    setBusy(action.id, '');
  }
};

const cancelAction = async (action) => {
  setBusy(action.id, 'cancel');
  try {
    await agentService.cancel(fridgeId.value, action.id);
    action.status = 'CANCELLED';
  } catch (error) {
    if ([409, 410].includes(error.response?.status)) await loadHistory();
    snackbar.error(getErrorMessage(error));
  } finally {
    setBusy(action.id, '');
  }
};
</script>

<style scoped>
.agent-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1005;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border: 0;
  border-radius: 50%;
  background: var(--sf-primary);
  color: #fff;
  box-shadow: 0 4px 16px rgba(19, 134, 95, 0.35);
  cursor: pointer;
  transition: background 0.15s, transform 0.15s;
}

.agent-fab:hover {
  background: var(--sf-primary-hover);
  transform: translateY(-1px);
}

.agent-fab:focus-visible {
  outline: 3px solid var(--sf-mint);
  outline-offset: 2px;
}

.agent-panel {
  border-left: 1px solid var(--sf-line) !important;
  box-shadow: -8px 0 24px rgba(34, 34, 34, 0.08) !important;
}

.agent-panel.is-mobile {
  width: 100% !important;
}

.panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--sf-bg);
}

.panel-head {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 10px 8px 10px 16px;
  border-bottom: 1px solid var(--sf-line);
  background: var(--sf-surface);
}

.panel-title {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.panel-name {
  font-size: var(--sf-fs-lg);
  font-weight: 700;
  color: var(--sf-text);
}

.panel-remaining {
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-faint);
}

.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.panel-loading {
  display: flex;
  justify-content: center;
  padding: 32px 0;
}

.panel-empty {
  padding: 24px 4px;
  text-align: center;
}

.empty-title {
  margin: 0 0 6px;
  font-size: var(--sf-fs-lg);
  font-weight: 700;
  color: var(--sf-text);
}

.empty-desc {
  margin: 0 0 16px;
  font-size: var(--sf-fs-sm);
  line-height: 1.6;
  color: var(--sf-text-sub);
}

.examples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.example {
  padding: 10px 14px;
  border: 1px solid var(--sf-line-strong);
  border-radius: var(--sf-radius-md);
  background: var(--sf-surface);
  font: inherit;
  font-size: var(--sf-fs-md);
  color: var(--sf-text);
  text-align: left;
  cursor: pointer;
}

.example:hover:not(:disabled) {
  border-color: var(--sf-primary);
  color: var(--sf-primary);
}

.msg {
  display: flex;
  flex-direction: column;
  margin-bottom: 12px;
}

.msg.is-user {
  align-items: flex-end;
}

.msg.is-assistant {
  align-items: stretch;
}

.bubble {
  max-width: 85%;
  padding: 10px 14px;
  border-radius: var(--sf-radius-md);
  font-size: var(--sf-fs-md);
  line-height: 1.55;
  white-space: pre-line;
  word-break: keep-all;
  overflow-wrap: anywhere;
}

.is-user .bubble {
  background: var(--sf-primary);
  color: #fff;
  border-bottom-right-radius: 4px;
}

.is-assistant .bubble {
  align-self: flex-start;
  background: var(--sf-surface);
  border: 1px solid var(--sf-line);
  color: var(--sf-text);
  border-bottom-left-radius: 4px;
}

.bubble.is-typing {
  display: inline-flex;
  gap: 4px;
  padding: 14px 16px;
}

.bubble.is-typing span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--sf-text-faint);
  animation: typing 1.2s infinite ease-in-out;
}

.bubble.is-typing span:nth-child(2) { animation-delay: 0.15s; }
.bubble.is-typing span:nth-child(3) { animation-delay: 0.3s; }

@keyframes typing {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}

.panel-foot {
  padding: 10px 12px 12px;
  border-top: 1px solid var(--sf-line);
  background: var(--sf-surface);
}

.limit-note {
  margin: 0 0 8px;
  font-size: var(--sf-fs-sm);
  color: var(--sf-expired-ink);
}

.composer {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.composer-input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 9px 12px;
  border: 1px solid var(--sf-line-strong);
  border-radius: var(--sf-radius-md);
  background: var(--sf-surface);
  font: inherit;
  font-size: var(--sf-fs-md);
  line-height: 1.4;
  color: var(--sf-text);
  resize: none;
  outline: none;
}

.composer-input:focus {
  border-color: var(--sf-primary);
}

.composer-input:disabled {
  background: var(--sf-bg);
}

.composer-hint {
  margin: 6px 0 0;
  font-size: var(--sf-fs-xs);
  color: var(--sf-text-faint);
}

@media (max-width: 600px) {
  .agent-fab {
    right: 16px;
    bottom: 16px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .bubble.is-typing span { animation: none; }
  .agent-fab { transition: none; }
}
</style>
