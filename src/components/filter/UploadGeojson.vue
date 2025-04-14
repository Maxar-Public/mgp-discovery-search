<template>
    <v-container class="button-container">
      <!-- Button to trigger file input -->
      <v-btn size="small" variant="tonal"
        @click="triggerFileInput"
        :disabled="disableButton"
      >
        UPLOAD
      </v-btn>
  
      <!-- Hidden file input -->
      <input
        type="file"
        ref="fileInput"
        accept=".geojson"
        style="display: none"
        @change="handleFileChange"
      />
    </v-container>
  </template>
  
  <script>
  import { ref } from 'vue';
  import errorStore from '../../stores/errorStore'
  
  export default {
    props: {
      disableButton: {
        type: Boolean,
        default: false,
      }
    },
    setup(props, { emit }) {
      const fileInput = ref(null);    
  
      // Function to trigger the file input click
      const triggerFileInput = () => {
        if (!props.loading && fileInput.value) {
          fileInput.value.click(); // Programmatically click the hidden file input
        }
      };
  
      // Function to handle file change event
      const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
  
          // Check if it has a .geojson extension or valid MIME type
          if (file.type !== 'application/geo+json' && !file.name.endsWith('.geojson')) {
            errorStore.addError({ 
              error: "Please upload a valid GeoJSON file.", 
              info: "Upload GeoJson", 
              timestamp: new Date().toISOString() 
            });

            resetFileInput();
            return;
          }
  
          // Read the file as text
          const reader = new FileReader();
          reader.onload = () => {
            try {
              // Parse the GeoJSON data
              const geoJsonData = JSON.parse(reader.result);
  
              // Extract BBox or calculate it
              let bbox = geoJsonData.bbox;
              if (!bbox) {
                bbox = calculateBoundingBox(geoJsonData);
              }

              emit('geojson-loaded', bbox); // Emit the bbox to the parent component
              
            } catch (error) {
              console.log(error)

              errorStore.addError({ 
                error: "Parsing GeoJson file.", 
                info: "Upload GeoJson", 
                timestamp: new Date().toISOString() 
              });             
            }

            resetFileInput();
          };
          reader.readAsText(file);
        }
      };

      const resetFileInput = () => {
        fileInput.value.type = '';
        fileInput.value.type = 'file';
      };
  
      const flattenCoordinates = (coords) => {
        if (typeof coords[0] === 'number') {
          return [coords];
        }
        return coords.flatMap(flattenCoordinates);
      };
  
      const calculateBoundingBox = (geoJson) => {
        const coords = [];
        if (geoJson.features) {
          geoJson.features.forEach((feature) => {
            const geometry = feature.geometry;
            if (geometry && geometry.coordinates) {
              coords.push(...flattenCoordinates(geometry.coordinates));
            }
          });
        }
  
        const west = Math.min(...coords.map((c) => c[0]));
        const south = Math.min(...coords.map((c) => c[1]));
        const east = Math.max(...coords.map((c) => c[0]));
        const north = Math.max(...coords.map((c) => c[1]));
  
        return [west, south, east, north];
      };
  
      return {
        triggerFileInput,
        handleFileChange,
        fileInput,
      };
    },
  };
  </script>
  
  <style scoped>
  .button-container {
    padding: 10px; 
    width: min-content; 
    margin: 0px;
  }
  </style>