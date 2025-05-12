<template>
  <div>
    <v-card class="sidebar">
      <v-card-title class="text-black title-bar">Discovery search
        <v-spacer></v-spacer>      
      </v-card-title>      
      <v-card-text class="text-black">
        <!-- Buttons -->
        <v-card-actions class="action-buttons-top">
          <v-card-text style="padding: 0px; flex: none;">Area</v-card-text>
          <UploadGeojson @geojson-loaded="onGeoJsonLoaded" :disableButton="loading" />
          <v-btn size="small" variant="tonal"
            @click="startDrawingBbox"
            :disabled="loading">
            DRAW
          </v-btn>
        </v-card-actions>    

        <!-- Date range from -->
        <v-text-field
          v-model="dateRangeFrom"
          label="Date from"
          type="date"
          :max="dateRangeTo || maxDate"
          variant="underlined"
          :disabled="loading"
        ></v-text-field>

        <!-- Date range to -->
        <v-text-field
          v-model="dateRangeTo"
          label="Date to"
          type="date"
          :min="dateRangeFrom"
          :max="maxDate"
          variant="underlined"
          :disabled="loading"
        ></v-text-field>

        <!-- Area cloud coverage -->
        <v-text-field
          v-model="areaCloudCoverage"
          label="Area cloud coverage"
          variant="underlined"
          placeholder="Enter a value between 0 and 100"
          :disabled="loading"
          type="number"
          :rules="[v => validateCloudCoverage(v)]"
          :step="0.01"
          @keypress="restrictInput"
        ></v-text-field>
        

        <!-- Image cloud coverage -->
        <v-text-field
          v-model="imageCloudCoverage"
          label="Image cloud coverage"
          variant="underlined"
          placeholder="Enter a value between 0 and 100"
          :disabled="loading"
          type="number"
          :rules="[v => validateCloudCoverage(v)]"
          :step="0.01"
          @keypress="restrictInput"
        ></v-text-field>

        <!-- Off nadir angle -->
        <v-text-field
          v-model="offNadirAngle"
          label="Off nadir angle"
          variant="underlined"
          placeholder="Enter a value between 0 and 90"
          :disabled="loading"
          type="number"
          :rules="[v => validateOffNadirAngle(v)]"
          :step="0.01"
          @keypress="restrictInput"
        ></v-text-field>

        <!-- Sensor -->
        <v-card-text style="height: 44px; align-items: end;" class="sensor-section-label">Sensor</v-card-text>
        <v-container fluid class="sensor-container">
          <v-row v-if="loadingSensors" class="justify-center align-center" style="height: 100px;">
            <v-progress-circular
              indeterminate
              color="primary"
              size="24"
            ></v-progress-circular>
            <span class="ml-2">Loading sensors...</span>
          </v-row>
          <v-row v-else class="tight-row">
            <v-col
              cols="6"
              v-for="(sensorItem, index) in sensorItems"
              :key="sensorItem"
              class="tight-col"
            >
              <!-- Your existing checkbox code -->
              <div class="sensor-checkbox-container">
                <v-checkbox
                  v-model="sensor"
                  :value="sensorItem"
                  :disabled="loading"
                  hide-details
                  dense
                  class="tight-spacing"
                >
                  <template v-slot:label>
                    <span
                      :style="{ color: sensor.includes(sensorItem) ? '#000000' : '#9e9e9e' }"
                      class="sensor-text"
                    >
                      {{ sensorItem }}
                    </span>
                  </template>
                </v-checkbox>
                <v-icon
                  size="small"
                  color="grey darken-1"
                  @click="showSensorInfo(sensorItem)"
                  class="info-icon"
                >
                  mdi-information-outline
                </v-icon>
              </div>
            </v-col>
          </v-row>
        </v-container>

      </v-card-text>

      <!-- Action buttons -->
      <v-card-actions class="action-buttons-bottom">
        <v-btn size="small" 
          @click="clearAll" 
          :disabled="loading || isBboxEmpty"
          :style="clearAllButtonStyle"
        >
          CLEAR ALL
        </v-btn>
        <v-btn size="small" variant="flat" 
          @click="runFilter" 
          :disabled="loading || isBboxEmpty"
          :style="runButtonStyle"
        >
          <v-progress-circular
            v-if="loading"
            indeterminate
            color="white"
            :size="20"
          ></v-progress-circular>
          <span v-else>RUN</span>
        </v-btn>
      </v-card-actions>
    </v-card>

    <!-- No Features Popup -->
    <v-dialog v-model="showPopup" max-width="600px">
      <v-card>
        <v-card-text>
          <div class="centered-box">
            {{ popupMessage }}
          </div>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="black darken-1" text size="small" @click="showPopup = false; popupMessage=''">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Sensor Info Dialog -->
    <v-dialog v-model="showSensorInfoDialog" max-width="800px">
      <v-card>
        <v-card-title class="text-h5">
          {{ selectedSensorTitle }}
          <v-spacer></v-spacer>
          <v-btn icon @click="showSensorInfoDialog = false">
            <v-icon>mdi-close</v-icon>
          </v-btn>
        </v-card-title>
        
        <v-card-text>
          <v-progress-circular
            v-if="loadingSensorInfo"
            indeterminate
            color="primary"
            class="mx-auto d-block my-4"
          ></v-progress-circular>
          
          <div v-if="!loadingSensorInfo && sensorInfo">
            <div class="my-2">
              <strong>Description:</strong> {{ sensorInfo.description }}
            </div>
            <div v-if="sensorInfo.summaries && Object.keys(sensorInfo.summaries).length">
              <v-expansion-panels>
              <v-expansion-panel>
                <v-expansion-panel-title>
                <strong>Summaries</strong>
                </v-expansion-panel-title>
                <v-expansion-panel-text>
                <v-simple-table
                  dense
                  fixed-header
                  height="250px"
                  class="elevation-1 mt-2 mb-4"
                >
                  <thead>
                  <tr>
                    <th class="primary white--text" style="padding-top: 12px; padding-bottom: 12px;">Property</th>
                    <th class="primary white--text" style="padding-top: 12px; padding-bottom: 12px;">Type</th>
                    <th class="primary white--text" style="padding-top: 12px; padding-bottom: 12px;">Description</th>
                  </tr>
                  </thead>
                  <tbody>
                  <tr v-for="(summary, key) in sensorInfo.summaries" :key="key">
                    <td class="font-weight-medium">{{ key }}</td>
                    <td style="padding-left: 16px; padding-right: 16px;">{{ summary.type }}</td>
                    <td>{{ summary.description }}</td>
                  </tr>
                  </tbody>
                </v-simple-table>
                </v-expansion-panel-text>
              </v-expansion-panel>
              </v-expansion-panels>
            </div>
            
            <div class="my-2">
              <strong>License:</strong> {{ sensorInfo.license }}
            </div>
            
            <div class="my-2" v-if="sensorInfo.providers && sensorInfo.providers.length">
              <strong>Providers:</strong>
              <ul>
                <li v-for="(provider, index) in sensorInfo.providers" :key="index">
                  {{ provider.name }} ({{ provider.roles.join(', ') }})
                </li>
              </ul>
            </div>
            
            <v-expansion-panels v-if="sensorInfoJson">
              <v-expansion-panel>
                <v-expansion-panel-title>View Full Details</v-expansion-panel-title>
                <v-expansion-panel-text>
                  <div class="json-content">{{ sensorInfoJson }}</div>
                </v-expansion-panel-text>
              </v-expansion-panel>
            </v-expansion-panels>
          </div>
          
          <div v-if="!loadingSensorInfo && !sensorInfo" class="text-center red--text">
            Failed to load sensor information.
          </div>
        </v-card-text>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
