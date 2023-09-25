let map;

// Initialize the map
function initMap() {
    // Check if the browser supports Geolocation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // Get the user's current coordinates
            var userLat = position.coords.latitude;
            var userLng = position.coords.longitude;

            // Create a LatLng object for the user's location
            var userLatLng = new google.maps.LatLng(userLat, userLng);

            // Create the map centered on the user's location
            map = new google.maps.Map(document.getElementById("map"), {
                center: userLatLng, // Center the map on the user's location
                zoom: 12, // Set an appropriate zoom level
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

        }, function(error) {
            console.error("Error getting user's location:", error);
        });
    } else {
        console.error("Geolocation is not supported by this browser.");
    }
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
          console.log(marker);
      }
  });
}
// Call the initMap function to initialize and add the map
initMap();
