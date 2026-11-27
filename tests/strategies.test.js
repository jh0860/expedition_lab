import test from "node:test";
import assert from "node:assert/strict";
import {
  createGame,
  chooseBot,
  legalActions,
  applyAction,
  loadGame,
} from "../src/game.js";

// Single-position decisions only. No turns or full games are simulated here.
test("strategy configuration persists per seat and rejects unknown names", () => {
  const s = createGame({ bots: ["builder", "delver"] });
  assert.deepEqual(
    s.players.map((p) => p.bot),
    ["builder", "delver"],
  );
  assert.throws(() => createGame({ bots: ["unknown", "courier"] }));
});

test("Recruitment grants Scout to both Builder and Delver", () => {
  const s = createGame();
  const tile = Object.values(s.board.tiles).find((t) => t.type === "recruit");
  s.players[0].position = `t:${tile.id}`;
  s.players[0].treasure = 3;
  s.players[0].hand = [];
  assert.deepEqual(chooseBot(s, "builder"), {
    type: "recruit",
    troop: "scout",
  });
  assert.deepEqual(chooseBot(s, "delver"), {
    type: "recruit",
    troop: "scout",
  });
});

test("Opportunist contests a rival Camp while Builder retains its own", () => {
  const s = createGame();
  const camps = Object.values(s.board.tiles).filter(
    (t) => t.type === "training",
  );
  s.players[0].position = `t:${camps[0].id}`;
  s.players[0].camp = camps[1].id;
  s.owners[camps[1].id] = 0;
  s.players[1].camp = camps[0].id;
  s.owners[camps[0].id] = 1;
  s.players[0].treasure = 2;
  s.players[0].hand = [];
  assert.deepEqual(chooseBot(s, "opportunist"), { type: "claim" });
  assert.notEqual(chooseBot(s, "builder").type, "claim");
});

test("Courier conversion phase converts Wild Might while Builder retains it", () => {
  const s = createGame();
  s.players[0].courierPhase = "convert";
  s.players[0].hand = ["wildMight", "wander"];
  s.players[0].deck = Array(5).fill("wander");
  s.players[0].discard = [];
  s.turn.movement = 1;
  assert.notEqual(chooseBot(s, "builder").type, "deposit");
  const used = applyAction(s, chooseBot(s, "courier"));
  assert.deepEqual(chooseBot(used, "courier"), {
    type: "deposit",
    zone: "discard",
    index: 0,
  });
});

test("strategies spend combat buffs only until victory is guaranteed", () => {
  const s = createGame();
  s.players[0].hand = ["wildMight", "healer"];
  s.encounter = { power: 1, health: 3, speed: 2 };
  assert.deepEqual(chooseBot(s, "delver"), { type: "play", index: 0 });
  s.turn.power = 2;
  assert.deepEqual(chooseBot(s, "delver"), { type: "resolveCombat" });
});

test("strategies use Coin before recruiting when it funds the upgrade", () => {
  const s = createGame();
  const tile = Object.values(s.board.tiles).find((t) => t.type === "recruit");
  s.players[0].position = `t:${tile.id}`;
  s.players[0].hand = ["alchemy"];
  s.players[0].treasure = 1;
  assert.deepEqual(chooseBot(s, "builder"), { type: "play", index: 0 });
});

test("each strategy returns a legal deterministic decision without changing state", () => {
  const s = createGame();
  s.players[0].hand = ["arcanePassage", "wander", "wildMight"];
  const before = JSON.stringify(s);
  const actions = legalActions(s);
  for (const strategy of [
    "courier",
    "builder",
    "delver",
    "opportunist",
    "basic",
  ]) {
    const a = chooseBot(s, strategy);
    assert.ok(
      actions.some((legal) => JSON.stringify(legal) === JSON.stringify(a)),
    );
    assert.deepEqual(chooseBot(s, strategy), a);
  }
  assert.equal(JSON.stringify(s), before);
});

test("Courier converts the highest-value available card", () => {
  const s = createGame();
  s.players[0].hand = [
    "healer",
    "wildMight",
    "arcanePassage",
    "trinket",
    "relic",
  ];
  s.players[0].deck = Array(5).fill("wander");
  s.players[0].discard = [];
  s.turn.movement = 1;
  const a = chooseBot(s, "courier");
  assert.equal(a.type, "deposit");
  assert.equal(s.players[0].hand[a.index], "relic");
});

test("Courier converts a Trinket in discard without waiting", () => {
  const s = createGame();
  s.players[0].hand = ["wander", "strike", "barter"];
  s.players[0].deck = Array(4).fill("wander");
  s.players[0].discard = ["trinket"];
  s.turn.movement = 3;
  assert.ok(
    !legalActions(s).some(
      (a) => a.type === "deposit" && s.players[0].hand[a.index] === "trinket",
    ),
  );
  assert.deepEqual(chooseBot(s, "courier"), {
    type: "deposit",
    zone: "discard",
    index: 0,
  });
});

test("Opportunist skips an unowned Camp when it already owns another", () => {
  const s = createGame();
  const camps = Object.values(s.board.tiles).filter(
    (t) => t.type === "training",
  );
  s.players[0].position = `t:${camps[0].id}`;
  s.players[0].camp = camps[1].id;
  s.owners[camps[1].id] = 0;
  s.players[0].hand = [];
  assert.notEqual(chooseBot(s, "opportunist").type, "claim");
  s.players[0].camp = null;
  delete s.owners[camps[1].id];
  assert.deepEqual(chooseBot(s, "opportunist"), { type: "claim" });
});

test("Courier conversion phase retains one Hike and converts surplus Hikes", () => {
  let s = createGame();
  s.players[0].courierPhase = "convert";
  s.players[0].hand = ["hike", "hike"];
  s.players[0].deck = Array(5).fill("wander");
  s.players[0].discard = [];
  s.turn.movement = 2;
  let deposited = false;
  for (let i = 0; i < 4; i++) {
    const a = chooseBot(s, "courier");
    s = applyAction(s, a);
    if (a.type === "deposit") {
      deposited = true;
      break;
    }
  }
  assert.ok(deposited);
  assert.equal(
    [
      ...s.players[0].hand,
      ...s.players[0].discard,
      ...s.players[0].deck,
    ].filter((id) => id === "hike").length,
    1,
  );
  assert.notEqual(chooseBot(s, "courier").type, "deposit");
});
