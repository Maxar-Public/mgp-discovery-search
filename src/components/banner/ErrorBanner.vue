<template>
    <div v-if="errorState.recentError" class="error-banner">
      <div class="error-content">
        <v-icon color="red" class="error-icon">mdi-alert-circle</v-icon>
        <p class="error-text">{{ errorState.recentError.error }}</p>
      </div>
      <v-card-actions>
        <DownloadLogs />
        <v-btn text @click="clearRecentError" class="close-btn">
          <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-actions>
    </div>
</template>
  
  <script>
  import errorStore from '../../stores/errorStore';
  import DownloadLogs from './DownloadLogs.vue';
  
  export default {
    components: {
      DownloadLogs,
    },
    setup() {  
      return { 
        errorState: errorStore.errorState,
        downloadLogs: errorStore.downloadLogs,
        clearRecentError : errorStore.clearRecentError,
     };
    },
  };
  </script>
  
<style scoped>
.error-banner {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  background-color: white;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 50%;
  max-width: 80%;
  min-width: 300px;
}

.error-content {
  display: flex;
  align-items: center;
}

.error-icon {
  margin-right: 20px;
  margin-left: 5px;
}

.error-text {
  font-size: 14px;
  font-weight: 400;
}

.close-btn {
  width: 30px;
  height: 28px; 
  min-width: 30px;
  padding: 0;
}

.v-card-actions{
  height: 30px; 
  min-height: auto;

}

  </style>
  