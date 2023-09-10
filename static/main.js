let map;

// Initialize the map
function initMap() {
    map = new google.maps.Map(document.getElementById("map"), {
        zoom: 4,
        center: { lat: 0, lng: 0 }, // Initialize the map at a default center
        zoomControl: false,
        fullscreenControl: false,
        streetViewControl: false,
        gestureHandling: "cooperative",
        minZoom: 2,
        restriction: {
            latLngBounds: {
                north: 85,
                south: -85,
                west: -180,
                east: 180
            }
        },
        mapId: "DEMO_MAP_ID"
    });

    // Fetch latitude and longitude data from the server
    fetch('/api/get_lat_lng')
        .then(response => response.json())
        .then(data => {
            // Handle the retrieved latitude and longitude data here
            console.log(data);
            // Call a function to add markers to the map using the data
            addMarkersToMap(data);
        })
        .catch(error => {
            // Handle any errors
            console.error(error);
        });
}

function addMarkersToMap(data) {
  // Loop through the data and add markers to the map
  data.forEach(location => {
      const latitude = parseFloat(location.latitude);
      const longitude = parseFloat(location.longitude);

      if (!isNaN(latitude) && !isNaN(longitude)) {
          const marker = new google.maps.Marker({
              position: { lat: latitude, lng: longitude },
              map: map,
              title: "Location"
          });
      }
  });
}
// Call the initMap function to initialize and add the map
initMap();
