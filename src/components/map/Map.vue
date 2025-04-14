<template>
  <div id="map-container">
    <InfoBanner />
    <ErrorBanner />
    <div id="map">
      <v-tooltip 
        v-text="mouseTooltip" 
        v-if="showTooltip" 
        :style="{ top: `${mousePosition.y - 10}px`, left: `${mousePosition.x + 365}px`, borderRadius: '4px' }">
      </v-tooltip>
    </div>
    <div class="custom-zoom-controls">
      <button class="zoom-button" @click="zoomIn">
        <v-icon>mdi-plus</v-icon>
      </button>
      <button class="zoom-button" @click="zoomOut">
        <v-icon>mdi-minus</v-icon>
      </button>
    </div>
  </div>
</template>

<script>
import { onMounted, watch, ref } from 'vue';
import L from 'leaflet';
import { saveData, getData, removeData } from '@/stores/dataStore';
import infoStore from '@/stores/infoStore';

export default {
props: {
  isDrawingBBOX: {
    type: Boolean,
    default: () => false,
  },
  bbox: {
    type: Array,
    default: () => null,
  },
  featureList: {
    type: Array,
    default: () => [],
  },
  featureTablePage: {
    type: Number,
    default: () => 1, 
  },
  featuresPerPage: {
    type: Number,
    default: () => 0,
  },
  highlightedFeature: {
    type: Object,
    default: () => null,
  },
  isHighlighted: {
    type: Boolean,
    default: () => false,
  },
  isSelectedHighlighted: {
    type: Boolean,
    default: () => false,
  },
  selectedHighlightedFeature: {
    type: Object,
    default: () => null,
  },
  geometryData: {
    type: Object,
    default: () => null,
  },
  cloudCoverToggle: {
    type: Boolean,
    default: () => false,
  },
  cloudGeometryIsLoading: {
    type: Boolean,
    default: () => false,
  }
},
emits: ['bbox-status', 'update-bbox', 'highlight-feature', 'unhighlight-feature', 'selected-feature'],
setup(props, {emit}) {
  var southWest; // BBOX Bottom-left corner (minLon, minLat)
  var northEast; // BBOX Top-right corner (maxLon, maxLat) 
  let map, drawnItems, rectangle, startLatLng, images, hightLighted, selectedImage, cloudPolygon;
  const mouseTooltip = ref("Click and drag to draw rectangle.");
  const mousePosition = ref({ x: 0, y: 0 });
  const showTooltip = ref(false);

  const clearMap = () => { 
    if (rectangle) {      
      drawnItems.removeLayer(rectangle);
      map.removeLayer(rectangle);
      rectangle = null; 
    }

    if(images) {
      images.clearLayers();
    }

    if(hightLighted) {
      hightLighted.clearLayers(); 
    }
    if(selectedImage) {
      selectedImage.clearLayers();
    }

    if(cloudPolygon) {
      cloudPolygon.clearLayers();
    }

  };

  // Method to zoom in the map
  const zoomIn = () => {
    if (map) map.zoomIn();
  };

  // Method to zoom out the map
  const zoomOut = () => {
    if (map) map.zoomOut();
  };

  const polygonPagination = () => {
    if(images) {
      images.clearLayers();
    }
    let page = props.featureTablePage;
    let itemsPerPage = props.featuresPerPage;
    if(!page) page = 1;
    if(!itemsPerPage) itemsPerPage = 0;
    
    let firstFeatureInTable = (page * itemsPerPage) - itemsPerPage;
    if(itemsPerPage === -1){   
      firstFeatureInTable = 0;
    }
    let lastFeatureInTable = firstFeatureInTable + itemsPerPage - 1;
    if(props.featureList.length < (itemsPerPage*page) || itemsPerPage === -1){
      lastFeatureInTable = props.featureList.length - 1; //in the case that the last page contains less features than the rest
    }

    const bounds = L.latLngBounds([]);

    for(let i=firstFeatureInTable; i <= lastFeatureInTable; i++){
      var coords = props.featureList[i].metadata.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

      // Create a polygon in Leaflet 
      const image = L.polygon(
        coords,
        {
          color: '#BD00FF90',
          fillOpacity: 0,
          weight: 2,
          opacity: 0.7,
        },
      ).addTo(map);
      image.customData = props.featureList[i].metadata;

      //Trigger function when hovering over and clicking image
      image.on('click', onImageClick);
      image.on('mouseover', onImageHover);
      image.on('mouseout', onImageHoverOut);

      images.addLayer(image);
      coords.forEach(coord => bounds.extend(coord));
    }

    if (props.bbox) {
      const bboxBounds = L.latLngBounds(
        L.latLng(props.bbox[1], props.bbox[0]),
        L.latLng(props.bbox[3], props.bbox[2])
      );
      bounds.extend(bboxBounds);
    }

    if(bounds.isValid()) {
      map.fitBounds(bounds);
      const center = bounds.getCenter();
      map.setView(center);
    }
  }

  const onImageClick = (event) => {
    const newFeature = event.target.customData;
    highlightSelectedImage(newFeature);

    emit('selected-feature', {
      id: newFeature.id,
      'area:cloud_cover_percentage': newFeature.properties["area:cloud_cover_percentage"],
      'eo:cloud_cover': newFeature.properties["eo:cloud_cover"],
      metadata: newFeature,
    });
  };

  const onImageHover = (event) => {
    const featureMetadata = event.target.customData;
    event.target.setStyle({
      color: '#BD00FF70', // Outline color
      fillColor: '#BD00FF70', // Fill color
      fillOpacity: 0.50, // Opacity of the inside
      weight: 2, // Thickness of the outline
    });
    emit('highlight-feature', {
      id: featureMetadata.id,
      'area:cloud_cover_percentage': featureMetadata.properties["area:cloud_cover_percentage"],
      'eo:cloud_cover': featureMetadata.properties["eo:cloud_cover"],
      metadata: featureMetadata,
    });
  };

  const onImageHoverOut = (event) => {
    event.target.setStyle({
      color: '#BD00FF90',
      fillOpacity: 0,
      weight: 2,
      opacity: 0.7,
    });
    emit('unhighlight-feature', null);
  };

  const highlightPolygon = (FeatureMetadata) => {
    const coords = FeatureMetadata.geometry.coordinates[0].map(coord => [coord[1], coord[0]])
    const polygon = L.polygon(
      coords,
      {
        color: '#BD00FF70', // Outline color
        fillColor: '#BD00FF70', // Fill color
        fillOpacity: 0.50, // Opacity of the inside
        weight: 2, // Thickness of the outline
      },
    ).addTo(map);
    polygon.customData = FeatureMetadata;
    hightLighted.addLayer(polygon);
  };

  const unhighlightPolygon = () => {
    if(hightLighted) {
      hightLighted.clearLayers();
    }
  };

  const highlightSelectedImage = (featureMetadata) => {
    selectedImage.clearLayers();
    var coords = featureMetadata.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

    // Create a polygon in Leaflet 
    const polygon = L.polygon(
      coords,
      {
        color: '#BD00FF', // Outline color
        fillColor: '#BD00FF', // Fill color
        fillOpacity: 0.50, // Opacity of the inside
        weight: 2, // Thickness of the outline
      },
    ).addTo(map);
    polygon.customData = featureMetadata;
    polygon.on('click', unhighlightSelectedImageFromMap);
    selectedImage.addLayer(polygon);
  }

// function to create the cloud polygon
const createCloudPolygon = () => {
      if(props.geometryData.geometry.type === "MultiPolygon"){
       props.geometryData.geometry.coordinates.forEach(coords => {
            coords = coords[0];
            coords = coords.map(coord => [coord[1], coord[0]]);
            const polygon = L.polygon(coords).addTo(map);
            cloudPolygon.addLayer(polygon);
        });
        }
        else if(props.geometryData.geometry.type === "Polygon"){
          var coords = props.geometryData.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

          // Create a polygon in Leaflet 
          const polygon = L.polygon(
            coords,
          ).addTo(map);
          cloudPolygon.addLayer(polygon);
        }
  
}

  const unhighlightSelectedImageFromMap = () => {
    emit('selected-feature', null);
    unhighlightSelectedImage();
  }

  const unhighlightSelectedImage = () => {
    selectedImage.clearLayers();
    cloudPolygon.clearLayers();
  }

  const saveMapViewToStorage = () => {
    const center = map.getCenter(); // Get current map center
    const zoom = map.getZoom(); // Get current map zoom level
    const mapView = {
      center: [center.lat, center.lng],
      zoom: zoom
    };
    saveData('mapView', mapView); // Save to session storage
  };

  onMounted(() => {
    const savedMapView = getData('mapView', null);
    

    map = L.map("map", {
      minZoom: 2, 
      maxZoom:18,
      maxBounds: [[-90, -180], [90, 180]],
      zoomControl: false, 
      dragging: true,  
      scrollWheelZoom: true,  
      worldCopyJump: false,
      attributionControl: false, 
    });

    // Add base layer (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      noWrap: false,
      attribution: '© OpenStreetMap contributors'
      }).addTo(map);

    // Initialize drawnItems to store drawn shapes
    drawnItems = new L.FeatureGroup();
    map.addLayer(drawnItems);

    // Initialize drawnItems to store drawn shapes
    images = new L.FeatureGroup();
    map.addLayer(images);

    //Initialize features to store API features 
    hightLighted = new L.FeatureGroup();
    map.addLayer(hightLighted);

    //Initialize selectedImages to store the selected feature
    selectedImage = new L.FeatureGroup();
    map.addLayer(selectedImage);

    // Initialize cloud polygon
    cloudPolygon = new L.FeatureGroup();
    map.addLayer(cloudPolygon);

    const savedBbox = getData('bbox', []);
    
    if (savedBbox && savedBbox.length) {
      const bounds = L.latLngBounds(
        L.latLng(savedBbox[1], savedBbox[0]), // Southwest (minLat, minLon)
        L.latLng(savedBbox[3], savedBbox[2])  // Northeast (maxLat, maxLon)
      );
      rectangle = L.rectangle(bounds, { color: "#ff7800", weight: 1 }).addTo(map);
      
      if (bounds.isValid()) {
        map.fitBounds(bounds);
        const center = bounds.getCenter();
        map.setView(center);
      }
    } 

    if (savedMapView) {
      map.setView(savedMapView.center, savedMapView.zoom);
    } else {
      map.setView([39.87, -105.045], 9); // Default view
    }

    if (props.featureList && props.featureList.length > 0) {
      polygonPagination();
    }

    if (props.selectedHighlightedFeature) {
      highlightSelectedImage(props.selectedHighlightedFeature.metadata);
    }

    if(props.geometryData && props.cloudCoverToggle){
      createCloudPolygon();
    }

    // Watch for changes to the map's view and store them in session storage
    map.on('moveend', saveMapViewToStorage);
    map.on('zoomend', saveMapViewToStorage);

    map.getContainer().addEventListener("mouseenter", () => {
      if (props.isDrawingBBOX) {
        showTooltip.value = true;
        mouseTooltip.value = "Click and drag to draw rectangle.";
      }
    });

    map.getContainer().addEventListener("mouseleave", () => {
      showTooltip.value = false;
    });


    
  });

  watch(() => props.isDrawingBBOX, (newVal) => {
    if (newVal) {
      // Clear previous layers and start fresh
      clearMap();
      if (map.getZoom() < 9){
        
        infoStore.addInfo({
          info: "Please zoom in."
        });
        emit('bbox-status', false);
        emit('update-bbox', []);
      }else{
        infoStore.clearRecentInfo();       
        startDrawingBBOX();
      }
      
    } else {
      stopDrawingBBOX();
    }
  });

  watch(() => props.bbox, (newBbox) => {
    clearMap();
    if (newBbox && newBbox.length === 4) {
      const bounds = L.latLngBounds(
        L.latLng(newBbox[1], newBbox[0]),  // Southwest (minLat, minLon)
        L.latLng(newBbox[3], newBbox[2])   // Northeast (maxLat, maxLon)
      );
      rectangle = L.rectangle(bounds, { color: "#ff7800", weight: 1 }).addTo(map);
      map.fitBounds(bounds);
      const center = bounds.getCenter();
      map.setView(center);      
    }
  });

  watch(() => props.featureList, () => {
    if (props.featureList && props.featureList.length > 0) {
      polygonPagination();
    }
  });

  watch(() => props.featureTablePage, () => {
    if (props.featureList && props.featureList.length > 0) {
      polygonPagination(); 
    }
  });

  watch(() => props.featuresPerPage, () => {
    if (props.featureList && props.featureList.length > 0) {
      polygonPagination(); 
    }
  });

  watch(() => props.isHighlighted, () => {
    if (props.highlightedFeature && props.isHighlighted) {
      var featureMetadata = props.highlightedFeature.metadata;
      highlightPolygon(featureMetadata);
    }
    else{
      unhighlightPolygon();
    }
  });

  watch(() => props.isSelectedHighlighted, () => {
    if(!props.isSelectedHighlighted){
      unhighlightSelectedImage();
    }
  });

  watch(() => props.geometryData, () => { 
    if(props.geometryData){
      if(cloudPolygon) {
        cloudPolygon.clearLayers();
        }
      if(props.geometryData.geometry && props.cloudCoverToggle){
      createCloudPolygon();
    }
    }
    
  });

  watch(() => props.selectedHighlightedFeature, () => {
    if (props.isSelectedHighlighted && props.selectedHighlightedFeature) {
      highlightSelectedImage(props.selectedHighlightedFeature.metadata);
    }
  });

  watch(() => props.cloudCoverToggle, () => {
    if(!props.cloudCoverToggle){
      cloudPolygon.clearLayers();
    }
    else if(props.geometryData){
      createCloudPolygon();
    }
  });

  const updateMousePosition = (event) => {
    const { containerPoint } = event;
    mousePosition.value = { x: containerPoint.x, y: containerPoint.y};
  };

  // Function to start drawing a BBOX (Bounding Box)
  const startDrawingBBOX = () => {
    // Disable map interaction
    map.dragging.disable();
    map.scrollWheelZoom.disable();
    map.doubleClickZoom.disable();
    map.getContainer().style.cursor = "crosshair";
    mouseTooltip.value = "Click and drag to draw rectangle.";

    // Start listening for mousedown to initiate drawing
    map.on("mousedown", onMouseDown);
    map.on("mousemove", updateMousePosition);
    emit('bbox-status', true);
  };

  // Event handler for mousedown to start drawing the BBOX
  const onMouseDown = (e) => {
    if (!props.isDrawingBBOX) return;

    if (rectangle) {
      drawnItems.removeLayer(rectangle);
      map.removeLayer(rectangle);
      rectangle = null;
    }

    mouseTooltip.value = "Release mouse to finish drawing.";
    // Set the initial point and start drawing
    startLatLng = e.latlng;
    map.on("mousemove", onMouseMove);
    map.on("mouseup", onMouseUp);
  };

  // Event handler for mousemove to dynamically draw the rectangle
  const onMouseMove = (e) => {
    if (!props.isDrawingBBOX) return;

    const bounds = L.latLngBounds(startLatLng, e.latlng);

    // If rectangle exists, update its bounds, else create a new one
    if (rectangle) {
      rectangle.setBounds(bounds);
    } else {
      rectangle = L.rectangle(bounds, { color: "#ff7800", weight: 1, fillOpacity: 0.1, });
      rectangle.addTo(map);
    }
  };

  // Event handler for mouseup to finish the drawing
  const onMouseUp = () => {
    if (!props.isDrawingBBOX) return;

    map.off("mousemove", onMouseMove);
    map.off("mouseup", onMouseUp);
    mouseTooltip.value = "";
    showTooltip.value = false;

    if (rectangle) {
      drawnItems.addLayer(rectangle);

      // Get the GeoJSON of the drawn BBOX
      const bounds = rectangle.getBounds();
      // Extract the southwest and northeast corners
      southWest = bounds.getSouthWest();
      northEast = bounds.getNorthEast();

      // Construct BBOX array in [minLon, minLat, maxLon, maxLat] format
      const bboxPoints = [southWest.lng, southWest.lat, northEast.lng, northEast.lat];
      
      // Emit event to indicate drawing is complete
      emit('bbox-status', false); 
      emit('update-bbox', bboxPoints);
    }
  };

  const stopDrawingBBOX = () => {
    // Re-enable map interaction
    map.dragging.enable();
    map.scrollWheelZoom.enable();
    map.doubleClickZoom.enable();
    map.getContainer().style.cursor = "";
    mouseTooltip.value = "";
  };

  const clearPolygons = () => {
    if (images) {
      images.clearLayers();
    }
  };

  return {
    map,
    zoomIn,
    zoomOut,
    clearMap,
    mouseTooltip,
    mousePosition,
    showTooltip,
    infoState: infoStore.infoState,
    clearPolygons
  }
},
};
</script>


