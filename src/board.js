import { hazards } from "./content.js";
const directions = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];
export function buildBoard(radius, random) {
  const tiles = {},
    vertices = {},
    edges = {};
  const distance = (q, r) =>
    Math.max(Math.abs(q), Math.abs(r), Math.abs(q + r));
  let flower = 0;
  for (let q = -radius; q <= radius; q++)
    for (let r = -radius; r <= radius; r++) {
      const ring = distance(q, r);
      if (ring > radius) continue;
      const centerQ = -3 * q - 2 * r,
        centerR = q + 3 * r;
      const type =
        ring === 0
          ? "market"
          : radius === 3 && ring === 3
            ? "mine"
            : ["forage", "training", "recruit", "guild", "forage", "mine"][
                flower++ % 6
              ];
      const rotation = Math.floor(random() * 6);
      [[0, 0], ...directions].forEach(([dq, dr], i) => {
        const tq = centerQ + dq,
          tr = centerR + dr,
          id = `${tq},${tr}`;
        let terrain = i === 0 ? type : "forest";
        if (ring === 0 && i > 0) terrain = "town";
        else if (i > 0 && type === "mine")
          terrain = i - 1 === rotation ? "black" : "mountain";
        else if (i > 0 && type === "guild")
          terrain = i - 1 === rotation ? "mountain" : "dark";
        else if (i > 0 && ring > 0)
          terrain =
            i - 1 === rotation
              ? "mountain"
              : i - 1 === (rotation + 3) % 6
                ? "dark"
                : "forest";
        const x = Math.sqrt(3) * (tq + tr / 2),
          y = 1.5 * tr;
        const corners = Array.from({ length: 6 }, (_, j) => {
          const angle = ((60 * j - 30) * Math.PI) / 180;
          const vx = Math.round((x + Math.cos(angle)) * 10000) / 10000,
            vy = Math.round((y + Math.sin(angle)) * 10000) / 10000;
          const key = `${vx.toFixed(4)},${vy.toFixed(4)}`;
          vertices[key] ??= { id: key, x: vx, y: vy, tiles: [], neighbors: [] };
          vertices[key].tiles.push(id);
          return key;
        });
        tiles[id] = {
          id,
          q: tq,
          r: tr,
          x,
          y,
          type: terrain,
          vertices: corners,
          town: ring === 0,
        };
        corners.forEach((a, j) => {
          const b = corners[(j + 1) % 6],
            key = [a, b].sort().join("|");
          edges[key] ??= { a, b, tiles: [] };
          edges[key].tiles.push(id);
        });
      });
    }
  for (const e of Object.values(edges)) {
    const blocked =
      e.tiles.length === 2 &&
      e.tiles.every(
        (id) => tiles[id].type === "mountain" || hazards.has(tiles[id].type),
      );
    if (!blocked) {
      vertices[e.a].neighbors.push(e.b);
      vertices[e.b].neighbors.push(e.a);
    }
  }
  return { tiles, vertices };
}
