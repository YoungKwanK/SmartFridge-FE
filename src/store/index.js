import { createStore } from "vuex";
import notification from "./notification";
const store = createStore({
    state: {
        currentFridgeId: localStorage.getItem('currentFridgeId') || null
    },
    mutations: {
        setCurrentFridgeId(state, id) {
            state.currentFridgeId = id;
            // localStorage에 저장
            if (id) {
                localStorage.setItem('currentFridgeId', id);
            } else {
                localStorage.removeItem('currentFridgeId');
            }
        },
        clearCurrentFridgeId(state) {
            state.currentFridgeId = null;
            localStorage.removeItem('currentFridgeId');
        }
    },
    getters: {
        getCurrentFridgeId: state => state.currentFridgeId
    },
    modules: {
        notification,
    }
});

export default store;