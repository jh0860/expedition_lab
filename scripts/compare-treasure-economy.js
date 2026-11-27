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
const names = ["delver", "builder", "opportunist", "courierAggressive", "courierReplacement"];
const pairs = names.flatMap((a, i) => names.slice(i + 1).map(b => [a, b]));
const schedule = Array.from({ length: count }, (_, i) => {
  if (mode === "duel") {
    const block = Math.floor(i / 10);
    let bots = [...pairs[i % 10]];
    // Two mirrored seed blocks, then a balanced tournament orientation.
    if (block % 2) bots.reverse();
    if (block === 4) {
      const [a,b] = bots.map(n => names.indexOf(n));
      if ((b-a+5)%5 > 2) bots.reverse();
    }
    return { seed: 1 + Math.floor(block / 2), bots };
  }
  const omit = i % 5;
  let bots = Array.from({length: 4}, (_, j) => names[(omit+j+1)%5]);
  if (Math.floor(i/5)%2) bots.reverse();
  return {seed: 42 + omit, bots};
});
const results = [];
for (const [gameIndex, { seed, bots }] of schedule.entries()) {
  let state = createGame({ seed, players: bots.length, bots });
  let actions = 0,
    error = null;
  const limit = bots.length === 4 ? 30000 : 15000;
  const activity = bots.map(() => ({
    treasureCardsPlayed: {trinket:0, relic:0},
    treasureCardPayout: 0,
    treasureCardOverflow: 0,
    treasureCardsConverted: {trinket:0, relic:0},
    firstLiquidationRound: null,
    firstPurchaseRound: null,
    siteTreasureSpent: 0,
    treasureLost: 0,
    incomeGenerated: 0,
    incomeGeneratedAtBase: 0,
    incomeOverflow: 0,
    incomePlays: {},
    travelActions: 0,
    actionsAtBase: 0,
    purchases: 0,
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
      if (p.position === `t:${p.base}`) stats.actionsAtBase++;
      if (["move", "enter", "exit"].includes(a.type)) stats.travelActions++;
      if (a.type === "play") {
        const id = p.hand[a.index];
        if (cards[id].treasure && !cards[id].singleUse && !cards[id].destroyOnPlay) {
          const gain = Math.min(cards[id].treasure, state.config.carry - p.treasure);
          stats.incomeGenerated += gain;
          stats.incomeOverflow += cards[id].treasure - gain;
          if (p.position === `t:${p.base}`) stats.incomeGeneratedAtBase += gain;
          stats.incomePlays[id] = (stats.incomePlays[id] || 0) + 1;
        }
        if (cards[id].destroyOnPlay) {
          stats.treasureCardsPlayed[id]++;
          const gain = Math.min(cards[id].treasure, state.config.carry - p.treasure);
          stats.treasureCardPayout += gain;
          stats.treasureCardOverflow += cards[id].treasure - gain;
          stats.firstLiquidationRound ??= state.round;
        }
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
        stats.firstPurchaseRound ??= before.round;
        stats.marketTreasureSpent += p.treasure - after.treasure;
      }
      if (["claim", "recruit"].includes(a.type))
        stats.siteTreasureSpent += p.treasure - after.treasure;
      if (a.type === "deposit") {
        const id = p[a.zone || "hand"][a.index];
        if (cards[id].destroyOnPlay) stats.treasureCardsConverted[id]++;
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
        { stats.defeats++; stats.treasureLost += p.treasure; }
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
        ...state.destroyed.filter((id) => marketDeck.includes(id)),
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
      rules: "Unified treasure: Barter +1, Alchemy +2, Precious Cache +5 carried treasure; no Coin. Free base conversion retained. Trinket/Relic unchanged; Scout/Fighter site bonuses unchanged",
      mode,
      players: mode === "duel" ? 2 : 4,
      games: count,
      strategies: names,
      goal: 50,
      radius: 2,
      roundLimit: 150,
      protocol:
        mode === "duel"
          ? "All ten pairs: two mirrored seed blocks plus one balanced orientation; five games per pair, twenty appearances and ten first seats per policy"
          : "Five omission lineups with reversed-seat repeats; eight appearances per policy, twice in each seat",
      results,
    },
    null,
    2,
  ),
);
