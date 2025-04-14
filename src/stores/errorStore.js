import { reactive, ref } from 'vue';
import { saveData, getData} from '@/stores/dataStore';

const errorState = reactive({
  errors: getData("errorLogs", []),
  recentError: null,  
});

const addError = (error) => {
  errorState.errors.push(error);
  errorState.recentError = error;
  saveData('errorLogs', errorState.errors);
};

const clearRecentError = () => {
  errorState.recentError = null;
};

const downloadLogs = () => {
  const logContent = errorState.errors.map(err => `[${err.timestamp}] ${err.info}: ${err.error}`).join('\n');
  const blob = new Blob([logContent], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'error_logs.txt';
  link.click();
};

export default {
  errorState,
  addError,
  downloadLogs,
  clearRecentError,

};
