/** Exploration is prospective. It never confirms visits or writes Meaning. */
import type * as D from './domain';

export interface ExplorationSelectionInput {
  actorId:D.Id;
  origin:D.ExplorationOrigin;
  /** Resolved, authorized same-owner records. No arbitrary AI-authored place facts. */
  experience:D.Experience|null;
  preference:D.Preference|null;
  candidateSet:D.CandidateSet;
  places:readonly D.Place[];
  sources:readonly D.Source[];
  discoveryCards:readonly D.DiscoveryCard[];
  policyVersion:string;
}
export interface ExplorationProposal {
  placeId:D.Id; origin:D.ExplorationOrigin; reason:D.ExplorationReason;
  inputVersions:readonly D.VersionRef[]; provenance:D.Provenance;
}
/** Pure, deterministic. Persistence and current ownership checks belong to EXP-002. */
export interface ExplorationPort {
  select(input:ExplorationSelectionInput):readonly ExplorationProposal[];
  relation(input:{actorId:D.Id;placeId:D.Id;visits:readonly D.Visit[];
    experiences:readonly D.Experience[];meaning:D.Meaning}):D.ExplorationRelation;
}

export interface ExplorationMarker {
  placeId:D.Id; candidateIds:readonly D.Id[]; anchor:D.LngLat;
  appearance:'mist'|'interested-mist';
  /** Symbolic size, never an observed building height or preference score. */
  sizeMeters:number;
  accessibleLabel:string;
  sourceMode:D.SourceMode;
}
export interface ExplorationLayerPort {
  /** Host owns camera, geographic projection and hit testing; hidden outside own lens. */
  describe(input:{items:readonly D.ExplorationItem[];lens:D.AppContextData['lens'];
    dimension:D.AppContextData['dimension'];enabled:boolean;reducedMotion:boolean;
    selectedPlaceId:D.Id|null;maxVisiblePlaces:number}):readonly ExplorationMarker[];
}
/** UI/renderers receive the same snapshot and callbacks through composition only. */
export interface ExplorationMapBinding {
  layer:ExplorationLayerPort;
  getSnapshot():{items:readonly D.ExplorationItem[];enabled:boolean;reducedMotion:boolean};
  subscribe(listener:()=>void):()=>void;
  selectPlace(placeId:D.Id):void;
}
