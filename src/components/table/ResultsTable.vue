<template>
  <v-container 
    v-if="showResults && featureList && featureList.length > 0"
    class="table-container"
  >

  <!-- Data Table -->
   
    <v-data-table
      v-model:page="pagination.page"
      v-model:items-per-page="pagination.itemsPerPage"
      :items-per-page-options="itemsPerPageOptions"
      :headers="headers"
      :items="featureList"
      fixed-header
      item-value="id"
      disable-sort
      class="table"
    >
    
      
      <!-- Toolbar at the top -->
      <template v-slot:top>
        <v-card-title class="header">Results</v-card-title>
        <div class="pl-4">
        <v-switch label="Show cloud coverage"
          v-model="cloudToggleSwitchOn"
          name="cloudToggleSwitchOn"
          inset
          dense
          color="success"
          :disabled="isLoading"
          :loading="isLoading ? 'black' : false"> <!-- Show loading if isLoading is true -->
        </v-switch>
      </div>
      </template>

      <!-- Custom row template -->
      <template #item="{ item }">
        <tr :class="{
              'selected-row': selectedFeature && selectedFeature.id === item.id,
              'hovered-row': hoveredFeature && hoveredFeature.id === item.id
            }"
            @click=" openPopup(item)"
            @mouseover="highlightImage(item)" 
            @mouseleave="unhighlightImage" 
            style="cursor: pointer" 
            :style="{ borderbottom: 'white' }"
        >
          <td>{{ item.id }}</td>
          <td>{{ item["area:cloud_cover_percentage"] != null ? (Math.round(item["area:cloud_cover_percentage"] * 100) / 100) + '%' : 'N/A' }}</td>
          <td>{{ item["eo:cloud_cover"] != null  ? (Math.round(item["eo:cloud_cover"] * 100) / 100) + '%' : 'N/A' }}</td>
        </tr>
      </template>
    </v-data-table>
    <ExportGeojson />
  </v-container>

  <!-- Metadata Popup Component -->
  <MetadataPopup 
    :selectedFeature="selectedFeature" 
    @popup-closed="unhighlightSelectedImage"
  />
</template>

<script>
import { reactive, watch, ref} from 'vue';
import MetadataPopup from './MetadataPopup.vue';
import ExportGeojson from './ExportGeojson.vue';
import { getData, saveData, removeData } from '@/stores/dataStore';
import {fetchCloudPolygons} from '@/shared/ApiService';

