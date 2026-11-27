import { cards, marketDeck } from "../src/content.js";
import { createGame, applyAction, chooseBot } from "../src/game.js";
const count = Number(process.argv[2] || 5);
if (!Number.isInteger(count) || count < 1 || count > 1000)
  throw Error("Use 1–1000 seeds.");
const courierPolicy = process.argv[4] || "courier";
if (!["courier", "courierReplacement"].includes(courierPolicy))
  throw Error("Unknown Courier policy.");
const strategies =
  process.argv[3] === "all"
    ? ["courier", "courierReplacement", "builder", "delver", "opportunist"]
    : [courierPolicy, "builder", "delver", "opportunist"];
const focus =
  process.argv[3] === "all"
    ? undefined
    : process.argv[3] === "courier"
      ? courierPolicy
      : process.argv[3];
if (focus && !strategies.includes(focus))
  throw Error("Unknown focus strategy.");
const totalGames =
  (focus
    ? 2 * (strategies.length - 1)
    : strategies.length * (strategies.length - 1)) * count;
const results = [];
for (let i = 0; i < strategies.length; i++) {
  for (let j = i + 1; j < strategies.length; j++) {
    if (focus && ![strategies[i], strategies[j]].includes(focus)) continue;
    for (let seed = 1; seed <= count; seed++) {
      for (const bots of [
        [strategies[i], strategies[j]],
        [strategies[j], strategies[i]],
      ]) {
        let state = createGame({ seed, bots });
        let actions = 0;
        const activity = bots.map(() => ({
          deposits: 0,
          depositValue: 0,
          claims: 0,
          takeovers: 0,
          recruits: 0,
          recruitmentTakeovers: 0,
          purchases: 0,
          teleports: 0,
          combats: 0,
          defeats: 0,
          powerCards: 0,
          healthCards: 0,
          purchasesByCard: {},
          usesByCard: {},
          remoteBankValue: 0,
          remoteDepositValue: 0,
          seizeTakeovers: 0,
          extraTurnsTaken: 0,
        }));
        let error = null;
        try {
          while (
            state.winner === null &&
            state.round <= 150 &&
            actions < 15000
          ) {
            const a = chooseBot(state);
            const p = state.players[state.active];
            const stats = activity[state.active];
            if (a.type === "deposit") {
              stats.deposits++;
            }
            if (a.type === "claim") {
              stats.claims++;
              if (state.owners[p.position.slice(2)] !== undefined)
                stats.takeovers++;
            }
            if (a.type === "recruit") {
              stats.recruits++;
              const owner = state.owners[p.position.slice(2)];
              if (owner !== undefined && owner !== state.active)
                stats.recruitmentTakeovers =
                  (stats.recruitmentTakeovers || 0) + 1;
            }
            if (a.type === "buy") {
              stats.purchases++;
              const id = state.market.offers[a.index];
              stats.purchasesByCard[id] = (stats.purchasesByCard[id] || 0) + 1;
            }
            if (a.type === "play") {
              const id = p.hand[a.index];
              if (cards[id].teleport) stats.teleports++;
              if (cards[id].singleUse)
                stats.usesByCard[id] = (stats.usesByCard[id] || 0) + 1;
              if (
                cards[id].seize &&
                state.owners[a.tile] !== undefined &&
                state.owners[a.tile] !== state.active
              )
                stats.seizeTakeovers++;
            }
            if (a.type === "resolveCombat") stats.combats++;
            const before = state;
            state = applyAction(state, a);
            if (a.type === "deposit") {
              const value = state.players[before.active].bank - p.bank;
              stats.depositValue += value;
              if (before.turn.remoteBanking && p.position !== `t:${p.base}`)
                stats.remoteDepositValue += value;
            }
            if (
              a.type === "bank" &&
              before.turn.remoteBanking &&
              p.position !== `t:${p.base}`
            )
              stats.remoteBankValue += p.treasure;
            if (
              (a.type === "end" ||
                (a.type === "resolveCombat" &&
                  !state.cleared.includes(before.encounter?.tile))) &&
              before.players[before.active].extraTurns > 0
            )
              stats.extraTurnsTaken++;
            const marketCards = [
              ...state.market.deck,
              ...state.market.offers.filter(Boolean),
              ...state.market.deposited,
              ...state.destroyed,
              ...state.players.flatMap((p) =>
                [...p.deck, ...p.hand, ...p.discard].filter(
                  (id) => cards[id].singleUse,
                ),
              ),
            ];
            if (
              JSON.stringify(marketCards.sort()) !==
              JSON.stringify([...marketDeck].sort())
            )
              throw Error("Market card conservation failure");
            if (a.type === "play") {
              if (state.turn.power > before.turn.power) stats.powerCards++;
              if (state.turn.health > before.turn.health) stats.healthCards++;
            }
            if (
              a.type === "resolveCombat" &&
              !state.cleared.includes(before.encounter.tile)
            )
              stats.defeats++;
            actions++;
          }
        } catch (e) {
          error = e.message;
        }
        const result = {
          seed,
          bots,
          winner: state.winner === null ? null : bots[state.winner],
          winnerSeat: state.winner === null ? null : state.winner + 1,
          rounds: state.round,
          actions,
          scores: state.players.map((p) => p.bank),
          troops: state.players.map((p) => p.troop),
          visited: state.players.map((p) => p.visited.length),
          marketRemaining:
            state.market.offers.filter(Boolean).length +
            state.market.deck.length,
          destroyed: state.destroyed,
          activity,
          error,
        };
        results.push(result);
        console.error(
          `${results.length}/${totalGames} ${bots.join(" vs ")} seed ${seed}: ${result.winner || "unfinished"}${error ? ` ERROR ${error}` : ""}`,
        );
      }
    }
  }
}
console.log(
  JSON.stringify(
    {
      focus: focus || null,
      goal: 50,
      radius: 2,
      roundLimit: 150,
      actionLimit: 15000,
      seedsPerPairPerSeat: count,
      results,
    },
    null,
    2,
  ),
);
