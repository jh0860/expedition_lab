import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  legalActions,
  applyAction,
  chooseBot,
  loadGame,
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
  s.players[0].recruitSite = Object.values(s.board.tiles).find(t => t.type === "recruit").id;
  s.owners[s.players[0].recruitSite] = 0;
  s.players[0].treasure = 5;
  s.turn.movement = 1;
  s = applyAction(s, { type: "enter", tile: tile.id });
  s = applyAction(s, { type: "resolveCombat" });
  assert.equal(s.active, 1);
  assert.equal(s.players[0].troop, "scout");
  assert.equal(s.players[0].treasure, 0);
  assert.equal(s.players[0].position, `t:${s.players[0].base}`);
  assert.ok(!s.cleared.includes(tile.id));
});
test("treasure conversion checks victory immediately", () => {
  let s = createGame({ goal: 5 });
  s.players[0].treasure = 5;
  s = applyAction(s, { type: "bank" });
  assert.equal(s.winner, 0);
  assert.deepEqual(legalActions(s), []);
});
test("a short 20-point bot smoke game can finish through the public action API", () => {
  let s = createGame({ seed: 1, goal: 20, bots: ["basic", "basic"] });
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
  state.turn.movement = 1;
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
  state.players[0].hand = ["wildMight", "wander"];
  state.turn.movement = 1;
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

test("a standard troop starts with zero Energy and must play cards to act", () => {
  let state = createGame();
  state.players[0].hand = ["wander", "hike", "strike"];
  assert.equal(state.turn.movement, 0);
  assert.ok(!("focus" in state.turn));
  assert.ok(legalActions(state).every((a) => ["play", "end"].includes(a.type)));
  state = applyAction(state, { type: "play", index: 0 });
  assert.equal(state.turn.movement, 1);
  const exit = legalActions(state).find((a) => a.type === "exit");
  state = applyAction(state, exit);
  assert.equal(state.turn.movement, 0);
  assert.ok(
    !legalActions(state).some((a) => a.type === "move" || a.type === "enter"),
  );
  state = applyAction(state, { type: "play", index: 0 });
  state = applyAction(
    state,
    legalActions(state).find((a) => a.type === "move"),
  );
  assert.equal(state.turn.movement, 1);
  state = applyAction(
    state,
    legalActions(state).find((a) => a.type === "enter"),
  );
  assert.equal(state.turn.movement, 0);
});

test("converting costs Energy and competes with leaving base", () => {
  let state = createGame();
  state.players[0].hand = ["hike", "wander"];
  assert.ok(!legalActions(state).some((a) => a.type === "deposit"));
  state = applyAction(state, { type: "play", index: 1 });
  state = applyAction(state, { type: "deposit", index: 0 });
  assert.equal(state.players[0].bank, 3);
  assert.equal(state.turn.movement, 0);
  assert.ok(!legalActions(state).some((a) => a.type === "exit"));
});

test("Only Scout grants automatic Energy, including when Fighter is also held", () => {
  let state = createGame();
  const camp = Object.values(state.board.tiles).find(
    (t) => t.type === "training",
  );
  state.players[0].recruitSite = Object.values(state.board.tiles).find(t => t.type === "recruit").id;
  state.owners[state.players[0].recruitSite] = 0;
  state.players[0].camp = camp.id;
  state.owners[camp.id] = 0;
  state = applyAction(state, { type: "end" });
  assert.equal(state.turn.movement, 0);
  state = applyAction(state, { type: "end" });
  assert.equal(state.turn.movement, 1);
  assert.ok(!("focus" in state.turn));
});

test("switching Camps cannot repeatedly generate Energy", () => {
  let state = createGame();
  const camps = Object.values(state.board.tiles).filter(
    (t) => t.type === "training",
  );
  state.players[0].position = `t:${camps[0].id}`;
  state = applyAction(state, { type: "claim" });
  assert.equal(state.turn.movement, 0);
  state.players[0].position = `t:${camps[1].id}`;
  state = applyAction(state, { type: "claim" });
  assert.equal(state.turn.movement, 0);
});

test("combat cards generate Energy usable after victory", () => {
  let state = createGame();
  const tile = Object.values(state.board.tiles).find((t) => t.type === "dark");
  state.players[0].position = tile.vertices[0];
  state.players[0].hand = ["wildMight", "wander", "hike"];
  state.turn.movement = 1;
  state = applyAction(state, { type: "enter", tile: tile.id });
  state = applyAction(state, { type: "play", index: 0 });
  state = applyAction(state, { type: "play", index: 0 });
  state = applyAction(state, { type: "play", index: 0 });
  assert.equal(state.turn.movement, 3);
  state = applyAction(state, { type: "resolveCombat" });
  state = applyAction(
    state,
    legalActions(state).find((a) => a.type === "exit"),
  );
  assert.equal(state.turn.movement, 2);
});

test("legacy save migration preserves pending actions but removes future baseline grants", () => {
  const old = createGame();
  old.turn.movement = 2;
  old.turn.focus = 1;
  old.config.movement = 3;
  old.config.focus = 2;
  const before = JSON.stringify(old);
  let state = loadGame({ version: 1, state: old });
  assert.equal(state.turn.movement, 3);
  assert.equal(state.config.movement, 0);
  assert.ok(!("focus" in state.turn));
  assert.ok(!("focus" in state.config));
  assert.equal(JSON.stringify(old), before);
  assert.deepEqual(loadGame({ version: 3, state }), state);
  state = applyAction(state, { type: "end" });
  assert.equal(state.turn.movement, 0);
  assert.throws(() => loadGame({ version: 7, state }));
});

test("new roster and ten-card starter deck match the design", async () => {
  const { cards, startingDeck, resources } = await import("../src/content.js");
  assert.equal(Object.keys(cards).length, 20);
  assert.deepEqual(
    startingDeck.reduce(
      (counts, id) => ({ ...counts, [id]: (counts[id] || 0) + 1 }),
      {},
    ),
    { wander: 5, strike: 2, barter: 3 },
  );
  for (const p of createGame().players) {
    assert.equal(p.hand.length, 5);
    assert.equal(p.deck.length, 5);
    assert.deepEqual([...p.hand, ...p.deck].sort(), [...startingDeck].sort());
  }
  assert.deepEqual(resources.forage, [
    "hike",
    "supplyCache",
    "wildMight",
    "trinket",
  ]);
  assert.deepEqual(resources.guild, [
    "arcanePassage",
    "healer",
    "magicalImbuement",
    "alchemy",
  ]);
  assert.deepEqual(resources.mine, [
    "preciousCache",
    "relic",
    "ancientBlessing",
  ]);
  assert.equal(cards.relic.value, 25);
});

test("site rewards are seeded, from the right pool, and once per player", async () => {
  const { resources } = await import("../src/content.js");
  for (const type of Object.keys(resources)) {
    let s = createGame();
    const tile = Object.values(s.board.tiles).find((t) => t.type === type);
    s.players[0].position = tile.vertices[0];
    s.turn.movement = 3;
    const a = applyAction(s, { type: "enter", tile: tile.id });
    const b = applyAction(s, { type: "enter", tile: tile.id });
    assert.deepEqual(a, b);
    assert.ok(resources[type].includes(a.players[0].discard.at(-1)));
    s = applyAction(a, { type: "exit", to: tile.vertices[0] });
    s = applyAction(s, { type: "enter", tile: tile.id });
    assert.equal(s.players[0].discard.length, 1);
  }
});

test("income cards produce spendable carried treasure that converts to Standing", () => {
  let s = createGame();
  const recruit = Object.values(s.board.tiles).find(t => t.type === "recruit");
  s.players[0].position = `t:${recruit.id}`;
  s.players[0].hand = ["barter", "alchemy", "ancientBlessing"];
  s.players[0].treasure = 2;
  s = applyAction(s, { type:"play", index:0 });
  s = applyAction(s, { type:"play", index:0 });
  assert.equal(s.players[0].treasure,5);
  assert.ok(!("coin" in s.turn));
  s = applyAction(s, {type:"recruit",troop:"scout"});
  assert.equal(s.players[0].treasure,2);
  s = applyAction(s, {type:"play",index:0});
  assert.equal(s.turn.health,5);
  assert.equal(s.turn.power,5);
  assert.equal(s.turn.movement,6);
  s.players[0].position = `t:${s.players[0].base}`;
  s = applyAction(s, {type:"bank"});
  assert.equal(s.players[0].bank,2);
  assert.equal(s.players[0].treasure,0);
  s = applyAction(s, {type:"end"});
  assert.equal(s.turn.health,0);
  assert.equal(s.turn.power,0);
});

test("Health cards affect the pending combat without granting permanent Health", () => {
  let s = createGame();
  const tile = Object.values(s.board.tiles).find((t) => t.type === "black");
  s.players[0].position = tile.vertices[0];
  s.players[0].hand = ["healer", "wildMight"];
  s.turn.movement = 1;
  s = applyAction(s, { type: "enter", tile: tile.id });
  s = applyAction(s, { type: "play", index: 0 });
  s = applyAction(s, { type: "play", index: 0 });
  s = applyAction(s, { type: "resolveCombat" });
  assert.equal(s.active, 0);
  assert.ok(s.cleared.includes(tile.id));
  assert.equal(s.turn.health, 5);
  s = applyAction(s, { type: "end" });
  assert.equal(s.turn.health, 0);
});

test("Arcane Passage chooses any Guild without Energy and awards its first visit", () => {
  let s = createGame();
  s.players[0].hand = ["arcanePassage"];
  const guilds = Object.values(s.board.tiles).filter((t) => t.type === "guild");
  const plays = legalActions(s).filter((a) => a.type === "play");
  assert.equal(plays.length, guilds.length);
  s = applyAction(s, plays.at(-1));
  assert.equal(s.players[0].position, `t:${guilds.at(-1).id}`);
  assert.equal(s.turn.movement, 0);
  assert.ok(s.players[0].visited.includes(guilds.at(-1).id));
  assert.equal(s.players[0].discard.length, 2);
  assert.throws(() =>
    applyAction(s, { type: "play", index: 0, tile: s.players[0].base }),
  );
  const tile = Object.values(s.board.tiles).find((t) => t.type === "dark");
  s.players[0].position = tile.vertices[0];
  s.players[0].hand = ["arcanePassage"];
  s.turn.movement = 1;
  s = applyAction(s, { type: "enter", tile: tile.id });
  assert.ok(!legalActions(s).some((a) => a.type === "play"));
});

test("starter cards and no-effect treasure cards can be converted permanently", () => {
  let s = createGame({ goal: 100 });
  s.players[0].hand = ["barter", "relic", "trinket"];
  s.turn.movement = 3;
  s = applyAction(s, { type: "deposit", index: 0 });
  s = applyAction(s, { type: "deposit", index: 0 });
  s = applyAction(s, { type: "deposit", index: 0 });
  assert.equal(s.players[0].bank, 33);
  assert.equal(s.players[0].discard.length, 0);
  assert.equal(s.players[0].hand.length, 0);
});

test("old card IDs migrate without changing deck sizes", () => {
  const s = createGame();
  s.players[0].hand = [
    "stride",
    "prepare",
    "strike",
    "nature",
    "sorcery",
    "mine",
  ];
  const migrated = loadGame({ version: 2, state: s });
  assert.deepEqual(migrated.players[0].hand, [
    "hike",
    "wander",
    "strike",
    "hike",
    "arcanePassage",
    "preciousCache",
  ]);
  assert.deepEqual(loadGame({ version: 3, state: migrated }), migrated);
});

test("the default victory target is 50 and crossing it ends the game", () => {
  let state = createGame();
  assert.equal(state.config.goal, 50);
  state.players[0].treasure = 49;
  state = applyAction(state, { type: "bank" });
  assert.equal(state.winner, null);
  state.players[0].treasure = 1;
  state = applyAction(state, { type: "bank" });
  assert.equal(state.players[0].bank, 50);
  assert.equal(state.winner, 0);
  assert.deepEqual(legalActions(state), []);
});
