<template>
    <div v-if="infoState.recentInfo" class="info-banner"> 
        <div class="info-content">
            <v-icon color="#2196F3" class="info-icon">mdi-information</v-icon>
            <p class="info-text">{{infoState.recentInfo.info}}</p>
        </div>
        <v-card-actions>
        <v-btn text @click="clearRecentInfo" class="close-btn">
            <v-icon>mdi-close</v-icon>
        </v-btn>
      </v-card-actions>
    </div>
</template>

<script setup>
    import infoStore from '@/stores/infoStore';
    const { infoState, clearRecentInfo } = infoStore;

</script>

<style scoped>
.info-banner {
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

.info-content {
  display: flex;
  align-items: center;
}

.info-text {
  font-size: 14px;
  font-weight: 400;
}

.info-icon {
  margin-right: 20px;
  margin-left: 5px;
}

.close-btn {
  width: 30px;
  height: 28px; 
  min-width: 30px;
}

.v-card-actions{
  height: 30px; 
  min-height: auto;
}

</style>