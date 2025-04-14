<template>
    <v-btn text size="small" @click="downloadLogs">
      VIEW LOG
    </v-btn>
</template>

<script>
import errorStore from '@/stores/errorStore';

export default {
  props: {
    iconOnly: {
      type: Boolean,
      default: false,
    },
  },
  setup() {
    const downloadLogs = () => {
      errorStore.downloadLogs();
    };

    return {
      downloadLogs,
    };
  },
};
</script>

<style scoped>
</style>
