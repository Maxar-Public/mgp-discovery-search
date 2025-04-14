import {reactive} from "vue";

const infoState = reactive({
    recentInfo: null,
});

const addInfo = (info) => {
    infoState.recentInfo = info;
};

const clearRecentInfo = () => {
    infoState.recentInfo = null;
};

export default {
    infoState,
    addInfo,
    clearRecentInfo,
};