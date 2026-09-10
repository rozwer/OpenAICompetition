import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import './style.css';

const regions = {
  tokyo: {
    label: '東京駅・丸の内', center: [139.7649, 35.6812], bearing: -18, zoom: 17.5,
    coverage: '高：駅舎と周辺高層棟の形状を確認'
  },
  shinjuku: {
    label: '東京・新宿', center: [139.6952, 35.6911], bearing: -24, zoom: 17.3,
    coverage: '高：東京都庁舎と新宿駅周辺の象徴的建築を確認'
  },
  yokohama: {
    label: '横浜・山下公園', center: [139.6497, 35.4459], bearing: 28, zoom: 17.4,
    coverage: '中：マリンタワーと氷川丸を識別。周辺街区は汎用形状が中心'
  },
  minatomirai: {
    label: '横浜・みなとみらい', center: [139.6349, 35.4552], bearing: 26, zoom: 17.2,
    coverage: '高：ランドマークタワー、観覧車、周辺施設を確認'
  },
  nagoya: {
    label: '名古屋・栄', center: [136.9085, 35.1707], bearing: -24, zoom: 17.5,
    coverage: '高：中部電力 MIRAI TOWERとオアシス21を識別'
  },
  hakone: {
    label: '箱根・芦ノ湖', center: [139.0247, 35.2040], bearing: 18, zoom: 17.1,
    coverage: '低：湖岸と建物形状は見えるが、象徴的な3Dランドマークは不足'
  },
  osaka: {
    label: '大阪・道頓堀', center: [135.50129, 34.669074], bearing: -22, zoom: 17.6,
    coverage: '低〜中：街区形状は見えるが、道頓堀らしい象徴物は補完候補'
  }
};

const CHARACTER_WIDTH = 64;
const CHARACTER_HEIGHT = 112;
const CHARACTER_FPS = 12;
const MAP_RENDER_SCALE = 0.8;
const BUILDING_ICON_TYPES = [
  { kind: 'memory', glyph: '♡', label: '思い出のある建物' },
  { kind: 'recommendation', glyph: '✦', label: 'AIのおすすめ建物' },
  { kind: 'discovery', glyph: '◇', label: '気になる建物' }
];
const MAX_BUILDING_ICONS = 3;

const token = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
const status = document.querySelector('#status');
const tokenHelp = document.querySelector('#token-help');
const regionSelect = document.querySelector('#region-select');
const animationToggle = document.querySelector('#animation-toggle');
const iconPlacementToggle = document.querySelector('#icon-placement-toggle');
const locateButton = document.querySelector('#locate-button');
const coverage = document.querySelector('#coverage');
const renderMode = document.querySelector('#render-mode');
const viewBadge = document.querySelector('.view-badge');
const markerElement = document.querySelector('#character-marker');
const modelCanvas = document.querySelector('#model-canvas');

if (!token || !token.startsWith('pk.')) {
  tokenHelp.hidden = false;
  status.textContent = 'Mapboxの公開トークンを設定すると表示できます。';
} else {
  startMap();
}