export default {
  components: {
    MetadataPopup,
    ExportGeojson
  },
  props: {
    featureList: {
      type: Array, // Changed to array since it is what v-data-table expects
      default: () => [],
    },
    showResults: {
      type: Boolean,
      default: () => false,
    },
    selectedImage: {
      type: Object,
      default: () => null,
    },
    highlightedImage: {
      type: Object,
      default: () => null,
    },
  },
  emits: 
  [
    'feature-table-page', 
    'feature-table-items-per-page', 
    'highlight-image', 
    'unhighlight-image', 
    'highlight-selected-image', 
    'unhighlight-selected-image', 
    'geometry-data', 
    'cloud-geometry-is-loading', 
    'cloud-cover-toggle-switch'
  ],
  setup(props, {emit}) {
    const headers = ref([
      { title: 'Image ID', key: 'id' },
      { title: 'Area CC', key: 'area:cloud_cover_percentage' },
      { title: 'Image CC', key: 'eo:cloud_cover' },
    ]);
    const pagination = reactive({
      page: getData('featureTablePage', 1),          // current page
      itemsPerPage: getData('featuresPerPage', 25), // items per page
    });
    const selectedFeature = ref(getData('selectedFeature'));
    const hoveredFeature = ref(null);
    const itemsPerPageOptions = ref([25, 50, 75, 100]);
    const cloudToggleSwitchOn = ref(getData('cloudCoverToggle'),false);
    const isLoading = ref(false);

    const cloudGeometryList = {}; //Where all the cloud geometry will be stored for cloud polygons

    watch(() => pagination.page, (newPage) => {
      emit('feature-table-page', newPage);
    }, { immediate: true });

    watch(() => pagination.itemsPerPage, (newItemsPerPage) => {
      emit('feature-table-items-per-page', newItemsPerPage);
    }, { immediate: true });

    watch(() => props.showResults, () => {
      if(!props.showResults && selectedFeature) {
        selectedFeature.value = null;
      }
      if(!props.showResults){
        pagination.page = 1;
      }
    });

    watch(() => selectedFeature.value, (newFeature)=> {
        emit('highlight-selected-image', newFeature);
    });

    watch(() => props.selectedImage, (newFeature)=> {
        selectedFeature.value = newFeature;
        if(selectedFeature.value){
          saveData('selectedFeature', newFeature);
          
          if(cloudGeometryList[newFeature["id"]]){
            emit('geometry-data', cloudGeometryList[newFeature["id"]]);
          }
                      
        }
        else {
          removeData('selectedFeature');
        }
    });
    
    watch(() => props.featureList, async () => {
      removeData('cloudPolygon');
      emit('geometry-data', null);
      for(const key in cloudGeometryList){
        delete cloudGeometryList[key];
      }
      if(cloudToggleSwitchOn.value){
        const promises = []; // Array to store Promises
        isLoading.value = true; // Set loading to true before starting the loop
        emit('cloud-geometry-is-loading', isLoading.value);
        for(const item of props.featureList){
          const promise = fetchCloudPolygons(item.metadata.assets["cloud-cover"].href).then(data => {
        cloudGeometryList[item["id"]] = data;
        });
        promises.push(promise); // Add the Promise to the array
      }
      // Wait for all Promises to resolve
      await Promise.all(promises);
      isLoading.value = false; // Set loading to false after all Promises are resolved
      emit('cloud-geometry-is-loading', isLoading.value);
      }
    });

    watch(() => cloudToggleSwitchOn.value, async () => {
      emit('cloud-cover-toggle-switch', cloudToggleSwitchOn.value);

      // if on, call the API for each feature in the feature list
      if(cloudToggleSwitchOn.value && Object.keys(cloudGeometryList).length === 0){

       const promises = []; // Array to store Promises
       isLoading.value = true; // Set loading to true before starting the loop
       emit('cloud-geometry-is-loading', isLoading.value);

       for(const item of props.featureList){
        const promise = fetchCloudPolygons(item.metadata.assets["cloud-cover"].href).then(data => {
        cloudGeometryList[item["id"]] = data;
        });
        promises.push(promise); // Add the Promise to the array
      }
      // Wait for all Promises to resolve
      await Promise.all(promises);

      isLoading.value = false; // Set loading status to false after all Promises are resolved
      emit('cloud-geometry-is-loading', isLoading.value);


      // if there was an image selected when the switch was toggled on, render the cloud polygons from that feature
      if(selectedFeature.value){
          emit('geometry-data', cloudGeometryList[selectedFeature.value["id"]]); // Send cloud geometry data to main for cloud polygons
        }

      }
    });

    //When image is highlighted by map interaction
    watch(() => props.highlightedImage, (newFeature)=> {
        hoveredFeature.value = newFeature;
    });

    // When feature is clicked from the results table, and after openPopup resolves, emit cloud geometry
    watch(() => selectedFeature.value, () =>{
      if(selectedFeature.value){
        if(cloudGeometryList[selectedFeature.value["id"]]){
          emit('geometry-data', cloudGeometryList[selectedFeature.value["id"]]); // Send cloud geometry data to main for cloud polygons
        }
      }
    })
    
    const openPopup = (feature) => {
      if(selectedFeature.value != feature) {
        selectedFeature.value = feature;
        saveData('selectedFeature', feature);
      }
      else {
        unhighlightSelectedImage();
      }
    };

    const highlightImage = (feature) => {
      hoveredFeature.value = feature;
      emit('highlight-image', feature);
    }

    const unhighlightImage = () => {
      hoveredFeature.value = null;
      emit('unhighlight-image');
    }

    const unhighlightSelectedImage = () => {
      selectedFeature.value = null;
      removeData('selectedFeature');
      emit('unhighlight-selected-image');
      emit('geometry-data', null);
    }
    
    return{
        results: cloudGeometryList,
        isLoading,
        cloudToggleSwitchOn,
        pagination,
        headers,
        selectedFeature,
        hoveredFeature,
        itemsPerPageOptions,
        openPopup,
        unhighlightImage,
        highlightImage,
        unhighlightSelectedImage,
    }
  },
};
</script>

<style>
.table-container {
 display: flex;
 flex-direction: column;
 width: 600px;
 height: 100vh;
 justify-content: space-between;
 margin: 0;
 padding: 0;
}

.table {
  overflow: auto;
  background-color: #EEF2EC;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #cfcfcf;
  flex-grow: 1;
  
}

.table .v-data-table__wrapper {
  flex-grow: 1;
}

.table .v-data-footer {
  margin-top: auto;
}

.table tr {
  border-bottom: none !important;
}
.table td {
  border-bottom: none !important;
}

/* Highlighted row */
.selected-row {
  background-color: #BD00FF66 !important; 
}

.hovered-row {
  background-color:#BD00FF33 !important; 
}

/* Ensure hover does not override the selected row's style */
.selected-row:hover {
  background-color: #BD00FF66 !important; 
}

</style>