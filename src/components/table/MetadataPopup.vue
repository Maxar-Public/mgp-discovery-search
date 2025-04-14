<template>
<v-card
    v-if="showPopup"
    :style="{ top: `${position.y}px`, left: `${position.x}px`, position: 'absolute', zIndex: 1000, width: `${popupWidth}px`, height: `${popupHeight}px`}"
    @mousedown="startDragging"
    class="popup"
>
    <v-toolbar flat>
      <v-toolbar-title>Metadata</v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn icon color="black" text @click="showPopup=false"><v-icon>mdi-close</v-icon></v-btn>
    </v-toolbar>
    <v-card-text style="overflow: auto; max-height: 320px; white-space: pre-wrap;">
        <pre><code ref="codeBlock" class="language-json">{{ prettyJson }}</code></pre>
    </v-card-text>

  <v-card-actions class="popup">
    <v-spacer></v-spacer>
    <ExportMetadata />
  </v-card-actions>
</v-card>
</template>

<script>
import {watch, ref, onUnmounted, watchEffect, onMounted} from 'vue';
import ExportMetadata from './ExportMetadata.vue';
import Prism from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';

export default {
    props: {
    selectedFeature: {
      type: Object,
      default: () => null, 
    },
  },
  setup(props, {emit}) {
    const showPopup = ref(false); // Controls popup visibility
    const position = ref({ x: window.innerWidth - 605, y: 10 }); // Initial position of the popup
    const isDragging = ref(false);
    const dragOffset = ref({ x: 0, y: 0 });
    const prettyJson = ref("");
    const codeBlock = ref(null);
    const popupWidth = ref(580);
    const popupHeight = ref(450);

    watch(() => props.selectedFeature, () => {
      if(props.selectedFeature){
        codeBlock.value = null;
        prettyJson.value = JSON.stringify(props.selectedFeature.metadata, null, 2);
        showPopup.value = true;
      }
      else{
        showPopup.value = false;
      }
    }, { immediate: true });

    watch(() => showPopup.value, () => {
      if(!showPopup.value){
          position.value = { x: window.innerWidth - 605, y: 10 }
          emit('popup-closed');
      }
    });

    watchEffect(() => {
      if (codeBlock.value) {
        Prism.highlightElement(codeBlock.value);
      }
    });

    const startDragging = (e) => {
      isDragging.value = true;
      dragOffset.value.x = e.clientX - position.value.x;
      dragOffset.value.y = e.clientY - position.value.y;
      window.addEventListener('mousemove', onDrag);
      window.addEventListener('mouseup', stopDragging);
    };

    const onDrag = (e) => {
      if (isDragging.value) {
        let newX = e.clientX - dragOffset.value.x;
        let newY = e.clientY - dragOffset.value.y;

        // Make sure the popup doesn't go outside the viewport
        newX = Math.max(0, Math.min(newX, window.innerWidth-popupWidth.value));
        newY = Math.max(0, Math.min(newY, window.innerHeight-popupHeight.value));

        position.value.x = newX;
        position.value.y = newY;
      }
    };

    const stopDragging = () => {
      isDragging.value = false;
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
    };

    // Cleanup event listeners when component is unmounted
    onUnmounted(() => {
      window.removeEventListener('mousemove', onDrag);
      window.removeEventListener('mouseup', stopDragging);
    });

    return{
        popupWidth,
        popupHeight,
        showPopup,
        position,
        prettyJson,
        startDragging,
        codeBlock
    }
  }
};
</script>

<style>
.popup {
  border-top: 1px solid white;
}
pre {
  background-color: white !important; 
  color: #f8f8f2 !important;
  padding: 16px;
  border-radius: 5px;
  overflow-x: auto;
}

/* JSON property keys */
.token.property {
  color: #AB37D3;
}

/* JSON string values */
.token.string {
  color: #277401;
}

/* JSON numbers */
.token.number {
  color: #277401;
}

/* JSON boolean values */
.token.boolean {
  color: #277401; 
}

/* JSON null values */
.token.null {
  color: #277401; 
}
</style>