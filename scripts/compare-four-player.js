import { createGame, applyAction, chooseBot } from "../src/game.js";
import { cards, marketDeck } from "../src/content.js";
const seed = Number(process.argv[2] || 42);
if (!Number.isInteger(seed) || seed < 0)
  throw Error("Use a nonnegative integer seed.");
const strategies = ["delver", "builder", "opportunist", "courier"];
const results = [];
for (let rotation = 0; rotation < 4; rotation++) {
  const bots = strategies.map((_, i) => strategies[(i + rotation) % 4]);
  let state = createGame({ seed, players: 4, bots });
  const activity = bots.map(() => ({
    purchases: 0,
    uses: {},
    claims: 0,
    campTakeovers: 0,
    recruitmentTakeovers: 0,
    combats: 0,
    defeats: 0,
    remoteBankValue: 0,
    remoteDepositValue: 0,
    depositValue: 0,
  }));
  let actions = 0,
    error = null;
  try {
    while (state.winner === null && state.round <= 150 && actions < 30000) {
      const a = chooseBot(state),
        p = state.players[state.active],
        stats = activity[state.active];
      const before = state;
      if (a.type === "buy") stats.purchases++;
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
        const owner = state.owners[p.position.slice(2)];
        if (owner !== undefined && owner !== state.active)
          stats.recruitmentTakeovers++;
      }
      if (a.type === "resolveCombat") stats.combats++;
      state = applyAction(state, a);
      if (
        a.type === "resolveCombat" &&
        !state.cleared.includes(before.encounter.tile)
      )
        stats.defeats++;
      if (a.type === "deposit") {
        const v = state.players[before.active].bank - p.bank;
        stats.depositValue += v;
        if (before.turn.remoteBanking && p.position !== `t:${p.base}`)
          stats.remoteDepositValue += v;
      }
      if (
        a.type === "bank" &&
        before.turn.remoteBanking &&
        p.position !== `t:${p.base}`
      )
        stats.remoteBankValue += p.treasure;
      const pool = [
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
        JSON.stringify(pool.sort()) !== JSON.stringify([...marketDeck].sort())
      )
        throw Error("Market card conservation failure");
      actions++;
    }
  } catch (e) {
    error = e.message;
  }
  const result = {
    seed,
    rotation,
    bots,
    winner: state.winner === null ? null : bots[state.winner],
    winnerSeat: state.winner === null ? null : state.winner + 1,
    rounds: state.round,
    actions,
    scores: state.players.map((p) => p.bank),
    troops: state.players.map((p) => p.troop),
    marketRemaining:
      state.market.deck.length + state.market.offers.filter(Boolean).length,
    activity,
    error,
  };
  results.push(result);
  console.error(
    `${rotation + 1}/4 ${bots.join(" / ")}: ${result.winner || "unfinished"}, round ${result.rounds}${error ? " ERROR " + error : ""}`,
  );
}
console.log(
  JSON.stringify(
    {
      players: 4,
      seed,
      goal: 50,
      radius: 2,
      roundLimit: 150,
      actionLimit: 30000,
      protocol:
        "Four cyclic seat rotations on one map seed; replacement Courier excluded",
      results,
    },
    null,
    2,
  ),
);
