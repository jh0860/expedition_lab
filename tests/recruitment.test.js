import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  applyAction,
  chooseBot,
  legalActions,
} from "../src/game.js";
const sites = (s) =>
  Object.values(s.board.tiles).filter((t) => t.type === "recruit");

test("recruiting claims a site and takeover removes the previous owner's upgrade", () => {
  let s = createGame();
  const tile = sites(s)[0];
  s.players[0].position = `t:${tile.id}`;
  s.turn.coin = 3;
  s = applyAction(s, { type: "recruit", troop: "scout" });
  assert.equal(s.owners[tile.id], 0);
  assert.equal(s.players[0].recruitSite, tile.id);
  assert.equal(s.turn.movement, 1);
  s = applyAction(s, { type: "end" });
  s.players[1].position = `t:${tile.id}`;
  s.players[1].treasure = 2;
  s.turn.coin = 1;
  s = applyAction(s, { type: "recruit", troop: "fighter" });
  assert.equal(s.players[0].troop, "standard");
  assert.equal(s.players[0].recruitSite, null);
  assert.equal(s.players[1].troop, "fighter");
  assert.equal(s.owners[tile.id], 1);
  assert.equal(s.turn.coin, 0);
  assert.equal(s.players[1].treasure, 0);
});

test("recruitment transfer releases the old site and preserves Camp ownership", () => {
  let s = createGame();
  const [a, b] = sites(s);
  const camp = Object.values(s.board.tiles).find((t) => t.type === "training");
  Object.assign(s.players[0], {
    position: `t:${b.id}`,
    troop: "scout",
    recruitSite: a.id,
    camp: camp.id,
    treasure: 3,
  });
  s.owners[a.id] = 0;
  s.owners[camp.id] = 0;
  s = applyAction(s, { type: "recruit", troop: "scout" });
  assert.equal(s.owners[a.id], undefined);
  assert.equal(s.players[0].recruitSite, b.id);
  assert.equal(s.players[0].camp, camp.id);
  assert.equal(s.owners[camp.id], 0);
  assert.equal(s.turn.movement, 0);
});

test("Opportunist skips unowned recruitment replacements but contests a rival", () => {
  const s = createGame();
  const [a, b] = sites(s);
  Object.assign(s.players[0], {
    position: `t:${b.id}`,
    troop: "scout",
    recruitSite: a.id,
    treasure: 3,
    hand: [],
  });
  s.owners[a.id] = 0;
  assert.notEqual(chooseBot(s, "opportunist").type, "recruit");
  s.owners[b.id] = 1;
  s.players[1].recruitSite = b.id;
  s.players[1].troop = "scout";
  assert.deepEqual(chooseBot(s, "opportunist"), {
    type: "recruit",
    troop: "scout",
  });
});

test("a troop profile can only change at a recruitment site with payment", () => {
  const s = createGame();
  assert.ok(!legalActions(s).some((a) => a.type === "recruit"));
  s.players[0].position = `t:${sites(s)[0].id}`;
  assert.ok(!legalActions(s).some((a) => a.type === "recruit"));
});
