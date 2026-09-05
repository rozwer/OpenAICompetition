import {test,expect} from 'vitest';
import {buildingCatalog,buildingTypes,buildingDesign,buildingParts} from '../src/features/map/buildingModels';
import type {Feature,Polygon} from 'geojson';
const feature:Feature<Polygon>={type:'Feature',id:123,properties:{building:'house',height:null},geometry:{type:'Polygon',coordinates:[[[139.65,35.44],[139.6501,35.44],[139.6501,35.4401],[139.65,35.4401],[139.65,35.44]]]}};
test('six building families each have ten stable models with finite heights and closed geometry',()=>{
 for(const type of buildingTypes) {
 expect(buildingCatalog[type]).toHaveLength(10);
 expect(new Set(buildingCatalog[type].map(p=>p.name)).size).toBe(10);
 }
 const before=JSON.stringify(feature);
 expect(buildingDesign(feature)).toEqual(buildingDesign(structuredClone(feature)));
 const parts=buildingParts(feature);
 expect(parts.features.length).toBeGreaterThan(10);
 for(const part of parts.features){expect(part.geometry.coordinates[0].at(-1)).toEqual(part.geometry.coordinates[0][0]);expect(part.properties!.top).toBeGreaterThanOrEqual(part.properties!.base);expect(part.geometry.coordinates.flat(2).every(Number.isFinite)).toBe(true);}
 expect(JSON.stringify(feature)).toBe(before);
});
test('actual tags choose family; unknown heights get presentation height without modifying observations',()=>{
 expect(buildingDesign(feature).type).toBe('house');
 expect(buildingDesign({...feature,properties:{building:'office'}}).type).toBe('office');
 expect(buildingDesign({...feature,properties:{building:'warehouse'}}).type).toBe('warehouse');
 expect(buildingDesign(feature).height).toBeGreaterThan(0);
 expect(feature.properties!.height).toBeNull();
});