import { ref, onMounted, watch, computed } from 'vue';
import UploadGeoJson from './UploadGeojson';
import { fetchFeatures, fetchSensors, fetchCollectionInfo } from "@/shared/ApiService.js";
import { saveData, getData, clearAllData, removeData } from '@/stores/dataStore';
import DownloadLogs from '../banner/DownloadLogs.vue';
import errorStore from '../../stores/errorStore';
import infoStore from '@/stores/infoStore';

export default {
  components: {
    UploadGeoJson,
    DownloadLogs,
  },
  props: {
    bbox: {
      type: Array,
      default: () => null,
    },
  },
  setup(props, { emit }) {
    const today = new Date().toISOString().split('T')[0];
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoString = oneYearAgo.toISOString().split('T')[0];
    const dateRangeFrom = ref(getData('dateRangeFrom', oneYearAgoString));
    const dateRangeTo = ref(getData('dateRangeTo', today));
    const areaCloudCoverage = ref(getData('areaCloudCoverage', ""));
    const imageCloudCoverage = ref(getData('imageCloudCoverage', ""));
    const offNadirAngle = ref(getData('offNadirAngle', ""));
    const sensor = ref(getData('sensor', []));
    const sensorItems = ref([]);
    const featureList = ref([]);
    const showPopup = ref(false);
    const popupMessage = ref("");
    const loading = ref(false);
    const isBboxEmpty = ref(true);
    const showSensorInfoDialog = ref(false);
    const selectedSensorTitle = ref("");
    const sensorInfo = ref(null);
    const sensorInfoJson = ref(null);
    const loadingSensorInfo = ref(false);
    const loadingSensors = ref(true);


    const setBbox = (newBbox) => {
      if (newBbox && newBbox.length > 0) {
        isBboxEmpty.value = false; // Bbox has been set
      } else {
        isBboxEmpty.value = true; // Bbox is empty
      }
    };

    // Fetching sensors and setting default selection to all
    onMounted(async () => {
      loadingSensors.value = true; // Make sure it is set before fetching
      try {
        const sensorTitles = await fetchSensors();
        sensorItems.value = sensorTitles;

        // Set all sensors as selected by default
        const savedSensorData = getData('sensor', []);
        if (savedSensorData === null || savedSensorData.length === 0) {
          sensor.value = sensorItems.value;
        } else {
          sensor.value = savedSensorData;
        }
      } catch (error) {
        errorStore.addError({
            error: error.message,
            info: "Error fetching Sensors: ",  
            timestamp: new Date().toISOString()
        });
      } finally {
        loadingSensors.value = false; // Set loading to false after fetching
      }

        if (!dateRangeFrom.value) {
          dateRangeFrom.value = oneYearAgoString;
        }
        if (!dateRangeTo.value) {
          dateRangeTo.value = today;
        }

        watch(dateRangeFrom, (newValue) => {
          saveData('dateRangeFrom', newValue);
        });

        watch(dateRangeTo, (newValue) => {
          saveData('dateRangeTo', newValue);
        });

        watch(areaCloudCoverage, (newValue) => {
          saveData('areaCloudCoverage', newValue);
        });

        watch(imageCloudCoverage, (newValue) => {
          saveData('imageCloudCoverage', newValue);
        });

        watch(offNadirAngle, (newValue) => {
          saveData('offNadirAngle', newValue);
        });

        watch(sensor, (newValue) => {
          saveData('sensor', newValue);
        });

        watch(() => props.bbox, (newBbox) => {
          setBbox(newBbox);
        }, { immediate: true });
    });

    const validateCloudCoverage = (value) => {
      if (value === null || value === '') return true;
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < 0 || num > 100) return 'Value must be between 0 and 100';
      return true;
    }

    const validateOffNadirAngle = (value) => {
      if (value === null || value === '') return true; // Not required
      const num = parseFloat(value);
      if (isNaN(num)) return 'Please enter a valid number';
      if (num < 0 || num > 90) return 'Value must be between 0 and 90';
      return true;
    }

    const restrictInput = (event) => {
      if (!/[0-9.]|\b/.test(event.key) || event.key === 'e' || event.key === 'E') {
      event.preventDefault();
      }
    }

    const onGeoJsonLoaded = (bbox) => {
      emit("clear-map");
      emit('send-Feature-Data', []);
      clearAllData();
      emit('show-results', false);
      emit('geojson-loaded', bbox); // Re-emit the event to the parent (Main component)
      infoStore.clearRecentInfo(); 
    };

    const clearAll = () => {
      dateRangeFrom.value = oneYearAgoString;
      dateRangeTo.value = today;
      areaCloudCoverage.value = "";
      imageCloudCoverage.value = "";
      offNadirAngle.value = "";
      sensor.value = sensorItems.value;
      featureList.value = [];
      setBbox([]);
      clearAllData();
      emit("clear-map");
      emit('send-Feature-Data', []);
      emit('show-results', false);
    };

   

    const runFilter = () => {
      if (!dateRangeFrom.value || !dateRangeTo.value) {
        showPopup.value = true;
        popupMessage.value = "Please select both Date From and Date To";
        return;
      }

      if (!props.bbox || !props.bbox.length) {
        showPopup.value = true;
        popupMessage.value = "Draw bbox or upload geojson";
        return;
      }

      if (!sensor.value || sensor.value.length === 0) {
        showPopup.value = true;
        popupMessage.value = "Please select sensors.";
        return;
      }

      const areaCloudValidation = validateCloudCoverage(areaCloudCoverage.value);
      if (areaCloudValidation !== true) {
        showPopup.value = true;
        popupMessage.value = `Area Cloud Coverage: ${areaCloudValidation}`;
        return;
      }

      const imageCloudValidation = validateCloudCoverage(imageCloudCoverage.value);
      if (imageCloudValidation !== true) {
        showPopup.value = true;
        popupMessage.value = `Image Cloud Coverage: ${imageCloudValidation}`;
        return;
      }

      const offNadirValidation = validateOffNadirAngle(offNadirAngle.value);
      if (offNadirValidation !== true) {
        showPopup.value = true;
        popupMessage.value = `Off Nadir Angle: ${offNadirValidation}`;
        return;
      }

      const selectedSensorsString = sensor.value.join(",");

      let filter = '';

      if (areaCloudCoverage.value) {
        filter += `area:cloud_cover_percentage <= ${areaCloudCoverage.value}`;
      }

      if (imageCloudCoverage.value) {
        if (filter) filter += ' AND ';
        filter += `eo:cloud_cover <= ${imageCloudCoverage.value}`;
      }
      
      if (offNadirAngle.value) {
        if (filter) filter += ' AND ';
        filter += `view:off_nadir <= ${offNadirAngle.value}`;
      }

      let filterQuery = filter ? `&filter=${filter}` : '';
      const dateFromFormatted = `${dateRangeFrom.value}T00:00:00Z`;
      const dateToFormatted = `${dateRangeTo.value}T00:00:00Z`;
      const datetimeRange = `${dateFromFormatted}/${dateToFormatted}`;

      featureList.value = [];
      emit('clear-polygons');
      emit('show-results', false);
      loading.value = true;

      fetchFeatures(props.bbox, selectedSensorsString, datetimeRange, filterQuery).then(data => {
        featureList.value = [];
        try {
          data.features.forEach(feature => {
            featureList.value.push({
              id: feature.id,
              'area:cloud_cover_percentage': feature.properties["area:cloud_cover_percentage"],
              'eo:cloud_cover': feature.properties["eo:cloud_cover"],
              metadata: feature,
            });
            
          });
          saveData('metadata', data);

          if (!data.features.length) {
            showPopup.value = true;
            popupMessage.value = "No result found";
          } else {
            emit('send-Feature-Data', featureList.value);
            emit('show-results', true);
          }
          loading.value = false;
        } catch (error) {
          loading.value = false;
          errorStore.addError({ 
            error: error.message,
            info: "Error: An issue occurred while fetching data.",  
            timestamp: new Date().toISOString()
          });
        }
      });
    };

    const runButtonStyle = computed(() => {
      return isBboxEmpty.value ? {} : { backgroundColor: '#424242', color: 'white' };
    });

    const clearAllButtonStyle = computed(() => {
      return isBboxEmpty.value ? {} : { color: '#424242' };
    });

    const showSensorInfo = async (sensorItem) => {
      selectedSensorTitle.value = sensorItem;
      showSensorInfoDialog.value = true;
      loadingSensorInfo.value = true;
      sensorInfo.value = null;
      sensorInfoJson.value = '';
      
      try {
        const info = await fetchCollectionInfo(sensorItem);
        sensorInfo.value = info;
        sensorInfoJson.value = JSON.stringify(info, null, 2);
      } catch (error) {
        errorStore.addError({
          error: error.message,
          info: `Error fetching information for sensor: ${sensorItem}`,
          timestamp: new Date().toISOString()
        });
      } finally {
        loadingSensorInfo.value = false;
      }
    };

    return {
      today,
      oneYearAgoString, 
      dateRangeFrom,
      dateRangeTo,
      areaCloudCoverage,
      imageCloudCoverage,
      offNadirAngle,
      sensor,
      sensorItems,
      maxDate: today,
      clearAll,
      runFilter,
      showPopup,
      popupMessage,
      loading,
      onGeoJsonLoaded,
      errorState: errorStore.errorState,
      isBboxEmpty,
      runButtonStyle,
      clearAllButtonStyle,
      validateCloudCoverage,
      validateOffNadirAngle,
      restrictInput,
      infoState: infoStore.infoState,
      loadingSensors,
      showSensorInfo,
      showSensorInfoDialog,
      selectedSensorTitle,
      sensorInfo,
      sensorInfoJson,
      loadingSensorInfo,
    };
  },
  methods:{
    startDrawingBbox() {
      this.$emit('bbox-status', true);
      this.$emit('send-Feature-Data', []);
      this.$emit('show-results', false);
      removeData('metadata');
      removeData('bbox');
      removeData('featureTablePage');
      removeData('featuresPerPage');
    }
  }
};
</script>

<style scoped>
.sidebar {
  width: 350px;
  height: 100vh;
  overflow: auto;
  background-color: #EEF2EC;
  display: flex;
  flex-direction: column;
  border-right: 1px solid #cfcfcf;
}

.action-buttons-top {
  display: flex;
  justify-content: start;
  padding: 0px;
}

.action-buttons-bottom {
  justify-content: space-between;
  display: flex;
  margin: 0px 10px;
}

.title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.tight-row {
  margin: 0;
  padding: 0;
}

.tight-col {
  margin: 0;
  padding: 0;
}

.sensor-section-label {
  color: #000000;
  font-size: medium;
  padding-left: 0%;
}
.sensor-text {
  font-weight: normal;
  font-size: 14px; 
  color: #262626; 
}

.sensor-container {
    width: 100%;
    padding: 0px;
    margin-right: auto;
    margin-left: auto;
}

.sensor-checkbox-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.info-icon {
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.info-icon:hover {
  opacity: 1;
}

.json-content {
  white-space: pre-wrap;
  font-family: monospace;
  font-size: 12px;
  padding: 8px;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}
</style>
