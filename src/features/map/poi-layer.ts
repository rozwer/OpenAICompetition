import type { Map, GeoJSONSource, MapLayerMouseEvent } from "maplibre-gl";
import type { SemanticPlace } from "../../contracts/places";
import type { UserPlaceRelation } from "../../contracts/personal-insights";
export function installPoiLayer(map: Map, onSelect: (id: string) => void) {
  map.addSource("semantic-pois", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterRadius: 42,
    clusterMaxZoom: 15,
  });
  map.addLayer({
    id: "poi-clusters",
    source: "semantic-pois",
    type: "circle",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": "#438b83",
      "circle-radius": ["step", ["get", "point_count"], 16, 20, 22, 100, 28],
      "circle-stroke-width": 3,
      "circle-stroke-color": "#ffffff",
      "circle-opacity": 0.92,
    },
  });
  map.addLayer({id:"personal-place-halo",source:"semantic-pois",type:"circle",filter:["all",["!",["has","point_count"]],["==",["get","personal"],true]],paint:{"circle-radius":["case",["get","favorite"],26,[">=",["get","visits"],3],23,20],"circle-color":["case",["get","favorite"],"#db8396",[">=",["get","stay"],120],"#8b78bd",[">=",["get","visits"],3],"#397f6d","#69babb"],"circle-opacity":0.3,"circle-stroke-width":3,"circle-stroke-color":["case",["get","favorite"],"#b74b71","#397f6d"]}});
  map.addLayer({
    id: "poi-symbols",
    source: "semantic-pois",
    type: "symbol",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ["get", "image"],
      "icon-size": 0.55,
      "icon-allow-overlap": false,
    },
  });
  const click = (e: MapLayerMouseEvent) => {
    const id = e.features?.[0]?.properties?.id;
    if (typeof id === "string") onSelect(id);
  };
  const cluster = async (e: MapLayerMouseEvent) => {
    const f = e.features?.[0];
    if (!f || f.geometry.type !== "Point") return;
    try {
      const zoom = await (
        map.getSource("semantic-pois") as GeoJSONSource
      ).getClusterExpansionZoom(Number(f.properties?.cluster_id));
      map.easeTo({
        center: [f.geometry.coordinates[0], f.geometry.coordinates[1]],
        zoom,
      });
    } catch {
      /* Map may have unmounted. */
    }
  };
  map.on("click", "poi-symbols", click);
  map.on("click", "poi-clusters", cluster);
  return () => {
    map.off("click", "poi-symbols", click);
    map.off("click", "poi-clusters", cluster);
    if (map.getLayer("poi-symbols")) map.removeLayer("poi-symbols");
    if (map.getLayer("personal-place-halo")) map.removeLayer("personal-place-halo");
    if (map.getLayer("poi-clusters")) map.removeLayer("poi-clusters");
    if (map.getSource("semantic-pois")) map.removeSource("semantic-pois");
  };
}
export function updatePoiLayer(map: Map, places: SemanticPlace[], relations: UserPlaceRelation[] = []) {
  for (const p of places) {
    const id = `poi-${p.icon}`;
    if (map.hasImage(id)) continue;
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext("2d");
    if (!ctx) continue;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(32, 32, 29, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#6da79a";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.font = '32px "Apple Color Emoji", "Segoe UI Emoji", sans-serif';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#164b3f";
    ctx.fillText(p.icon, 32, 33);
    map.addImage(id, ctx.getImageData(0, 0, 64, 64));
  }
  (map.getSource("semantic-pois") as GeoJSONSource | undefined)?.setData({
    type: "FeatureCollection",
    features: places.map((p) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [p.lng, p.lat] },
      properties: { id: p.id, image: `poi-${p.icon}`,personal:relations.some(r=>r.placeId===p.id&&(r.visitCount>0||r.favorite)),favorite:relations.find(r=>r.placeId===p.id)?.favorite||false,visits:relations.find(r=>r.placeId===p.id)?.visitCount||0,stay:relations.find(r=>r.placeId===p.id)?.totalStayMinutes||0 },
    })),
  });
}
