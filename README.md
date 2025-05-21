# MGP Discovery Search

This project leverages Vue.js, Vuetify, and Vite to deliver a modern and interactive web application. It integrates a Leaflet map to provide an interactive interface for retrieving, visualizing, and analyzing geospatial data. The project allows for the user to apply filters, validate inputs, and display results fetched from the Discovery endpoint, enabling efficient data exploration and insights. Below is all the necessary information to set up and run the project.

A companion Jupyter notebook illustrating the core concepts in Python is also available. Click the button below to run the notebook in [Binder](https://mybinder.org).

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/Maxar-Public/mgp-discovery-search/binder?urlpath=%2Fdoc%2Ftree%2FDiscovery-Search-Notebook.ipynb)

## Features

- **Framework:** Built using Vue 3 and Vuetify 3 for a responsive and modern UI.
- **State Management:** Utilizes a custom state management.
- **Routing:** Includes Vue Router for single-page application navigation.
- **Build Tool:** Powered by Vite for fast development and build processes.

# Node.js and npm Installation Guide
    
### Windows and macOS Installation
    
1. **Download Node.js**  
       - Go to the [Node.js download page](https://nodejs.org/) and download the latest **LTS** (Long-Term Support) version, which includes npm.
    
2. **Install Node.js**  
       - Open the downloaded installer and follow the installation prompts.
       - This will install both Node.js and npm.
    
3. **For Additional Guidance**  
       - Visit the official [Node.js Documentation](https://nodejs.org/en/docs/) for more information on setup and usage.
    
### Linux Installation
    
For Linux, you can install Node.js and npm via a package manager (like `apt` for Debian/Ubuntu, or `dnf` for RHEL/Fedora), or directly using `nvm` (Node Version Manager) for easier version control.
    
#### Using a Package Manager
    
- **Debian/Ubuntu**:
    ```
    sudo apt update
    sudo apt install -y nodejs npm
    ```
    ```
    # Run this to check if NodeJS and NPM are installed and verify the version

    node -v   # This should display the Node.js version
    npm -v    # This should display the npm version
    ```

# Setup Instructions

1. **Clone the Repository**

    Clone the project to your local machine:
    ```
    git clone https://github.com/Maxar-Public/mgp-discovery-search.git
    ```
2. **Install Dependencies**

    Install the necessary dependencies using npm:
    ```
    npm install
    ```
    (You can also use `yarn install` or `pnpm install`.)
3. **Environment Configuration**

    Create a `.env` file and set up environment variable. The file should contain:
    ```
    VITE_API_KEY=<your-api-key>
    ```
    Replace `<your-api-key>` with your actual API Key.
    
    **Note:** The `.env` needs to be in the root folder inside 'mgp-discovery-search'

# Usage

## Development Server
To start the development server
```
npm run dev
```
This will launch the application at `http://localhost:3000`.

**Note:** To run this command and any other command you need to locate yourself where the project is otherwise it will throw an error.

## Build for Production
To create an optimized production build:
```
npm run build
```

# Discovery API
    
## Overview
    
The **Discovery API** enables searching, filtering, and sorting through a unified catalog of available Maxar content. It provides metadata information with selectable options about available content as **SpatioTemporal Asset Catalog (STAC)** and **GeoJSON**. Some result sets return links to order or stream the selected content.

## Key Parameters Used In Example
    
- **bbox** — `query`  
Bounding box in format `\"west,south,east,north\"` in WGS84 decimal degrees.
    
- **collection** — `query`  
Comma-separated list of collections to search in. If this parameter is not specified, items are retrieved from all available collections.
    
- **datetime** — `query`  
Date range filter in format `\"start-date/end-date\"` or `\"exact-datetime\"`.
    
- **limit** — `query`  
Maximum number of items to return.
    
- **sortby** — `query`  
An array of property names, prefixed by either `+` for ascending or `-` for descending order.
    
- **area-based-calc** — `boolean`  
Return area-based calculations in search results.
    
For more information, please refer to the [API Documentation](https://developers.maxar.com/docs/discovery/api/get-search-stac).

# Folder Structure
- `src/`: Contains the main application source code.
    - `assets/`: Contains images, fonts, and other assets used in the project.
    - `components/`: Reusable Vue components, such as buttons, modals, or forms.
        - `banner/`: A way to display notification messages in the application.
        - `filter/`: Sidepanel containing inputs, validations and functions to retrieve the data.
        - `map/`: Leaflet map.
        - `table/`: Displays the results from the endpoint and contains the functionalities.
    - `shared/`: Contains the call to the endpoint; the API Service.
    - `stores/`: This folder have the different custom state management.
- `public/`: Static assets and public files.

# Project File Overview

In this section, we will go into detail about the main files in this project, describing their purpose and how they contribute to the overall functionality. 

Each file plays a unique role in supporting core features and handling data to provide a seamless user experience.

## ApiService.js
**Location**:  
This file is located in the `src` folder, within the `shared` subfolder. 

**Purpose**:  
The `ApiService.js` file is responsible for calling the Discovery API and handling the data received. It saves this data to be later displayed on the interactive map within the application. This service helps manage the data flow from the API to the interactive map display, supporting a smooth user experience. 

**Error Validation**:  
This file includes error validation to handle any non-200 HTTP status codes, ensuring that errors from the API are properly identified and managed.

**Key Functions**:
- **fetchSensors**:  
  This function fetches all available sensors from the Discovery API to be displayed in the filter panel. By retrieving sensor options, it enables users to select the specific sensors they want to use when filtering data.

- **fetchFeatures**:  
  This function performs the actual API call to the Discovery API, retrieving data based on specified parameters. The data is then exported for use in other areas of the app, such as the map display and table components, to provide users with relevant search results.

## components/filter/filterPanel.vue

**Location**:  
This file is located in the `components` folder, within the `filter` subfolder.

**Purpose**:  
The `filterPanel.vue` component allows users to define search criteria by selecting various filter options. This panel provides a user-friendly interface to refine search results based on the following parameters:
    
- **Date Range**: Users can select a specific date range to filter the data.
- **Area Cloud Coverage**: Allows users to set the desired cloud coverage for the selected area.
- **Image Cloud Coverage**: Provides an option to filter based on the cloud coverage in the images.
- **Off Nadir Angle**: Users can select the angle off nadir for the satellite images.
- **Sensors**: Enables users to select the specific sensors they wish to use for the search.

**Key Functions**: 
- **onMounted**:  
The `onMounted` lifecycle hook fetches sensor data from the API when the component is first mounted. Additionally, it sets the default selection to include all user input options, ensuring users have an initial, broad selection of filters to start with.

- **runFilter**:  
The `runFilter` method gathers all user inputs from the filter panel and performs validation.  

Once validated, it calls the `fetchFeatures` function from `ApiService.js`, passing in the parameters the user specified. This triggers the API request to retrieve data based on the filtered criteria.
  
## components/map/Map.vue
    
**Location**:  
This file is located in the `components` folder, within the `map` subfolder.
    
**Purpose**:  
The `Map.vue` file is responsible for everything related to the map interface in the application. It handles various map interactions and features, including:
    
- **Drawing the Bounding Box (bbox)**:  
Users can interact with the map to draw a bounding box, which defines the area for their search query.
    
- **Displaying Results on the Map**:  
Once the data is fetched, the map displays the results, allowing users to visualize the content based on their search criteria.
    
- **Map Navigation**:  
Users can move the map around to focus on different areas, helping them navigate to the region where they want to search for data.
    
**Key Functions**:
    
- **polygonPagination**:  
This method is responsible for displaying the areas returned by the API as polygons on the map. It helps visualize the search results, making it easier for users to see the areas they are interested in.
    
- **onImageClick**:  
This function handles the behavior when a user clicks on an image on the map. It can be used for displaying additional information about the selected image or interacting with other components.
    
- **onImageHover**:  
Similar to `onImageClick`, this function manages the interaction when a user hovers over an image on the map. It can be used to display tooltips or highlight areas of interest.
    
This component is essential for providing users with an interactive map that allows them to visually explore search results and fine-tune their search area.
   
## components/table/ResultsTable.vue
    
**Location**:  
This file is located in the `components` folder, within the `table` subfolder.
    
**Purpose**:  
The `ResultsTable.vue` file is responsible for displaying the results fetched from the API in a table format. It provides users with essential information about each result, making it easier to review and analyze the returned data. Key information displayed includes:
    
- **Image ID**:  
Displays the unique identifier for each image result, allowing users to reference or locate specific images.

- **Area Cloud Coverage (Area CC)**:  
Shows the percentage of cloud coverage within the specified area, giving users insight into the clarity of the area of interest.
    
- **Image Cloud Coverage (Image CC)**:  
Displays the cloud coverage specific to the image itself, helping users assess the quality of the image.
    
**Event Emissions**:  
Instead of relying on specific key functions, this component emits variables to the main application, enabling other parts of the app to utilize and display the data more effectively.
   

# Custom Configurations
- **API Key Management:** The API Key is dynamic and can be updated via the `.env` file.
- **UI Enhancements:** Customized `v-select` and `v-number-input` components for better user experience.

