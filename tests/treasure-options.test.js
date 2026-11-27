import test from "node:test";
import assert from "node:assert/strict";
import { createGame, applyAction, legalActions, loadGame, chooseBot } from "../src/game.js";
import { cards, playerStats, marketDeck } from "../src/content.js";

for (const [id, cash, value] of [["trinket", 5, 7], ["relic", 20, 25]]) {
  test(`${id} can be destroyed for carried treasure or converted for full Standing`, () => {
    let s = createGame();
    s.players[0].hand = [id];
    s = applyAction(s, { type: "play", index: 0 });
    assert.equal(s.players[0].treasure, cash);
    assert.equal(s.players[0].bank, 0);
    assert.deepEqual(s.destroyed, [id]);
    assert.ok(!s.players[0].discard.includes(id));
    assert.ok(!legalActions(s).some(a => a.type === "deposit"));
    assert.deepEqual(loadGame({ version: 5, state: s }), s);
    s = applyAction(s, { type: "bank" });
    assert.equal(s.players[0].bank, cash);
    assert.equal(s.turn.movement, 0);
    const finiteMarket = [...s.market.deck, ...s.market.offers.filter(Boolean), ...s.market.deposited, ...s.destroyed.filter(x => marketDeck.includes(x))];
    assert.equal(finiteMarket.length, 6);
    s = createGame();
    s.players[0].hand = [id];
    s.turn.movement = 1;
    s = applyAction(s, { type: "deposit", index: 0 });
    assert.equal(s.players[0].bank, value);
    assert.equal(s.players[0].treasure, 0);
    assert.deepEqual(s.destroyed, []);
    assert.equal(cards[id].value, value);
  });
}
test("Relic respects the existing carry limit and bots avoid wasting its overflow", () => {
  let s = createGame();
  s.players[0].position = Object.keys(s.board.vertices)[0];
  s.players[0].hand = ["relic"];
  s.players[0].treasure = 5;
  assert.notEqual(chooseBot(s, "delver").type, "play");
  s = applyAction(s, { type: "play", index: 0 });
  assert.equal(s.players[0].treasure, 20);
  assert.deepEqual(s.destroyed, ["relic"]);
});
test("Scout and Fighter independently follow their respective contested sites", () => {
  let s = createGame();
  const camp = Object.values(s.board.tiles).find(t => t.type === "training");
  const recruit = Object.values(s.board.tiles).find(t => t.type === "recruit");
  s.players[0].position = `t:${camp.id}`;
  s = applyAction(s, {type:"claim"});
  assert.deepEqual(playerStats(s.players[0]), {power:2,health:3,movement:0});
  assert.equal(s.turn.movement, 0);
  s.players[0].position = `t:${recruit.id}`;
  s.players[s.active].treasure += 3;
  s = applyAction(s, {type:"recruit",troop:"scout"});
  assert.deepEqual(playerStats(s.players[0]), {power:2,health:3,movement:1});
  assert.equal(s.turn.movement, 1);
  s = applyAction(s, {type:"end"});
  s.players[1].position = `t:${recruit.id}`;
  s.players[s.active].treasure += 3;
  s = applyAction(s, {type:"recruit",troop:"scout"});
  assert.deepEqual(playerStats(s.players[0]), {power:2,health:3,movement:0});
  assert.equal(s.players[0].troop,"fighter");
  assert.deepEqual(playerStats(s.players[1]), {power:1,health:2,movement:1});
  s.players[1].position = `t:${camp.id}`;
  s.players[s.active].treasure += 2;
  s = applyAction(s, {type:"claim"});
  assert.deepEqual(playerStats(s.players[0]), {power:1,health:2,movement:0});
  assert.deepEqual(playerStats(s.players[1]), {power:2,health:3,movement:1});
  assert.equal(s.turn.movement, 1);
});
