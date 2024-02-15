/* global window */
import React, {useState, useEffect} from 'react';
import {createRoot} from 'react-dom/client';
import {Map} from 'react-map-gl';
import maplibregl from 'maplibre-gl';
import {AmbientLight, PointLight, LightingEffect} from '@deck.gl/core';
import DeckGL from '@deck.gl/react';
import {PolygonLayer} from '@deck.gl/layers';
import {TripsLayer} from '@deck.gl/geo-layers';


// Source data CSV

const DATA_URL = {
  BUILDINGS:
    'https://raw.githubusercontent.com/visgl/deck.gl-data/master/examples/trips/buildings.json', // eslint-disable-line
  TRIPS: 'https://raw.githubusercontent.com/jamescannella/zto_demo2/main/zto-chicago-trips-full3%20v2.json' // eslint-disable-line
};

const ambientLight = new AmbientLight({
  color: [255, 255, 255],
  intensity: 2.0
});

const pointLight = new PointLight({
  color: [255, 255, 255],
  intensity: 10.0,
  position: [-87.63476, 41.87516]
});

const lightingEffect = new LightingEffect({ambientLight, pointLight});

const material = {
  ambient: 0.4,
  diffuse: 0.6,
  shininess: 60,
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
  zoom: 14,
  pitch: 60,
  bearing: 35
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
  trailLength = 1400,
  initialViewState = INITIAL_VIEW_STATE,
  mapStyle = MAP_STYLE,
  theme = DEFAULT_THEME,
  loopLength = 1600, // unit corresponds to the timestamp in source data
  animationSpeed = 2.5
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
    new PolygonLayer({
      id: 'buildings',
      data: buildings,
      extruded: true,
      wireframe: true,
      opacity: 1,
      getPolygon: f => f.polygon,
      getElevation: f => f.height,
      getFillColor: theme.buildingColor,
      material: theme.material
    }),
    new deck.MVTLayer({
      data: `https://api.maptiler.com/maps/cb574b7a-7703-4700-b037-40d45038440c/style.json?key=N8tRase5efDDDNAZ6tfz`,
      loadOptions: {
        mvt: {
          layers: ['building']
        }
      },
      minZoom: 0,
      maxZoom: 15,
      getLineColor: f => {
        return f.properties.colour && chroma.valid(f.properties.colour) ? chroma(f.properties.colour).rgb() : [140, 170, 180]
      },
      getFillColor: f => {
        return f.properties.colour && chroma.valid(f.properties.colour) ? chroma(f.properties.colour).rgb() : [140, 170, 180]
      },
      getLineWidth: 1,
      lineWidthMinPixels: 1,
      getElevation: f => {
        return f.properties.render_height ? f.properties.render_height : 0
      },
      extruded: true,
      wireframe: true
    }),
    new TripsLayer({
      id: 'trips',
      data: trips,
      getPath: d => d.path,
      getTimestamps: d => d.timestamps,
      getColor: d => (d.vendor === 0 ? theme.trailColor0 : theme.trailColor1),
      opacity: 0.2,
      widthMinPixels: 4,
      rounded: true,
      trailLength,
      currentTime: time,

      shadowEnabled: false
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
