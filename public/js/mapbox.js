/* eslint-disable */

export const displayMap = (locations) => {
  mapboxgl.accessToken =
    'pk.eyJ1IjoicnVodWwtYSIsImEiOiJjbHdueXYyYjcwNmIwMmtuNHp4aXRqeXZpIn0.yUxicTjuXhnpYuK51giTOQ';

  var map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/ruhul-a/clwp7bmfc00z001pn8bs68pel',
    scrollZoom: false,
    // center: [-118.113491, 34.111745],
    // zoom: 10,
    // interactive: false,
  });

  const bounds = new mapboxgl.LngLatBounds();

  locations.forEach((loc) => {
    //Create a marker
    const el = document.createElement('div');
    el.className = 'marker';

    //Add the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    //Add popup
    new mapboxgl.Popup({ offset: 30 })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      // .setMaxWidth('300px')
      .addTo(map);
    //extend the map bound to include the current locations
    bounds.extend(loc.coordinates);
  });
  // console.log(bounds);
  map.fitBounds(bounds, {
    padding: { top: 200, bottom: 150, left: 100, right: 100 },
  });
};