<style>
@import "leaflet/dist/leaflet.css";
#map {
  height: 100vh; 
  width: 100%;
}

.leaflet-control-zoom-in, .leaflet-control-zoom-out {
  width: 32px; 
  height: 32px; 
  border-radius: 32px; 
  line-height: 32px; 
  text-align: center; 
}

.leaflet-control-zoom-in:hover, .leaflet-control-zoom-out:hover {
  background-color: #e6e6e6; 
}

.leaflet-touch .leaflet-control-layers, .leaflet-touch .leaflet-bar {
  border: none;
}

.leaflet-control-zoom-in {
  margin-bottom: 8px; 
}

.custom-zoom-controls {
  position: absolute;
  bottom: 20px;
  right: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  z-index: 1000; /* Ensure it stays above other map elements */
}

.zoom-button {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  box-shadow: 0px 2px 5px rgba(0, 0, 0, 0.3);
  transition: background-color 0.3s;
}

.zoom-button:hover {
  background-color: #f0f0f0;
}

.v-icon {
  font-size: 20px; /* Adjust icon size if needed */
}

.v-tooltip {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
  background-color: #616161E5;
  color: white;
  font-size: xx-small;
  padding: 5px 10px;
  width: max-content;
  height: max-content;
}

#map-container {
  position: relative;
  height: 100vh;
  width: 100%;
}

</style>
