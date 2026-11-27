import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  applyAction,
  legalActions,
  loadGame,
  chooseBot,
} from "../src/game.js";
import { cards, marketDeck } from "../src/content.js";
function offer(s, ids) {
  s.market.offers = [...ids];
  s.market.deck = marketDeck.filter((id) => !ids.includes(id));
}
function give(s, id) {
  s.market.offers = s.market.offers.map((x) => (x === id ? null : x));
  s.market.deck = s.market.deck.filter((x) => x !== id);
  s.players[s.active].hand.push(id);
}
function marketVertex(s) {
  return Object.values(s.board.tiles).find((t) => t.type === "market")
    .vertices[0];
}
function conserve(s) {
  const ids = [
    ...s.market.deck,
    ...s.market.offers.filter(Boolean),
    ...s.market.deposited,
    ...s.destroyed.filter((id) => marketDeck.includes(id)),
    ...s.players.flatMap((p) =>
      [...p.deck, ...p.hand, ...p.discard].filter((id) => cards[id].singleUse),
    ),
  ];
  assert.deepEqual(ids.sort(), [...marketDeck].sort());
}

test("market starts with two unique offers and four cards in reserve", () => {
  const s = createGame();
  assert.equal(s.market.offers.filter(Boolean).length, 2);
  assert.equal(s.market.deck.length, 4);
  conserve(s);
});

test("purchases spend carried treasure, never Standing, and wait for restock", () => {
  let s = createGame({ goal: 500 });
  offer(s, ["timeLord", "journey"]);
  s.players[0].position = marketVertex(s);
  s.players[0].bank = 100;
  assert.ok(!legalActions(s).some((a) => a.type === "buy"));
  s.players[0].treasure = 5;
  s = applyAction(s, { type: "buy", index: 0 });
  assert.ok(!("coin" in s.turn));
  assert.equal(s.players[0].treasure, 1);
  assert.equal(s.players[0].bank, 100);
  assert.ok(s.players[0].discard.includes("timeLord"));
  assert.equal(s.market.offers[0], null);
  assert.equal(s.market.deck.length, 4);
  s = applyAction(s, { type: "end" });
  assert.ok(s.market.offers[0]);
  assert.equal(s.market.deck.length, 3);
  conserve(s);
});

test("the finite market never recycles used or converted cards", () => {
  let s = createGame();
  offer(s, ["journey", null]);
  s.market.deck = marketDeck.filter((id) => id !== "journey");
  for (const id of [...s.market.deck]) {
    s.market.deck = s.market.deck.filter((x) => x !== id);
    s.destroyed.push(id);
  }
  s.players[0].position = marketVertex(s);
  s.players[s.active].treasure += 3;
  s = applyAction(s, { type: "buy", index: 0 });
  s = applyAction(s, { type: "end" });
  assert.deepEqual(s.market.offers, [null, null]);
  conserve(s);
});

test("Journey destroys itself immediately and cannot then be converted", () => {
  let s = createGame();
  s.players[0].hand = [];
  give(s, "journey");
  s = applyAction(s, { type: "play", index: 0 });
  assert.equal(s.turn.movement, 5);
  assert.deepEqual(s.destroyed, ["journey"]);
  assert.ok(!s.players[0].discard.includes("journey"));
  assert.ok(
    !legalActions(s).some(
      (a) =>
        a.type === "deposit" &&
        s.players[0][a.zone || "hand"][a.index] === "journey",
    ),
  );
  conserve(s);
});

test("Omnipotence draws three additional cards and cannot redraw itself", () => {
  let s = createGame();
  s.players[0].hand = [];
  s.players[0].deck = ["wander", "strike", "barter"];
  s.players[0].discard = [];
  give(s, "omnipotence");
  s = applyAction(s, { type: "play", index: 0 });
  assert.equal(s.players[0].hand.length, 3);
  assert.ok(!s.players[0].hand.includes("omnipotence"));
  assert.ok(s.destroyed.includes("omnipotence"));
  conserve(s);
});

test("Time Lord grants a fresh turn after cleanup and market restocking", () => {
  let s = createGame();
  s.players[0].hand = [];
  give(s, "timeLord");
  s.players[0].recruitSite = Object.values(s.board.tiles).find(t => t.type === "recruit").id;
  s.owners[s.players[0].recruitSite] = 0;
  s = applyAction(s, { type: "play", index: 0 });
  s.turn.movement = 9;
  s.turn.power = 5;
  s.turn.health = 3;
  s.players[s.active].treasure += 4;
  s.turn.remoteBanking = true;
  s = applyAction(s, { type: "end" });
  assert.equal(s.active, 0);
  assert.equal(s.round, 1);
  assert.equal(s.players[0].hand.length, 5);
  assert.equal(s.players[0].extraTurns, 0);
  assert.equal(s.turn.movement, 1);
  assert.equal(s.turn.power, 0);
  assert.equal(s.turn.health, 0);
  assert.ok(!("coin" in s.turn));
  assert.equal(s.turn.remoteBanking, false);
  assert.equal(s.market.offers.filter(Boolean).length, 2);
  s = applyAction(s, { type: "end" });
  assert.equal(s.active, 1);
  conserve(s);
});

test("Strike It Rich is carried treasure, observes capacity, and scores only on treasure conversion", () => {
  let s = createGame();
  s.players[0].hand = [];
  s.players[0].treasure = 15;
  give(s, "strikeItRich");
  s = applyAction(s, { type: "play", index: 0 });
  assert.equal(s.players[0].treasure, 20);
  assert.equal(s.players[0].bank, 0);
  s = applyAction(s, { type: "bank" });
  assert.equal(s.players[0].bank, 20);
  conserve(s);
});

