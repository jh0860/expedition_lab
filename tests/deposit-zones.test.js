import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  applyAction,
  legalActions,
  chooseBot,
  loadGame,
} from "../src/game.js";

test("discard conversions cost Energy and remove only the selected copy", () => {
  let s = createGame();
  s.players[0].hand = ["strike"];
  s.players[0].discard = ["trinket", "hike"];
  s.players[0].deck = ["relic"];
  s.turn.movement = 1;
  const a = { type: "deposit", zone: "discard", index: 0 };
  assert.ok(
    legalActions(s).some((x) => JSON.stringify(x) === JSON.stringify(a)),
  );
  assert.throws(() =>
    applyAction(s, { type: "deposit", zone: "exile", index: 0 }),
  );
  s = applyAction(s, a);
  assert.equal(s.players[0].bank, 7);
  assert.deepEqual(s.players[0].discard, ["hike"]);
  assert.deepEqual(s.players[0].hand, ["strike"]);
  assert.deepEqual(s.players[0].deck, ["relic"]);
  assert.equal(s.turn.movement, 0);
  assert.ok(!legalActions(s).some((a) => a.type === "deposit"));
});

test("a played card can be converted from discard without removing its turn bonus", () => {
  let s = createGame();
  s.players[0].hand = ["magicalImbuement"];
  s.players[0].discard = [];
  s = applyAction(s, { type: "play", index: 0 });
  s = applyAction(s, { type: "deposit", zone: "discard", index: 0 });
  assert.equal(s.turn.movement, 2);
  assert.equal(s.turn.power, 1);
  assert.equal(s.players[0].bank, 5);
  assert.equal(s.players[0].discard.length, 0);
  assert.deepEqual(loadGame({ version: 3, state: s }), s);
});

test("discard conversions are unavailable away from base and during combat", () => {
  const s = createGame();
  s.players[0].discard = ["relic"];
  s.turn.movement = 2;
  s.players[0].position = s.board.tiles[s.players[0].base].vertices[0];
  assert.ok(!legalActions(s).some((a) => a.type === "deposit"));
  s.players[0].position = `t:${s.players[0].base}`;
  s.encounter = { power: 1, health: 3 };
  assert.ok(!legalActions(s).some((a) => a.type === "deposit"));
});

test("both Courier policies convert a reward directly from discard", () => {
  for (const policy of ["courier", "courierReplacement"]) {
    let s = createGame({ bots: [policy, "builder"] });
    s.players[0].hand = ["wander"];
    s.players[0].discard = ["trinket"];
    s.players[0].deck = Array(4).fill("wander");
    s = applyAction(s, chooseBot(s));
    const a = chooseBot(s);
    assert.deepEqual(a, { type: "deposit", zone: "discard", index: 0 });
  }
});

test("replacement Courier credits are not reused after discard conversions or save/load", () => {
  let s = createGame({ bots: ["courierReplacement", "builder"] });
  s.players[0].hand = [];
  s.players[0].discard = ["wander", "wander", "wander"];
  s.players[0].deck = ["hike", "hike", "wander", "wander"];
  s.turn.movement = 5;
  for (let i = 0; i < 2; i++) {
    const a = chooseBot(s);
    assert.equal(a.type, "deposit");
    assert.equal(a.zone, "discard");
    s = loadGame({ version: 3, state: applyAction(s, a) });
  }
  assert.deepEqual(s.players[0].courierReplacements, ["wander", "wander"]);
  assert.notEqual(chooseBot(s).type, "deposit");
});

test("draw-deck conversions preserve hand/discard and shuffle only the remaining draw deck", () => {
  const s = createGame();
  s.players[0].hand = ["barter", "healer"];
  s.players[0].discard = ["strike", "trinket"];
  s.players[0].deck = [
    "relic",
    "hike",
    "wildMight",
    "alchemy",
    "wander",
    "healer",
  ];
  s.turn.movement = 1;
  const before = JSON.stringify(s);
  const a = { type: "deposit", zone: "deck", index: 0 };
  const result = applyAction(s, a);
  assert.equal(JSON.stringify(s), before);
  assert.equal(result.players[0].bank, 25);
  assert.equal(result.turn.movement, 0);
  assert.deepEqual(result.players[0].hand, s.players[0].hand);
  assert.deepEqual(result.players[0].discard, s.players[0].discard);
  assert.deepEqual(
    [...result.players[0].deck].sort(),
    s.players[0].deck.slice(1).sort(),
  );
  assert.notEqual(result.rng, s.rng);
  assert.deepEqual(applyAction(s, a), result);
});

test("hand and discard conversions also shuffle the draw deck without moving other cards", () => {
  for (const zone of ["hand", "discard"]) {
    const s = createGame();
    s.players[0].hand = ["trinket", "strike"];
    s.players[0].discard = ["relic", "barter"];
    s.players[0].deck = ["wander", "hike", "healer", "alchemy", "wildMight"];
    s.turn.movement = 1;
    const result = applyAction(s, {
      type: "deposit",
      ...(zone === "hand" ? {} : { zone }),
      index: 0,
    });
    assert.notEqual(result.rng, s.rng);
    assert.deepEqual(
      [...result.players[0].deck].sort(),
      [...s.players[0].deck].sort(),
    );
    const other = zone === "hand" ? "discard" : "hand";
    assert.deepEqual(result.players[0][other], s.players[0][other]);
    assert.deepEqual(result.players[0][zone], s.players[0][zone].slice(1));
  }
});

test("both Courier policies can fund and convert a Trinket directly from the draw deck", () => {
  for (const policy of ["courier", "courierReplacement"]) {
    let s = createGame({ bots: [policy, "builder"] });
    s.players[0].hand = ["wander"];
    s.players[0].deck = ["trinket", ...Array(4).fill("wander")];
    s.players[0].discard = [];
    s = applyAction(s, chooseBot(s));
    const a = chooseBot(s);
    assert.equal(a.type, "deposit");
    assert.equal(a.zone, "deck");
    assert.equal(s.players[0].deck[a.index], "trinket");
    s = applyAction(s, a);
    assert.equal(s.players[0].bank, 7);
  }
});
