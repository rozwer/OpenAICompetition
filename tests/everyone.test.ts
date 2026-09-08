import { describe, it, expect } from "vitest";
import { compareVisits } from "../src/domain/everyone";
import { myLens, friendLenses } from "../src/fixtures/everyone";
describe("lens comparison",()=>{
 it("computes overlap of unique places without confusing it with affinity",()=>{const result=compareVisits([...myLens.visits,...myLens.visits],friendLenses[0].visits);expect(result.overlap).toBe(50);expect(result.common).toHaveLength(3);expect(result.mine).toEqual(["library"]);expect(result.theirs).toHaveLength(2)});
 it("handles missing records",()=>{expect(compareVisits([],[])).toEqual({common:[],mine:[],theirs:[],overlap:0})});
});
