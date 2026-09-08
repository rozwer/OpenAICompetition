"use client";
import { useEffect, useRef, useState } from "react";
import maplibregl, { type GeoJSONSource } from "maplibre-gl";
import type { HistoryPin, HistoryRoute } from "../../contracts/history";
export function HistoryMap({
  pins,
  route,
  onSelect,
}: {
  pins: HistoryPin[];
  route: HistoryRoute;
  onSelect: (p: HistoryPin) => void;
}) {
  const element = useRef<HTMLDivElement>(null),
    map = useRef<maplibregl.Map | null>(null),
    [ready, setReady] = useState(false),
    [rendered, setRendered] = useState(false),
    [error, setError] = useState(false),
    selection = useRef(onSelect),
    currentPins = useRef(pins);
  selection.current = onSelect;
  currentPins.current = pins;
  useEffect(() => {
    if (!element.current) return;
    const m = new maplibregl.Map({
      container: element.current,
      center: [136.94, 35.16],
      zoom: 12,
      pitch: 0,
      attributionControl: false,
      style: {
        version: 8,
        sources: {
          roads: { type: "geojson", data: "/data/roads.geojson" },
          water: { type: "geojson", data: "/data/water.geojson" },
          buildings: { type: "geojson", data: "/data/buildings.geojson" },
        },
        layers: [
          {
            id: "background",
            type: "background",
            paint: { "background-color": "#ecf2e8" },
          },
          {
            id: "water",
            type: "fill",
            source: "water",
            paint: { "fill-color": "#bbdfe4" },
          },
          {
            id: "buildings",
            type: "fill",
            source: "buildings",
            paint: { "fill-color": "#dce5d7", "fill-opacity": 0.6 },
          },
          {
            id: "roads",
            type: "line",
            source: "roads",
            paint: { "line-color": "#ffffff", "line-width": 3 },
          },
        ],
      },
    });
    map.current = m;
    m.addControl(
      new maplibregl.AttributionControl({
        compact: true,
        customAttribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
      }),
    );
    m.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );
    m.on("load", () => {
      m.addSource("journey-route", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
      });
      m.addLayer({
        id: "journey-route",
        source: "journey-route",
        type: "line",
        paint: {
          "line-color": "#408979",
          "line-width": 4,
          "line-opacity": 0.8,
        },
      });
      m.addSource("journey-places", {
        type: "geojson",
        data: { type: "FeatureCollection", features: [] },
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 25,
      });
      m.addLayer({
        id: "journey-clusters",
        type: "circle",
        source: "journey-places",
        filter: ["has", "point_count"],
        paint: {
          "circle-color": "#73b69d",
          "circle-radius": 14,
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });
      m.addLayer({
        id: "journey-pins",
        type: "circle",
        source: "journey-places",
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "case",
            [">=", ["get", "count"], 3],
            "#4f83e8",
            ["get", "isNew"],
            "#4f9a82",
            "#2e6c5d",
          ],
          "circle-radius": ["case", ["get", "isNew"], 10, 7],
          "circle-opacity": ["case", ["get", "isNew"], 1, 0.6],
          "circle-stroke-color": "#fff",
          "circle-stroke-width": 2,
        },
      });
      m.addLayer({
        id: "journey-numbers",
        type: "symbol",
        source: "journey-places",
        filter: ["all", ["!", ["has", "point_count"]], ["has", "numberImage"]],
        layout: {
          "icon-image": ["get", "numberImage"],
          "icon-size": 0.65,
          "icon-allow-overlap": true,
        },
      });
      const choose = (e: maplibregl.MapLayerMouseEvent) => {
        const id = e.features?.[0]?.properties?.id,
          p = currentPins.current.find((p) => p.id === id);
        if (p) selection.current(p);
      };
      m.on("click", "journey-pins", choose);
      m.on("click", "journey-numbers", choose);
      m.on("click", "journey-clusters", async (e) => {
        const f = e.features?.[0];
        if (!f || f.geometry.type !== "Point") return;
        try {
          const zoom = await (
            m.getSource("journey-places") as GeoJSONSource
          ).getClusterExpansionZoom(Number(f.properties?.cluster_id));
          m.easeTo({
            center: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
            zoom,
          });
        } catch {}
      });
      setReady(true);
    });
    m.on("error", () => setError(true));
    m.on("idle", () => setRendered(true));
    const observer = new ResizeObserver(() => m.resize());
    observer.observe(element.current);
    return () => {
      observer.disconnect();
      m.remove();
      map.current = null;
    };
  }, []);
  useEffect(() => {
    const m = map.current;
    if (!ready || !m) return;
    setRendered(false);
    for (const p of pins) {
      if (!p.order) continue;
      const id = `number-${p.order}`;
      if (m.hasImage(id)) continue;
      const c = document.createElement("canvas");
      c.width = 48;
      c.height = 48;
      const ctx = c.getContext("2d");
      if (!ctx) continue;
      ctx.fillStyle = "#2e6c5d";
      ctx.beginPath();
      ctx.arc(24, 24, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = "white";
      ctx.font = "bold 22px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(String(p.order), 24, 25);
      m.addImage(id, ctx.getImageData(0, 0, 48, 48));
    }
    (m.getSource("journey-places") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: pins.map((p) => ({
        type: "Feature",
        geometry: { type: "Point", coordinates: [p.lng, p.lat] },
        properties: {
          id: p.id,
          isNew: p.isNew,
          count: p.count,
          ...(p.order ? { numberImage: `number-${p.order}` } : {}),
        },
      })),
    });
    (m.getSource("journey-route") as GeoJSONSource).setData({
      type: "FeatureCollection",
      features: route.lines.map((coordinates) => ({
        type: "Feature",
        geometry: { type: "LineString", coordinates },
        properties: {},
      })),
    });
    m.setPaintProperty(
      "journey-route",
      "line-dasharray",
      route.kind === "visit_order" ? [2, 3] : [1, 0],
    );
    const coords = [...pins.map((p) => [p.lng, p.lat]), ...route.lines.flat()];
    if (coords.length) {
      const b = new maplibregl.LngLatBounds();
      for (const c of coords) b.extend([c[0], c[1]]);
      m.fitBounds(b, { padding: 60, maxZoom: 16, duration: 500 });
    }
  }, [ready, pins, route]);
  return (
    <div className="history-map-wrap">
      <div
        ref={element}
        className="history-map"
        data-rendered={rendered}
        role="img"
        aria-label="選択した期間の訪問地図"
        data-history-pins={pins.length}
      />
      {error && (
        <small className="history-map-note">
          背景地図の一部を読み込めません。記録は下の一覧で確認できます。
        </small>
      )}
    </div>
  );
}
