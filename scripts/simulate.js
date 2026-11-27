import { createGame, applyAction, chooseBot } from "../src/game.js";
const count = Number(process.argv[2] || 10);
if (!Number.isInteger(count) || count < 1 || count > 10000)
  throw Error("Use a game count from 1 to 10000.");
// Optional comma-separated strategies, one per seat. No simulation runs on import.
const bots = process.argv[3]?.split(",");
const results = [];
for (let seed = 1; seed <= count; seed++) {
  let game = createGame({
    seed,
    ...(bots ? { players: bots.length, bots } : {}),
  });
  let actions = 0;
  while (game.winner === null && game.round <= 150 && actions < 15000) {
    game = applyAction(game, chooseBot(game));
    actions++;
  }
  results.push({
    seed,
    winner: game.winner === null ? null : game.winner + 1,
    rounds: game.round,
    actions,
    scores: game.players.map((p) => p.bank),
  });
}
console.log(
  JSON.stringify(
    {
      games: count,
      completed: results.filter((r) => r.winner !== null).length,
      results,
    },
    null,
    2,
  ),
);
