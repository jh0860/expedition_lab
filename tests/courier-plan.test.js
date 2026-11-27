import test from "node:test";
import assert from "node:assert/strict";
import { createGame, chooseBot, applyAction, loadGame } from "../src/game.js";
import { courierPlan } from "../src/bots.js";

test("Courier initially keeps useful combat and Coin cards but converts treasure cards", () => {
  const s = createGame();
  s.players[0].hand = ["wildMight", "alchemy", "wander"];
  s.players[0].deck = Array(5).fill("wander");
  s.players[0].discard = [];
  s.turn.movement = 1;
  assert.equal(courierPlan(s, s.players[0]), "invest");
  assert.notEqual(chooseBot(s).type, "deposit");
  s.players[0].discard = ["trinket"];
  assert.deepEqual(chooseBot(s), {
    type: "deposit",
    zone: "discard",
    index: 0,
  });
});

test("investment Courier retains spendable treasure and deliberately recruits Scout", () => {
  const s = createGame();
  s.players[0].treasure = 4;
  s.players[0].hand = [];
  assert.notEqual(chooseBot(s).type, "bank");
  const site = Object.values(s.board.tiles).find((t) => t.type === "recruit");
  s.players[0].position = `t:${site.id}`;
  assert.deepEqual(chooseBot(s), { type: "recruit", troop: "scout" });
});

test("Courier shifts when its reusable engine is ready, but Journey does not qualify", () => {
  const s = createGame();
  const p = s.players[0];
  p.recruitSite = Object.values(s.board.tiles).find(t => t.type === "recruit").id;
  p.hand = [
    ...Array(5).fill("wander"),
    ...Array(3).fill("barter"),
    "alchemy",
    "journey",
  ];
  p.deck = [];
  p.discard = [];
  assert.equal(courierPlan(s, p), "invest");
  p.hand.push("magicalImbuement");
  assert.equal(courierPlan(s, p), "convert");
});

test("Standing and rival Standing create conversion urgency", () => {
  const s = createGame();
  const p = s.players[0];
  p.bank = 30;
  assert.equal(courierPlan(s, p), "convert");
  p.bank = 0;
  s.players[1].bank = 40;
  assert.equal(courierPlan(s, p), "convert");
  s.players[1].bank = 0;
  p.bank = 25;
  p.discard = ["relic"];
  assert.equal(courierPlan(s, p), "convert");
});

test("conversion phase persists after converting upgrades and across saves", () => {
  let s = createGame();
  s.players[0].bank = 30;
  s.players[0].hand = ["wildMight"];
  s.turn.movement = 1;
  // Apply one legal action to record the phase, then lower mocked readiness to
  // verify that the committed phase does not regress after losing an engine.
  s = applyAction(s, { type: "play", index: 0 });
  assert.equal(s.players[0].courierPhase, "convert");
  s.players[0].bank = 0;
  s.players[0].troop = "standard";
  s.players[0].camp = null;
  s = loadGame({ version: 4, state: s });
  assert.equal(courierPlan(s, s.players[0]), "convert");
});

test("investment Courier will convert treasure to win or avoid a full carrying load", () => {
  const s = createGame();
  s.players[0].treasure = 20;
  assert.deepEqual(chooseBot(s), { type: "bank" });
  s.players[0].treasure = 10;
  s.players[0].bank = 40;
  assert.deepEqual(chooseBot(s), { type: "bank" });
});

test("legacy aggressive Courier skips the investment phase while current Courier retains it", () => {
  const s = createGame();
  s.players[0].hand = [];
  s.players[0].deck = ["wander", "wander", "wander", "wander", "wander"];
  s.players[0].discard = ["wildMight"];
  s.turn.movement = 1;
  assert.equal(chooseBot(s, "courierAggressive").type, "deposit");
  assert.notEqual(chooseBot(s, "courier").type, "deposit");
  assert.notEqual(chooseBot(s, "courierReplacement").type, "deposit");
});
