"use client";
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
export function MapCanvas({
  route,
  points,
  places,
  selected,
  onSelect,
  onCount,
  immersive,
  onEnter,
}: {
  route?: RouteProposal;
  points: TrackPoint[];
  places: Place[];
  selected: Place | null;
  onSelect: (p: Place) => void;
  onCount: (n: number) => void;
  immersive: boolean;
  onEnter: () => void;
}) {
  const container = useRef<HTMLDivElement>(null),
    map = useRef<MapType | null>(null),
    data = useRef<FeatureCollection<Polygon> | null>(null);
  const [ready, setReady] = useState(false),
    [error, setError] = useState("");
  const selectRef = useRef(onSelect);
  const walker = useRef<maplibregl.Marker | null>(null);
  const [following, setFollowing] = useState(true);
  const followingRef = useRef(following);
  followingRef.current = following;
  const position = walkerPosition(points);
  const positionRef = useRef(position);
  const previousPosition = useRef<string | null>(null);
  const enteringUntil = useRef(0);
  positionRef.current = position;
  selectRef.current = onSelect;
  const enterRef = useRef(onEnter),
    immersiveRef = useRef(immersive);
  enterRef.current = onEnter;
  immersiveRef.current = immersive;
  const overview = useRef<{
    center: maplibregl.LngLat;
    zoom: number;
    pitch: number;
    bearing: number;
  } | null>(null);
  const detailCache = useRef(new Map<string | number, FeatureCollection<Polygon>>());
  const detailsKey = useRef("");
  useEffect(() => {
    if (!container.current) return;
    let active = true;
    let instance: MapType;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        center: [139.65, 35.4417],
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
    const removeOrbitControls = installOrbitControls(instance, () => immersiveRef.current, () => [positionRef.current.lng, positionRef.current.lat]);
    instance.on("dragstart", () => setFollowing(false));
    const observer = new ResizeObserver(() => {
      instance.resize();
      if (immersiveRef.current) {
        const padding = { top: instance.getContainer().clientHeight * 0.24, bottom: 0, left: 0, right: 0 };
        if (performance.now() < enteringUntil.current) instance.jumpTo({ center: [positionRef.current.lng, positionRef.current.lat], zoom: 18, pitch: 62, padding });
        else instance.setPadding(padding);
      }
    });
    observer.observe(container.current);
    instance.on("click", () => {
      if (!immersiveRef.current) enterRef.current();
    });
    instance.addControl(
      new maplibregl.NavigationControl({ showCompass: true }),
      "bottom-right",
    );
    instance.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution: "© OpenStreetMap contributors · ODbL · 経路: openrouteservice",
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
        instance.setLight({ anchor: "viewport", color: "#fff4de", intensity: 0.45, position: [1.5, 200, 35] });
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
        instance.addSource("building-details", { type: "geojson", promoteId: "parent", data: { type: "FeatureCollection", features: [] } });
        instance.addLayer({ id: "building-details", type: "fill-extrusion", source: "building-details", paint: {
          "fill-extrusion-color": ["get", "color"],
          "fill-extrusion-height": ["*", ["get", "top"], ["coalesce", ["feature-state", "growth"], 0]],
          "fill-extrusion-base": ["*", ["get", "base"], ["coalesce", ["feature-state", "growth"], 0]],
          "fill-extrusion-opacity": 1,
        } });
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
        instance.addSource("walker-radius", { type: "geojson", data: walkerCircle(p.lng, p.lat) });
        instance.addLayer({ id: "walker-radius-fill", type: "fill", source: "walker-radius", paint: { "fill-color": "#aaffdc", "fill-opacity": 0.12 } });
        instance.addLayer({ id: "walker-radius-line", type: "line", source: "walker-radius", paint: { "line-color": "#f4fff4", "line-width": 2, "line-opacity": 0.8 } });
        walker.current = new maplibregl.Marker({ element: createWalker(), anchor: "bottom" }).setLngLat([p.lng, p.lat]).addTo(instance);
        instance.addSource("planned-route", { type: "geojson", data: { type: "FeatureCollection", features: [] } });
        instance.addLayer({ id: "planned-route-outline", source: "planned-route", type: "line", paint: { "line-color": "#fff8e9", "line-width": 9 } });
        instance.addLayer({ id: "planned-route", source: "planned-route", type: "line", paint: { "line-color": "#d68142", "line-width": 5 }, layout: { "line-cap": "round", "line-join": "round" } });
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
      detailCache.current.clear(); detailsKey.current = "";
    };
  }, [places]);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    instance.resize();
    for (const handler of [instance.dragPan, instance.dragRotate, instance.touchPitch, instance.doubleClickZoom, instance.keyboard]) {
      if (immersive) handler.disable(); else handler.enable();
    }
    instance.scrollZoom.enable(immersive ? { around: "center" } : undefined);
    instance.setPaintProperty("background", "background-color", immersive ? "#9de0bd" : "#eceee5");
    instance.setPaintProperty("water", "fill-color", immersive ? "#72cad1" : "#b7d2d1");
    instance.setPaintProperty("roads", "line-color", immersive ? "#6bb5ad" : "#fffdf4");
    instance.setPaintProperty("road-outline", "line-color", immersive ? "#e3f6a9" : "#d8dacd");
    instance.setPaintProperty("roads", "line-width", immersive ? ["interpolate", ["linear"], ["zoom"], 15, 4, 18, 24, 20, 90] : 6);
    instance.setPaintProperty("road-outline", "line-width", immersive ? ["interpolate", ["linear"], ["zoom"], 15, 6, 18, 28, 20, 96] : 9);
    instance.setLayoutProperty("walker-radius-fill", "visibility", immersive ? "visible" : "none");
    instance.setLayoutProperty("walker-radius-line", "visibility", immersive ? "visible" : "none");
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
      instance.flyTo({
        center: [positionRef.current.lng, positionRef.current.lat],
        zoom: 18,
        pitch: 62,
        padding: { top: instance.getContainer().clientHeight * 0.24, bottom: 0, left: 0, right: 0 },
        duration,
      });
    } else if (overview.current) {
      instance.flyTo({ ...overview.current, padding: { top: 0, bottom: 0, left: 0, right: 0 }, duration });
      overview.current = null;
    }
  }, [immersive, ready]);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance || !walker.current) return;
    walker.current.setLngLat([position.lng, position.lat]);
    (instance.getSource("walker-radius") as GeoJSONSource).setData(walkerCircle(position.lng, position.lat));
    const el = walker.current.getElement();
    const key = `${position.lng},${position.lat}`;
    const moved = previousPosition.current !== null && previousPosition.current !== key;
    previousPosition.current = key;
    if (moved) el.classList.add("walking");
    const timer = window.setTimeout(() => el.classList.remove("walking"), 700);
    if (moved && immersiveRef.current && followingRef.current) instance.easeTo({ center: [position.lng, position.lat], ...(performance.now() < enteringUntil.current ? { zoom: 18, pitch: 62, padding: { top: instance.getContainer().clientHeight * 0.24, bottom: 0, left: 0, right: 0 } } : {}), duration: matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 600 });
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
    const animated: { id: number | string; height: number; from: number; fullHeight: number }[] =
      [];
    for (const f of data.current.features) {
      const id = f.id!;
      const reached = exploredFootprint(f.geometry.coordinates[0], lines);
      if (reached) { count++; reachedBuildings.push(f); }
      const old = instance.getFeatureState({ source: "buildings", id });
      const height = reached ? f.properties?.render_height || 0 : 0;
      instance.setFeatureState(
        { source: "buildings", id },
        { explored: reached },
      );
      if ((old.displayHeight || 0) !== height)
        animated.push({ id, height, from: old.displayHeight || 0, fullHeight: f.properties?.render_height || 1 });
    }
    const key = reachedBuildings.map(f => f.id).join(",");
    if (key !== detailsKey.current) {
      const features = reachedBuildings.flatMap(f => {
        if (!detailCache.current.has(f.id!)) detailCache.current.set(f.id!, buildingParts(f));
        return detailCache.current.get(f.id!)!.features;
      });
      (instance.getSource("building-details") as GeoJSONSource).setData({ type: "FeatureCollection", features });
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
        instance.setFeatureState({ source: "building-details", id: b.id }, { growth: (b.from + (b.height - b.from) * (1 - (1 - t) ** 3)) / b.fullHeight });
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
  const routeGeometry = JSON.stringify(route?.status === "ready" ? route.route?.geometry : null);
  useEffect(() => {
    const instance = map.current;
    if (!ready || !instance) return;
    const geometry = JSON.parse(routeGeometry || "null");
    (instance.getSource("planned-route") as GeoJSONSource).setData({ type: "FeatureCollection", features: geometry ? [{ type: "Feature", properties: {}, geometry }] : [] });
    if (geometry && !immersive) {
      const bounds = new maplibregl.LngLatBounds();
      for (const c of geometry.coordinates) bounds.extend(c);
      instance.fitBounds(bounds, { padding: 75, pitch: 35, duration: 700, maxZoom: 17 });
    }
  }, [routeGeometry, ready, immersive]);
  return (
    <>
      <div className="map-canvas" ref={container} aria-label="横浜の3D地図" />
      {immersive && <>
        <div className="walking-sky" />
        <div className="walker-controls">
          <span className="walker-position-label">{position.label} · 半径20m</span>
        </div>
      </>}
      {error && (
        <div className="map-error" role="alert">
          {error}
        </div>
      )}
    </>
  );
}
