import { onMounted, onUnmounted } from 'vue';

// 화면 밖(AI 도우미 등)에서 식품이 바뀌었을 때, 지금 열려 있는 목록 화면이 다시 불러오도록 알린다.
const EVENT = 'sf:foods-changed';

export const notifyFoodsChanged = () => {
  window.dispatchEvent(new CustomEvent(EVENT));
};

// setup()에서 부른다. 화면이 떠 있는 동안만 듣는다
export const useFoodsChanged = (callback) => {
  onMounted(() => window.addEventListener(EVENT, callback));
  onUnmounted(() => window.removeEventListener(EVENT, callback));
};

// 옵션 API 화면용 (mounted / beforeUnmount에서 직접 붙이고 뗀다)
export const FOODS_CHANGED_EVENT = EVENT;