test("Banker allows free remote treasure conversion plus normal-cost card conversions only for this turn", () => {
  let s = createGame();
  s.players[0].hand = [];
  give(s, "banker");
  s.players[0].position = marketVertex(s);
  s.players[0].treasure = 10;
  s.players[0].discard = ["trinket"];
  assert.ok(!legalActions(s).some((a) => a.type === "bank"));
  s = applyAction(s, { type: "play", index: 0 });
  s = applyAction(s, { type: "bank" });
  assert.equal(s.players[0].bank, 10);
  assert.equal(s.turn.movement, 0);
  assert.ok(!legalActions(s).some((a) => a.type === "deposit"));
  s.turn.movement = 1;
  s = applyAction(s, { type: "deposit", zone: "discard", index: 0 });
  assert.equal(s.players[0].bank, 17);
  assert.equal(s.turn.movement, 0);
  s = applyAction(s, { type: "end" });
  assert.equal(s.turn.remoteBanking, false);
  conserve(s);
});

test("Seize Control transfers a distant site and its benefit without paying normal acquisition costs", () => {
  let s = createGame();
  const tiles = Object.values(s.board.tiles),
    camp = tiles.find((t) => t.type === "training"),
    recruit = tiles.find((t) => t.type === "recruit");
  s.players[0].hand = [];
  give(s, "seizeControl");
  s.players[1].camp = camp.id;
  s.owners[camp.id] = 1;
  const a = legalActions(s).find(
    (a) => a.type === "play" && a.tile === camp.id,
  );
  s = applyAction(s, a);
  assert.equal(s.players[1].camp, null);
  assert.equal(s.players[0].camp, camp.id);
  assert.equal(s.turn.movement, 0);
  assert.equal(s.players[0].treasure, 0);
  conserve(s);
  s = createGame();
  s.players[0].hand = [];
  give(s, "seizeControl");
  s.players[1].recruitSite = recruit.id;
  s.players[1].troop = "scout";
  s.owners[recruit.id] = 1;
  s = applyAction(s, {
    type: "play",
    index: 0,
    tile: recruit.id,
    troop: "scout",
  });
  assert.equal(s.players[1].troop, "standard");
  assert.equal(s.players[0].troop, "scout");
  assert.equal(s.players[0].recruitSite, recruit.id);
  conserve(s);
});

test("an unused consumable can be converted but its effect is not activated", () => {
  let s = createGame();
  s.players[0].hand = [];
  give(s, "timeLord");
  s.turn.movement = 1;
  s = applyAction(s, { type: "deposit", index: 0 });
  assert.equal(s.players[0].bank, 4);
  assert.equal(s.players[0].extraTurns, 0);
  assert.deepEqual(s.market.deposited, ["timeLord"]);
  conserve(s);
});

test("new market states round-trip and older saves receive a finite market", () => {
  const s = createGame();
  assert.deepEqual(loadGame({ version: 4, state: s }), s);
  const old = structuredClone(s);
  delete old.market;
  delete old.destroyed;
  delete old.turn.remoteBanking;
  for (const p of old.players) delete p.extraTurns;
  const loaded = loadGame({ version: 3, state: old });
  assert.equal(loaded.market.offers.filter(Boolean).length, 2);
  conserve(loaded);
});

test("all strategies can buy and use market cards rather than converting them for small scores", () => {
  for (const bot of [
    "courier",
    "courierReplacement",
    "builder",
    "delver",
    "opportunist",
  ]) {
    let s = createGame({ bots: [bot, "builder"] });
    offer(s, ["journey", "timeLord"]);
    s.players[0].position = marketVertex(s);
    s.players[0].hand = [];
    s.players[s.active].treasure += 4;
    assert.equal(chooseBot(s).type, "buy");
    s = createGame({ bots: [bot, "builder"] });
    s.players[0].hand = [];
    give(s, "timeLord");
    s.turn.movement = 2;
    assert.deepEqual(chooseBot(s), { type: "play", index: 0 });
  }
});

test("Time Lord still resolves its extra turn after defeat ends the current turn", () => {
  let s = createGame();
  const tile = Object.values(s.board.tiles).find((t) => t.type === "black");
  s.players[0].hand = [];
  give(s, "timeLord");
  s.players[0].treasure = 5;
  s = applyAction(s, { type: "play", index: 0 });
  s.players[0].position = tile.vertices[0];
  s.turn.movement = 1;
  s = applyAction(s, { type: "enter", tile: tile.id });
  s = applyAction(s, { type: "resolveCombat" });
  assert.equal(s.active, 0);
  assert.equal(s.players[0].position, `t:${s.players[0].base}`);
  assert.equal(s.players[0].treasure, 0);
  assert.equal(s.players[0].extraTurns, 0);
  assert.equal(s.players[0].hand.length, 5);
  assert.equal(s.turn.movement, 0);
  conserve(s);
});

test("remote ownership changes and treasure conversion remain locked during combat", () => {
  let s = createGame();
  const tile = Object.values(s.board.tiles).find((t) => t.type === "dark");
  s.players[0].hand = [];
  give(s, "seizeControl");
  give(s, "banker");
  s = applyAction(s, { type: "play", index: 1 });
  s.players[0].position = tile.vertices[0];
  s.players[0].treasure = 4;
  s.turn.movement = 1;
  s = applyAction(s, { type: "enter", tile: tile.id });
  assert.ok(
    !legalActions(s).some(
      (a) =>
        a.type === "bank" ||
        a.type === "deposit" ||
        a.type === "buy" ||
        (a.type === "play" && a.tile),
    ),
  );
  conserve(s);
});
