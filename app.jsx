/* global window */
import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';
import {IconLayer} from '@deck.gl/layers';


// Source data CSV
const DATA_URL = {
  BUILDINGS:
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: 'https://raw.githubusercontent.com/jamescannella/zto_demo2/main/zto-chicago-trips-full3.json' // eslint-disable-line
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 4.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 5.0,
  position: [-87.63476, 41.87516]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const material = {
  ambient: 0.4,
  diffuse: 0.6,
  shininess: 80,
  specularColor: [60, 64, 70]
};

const DEFAULT_THEME = {
  buildingColor: [74, 80, 87],
  trailColor0: [253, 128, 93],
  trailColor1: [23, 184, 190],
  material,
  effects: [lightingEffect]
};

const INITIAL_VIEW_STATE = {
  longitude: -87.62906,
  latitude: 41.8832,
  zoom: 15.5,
  pitch: 60,
  bearing: -36
};

const ICON_MAPPING = {
  marker: {x: 0, y: 0, width: 128, height: 128, mask: true}
};

const MAP_STYLE = 'https://api.maptiler.com/maps/cb574b7a-7703-4700-b037-40d45038440c/style.json?key=N8tRase5efDDDNAZ6tfz';

const landCover = [
  [
    [-74.0, 40.7],
    [-74.02, 40.7],
    [-74.02, 40.72],
    [-74.0, 40.72]
  ]
];

export default function App({
  buildings = DATA_URL.BUILDINGS,
  trips = DATA_URL.TRIPS,
  trailLength = 1000,
  initialViewState = INITIAL_VIEW_STATE,
  mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  loopLength = 1700, // unit corresponds to the timestamp in source data
  animationSpeed = 2
}) {
  const [time, setTime] = useState(0);
  const [animation] = useState({});

  const animate = () => {
    setTime(t => (t + animationSpeed) % loopLength);
    animation.id = window.requestAnimationFrame(animate);
  };

  useEffect(() => {
    animation.id = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animation.id);
  }, [animation]);

  const layers = [
    // This is only needed when using shadow effects
    new PolygonLayer({
      id: 'ground',
      data: landCover,
      getPolygon: f => f,
      stroked: false,
      getFillColor: [0, 0, 0, 0]
    }),
    new TripsLayer({
      id: 'trips',
      data: trips,
      getPath: d => d.path,
      getTimestamps: d => d.timestamps,
      getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
      opacity: 0.2,
      widthMinPixels: 3,
      rounded: true,
      trailLength,
      currentTime: time,

      shadowEnabled: false
    }),
    new PolygonLayer({
      id: 'buildings',
      data: buildings,
      extruded: true,
      wireframe: false,
      opacity: 0.5,
      getPolygon: f => f.polygon,
      getElevation: f => f.height,
      getFillColor: theme.buildingColor,
      material: theme.material
    }),

    new IconLayer({
      id: 'icon-layer',
      data,
      pickable: true,
      // iconAtlas and iconMapping are required
      // getIcon: return a string
      iconAtlas: 'https://raw.githubusercontent.com/jamescannella/zto_demo2/main/McDonalds%20Logo%20Icon%20small.png',
      iconMapping: ICON_MAPPING,
      getIcon: d => 'marker',
  
      sizeScale: 15,
      getPosition: d => d.coordinates,
      getSize: d => 5,
      getColor: d => [Math.sqrt(d.exits), 140, 0]
    })

  ];

  return (
    <DeckGL
      layers={layers}
      effects={theme.effects}
      initialViewState={initialViewState}
      controller={true}
    >
      <Map reuseMaps mapLib={maplibregl} mapStyle={mapStyle} preventStyleDiffing={true} />
    </DeckGL>
  );
}

export function renderToDOM(container) {
  createRoot(container).render(<App />);
}
