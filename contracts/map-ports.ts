/** Metre-based symbolic descriptors, independent of Three and MapLibre. */
import type { ExplorationMapBinding } from './exploration';
import type { Meaning, AppContextData, LngLat } from './domain';
export type Vec3 = readonly [number, number, number];
export type Primitive = {
  shape: 'box'|'sphere'|'cylinder'; position: Vec3; rotation: Vec3;
  size: Vec3; color: string;
};
export interface FormsPort { build(meaning: Meaning): readonly Primitive[] }
export interface AvatarPort {
  build(pose: {headingDegrees:number|null; moving:boolean; phase:number}): readonly Primitive[];
}
export type MapAction = {type:'dimension'; value:'2d'|'3d'} |
  {type:'lens'; value:'physical'|'mine'|'peer'; peerId:string|null} |
  {type:'live-position'; value:LngLat|null} | {type:'replay-position'; value:LngLat|null};
export interface MapStatePort { reduce(state:AppContextData, action:MapAction):AppContextData }
export interface MapDependencies { forms:FormsPort; avatar:AvatarPort|null; state:MapStatePort; exploration?:ExplorationMapBinding }
/** Host factory is supplied by MAP-001; composition supplies pure parts explicitly. */
export type MapHostFactory<View> = (dependencies:MapDependencies) => import('./entries').UIEntry<View>;
