// Initialize and add the map
let map;

async function initMap() {
  // Request needed libraries
  //@ts-ignore
  const { Map } = await google.maps.importLibrary("maps");
  const { AdvancedMarkerView } = await google.maps.importLibrary("marker");

  // The location of Uluru
  const position = { lat: -25.344, lng: 131.031 };

  // The map, centered at Uluru
  map = new Map(document.getElementById("map"), {
    zoom: 4,
    center: position,
    zoomControl: false, // Disable the default zoom control buttons
    fullscreenControl: false, // Disable the full-screen control button
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
    mapId: "DEMO_MAP_ID",
  });

  // The marker, positioned at Uluru
  const marker = new AdvancedMarkerView({
    map: map,
    position: position,
    title: "Uluru",
  });
}


// Call the initMap function to initialize and add the map
initMap();
