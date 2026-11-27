import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  applyAction,
  legalActions,
  loadGame,
} from "../src/game.js";

test("every tile exit costs 1 Energy, including cleared forests", () => {
  const setup = createGame();
  for (const tile of Object.values(setup.board.tiles)) {
    let s = structuredClone(setup);
    s.players[0].position = `t:${tile.id}`;
    s.cleared.push(tile.id);
    s.turn.movement = 0;
    assert.ok(!legalActions(s).some((a) => a.type === "exit"));
    s.turn.movement = 1;
    const exit = legalActions(s).find((a) => a.type === "exit");
    assert.ok(exit);
    s = applyAction(s, exit);
    assert.equal(s.turn.movement, 0);
  }
});

test("cleared forest entry allows staying and playing cards, with no free exit", () => {
  let s = createGame();
  const tile = Object.values(s.board.tiles).find((t) => t.type === "dark");
  s.players[0].position = tile.vertices[0];
  s.players[0].hand = ["wander"];
  s.cleared.push(tile.id);
  s.turn.movement = 1;
  s = applyAction(s, { type: "enter", tile: tile.id });
  assert.equal(s.encounter, null);
  assert.equal(s.turn.movement, 0);
  assert.ok(!legalActions(s).some((a) => a.type === "exit"));
  assert.ok(legalActions(s).some((a) => a.type === "end"));
  s = applyAction(s, { type: "play", index: 0 });
  s = applyAction(
    s,
    legalActions(s).find((a) => a.type === "exit"),
  );
  assert.equal(s.turn.movement, 0);
});

test("old pending trail exits load under the uniform cost rule", () => {
  const s = createGame();
  s.turn.freeExit = s.players[0].base;
  s.turn.trail = true;
  const loaded = loadGame({ version: 3, state: s });
  assert.ok(!("freeExit" in loaded.turn));
  assert.ok(!("trail" in loaded.turn));
  assert.ok(!legalActions(loaded).some((a) => a.type === "exit"));
});
