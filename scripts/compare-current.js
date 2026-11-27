import { createGame, applyAction, chooseBot } from "../src/game.js";
import { cards, marketDeck } from "../src/content.js";
const mode = process.argv[2] || "duel";
const count = Number(process.argv[3] || (mode === "multiplayer" ? 10 : 50));
if (
  !["duel", "multiplayer"].includes(mode) ||
  !Number.isInteger(count) ||
  count < 1 ||
  count > 1000
)
  throw Error("Use duel|multiplayer and 1–1000 games.");
const names = ["delver", "builder", "opportunist", "courier"];
// Each 12-game duel block covers all six pairings in both orders. The first
// two games are complementary pairs, keeping a 50-game schedule at 25 appearances each.
const duelOrder = [
  [0, 1],
  [2, 3],
  [1, 0],
  [3, 2],
  [0, 2],
  [1, 3],
  [2, 0],
  [3, 1],
  [0, 3],
  [1, 2],
  [3, 0],
  [2, 1],
];
const schedule = Array.from({ length: count }, (_, i) => {
  if (mode === "duel")
    return {
      seed: 1 + Math.floor(i / 12),
      bots: duelOrder[i % 12].map((n) => names[n]),
    };
  const block = Math.floor(i / 4),
    order = block % 2 ? [0, 3, 2, 1].map((n) => names[n]) : names;
  const offset = i % 4;
  return {
    seed: 42 + block,
    bots: order.map((_, j) => order[(j + offset) % 4]),
  };
});
const results = [];
for (const [gameIndex, { seed, bots }] of schedule.entries()) {
  let state = createGame({ seed, players: bots.length, bots });
  let actions = 0,
    error = null;
  const limit = bots.length === 4 ? 30000 : 15000;
  const activity = bots.map(() => ({
    purchases: 0,
    marketCoinSpent: 0,
    marketTreasureSpent: 0,
    uses: {},
    claims: 0,
    campTakeovers: 0,
    recruits: 0,
    recruitmentTakeovers: 0,
    combats: 0,
    defeats: 0,
    standingFromCards: 0,
    standingFromTreasure: 0,
    remoteStanding: 0,
  }));
  const courierPhases = [
    {
      phase: state.players[bots.indexOf("courier")]?.courierPhase || "invest",
      round: 1,
      standing: 0,
    },
  ];
  try {
    while (state.winner === null && state.round <= 150 && actions < limit) {
      const a = chooseBot(state),
        p = state.players[state.active],
        stats = activity[state.active];
      const before = state;
      if (a.type === "play") {
        const id = p.hand[a.index];
        if (cards[id].singleUse) stats.uses[id] = (stats.uses[id] || 0) + 1;
      }
      if (a.type === "claim") {
        stats.claims++;
        if (state.owners[p.position.slice(2)] !== undefined)
          stats.campTakeovers++;
      }
      if (a.type === "recruit") {
        stats.recruits++;
        const owner = state.owners[p.position.slice(2)];
        if (owner !== undefined && owner !== state.active)
          stats.recruitmentTakeovers++;
      }
      if (a.type === "resolveCombat") stats.combats++;
      state = applyAction(state, a);
      const after = state.players[before.active];
      if (a.type === "buy") {
        stats.purchases++;
        stats.marketCoinSpent += before.turn.coin - state.turn.coin;
        stats.marketTreasureSpent += p.treasure - after.treasure;
      }
      if (a.type === "deposit" || a.type === "bank") {
        const value = after.bank - p.bank;
        stats[
          a.type === "deposit" ? "standingFromCards" : "standingFromTreasure"
        ] += value;
        if (before.turn.remoteBanking && p.position !== `t:${p.base}`)
          stats.remoteStanding += value;
      }
      if (
        a.type === "resolveCombat" &&
        !state.cleared.includes(before.encounter.tile)
      )
        stats.defeats++;
      const courier = state.players[bots.indexOf("courier")];
      if (courier && courier.courierPhase !== courierPhases.at(-1).phase)
        courierPhases.push({
          phase: courier.courierPhase,
          round: state.round,
          standing: courier.bank,
          treasure: courier.treasure,
        });
      const stock = [
        ...state.market.deck,
        ...state.market.offers.filter(Boolean),
        ...state.market.deposited,
        ...state.destroyed,
        ...state.players.flatMap((p) =>
          [...p.hand, ...p.deck, ...p.discard].filter(
            (id) => cards[id].singleUse,
          ),
        ),
      ];
      if (
        JSON.stringify(stock.sort()) !== JSON.stringify([...marketDeck].sort())
      )
        throw Error("Market card conservation failure");
      if (
        state.turn.movement < 0 ||
        state.players.some(
          (p, i) =>
            p.bank < before.players[i].bank ||
            p.treasure < 0 ||
            p.treasure > state.config.carry,
        )
      )
        throw Error("Standing, treasure, or Energy invariant failed");
      actions++;
    }
  } catch (e) {
    error = e.message;
  }
  const result = {
    game: gameIndex + 1,
    seed,
    bots,
    winner: state.winner === null ? null : bots[state.winner],
    winnerSeat: state.winner === null ? null : state.winner + 1,
    rounds: state.round,
    actions,
    standing: state.players.map((p) => p.bank),
    troops: state.players.map((p) => p.troop),
    marketRemaining:
      state.market.deck.length + state.market.offers.filter(Boolean).length,
    activity,
    courierPhases: bots.includes("courier") ? courierPhases : [],
    error,
  };
  results.push(result);
  console.error(
    `${gameIndex + 1}/${count} ${bots.join(" / ")}: ${result.winner || "unfinished"}, round ${result.rounds}${error ? " ERROR " + error : ""}`,
  );
}
console.log(
  JSON.stringify(
    {
      mode,
      players: mode === "duel" ? 2 : 4,
      games: count,
      strategies: names,
      goal: 50,
      radius: 2,
      roundLimit: 150,
      protocol:
        mode === "duel"
          ? "Mirrored 12-game blocks plus balanced complementary pairs; each strategy appears 25 times for 50 games"
          : "Cyclic seat rotations in groups of four, alternating clockwise order on successive seeds; seats appear 2 or 3 times for 10 games",
      results,
    },
    null,
    2,
  ),
);
