"use client";
import type { ExtensionMarker } from "../../contracts/extensions";
import type { SemanticPlace, PlaceQuery } from "../../contracts/places";
import type { UserPlaceRelation } from "../../contracts/personal-insights";
import { installPoiLayer, updatePoiLayer } from "./poi-layer";
import { useEffect, useRef, useState } from "react";
import maplibregl, {
  type GeoJSONSource,
  type Map as MapType,
} from "maplibre-gl";
import type { FeatureCollection, Polygon } from "geojson";
import type { Place, TrackPoint } from "../../contracts";
import { exploredFootprint, segments } from "../../domain/tracks";
import { createWalker, walkerCircle, walkerPosition } from "./walker";
import { installOrbitControls } from "./orbitControls";
import type { RouteProposal } from "../../contracts/routes";
import { buildingDesign, buildingParts } from "./buildingModels";
import { Layers3, LocateFixed } from "lucide-react";
export function MapCanvas({
  semanticPlaces = [], personalRelations = [], onPoiSelect, onViewChange,
  extensionMarkers = [], onExtensionSelect,
  route,
  points,
  places,
  selected,
  onSelect,
  onCount,
  immersive,
  planning,
  onEnter,
}: {
  semanticPlaces?: SemanticPlace[];
  personalRelations?: UserPlaceRelation[];
  onPoiSelect?: (p: SemanticPlace) => void;
  onViewChange?: (q: PlaceQuery) => void;
  extensionMarkers?: ExtensionMarker[];
  onExtensionSelect?: (id:string) => void;
  route?: RouteProposal;
  points: TrackPoint[];
  places: Place[];
  selected: Place | null;
  onSelect: (p: Place) => void;
  onCount: (n: number) => void;
  immersive: boolean;
  planning?: boolean;
  onEnter: () => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapType | null>(null),
    data = useRef<FeatureCollection<Polygon> | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [buildingsVisible, setBuildingsVisible] = useState(true),
    [threeDimensional, setThreeDimensional] = useState(true);
  const poiRef = useRef(semanticPlaces), poiSelectRef = useRef(onPoiSelect), viewRef = useRef(onViewChange);
  poiRef.current = semanticPlaces; poiSelectRef.current = onPoiSelect; viewRef.current = onViewChange;
  useEffect(() => {
    const instance = map.current; if (!ready || !instance) return;
    const cleanup = installPoiLayer(instance, id => { const p = poiRef.current.find(p => p.id === id); if (p) poiSelectRef.current?.(p); });
    const moved = () => { const c = instance.getCenter(); viewRef.current?.({ lat: Number(c.lat.toFixed(4)), lng: Number(c.lng.toFixed(4)), radius: 1000 }); };
    instance.on("moveend", moved); moved(); updatePoiLayer(instance, poiRef.current);
    return () => { instance.off("moveend", moved); if (map.current) cleanup(); };
  }, [ready]);
  useEffect(() => { if (ready && map.current?.getSource("semantic-pois")) updatePoiLayer(map.current, semanticPlaces, personalRelations); }, [ready, semanticPlaces, personalRelations]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const markers = extensionMarkers.map(item => {
      const button = document.createElement("button");
      button.className = "extension-map-marker";
      button.textContent = item.icon === "📍" ? "●" : item.icon;
      button.style.backgroundColor = item.color || "#388565";
      button.style.borderColor = "white";
      button.style.color = "white";
      button.dataset.color = item.color || "#388565";
      button.setAttribute("aria-label", `${item.label} · ${item.colorLabel || "通常"}`);
      button.title = `${item.label} · ${item.colorLabel || "通常"}`;
      button.onclick = event => { event.stopPropagation(); onExtensionSelect?.(item.extensionId); };
      return new maplibregl.Marker({element:button}).setLngLat([item.lng,item.lat]).addTo(map.current!);
    });
    return () => markers.forEach(marker => marker.remove());
  }, [ready, extensionMarkers, onExtensionSelect]);
  const selectRef = useRef(onSelect);
  const walker = useRef<maplibregl.Marker | null>(null);
  const [following, setFollowing] = useState(true);
  const followingRef = useRef(following);
  followingRef.current = following;
  const position = walkerPosition(points);
  const worldMode = immersive || Boolean(planning);
  const routeGeometry = JSON.stringify(
    route?.status === "ready" ? route.route?.geometry : null,
  );
  const positionRef = useRef(position);
  const previousPosition = useRef<string | null>(null);
  const enteringUntil = useRef(0);
  positionRef.current = position;
  selectRef.current = onSelect;
  const enterRef = useRef(onEnter),
    immersiveRef = useRef(immersive),
    planningRef = useRef(planning),
    worldModeRef = useRef(worldMode);
  enterRef.current = onEnter;
  immersiveRef.current = immersive;
  planningRef.current = planning;
  worldModeRef.current = worldMode;
  const overview = useRef<{
    center: maplibregl.LngLat;
    zoom: number;
    pitch: number;
    bearing: number;
  } | null>(null);
  const detailCache = useRef(
    new Map<string | number, FeatureCollection<Polygon>>(),
  );
  const detailsKey = useRef("");
  useEffect(() => {
    if (!container.current) return;
    let active = true;
    let instance: MapType;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        center: [136.9089, 35.1688],
        zoom: 16,
        pitch: 52,
        bearing: -24,
        attributionControl: false,
        style: {
          version: 8,
          sources: {},
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": "#eceee5" },
            },
          ],
        },
      });
    } catch {
      setError("3D表示を開始できません。WebGL対応ブラウザで開いてください。");
      return;
    }
    map.current = instance;
    instance.touchZoomRotate.enable({ around: "center" });
    const removeOrbitControls = installOrbitControls(
      instance,
      () => worldModeRef.current,
      () => [positionRef.current.lng, positionRef.current.lat],
    );
    instance.on("dragstart", () => setFollowing(false));
    const observer = new ResizeObserver(() => {
      instance.resize();
      if (immersiveRef.current) {
        const padding = {
          top: instance.getContainer().clientHeight * 0.24,
          bottom: 0,
          left: 0,
          right: 0,
        };
        if (performance.now() < enteringUntil.current)
          instance.jumpTo({
            center: [positionRef.current.lng, positionRef.current.lat],
            zoom: 18,
            pitch: 62,
            padding,
          });
        else instance.setPadding(padding);
      }
    });
    observer.observe(container.current);
    instance.on("click", () => {
      if (!immersiveRef.current && !planningRef.current) enterRef.current();
    });
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "bottom-right",
    );
    instance.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          "© OpenStreetMap contributors · ODbL · 経路: openrouteservice",
      }),
      "bottom-left",
    );
    instance.on("load", async () => {
      try {
        const [buildings, roads, water] = await Promise.all(
          ["buildings", "roads", "water"].map(async (name) => {
            const res = await fetch(`/data/${name}.geojson`);
            if (!res.ok) throw Error();
            return res.json();
          }),
        );
        if (!active) return;
        for (const f of buildings.features) {
          const design = buildingDesign(f);
          f.properties.render_height = design.height;
          f.properties.render_color = design.preset.wall;
          f.properties.render_type = design.type;
          f.properties.render_variant = design.variant + 1;
        }
        data.current = buildings;
        instance.setLight({
          anchor: "viewport",
          color: "#fff4de",
          intensity: 0.45,
          position: [1.5, 200, 35],
        });
        instance.addSource("water", { type: "geojson", data: water });
        instance.addLayer({
          id: "water",
          type: "fill",
          source: "water",
          paint: { "fill-color": "#b7d2d1" },
        });
        instance.addSource("roads", { type: "geojson", data: roads });
        instance.addLayer({
          id: "road-outline",
          type: "line",
          source: "roads",
          paint: { "line-color": "#d8dacd", "line-width": 9 },
        });
        instance.addLayer({
          id: "roads",
          type: "line",
          source: "roads",
          paint: { "line-color": "#fffdf4", "line-width": 6 },
        });
        instance.addSource("buildings", { type: "geojson", data: buildings });
        instance.addLayer({
          id: "footprints",
          type: "fill",
          source: "buildings",
          paint: {
            "fill-color": [
              "case",
              ["boolean", ["feature-state", "explored"], false],
              "#87a78b",
              "#d4d8c7",
            ],
            "fill-opacity": 0.85,
            "fill-outline-color": "#c3cbb9",
          },
        });
        instance.addLayer({
          id: "buildings3d",
          type: "fill-extrusion",
          source: "buildings",
          paint: {
            "fill-extrusion-color": [
              "case",
              ["boolean", ["feature-state", "explored"], false],
              ["get", "render_color"],
              "#d4d8c7",
            ],
            "fill-extrusion-height": [
              "coalesce",
              ["feature-state", "displayHeight"],
              0,
            ],
            "fill-extrusion-opacity": 1,
            "fill-extrusion-base": 0,
          },
        });
        instance.addSource("trail", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        instance.addSource("building-details", {
          type: "geojson",
          promoteId: "parent",
          data: { type: "FeatureCollection", features: [] },
        });
        instance.addLayer({
          id: "building-details",
          type: "fill-extrusion",
          source: "building-details",
          paint: {
            "fill-extrusion-color": ["get", "color"],
            "fill-extrusion-height": [
              "*",
              ["get", "top"],
              ["coalesce", ["feature-state", "growth"], 0],
            ],
            "fill-extrusion-base": [
              "*",
              ["get", "base"],
              ["coalesce", ["feature-state", "growth"], 0],
            ],
            "fill-extrusion-opacity": 1,
          },
        });
        instance.addLayer({
          id: "trail-glow",
          type: "line",
          source: "trail",
          paint: {
            "line-color": "#d0e4af",
            "line-width": 10,
            "line-opacity": 0.7,
          },
        });
        instance.addLayer({
          id: "trail",
          type: "line",
          source: "trail",
          paint: { "line-color": "#427960", "line-width": 4 },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        instance.on("click", "footprints", (e) => {
          if (!immersiveRef.current) return;
          if (instance.getLayer("poi-symbols") && instance.queryRenderedFeatures(e.point, {layers: ["poi-symbols", "poi-clusters"]}).length) return;
          const f = e.features?.[0];
          if (!f) return;
          new maplibregl.Popup()
            .setLngLat(e.lngLat)
            .setText(
              `${f.properties?.name || "建物"} · ${f.properties?.render_type} / 外観${f.properties?.render_variant} · 高さ・外観は演出モデル · 通過と訪問は別に記録`,
            )
            .addTo(instance);
        });
        for (const p of places) {
          const el = document.createElement("button");
          el.className = "place-marker";
          el.title = p.name;
          el.setAttribute("aria-label", p.name);
          el.innerHTML = "<span>✦</span>";
          el.onclick = () => selectRef.current(p);
          new maplibregl.Marker({ element: el })
            .setLngLat([p.lng, p.lat])
            .addTo(instance);
        }
        const p = positionRef.current;
        instance.addSource("walker-radius", {
          type: "geojson",
          data: walkerCircle(p.lng, p.lat),
        });
        instance.addLayer({
          id: "walker-radius-fill",
          type: "fill",
          source: "walker-radius",
          paint: { "fill-color": "#aaffdc", "fill-opacity": 0.12 },
        });
        instance.addLayer({
          id: "walker-radius-line",
          type: "line",
          source: "walker-radius",
          paint: {
            "line-color": "#f4fff4",
            "line-width": 2,
            "line-opacity": 0.8,
          },
        });
        walker.current = new maplibregl.Marker({
          element: createWalker(),
          anchor: "bottom",
        })
          .setLngLat([p.lng, p.lat])
          .addTo(instance);
        instance.addSource("planned-route", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });
        instance.addLayer({
          id: "planned-route-outline",
          source: "planned-route",
          type: "line",
          paint: { "line-color": "#fff8e9", "line-width": 9 },
        });
        instance.addLayer({
          id: "planned-route",
          source: "planned-route",
          type: "line",
          paint: { "line-color": "#d68142", "line-width": 5 },
          layout: { "line-cap": "round", "line-join": "round" },
        });
        setReady(true);
      } catch {
        if (active)
          setError("地図データを読み込めません。画面を再読込みしてください。");
      }
    });
    return () => {
      active = false;
      observer.disconnect();
      removeOrbitControls();
      instance.remove();
      walker.current = null;
      map.current = null;
      detailCache.current.clear();
      detailsKey.current = "";
    };
  }, [places]);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    instance.resize();
    for (const handler of [
      instance.dragPan,
      instance.dragRotate,
      instance.touchPitch,
      instance.doubleClickZoom,
      instance.keyboard,
    ]) {
      if (worldMode) handler.disable();
      else handler.enable();
    }
    instance.scrollZoom.enable(worldMode ? { around: "center" } : undefined);
    instance.setPaintProperty(
      "background",
      "background-color",
      worldMode ? "#9de0bd" : "#eceee5",
    );
    instance.setPaintProperty(
      "water",
      "fill-color",
      worldMode ? "#72cad1" : "#b7d2d1",
    );
    instance.setPaintProperty(
      "roads",
      "line-color",
      worldMode ? "#6bb5ad" : "#fffdf4",
    );
    instance.setPaintProperty(
      "road-outline",
      "line-color",
      worldMode ? "#e3f6a9" : "#d8dacd",
    );
    instance.setPaintProperty(
      "roads",
      "line-width",
      worldMode
        ? ["interpolate", ["linear"], ["zoom"], 15, 4, 18, 24, 20, 90]
        : 6,
    );
    instance.setPaintProperty(
      "road-outline",
      "line-width",
      worldMode
        ? ["interpolate", ["linear"], ["zoom"], 15, 6, 18, 28, 20, 96]
        : 9,
    );
    instance.setPaintProperty(
      "planned-route",
      "line-color",
      worldMode ? "#2f9488" : "#d68142",
    );
    instance.setPaintProperty("planned-route", "line-width", worldMode ? 6 : 5);
    instance.setLayoutProperty(
      "walker-radius-fill",
      "visibility",
      worldMode ? "visible" : "none",
    );
    instance.setLayoutProperty(
      "walker-radius-line",
      "visibility",
      worldMode ? "visible" : "none",
    );
    const duration = matchMedia("(prefers-reduced-motion: reduce)").matches
      ? 0
      : 1100;
    if (immersive) {
      enteringUntil.current = performance.now() + duration;
      setFollowing(true);
      overview.current = {
        center: instance.getCenter(),
        zoom: instance.getZoom(),
        pitch: instance.getPitch(),
        bearing: instance.getBearing(),
      };
      const geometry = JSON.parse(routeGeometry || "null");
      if (geometry) {
        const bounds = new maplibregl.LngLatBounds();
        for (const coordinate of geometry.coordinates)
          bounds.extend(coordinate);
        instance.fitBounds(bounds, {
          padding: { top: 150, right: 70, bottom: 300, left: 55 },
          pitch: 58,
          duration,
          maxZoom: 18,
        });
      } else {
        instance.flyTo({
          center: [positionRef.current.lng, positionRef.current.lat],
          zoom: 18,
          pitch: 62,
          padding: {
            top: instance.getContainer().clientHeight * 0.24,
            bottom: 0,
            left: 0,
            right: 0,
          },
          duration,
        });
      }
    } else if (overview.current) {
      instance.flyTo({
        ...overview.current,
        padding: { top: 0, bottom: 0, left: 0, right: 0 },
        duration,
      });
      overview.current = null;
    }
    if (planning) {
      instance.setPadding({
        top: 90,
        bottom: instance.getContainer().clientHeight * 0.43,
        left: 0,
        right: 0,
      });
      if (!overview.current)
        instance.easeTo({ pitch: threeDimensional ? 48 : 0, duration: 350 });
    } else if (!immersive && !overview.current) {
      instance.setPadding({ top: 0, bottom: 0, left: 0, right: 0 });
    }
  }, [immersive, planning, ready, routeGeometry, threeDimensional, worldMode]);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance || !walker.current) return;
    walker.current.setLngLat([position.lng, position.lat]);
    (instance.getSource("walker-radius") as GeoJSONSource).setData(
      walkerCircle(position.lng, position.lat),
    );
    const el = walker.current.getElement();
    const key = `${position.lng},${position.lat}`;
    const moved =
      previousPosition.current !== null && previousPosition.current !== key;
    previousPosition.current = key;
    if (moved) el.classList.add("walking");
    const timer = window.setTimeout(() => el.classList.remove("walking"), 700);
    if (moved && worldModeRef.current && followingRef.current)
      instance.easeTo({
        center: [position.lng, position.lat],
        ...(performance.now() < enteringUntil.current
          ? {
              zoom: 18,
              pitch: 62,
              padding: {
                top: instance.getContainer().clientHeight * 0.24,
                bottom: 0,
                left: 0,
                right: 0,
              },
            }
          : {}),
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : 600,
      });
    return () => window.clearTimeout(timer);
  }, [position.lng, position.lat, ready]);
  useEffect(() => {
    if (!ready || !map.current || !data.current) return;
    const instance = map.current;
    const lines = segments(points);
    (instance.getSource("trail") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: lines
        .filter((l) => l.length > 1)
        .map((line) => ({
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: line.map((p) => [p.lng, p.lat]),
          },
        })),
    });
    let count = 0;
    const reachedBuildings: typeof data.current.features = [];
    const animated: {
      id: number | string;
      height: number;
      from: number;
      fullHeight: number;
    }[] = [];
    for (const f of data.current.features) {
      const id = f.id!;
      const reached = exploredFootprint(f.geometry.coordinates[0], lines);
      if (reached) {
        count++;
        reachedBuildings.push(f);
      }
      const old = instance.getFeatureState({ source: "buildings", id });
      const height = reached ? f.properties?.render_height || 0 : 0;
      instance.setFeatureState(
        { source: "buildings", id },
        { explored: reached },
      );
      if ((old.displayHeight || 0) !== height)
        animated.push({
          id,
          height,
          from: old.displayHeight || 0,
          fullHeight: f.properties?.render_height || 1,
        });
    }
    const key = reachedBuildings.map((f) => f.id).join(",");
    if (key !== detailsKey.current) {
      const features = reachedBuildings.flatMap((f) => {
        if (!detailCache.current.has(f.id!))
          detailCache.current.set(f.id!, buildingParts(f));
        return detailCache.current.get(f.id!)!.features;
      });
      (instance.getSource("building-details") as GeoJSONSource).setData({
        type: "FeatureCollection",
        features,
      });
      detailsKey.current = key;
    }
    onCount(count);
    let raf = 0;
    const start = performance.now(),
      duration = matchMedia("(prefers-reduced-motion: reduce)").matches
        ? 0
        : 600;
    const frame = (now: number) => {
      const t = duration ? Math.min(1, (now - start) / duration) : 1;
      for (const b of animated) {
        instance.setFeatureState(
          { source: "buildings", id: b.id },
          { displayHeight: b.from + (b.height - b.from) * (1 - (1 - t) ** 3) },
        );
        instance.setFeatureState(
          { source: "building-details", id: b.id },
          {
            growth:
              (b.from + (b.height - b.from) * (1 - (1 - t) ** 3)) /
              b.fullHeight,
          },
        );
      }
      if (t < 1) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [points, ready, onCount]);
  useEffect(() => {
    if (selected && ready && !immersiveRef.current) {
      setFollowing(false);
      map.current?.flyTo({
        center: [selected.lng, selected.lat],
        zoom: 16.8,
        duration: 800,
      });
    }
  }, [selected, ready]);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const geometry = JSON.parse(routeGeometry || "null");
    (instance.getSource("planned-route") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: geometry ? [{ type: "Feature", properties: {}, geometry }] : [],
    });
    if (geometry && !immersive) {
      const bounds = new maplibregl.LngLatBounds();
      for (const c of geometry.coordinates) bounds.extend(c);
      instance.fitBounds(bounds, {
        padding: planning
          ? {
              top: 150,
              right: 70,
              bottom: Math.min(430, window.innerHeight * 0.48),
              left: 50,
            }
          : 75,
        pitch: planning && threeDimensional ? 48 : 35,
        duration: 700,
        maxZoom: 17,
      });
    }
  }, [routeGeometry, ready, immersive, planning, threeDimensional]);
  function toggleBuildings() {
    const instance = map.current;
    if (!instance || !ready) return;
    const visible = !buildingsVisible;
    for (const layer of ["buildings3d", "building-details", "footprints"])
      if (instance.getLayer(layer))
        instance.setLayoutProperty(
          layer,
          "visibility",
          visible ? "visible" : "none",
        );
    setBuildingsVisible(visible);
  }
  function locate() {
    map.current?.easeTo({
      center: [position.lng, position.lat],
      zoom: 17.2,
      pitch: threeDimensional ? 48 : 0,
      duration: 600,
    });
    setFollowing(true);
  }
  function toggleDimension() {
    const next = !threeDimensional;
    setThreeDimensional(next);
    map.current?.easeTo({ pitch: next ? 48 : 0, duration: 450 });
  }
  return (
    <>
      <div
        className="map-canvas"
        ref={container}
        aria-label="名古屋の3D地図"
        data-route-visible={route?.status === "ready" ? "true" : "false"}
      />
      {worldMode && (
        <>
          <div className="walking-sky" />
          {immersive && (
            <div className="walker-controls">
              <span className="walker-position-label">
                {position.label} · 半径20m
              </span>
            </div>
          )}
        </>
      )}
      {(planning || immersive) && (
        <div className="planner-map-tools" aria-label="地図表示の操作">
          <button
            aria-label="建物表示を切り替える"
            aria-pressed={buildingsVisible}
            onClick={toggleBuildings}
          >
            <Layers3 />
          </button>
          <button aria-label="現在地へ移動" onClick={locate}>
            <LocateFixed />
          </button>
          <button aria-label="2Dと3Dを切り替える" onClick={toggleDimension}>
            {threeDimensional ? "2D" : "3D"}
          </button>
        </div>
      )}
      {error && (
        <div className="map-error" role="alert">
          {error}
        </div>
      )}
    </>
  );
}



