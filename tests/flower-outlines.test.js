import test from "node:test";
import assert from "node:assert/strict";
import {createGame} from "../src/game.js";
import {flowerOutlines} from "../src/flower-outlines.js";

for (const [radius, count] of [[1,7],[2,19],[3,37]]) {
  test(`${count} flowers each have one closed outline containing only outer edges`, () => {
    const board=createGame({radius}).board;
    const flowers=flowerOutlines(board);
    assert.equal(flowers.length,count);
    assert.equal(new Set(flowers.flatMap(f=>f.tiles)).size,count*7);
    for (const flower of flowers) {
      assert.equal(flower.vertices.length,18);
      assert.equal(new Set(flower.vertices).size,18);
      const occurrences=new Map();
      for (const id of flower.tiles) board.tiles[id].vertices.forEach((a,i,vs)=>{
        const key=[a,vs[(i+1)%6]].sort().join("|");
        occurrences.set(key,(occurrences.get(key)||0)+1);
      });
      const outline=flower.vertices.map((a,i,vs)=>[a,vs[(i+1)%vs.length]].sort().join("|"));
      assert.deepEqual(new Set(outline),new Set([...occurrences].filter(([,n])=>n===1).map(([key])=>key)));
    }
  });
}