function startMap() {
  mapboxgl.accessToken = token;
  mapboxgl.workerCount = 1;
  let current = regions[regionSelect.value];
  let walking = true;
  let mixer;
  let walkAction;
  let styleReady = false;
  let currentLod;
  let modelVisible = true;
  let buildingIconsVisible = true;
  let buildingPlacementMode = false;
  let hoveredBuilding;
  let selectedBuilding;
  let nextBuildingIconType = 0;
  const buildingIconMarkers = [];
  let mapMoving = false;
  let characterFramePending = false;
  let lastCharacterFrame = performance.now();
  let measuredFrameCount = 0;
  let measuredFrameStart = performance.now();
  const characterFrameInterval = 1000 / CHARACTER_FPS;
  coverage.textContent = '3つの記憶';

  const boundsFor = ([longitude, latitude]) => [
    [longitude - 0.014, latitude - 0.01],
    [longitude + 0.014, latitude + 0.01]
  ];

  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/mapbox/standard',
    config: {
      basemap: {
        theme: 'default',
        lightPreset: 'day',
        colorBuildingHighlight: '#a9d4c2',
        colorBuildingSelect: '#6fa98e',
        show3dObjects: true,
        show3dBuildings: true,
        show3dLandmarks: true,
        show3dFacades: false,
        show3dTrees: false,
        showLandmarkIcons: true,
        showPointOfInterestLabels: false,
        showPlaceLabels: false,
        showRoadLabels: false,
        showTransitLabels: false,
        showPedestrianRoads: false
      }
    },
    center: current.center,
    zoom: current.zoom,
    pitch: 64,
    bearing: current.bearing,
    antialias: false,
    fadeDuration: 0,
    refreshExpiredTiles: false,
    maxTileCacheSize: 12,
    minZoom: 14.5,
    maxZoom: 20,
    maxPitch: 68,
    maxBounds: boundsFor(current.center),
    renderWorldCopies: false,
    projection: 'mercator',
    respectPrefersReducedMotion: true
  });

  const characterScene = new THREE.Scene();
  const characterCamera = new THREE.PerspectiveCamera(
    30,
    CHARACTER_WIDTH / CHARACTER_HEIGHT,
    0.01,
    100
  );
  characterScene.add(new THREE.HemisphereLight(0xffffff, 0x607080, 2.2));
  const key = new THREE.DirectionalLight(0xffffff, 3.2);
  key.position.set(-2, -3, 6);
  characterScene.add(key);

  const characterRenderer = new THREE.WebGLRenderer({
    canvas: modelCanvas,
    alpha: true,
    antialias: false,
    powerPreference: 'low-power'
  });
  characterRenderer.setClearColor(0x000000, 0);
  characterRenderer.setPixelRatio(1);
  characterRenderer.setSize(CHARACTER_WIDTH, CHARACTER_HEIGHT, false);

  const characterMarker = new mapboxgl.Marker({
    element: markerElement,
    anchor: 'bottom',
    rotationAlignment: 'viewport',
    pitchAlignment: 'viewport'
  }).setLngLat(current.center).addTo(map);

  const createBuildingIcon = (icon, coordinates, height) => {
    const element = document.createElement('button');
    element.className = `building-icon building-icon--${icon.kind}`;
    element.type = 'button';
    element.setAttribute('aria-label', icon.label);
    element.innerHTML = `
      <span class="building-icon-body" aria-hidden="true"><span>${icon.glyph}</span></span>
      <span class="building-icon-label">${icon.label}<small>屋根高 ${Math.round(height)}m</small></span>
      <span class="building-icon-connector" aria-hidden="true"></span>
      <span class="building-icon-target" aria-hidden="true"></span>
    `;
    element.addEventListener('click', () => {
      status.textContent = `${icon.label}・屋根高 ${Math.round(height)}m`;
    });
    const marker = new mapboxgl.Marker({
      element,
      anchor: 'bottom',
      rotationAlignment: 'viewport',
      pitchAlignment: 'viewport',
      occludedOpacity: 0.34
    })
      .setLngLat(coordinates)
      .setAltitude(height)
      .addTo(map);
    buildingIconMarkers.push(marker);
    if (buildingIconMarkers.length > MAX_BUILDING_ICONS) buildingIconMarkers.shift().remove();
    marker.getElement().hidden = !buildingIconsVisible;
  };

  const buildingCenter = (feature, fallback) => {
    const points = [];
    const collectPoints = (coordinates) => {
      if (typeof coordinates?.[0] === 'number' && typeof coordinates?.[1] === 'number') {
        points.push(coordinates);
        return;
      }
      coordinates?.forEach(collectPoints);
    };
    collectPoints(feature.geometry?.coordinates);
    if (!points.length) return fallback;
    const bounds = points.reduce((result, [longitude, latitude]) => ({
      west: Math.min(result.west, longitude),
      east: Math.max(result.east, longitude),
      south: Math.min(result.south, latitude),
      north: Math.max(result.north, latitude)
    }), { west: Infinity, east: -Infinity, south: Infinity, north: -Infinity });
    return [(bounds.west + bounds.east) / 2, (bounds.south + bounds.north) / 2];
  };

  const setBuildingIconsVisible = (visible) => {
    buildingIconsVisible = visible;
    buildingIconMarkers.forEach((marker) => {
      marker.getElement().hidden = !visible;
    });
  };

  const lodForZoom = (zoom) => {
    if (zoom >= 17.0) {
      return {
        id: 'detail', label: '詳細3D', objects: true, buildings: true,
        landmarks: true, facades: false, trees: false, character: true, icons: true, pitch: 64
      };
    }
    if (zoom >= 15.2) {
      return {
        id: 'light', label: '広域3D', objects: true, buildings: true,
        landmarks: true, facades: false, trees: false, character: zoom >= 16.8, icons: zoom >= 16.2, pitch: 48
      };
    }
    return {
      id: 'overview', label: 'フットプリント俯瞰', objects: true, buildings: true,
      landmarks: false, facades: false, trees: false, character: false, icons: false, pitch: 0
    };
  };

  const updateRenderModeText = (fps) => {
    const animation = !modelVisible
      ? '人物非表示'
      : walking
        ? `人物 ${fps ?? `≤${CHARACTER_FPS}`}fps`
        : '人物停止';
    const icons = buildingIconsVisible ? `建物アイコン ${buildingIconMarkers.length}件` : '建物アイコン非表示';
    renderMode.textContent = `${currentLod?.label ?? '準備中'} · ${animation} · ${icons}`;
  };

  const updateStatus = () => {
    status.textContent = currentLod?.id === 'detail'
      ? `${current.label}を歩いた範囲が育っています`
      : `${current.label}を広く見ています`;
  };

  const growthDataFor = ([longitude, latitude]) => ({
    route: {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [longitude - 0.00135, latitude - 0.0010],
          [longitude - 0.00078, latitude - 0.00054],
          [longitude - 0.00038, latitude - 0.00072],
          [longitude - 0.00012, latitude - 0.00020],
          [longitude, latitude]
        ]
      },
      properties: {}
    },
    memories: {
      type: 'FeatureCollection',
      features: [
        [-0.00135, -0.0010], [-0.00038, -0.00072], [-0.00012, -0.00020]
      ].map(([dx, dy], index) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [longitude + dx, latitude + dy] },
        properties: { order: index + 1 }
      }))
    }
  });

  const updateGrowthData = () => {
    const data = growthDataFor(current.center);
    map.getSource('walked-route')?.setData(data.route);
    map.getSource('grown-places')?.setData(data.memories);
  };

  const addGrowthLayers = () => {
    const data = growthDataFor(current.center);
    map.addSource('walked-route', { type: 'geojson', data: data.route });
    map.addSource('grown-places', { type: 'geojson', data: data.memories });
    map.addLayer({
      id: 'walked-route-glow', type: 'line', source: 'walked-route', slot: 'top',
      paint: { 'line-color': '#d9f3b7', 'line-width': 12, 'line-opacity': 0.44, 'line-blur': 7 }
    });
    map.addLayer({
      id: 'walked-route-line', type: 'line', source: 'walked-route', slot: 'top',
      paint: { 'line-color': '#91c78e', 'line-width': 4, 'line-opacity': 0.9 }
    });
    map.addLayer({
      id: 'grown-place-halo', type: 'circle', source: 'grown-places', slot: 'top',
      paint: { 'circle-radius': 18, 'circle-color': '#dff2c6', 'circle-opacity': 0.42, 'circle-blur': 0.35 }
    });
    map.addLayer({
      id: 'grown-place-core', type: 'circle', source: 'grown-places', slot: 'top',
      paint: { 'circle-radius': 6, 'circle-color': '#6ca781', 'circle-stroke-width': 3, 'circle-stroke-color': '#f0f8e8' }
    });
  };

  const renderCharacter = () => {
    characterFramePending = false;
    const now = performance.now();
    const elapsedSeconds = Math.min((now - lastCharacterFrame) / 1000, 0.1);
    lastCharacterFrame = now;

    if (!modelVisible || mapMoving) return;
    if (walking && mixer) mixer.update(elapsedSeconds);
    characterRenderer.render(characterScene, characterCamera);

    measuredFrameCount += 1;
    const measurementDuration = now - measuredFrameStart;
    if (measurementDuration >= 1000) {
      const fps = Math.round(measuredFrameCount * 1000 / measurementDuration);
      updateRenderModeText(fps);
      measuredFrameCount = 0;
      measuredFrameStart = now;
    }

    if (walking && !document.hidden) requestCharacterRender();
  };

  const requestCharacterRender = () => {
    if (characterFramePending || !modelVisible || document.hidden) return;
    characterFramePending = true;
    const wait = Math.max(0, characterFrameInterval - (performance.now() - lastCharacterFrame));
    window.setTimeout(renderCharacter, wait);
  };

  const applyLod = (force = false) => {
    if (!styleReady) return;
    const next = lodForZoom(map.getZoom());
    const markerScale = Math.min(1.18, Math.max(0.78, 2 ** ((map.getZoom() - 17.5) * 0.28)));
    markerElement.style.width = `${Math.round(CHARACTER_WIDTH * markerScale * MAP_RENDER_SCALE)}px`;
    markerElement.style.height = `${Math.round(CHARACTER_HEIGHT * markerScale * MAP_RENDER_SCALE)}px`;
    if (!force && next.id === currentLod?.id && next.character === currentLod.character && next.icons === currentLod.icons) return;
    const buildingsChanged = next.buildings !== currentLod?.buildings;
    const landmarksChanged = next.landmarks !== currentLod?.landmarks;
    currentLod = next;
    viewBadge.textContent = next.id === 'overview' ? '俯瞰' : '3D';
    modelVisible = next.character;
    markerElement.hidden = !modelVisible;
    setBuildingIconsVisible(next.icons);
    if (buildingsChanged) map.setConfigProperty('basemap', 'show3dBuildings', next.buildings);
    if (landmarksChanged) map.setConfigProperty('basemap', 'show3dLandmarks', next.landmarks);
    measuredFrameCount = 0;
    measuredFrameStart = performance.now();
    updateRenderModeText();
    updateStatus();
    requestCharacterRender();
  };

  new GLTFLoader().load('/models/basic-human/human.glb', (gltf) => {
        const model = gltf.scene;
        model.traverse((child) => {
          if (!child.isMesh) return;
          child.material = child.material.clone();
          child.material.color.set(0xff6b35);
          child.material.emissive.set(0x4b1000);
          child.material.emissiveIntensity = 0.55;
          child.material.roughness = 0.72;
          child.material.metalness = 0;
        });
        characterScene.add(model);

        const bounds = new THREE.Box3().setFromObject(model);
        const size = bounds.getSize(new THREE.Vector3());
        const center = bounds.getCenter(new THREE.Vector3());
        model.position.set(-center.x, -bounds.min.y, -center.z);
        characterCamera.position.set(0, size.y * 0.48, size.y * 2.55);
        characterCamera.lookAt(0, size.y * 0.48, 0);

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(size.x * 0.52, size.x * 0.68, 32),
          new THREE.MeshBasicMaterial({
            color: 0xffcf56,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.025;
        characterScene.add(ring);

        mixer = new THREE.AnimationMixer(model);
        const clip = THREE.AnimationClip.findByName(gltf.animations, 'Walk') ?? gltf.animations[0];
        if (clip) {
          walkAction = mixer.clipAction(clip);
          walkAction.play();
        }
        updateStatus();
        requestCharacterRender();
      }, undefined, () => {
        status.textContent = '人物モデルを読み込めませんでした。';
      });

  const initializeMapStyle = () => {
    if (map.getSource('walked-route')) return;
    map.setLights([
      {
        id: 'prototype-ambient',
        type: 'ambient',
        properties: { color: '#ffffff', intensity: 0.72 }
      },
      {
        id: 'prototype-directional',
        type: 'directional',
        properties: {
          color: '#ffffff',
          intensity: 0.38,
          direction: [200, 45],
          'cast-shadows': false,
          'shadow-intensity': 0
        }
      }
    ]);
    addGrowthLayers();
    map.addInteraction('building-icon-hover', {
      type: 'mouseenter',
      target: { featuresetId: 'buildings', importId: 'basemap' },
      handler: ({ feature }) => {
        if (!buildingPlacementMode || !feature) return;
        if (hoveredBuilding) map.setFeatureState(hoveredBuilding, { highlight: false });
        hoveredBuilding = feature;
        map.setFeatureState(feature, { highlight: true });
        map.getCanvas().style.cursor = 'crosshair';
      }
    });
    map.addInteraction('building-icon-leave', {
      type: 'mouseleave',
      target: { featuresetId: 'buildings', importId: 'basemap' },
      handler: ({ feature }) => {
        if (hoveredBuilding && feature?.id === hoveredBuilding.id) {
          map.setFeatureState(hoveredBuilding, { highlight: false });
          hoveredBuilding = undefined;
          map.getCanvas().style.cursor = '';
        }
        return false;
      }
    });
    map.addInteraction('building-icon-place', {
      type: 'click',
      target: { featuresetId: 'buildings', importId: 'basemap' },
      handler: ({ feature, lngLat }) => {
        if (!buildingPlacementMode || !feature) return;
        const height = Number(feature.properties?.height);
        if (!Number.isFinite(height) || height <= 0) {
          status.textContent = 'この建物は屋根の高さを確認できないため、アイコンを配置できません。';
          return;
        }
        if (selectedBuilding) map.setFeatureState(selectedBuilding, { select: false });
        selectedBuilding = feature;
        map.setFeatureState(feature, { select: true });
        const icon = BUILDING_ICON_TYPES[nextBuildingIconType % BUILDING_ICON_TYPES.length];
        nextBuildingIconType += 1;
        createBuildingIcon(icon, buildingCenter(feature, lngLat.toArray()), height);
        buildingPlacementMode = false;
        iconPlacementToggle.classList.remove('active');
        iconPlacementToggle.setAttribute('aria-pressed', 'false');
        map.getCanvas().style.cursor = '';
        status.textContent = `${icon.label}を、選択した建物の屋根へ固定しました。`;
        updateRenderModeText();
      }
    });
    styleReady = true;
    applyLod(true);
  };

  map.on('style.load', initializeMapStyle);
  map.on('load', initializeMapStyle);
  if (map.isStyleLoaded()) initializeMapStyle();

  map.on('zoom', () => applyLod());

  map.on('movestart', () => {
    mapMoving = true;
  });

  map.on('moveend', () => {
    mapMoving = false;
    lastCharacterFrame = performance.now();
    requestCharacterRender();
  });

  map.on('zoomend', () => {
    const targetPitch = lodForZoom(map.getZoom()).pitch;
    if (Math.abs(map.getPitch() - targetPitch) < 0.5) return;
    map.easeTo({ pitch: targetPitch, duration: 320 });
  });

  map.on('error', (event) => {
    status.textContent = `Mapboxの読み込みエラー: ${event.error?.message ?? '詳細不明'}`;
  });

  regionSelect.addEventListener('change', () => {
    current = regions[regionSelect.value];
    characterMarker.setLngLat(current.center);
    buildingIconMarkers.splice(0).forEach((marker) => marker.remove());
    if (selectedBuilding) map.setFeatureState(selectedBuilding, { select: false });
    selectedBuilding = undefined;
    buildingPlacementMode = false;
    iconPlacementToggle.classList.remove('active');
    iconPlacementToggle.setAttribute('aria-pressed', 'false');
    coverage.textContent = '3つの記憶';
    updateGrowthData();
    applyLod(true);
    map.setMaxBounds(boundsFor(current.center));
    map.flyTo({ center: current.center, zoom: current.zoom, pitch: 64, bearing: current.bearing, duration: 900 });
    status.textContent = `${current.label}へ移動しています…`;
    map.once('moveend', () => {
      updateStatus();
    });
  });

  animationToggle.addEventListener('click', () => {
    walking = !walking;
    if (walkAction) walkAction.paused = !walking;
    animationToggle.textContent = walking ? 'Ⅱ' : '▶';
    animationToggle.setAttribute('aria-label', walking ? '歩行を停止' : '歩行を再生');
    measuredFrameCount = 0;
    measuredFrameStart = performance.now();
    updateRenderModeText();
    requestCharacterRender();
  });

  iconPlacementToggle.addEventListener('click', () => {
    buildingPlacementMode = !buildingPlacementMode;
    iconPlacementToggle.classList.toggle('active', buildingPlacementMode);
    iconPlacementToggle.setAttribute('aria-pressed', String(buildingPlacementMode));
    map.getCanvas().style.cursor = buildingPlacementMode ? 'crosshair' : '';
    status.textContent = buildingPlacementMode
      ? 'アイコンを固定する建物を選んでください。'
      : `${current.label}を歩いた範囲が育っています`;
  });

  locateButton.addEventListener('click', () => {
    map.easeTo({ center: current.center, zoom: current.zoom, pitch: 64, bearing: current.bearing, duration: 600 });
  });

  document.addEventListener('visibilitychange', () => {
    lastCharacterFrame = performance.now();
    requestCharacterRender();
  });
}
