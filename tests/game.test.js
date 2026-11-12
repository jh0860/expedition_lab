import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  legalActions,
  applyAction,
  chooseBot,
} from "../src/game.js";

test("seeded setup and play are repeatable", () => {
  let a = createGame({ seed: 23 }),
    b = createGame({ seed: 23 });
  for (let i = 0; i < 80; i++) {
    a = applyAction(a, chooseBot(a));
    b = applyAction(b, chooseBot(b));
  }
  assert.deepEqual(a, b);
});
test("full board retains 37 nonoverlapping seven-hex flowers", () =>
  assert.equal(Object.keys(createGame({ radius: 3 }).board.tiles).length, 259));
test("illegal actions do not mutate the caller", () => {
  const state = createGame(),
    before = JSON.stringify(state);
  assert.throws(() => applyAction(state, { type: "deposit", index: 99 }));
  assert.equal(JSON.stringify(state), before);
});
test("cleared forest gives one immediate free exit per turn", () => {
  let s = createGame();
  const tile = Object.values(s.board.tiles).find((t) => t.type === "dark");
  s.players[0].position = tile.vertices[0];
  s.cleared.push(tile.id);
  s.turn.focus = 1;
  s = applyAction(s, { type: "enter", tile: tile.id });
  assert.equal(s.turn.focus, 0);
  assert.ok(legalActions(s).every((a) => a.type === "exit"));
  s = applyAction(s, legalActions(s)[0]);
  assert.equal(s.turn.focus, 0);
  assert.equal(s.turn.freeExit, null);
});
test("takeover charges carried treasure and transfers the Camp", () => {
  let s = createGame();
  const tile = Object.values(s.board.tiles).find((t) => t.type === "training");
  s.players[0].position = `t:${tile.id}`;
  s.players[0].treasure = 2;
  s.players[1].camp = tile.id;
  s.owners[tile.id] = 1;
  s = applyAction(s, { type: "claim" });
  assert.equal(s.players[0].treasure, 0);
  assert.equal(s.players[1].camp, null);
  assert.equal(s.owners[tile.id], 0);
});
test("defeat returns the same upgraded troop and loses treasure", () => {
  let s = createGame();
  const tile = Object.values(s.board.tiles).find((t) => t.type === "black");
  s.players[0].position = tile.vertices[0];
  s.players[0].troop = "scout";
  s.players[0].treasure = 5;
  s = applyAction(s, { type: "enter", tile: tile.id });
  s = applyAction(s, { type: "resolveCombat" });
  assert.equal(s.active, 1);
  assert.equal(s.players[0].troop, "scout");
  assert.equal(s.players[0].treasure, 0);
  assert.equal(s.players[0].position, `t:${s.players[0].base}`);
  assert.ok(!s.cleared.includes(tile.id));
});
test("banking checks victory immediately", () => {
  let s = createGame({ goal: 5 });
  s.players[0].treasure = 5;
  s = applyAction(s, { type: "bank" });
  assert.equal(s.winner, 0);
  assert.deepEqual(legalActions(s), []);
});
test("a seeded bot game can finish through the public action API", () => {
  let s = createGame({ seed: 1 });
  for (let i = 0; i < 3000 && s.winner === null; i++)
    s = applyAction(s, chooseBot(s));
  assert.notEqual(s.winner, null);
});

test("entering a hazard reveals the encounter and locks world actions", () => {
  let state = createGame();
  const tile = Object.values(state.board.tiles).find(
    (tile) => tile.type === "dark",
  );
  state.players[0].position = tile.vertices[0];
  const rng = state.rng;
  state = applyAction(state, { type: "enter", tile: tile.id });
  assert.equal(state.encounter.tile, tile.id);
  assert.equal(state.rng, rng);
  assert.equal(state.active, 0);
  assert.ok(
    legalActions(state).every((action) =>
      ["play", "resolveCombat"].includes(action.type),
    ),
  );
  assert.throws(() => applyAction(state, { type: "end" }));
  assert.throws(() =>
    applyAction(state, { type: "exit", to: tile.vertices[0] }),
  );
});

test("cards played in the decision window affect the pending fight", () => {
  let state = createGame();
  const tile = Object.values(state.board.tiles).find(
    (tile) => tile.type === "dark",
  );
  state.players[0].position = tile.vertices[0];
  state.players[0].hand = ["strike", "prepare"];
  state = applyAction(state, { type: "enter", tile: tile.id });
  state = applyAction(state, { type: "play", index: 0 });
  assert.equal(state.turn.power, 2);
  assert.equal(state.players[0].hand.length, 1);
  assert.ok(state.encounter);
  const restored = JSON.parse(JSON.stringify(state));
  const result = applyAction(state, { type: "resolveCombat" });
  assert.equal(
    JSON.stringify(result),
    JSON.stringify(applyAction(restored, { type: "resolveCombat" })),
  );
  assert.equal(result.encounter, null);
  assert.ok(result.cleared.includes(tile.id));
  assert.equal(result.active, 0);
  assert.equal(result.turn.power, 2);
  assert.equal(result.players[0].treasure, 2);
});
