import { createStore } from "vuex";
import notification from "./notification";
import user from "./user";

const store = createStore({
    state: {
        currentFridgeId: localStorage.getItem('currentFridgeId') || null,
        currentFridgeInfo: (() => {
            try {
                const raw = localStorage.getItem('currentFridgeInfo');
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        })()
    },
    mutations: {
        setCurrentFridgeId(state, id) {
            state.currentFridgeId = id;
            localStorage.setItem('currentFridgeId', id);
        },
        setCurrentFridgeInfo(state, fridgeInfo) {
            state.currentFridgeInfo = fridgeInfo;
            try {
                localStorage.setItem('currentFridgeInfo', JSON.stringify(fridgeInfo));
            } catch (e) {
                // ignore storage errors
            }
        },
        clearCurrentFridgeId(state) {
            state.currentFridgeId = null;
            localStorage.removeItem('currentFridgeId');
        },
        clearCurrentFridgeInfo(state) {
            state.currentFridgeInfo = null;
            localStorage.removeItem('currentFridgeInfo');
        }
    },
    getters: {
        getCurrentFridgeId: state => state.currentFridgeId,
        getCurrentFridgeInfo: state => state.currentFridgeInfo
    },
    modules: {
        notification,
        user
    }
});

export default store;