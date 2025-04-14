<template>
    <v-card-actions class="action-button-bottom">
        <v-btn text size="small" elevation="0" variant="flat"
          color="#424242"
          @click="exportGeoJson"
        >
          DOWNLOAD
        </v-btn>
    </v-card-actions>
  </template>
  
  <script>
import { getData } from '@/stores/dataStore';

  export default {
    methods: {
      exportGeoJson() {  
        const geoJson = getData('metadata',{});
        // Create a Blob from the GeoJSON
        const blob = new Blob([JSON.stringify(geoJson)], { type: "application/geo+json" });
  
        // Create a URL for the Blob
        const url = URL.createObjectURL(blob);
  
        // Create an anchor element and set download attributes
        const link = document.createElement("a");
        link.href = url;
        link.download = "search-results.geojson";
  
        document.body.appendChild(link); // Append link to the body
        link.click(); // Programmatically click the link to trigger the download
        document.body.removeChild(link); // Clean up and remove the link from the DOM
        URL.revokeObjectURL(url); // Revoke the URL after download
      },
    },
  };
  </script>
  
  <style scoped>
  .action-button-bottom {
    justify-content: flex-end;
    margin-right: 10px;
  }
  </style>
  