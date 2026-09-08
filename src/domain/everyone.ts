import type { FriendLens, LensVisit } from "../contracts/everyone";
export function compareVisits(mine: LensVisit[], theirs: LensVisit[]) {
  const a = new Set(mine.map(v => v.placeId)), b = new Set(theirs.map(v => v.placeId));
  const common = [...a].filter(id => b.has(id)), union = new Set([...a, ...b]);
  return { common, mine: [...a].filter(id => !b.has(id)), theirs: [...b].filter(id => !a.has(id)), overlap: union.size ? Math.round(common.length / union.size * 100) : 0 };
}
export function comparisonInput(mine: FriendLens, friend: FriendLens) {
  return { sample: true, period: "架空の直近30日", mine: { name: mine.name, visits: mine.visits }, friend: { name: friend.name, visits: friend.visits }, comparison: compareVisits(mine.visits, friend.visits) };
}
