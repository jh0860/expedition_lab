const centers = new Set(["market", "forage", "training", "recruit", "guild", "mine"]);
const offsets = [[0,0],[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];

// Recover each flower from its site center, including boards in existing saves.
// Only edges used by one of its seven tiles belong to the outer silhouette.
export function flowerOutlines(board) {
  return Object.values(board.tiles).filter(t => centers.has(t.type)).map(center => {
    const tiles = offsets.map(([dq,dr]) => board.tiles[`${center.q+dq},${center.r+dr}`]);
    if (tiles.some(t => !t)) return null;
    const edges = new Map();
    for (const tile of tiles) tile.vertices.forEach((a,i) => {
      const b = tile.vertices[(i+1)%6], key = [a,b].sort().join("|");
      if (edges.has(key)) edges.delete(key);
      else edges.set(key,[a,b]);
    });
    const adjacent = new Map();
    for (const [a,b] of edges.values()) {
      if (!adjacent.has(a)) adjacent.set(a,[]);
      if (!adjacent.has(b)) adjacent.set(b,[]);
      adjacent.get(a).push(b); adjacent.get(b).push(a);
    }
    const first = adjacent.keys().next().value, vertices = [first];
    let previous = null, current = first;
    do {
      const next = adjacent.get(current).find(v => v !== previous);
      if (next === first) break;
      vertices.push(next); previous=current; current=next;
    } while (vertices.length <= edges.size);
    return {id:center.id, tiles:tiles.map(t=>t.id), vertices};
  }).filter(Boolean);
}
