import errorStore from '../stores/errorStore'

const baseUrl = "https://api.maxar.com/discovery/v1/catalogs/imagery"
const apiKey = import.meta.env.VITE_API_KEY;




//-----------------Endpoints-----------------------------------------------------------------//


//Sensor Titles - Dynamically fetched from API
export const fetchSensors = async () => {
  try {
    const response = await fetch(`${baseUrl}/collections?maxar_api_key=${apiKey}`, {
      method: 'GET'
    });

    if (!response.ok) {
      if(response.status === 401) throw new Error('Unauthorized, please insert a valid Api key in config');
      if(response.status === 500) throw new Error('Internal API Error');
      throw new Error(`Failed to fetch collections: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract collection IDs from the response
    // Assuming the response has a collections array with id properties
    const sensors = data.collections.map(collection => collection.id);
    return sensors;
  } catch (error) {
    errorStore.addError({
      error: error.message,
      info: "Error fetching available collections: ",
      timestamp: new Date().toISOString()
    });
    
    // Return the static list as fallback
    return [
      'ge01',
      'wv01',
      'wv02',
      'wv03-vnir',
      'wv03-swir',
      'wv04',
      'lg01',
      'lg02',
      'lg03',
      'lg04'
    ];
  }
};

export const fetchCollectionInfo = async (collectionId) => {
    // Fetch collection STAC definition
    const response = await fetch(`${baseUrl}/collections/${collectionId}?maxar_api_key=${apiKey}`, {
        method: 'GET'
    });
    if (!response.ok) {
        if(response.status === 401) throw new Error('Unauthorized, please insert a valid Api key in config');
        if(response.status === 500) throw new Error('Internal API Error');
        throw new Error(`Failed to fetch collection info: ${response.status}`);
    }
    const data = await response.json();
    return data;
}

// Fetch BBOX Results
export const fetchFeatures = async (bbox,selectedSensorsString,datetimeRange, filter) => {
    try {
        const response = await fetch(`${baseUrl}/search?bbox=${bbox[0]},${bbox[1]},${bbox[2]},${bbox[3]}&collections=${selectedSensorsString}&datetime=${datetimeRange}&area-based-calc=true${filter}&limit=1000&page=1&sortBy=datetime&maxar_api_key=${apiKey}`, {
            method: 'GET'
        });

        if (!response.ok){           
            
            if(response.status === 408) throw new Error('Api call timeout, bbox area is too large');
            if(response.status === 401) throw new Error('Unauthorized, please insert a valid Api key in config'); //Currently not working due to CORS Issue
            if(response.status === 500) throw new Error('Internal API Error');
            else throw new Error('Bad Request');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        errorStore.addError({ 
            error: error.message,
            info: "Error fetching Features: ",  
            timestamp: new Date().toISOString()
        });
    }
};

// Get cloud polygons coordinates
export const fetchCloudPolygons = async (cloudCover) => {

    try {
        //console.log(cloudCover);
        const response = await fetch(`${cloudCover}?&maxar_api_key=${apiKey}`, {
            method: 'GET'
        });

        if (!response.ok){           
            if(response.status === 408) throw new Error('Api call timeout, cloud area is too large');
            if(response.status === 401) throw new Error('Unauthorized, please insert a valid Api key in config'); //Currently not working due to CORS Issue
            if(response.status === 500) throw new Error('Internal API Error');
            else throw new Error('Bad Request');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        errorStore.addError({ 
            error: error.message,
            info: "Error fetching Cloud Geometry: ",  
            timestamp: new Date().toISOString()
        });
    }

};
