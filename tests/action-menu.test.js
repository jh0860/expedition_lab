import test from "node:test";
import assert from "node:assert/strict";
import {createGame, legalActions} from "../src/game.js";
import {travelDescription} from "../src/action-menu.js";

test("each of a tile's six exits has a distinct directional name", () => {
  const state=createGame();
  state.turn.movement=1;
  for (const tile of Object.values(state.board.tiles)) {
    state.players[state.active].position=`t:${tile.id}`;
    const exits=legalActions(state).filter(a=>a.type === "exit");
    const labels=exits.map(a=>travelDescription(state,a));
    assert.equal(new Set(labels).size,exits.length);
    assert.ok(labels.every(text=>/^Exit (North|South|East|West)/.test(text)));
  }
});

test("travel descriptions use board directions and readable site names without changing state", () => {
  const state=createGame();
  const tile=Object.values(state.board.tiles).find(t=>t.type === "recruit");
  state.players[state.active].position=tile.vertices[0];
  const before=structuredClone(state);
  assert.equal(travelDescription(state,{type:"enter",tile:tile.id}),"Enter Recruitment Site");
  const from=state.board.vertices[tile.vertices[0]];
  for (const to of from.neighbors) {
    const target=state.board.vertices[to];
    const text=travelDescription(state,{type:"move",to});
    if(target.x>from.x+0.1) assert.match(text,/East|east/);
    if(target.x<from.x-0.1) assert.match(text,/West|west/);
    if(target.y>from.y+0.1) assert.match(text,/South|south/);
    if(target.y<from.y-0.1) assert.match(text,/North|north/);
  }
  assert.deepEqual(state,before);
});
