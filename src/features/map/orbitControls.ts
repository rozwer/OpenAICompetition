import type { Map } from "maplibre-gl";

/** Finger angle around the walker's feet maps 1:1 to visible map rotation. */
export function installOrbitControls(map: Map, enabled: () => boolean, center: () => [number, number]) {
  const surface = map.getCanvasContainer();
  let start: { x: number; y: number; pivotX: number; pivotY: number; angle: number | null; bearing: number } | null = null;
  let dragged = false;
  let multiTouch = false;
  const begin = (x: number, y: number) => {
    dragged = false;
    if (!enabled()) return;
    map.stop();
    const feet = map.project(center());
    const rect = map.getCanvas().getBoundingClientRect();
    const pivotX = rect.left + feet.x, pivotY = rect.top + feet.y;
    start = { x, y, pivotX, pivotY, angle: Math.hypot(x - pivotX, y - pivotY) < 18 ? null : Math.atan2(y - pivotY, x - pivotX), bearing: map.getBearing() };
  };
  const move = (x: number, y: number) => {
    if (!start || !enabled()) return;
    if (Math.hypot(x - start.x, y - start.y) > 5) dragged = true;
    // Close to the pivot the angle is unstable. Re-anchor on leaving it,
    // rather than flipping the map when a finger passes over the person.
    if (Math.hypot(x - start.pivotX, y - start.pivotY) < 18) { start.angle = null; return; }
    const angle = Math.atan2(y - start.pivotY, x - start.pivotX);
    if (start.angle !== null && dragged) {
      const delta = Math.atan2(Math.sin(angle - start.angle), Math.cos(angle - start.angle));
      start.bearing -= delta * 180 / Math.PI;
      map.jumpTo({ center: center(), bearing: start.bearing });
    }
    if (dragged || start.angle === null) start.angle = angle;
  };
  const mouseDown = (e: MouseEvent) => {
    if (e.button === 0 && e.target === map.getCanvas()) begin(e.clientX, e.clientY);
  };
  const mouseMove = (e: MouseEvent) => move(e.clientX, e.clientY);
  const end = () => { start = null; };
  const touchStart = (e: TouchEvent) => {
    if (!enabled() || e.target !== map.getCanvas()) return;
    if (e.touches.length > 1) { multiTouch = true; dragged = true; end(); }
    else if (!multiTouch) begin(e.touches[0].clientX, e.touches[0].clientY);
  };
  const touchMove = (e: TouchEvent) => {
    if (!enabled() || multiTouch || e.touches.length !== 1 || !start) return;
    e.preventDefault();
    move(e.touches[0].clientX, e.touches[0].clientY);
  };
  const touchEnd = (e: TouchEvent) => {
    end();
    if (!e.touches.length) multiTouch = false;
  };
  const click = (e: MouseEvent) => {
    if (enabled() && dragged && e.target === map.getCanvas()) { e.preventDefault(); e.stopPropagation(); }
  };
  surface.addEventListener("mousedown", mouseDown);
  window.addEventListener("mousemove", mouseMove);
  window.addEventListener("mouseup", end);
  window.addEventListener("blur", end);
  surface.addEventListener("touchstart", touchStart, { passive: true });
  surface.addEventListener("touchmove", touchMove, { passive: false });
  surface.addEventListener("touchend", touchEnd);
  surface.addEventListener("touchcancel", touchEnd);
  surface.addEventListener("click", click, true);
  return () => {
    surface.removeEventListener("mousedown", mouseDown);
    window.removeEventListener("mousemove", mouseMove);
    window.removeEventListener("mouseup", end);
    window.removeEventListener("blur", end);
    surface.removeEventListener("touchstart", touchStart);
    surface.removeEventListener("touchmove", touchMove);
    surface.removeEventListener("touchend", touchEnd);
    surface.removeEventListener("touchcancel", touchEnd);
    surface.removeEventListener("click", click, true);
  };
}
