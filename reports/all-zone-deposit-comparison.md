# Deposit from any owned card zone: simulation comparison

Protocol: two separate 30-game batches, one per Courier policy, each against Builder, Delver, and Opportunist. Five seeds per opponent, repeated with seats swapped. Default 19-flower map; 50 banked treasure to win; limits of 150 rounds and 15,000 actions. All players can deposit from hand, discard, or draw deck at base for 1 Movement per card. Only the selected card is removed; the remaining draw deck is shuffled after every deposit. Other hand and discard cards stay in place. Both Courier policies and opponents are otherwise unchanged from the preceding discard-deposit batch.

Played cards can still be deposited and generated bonuses remain. Numeric-effect cards may be played before banking; teleports are not triggered solely to cash out. Persistent damage remains tabled, and every tile exit costs 1 Movement.

| Courier policy | Wins | Losses | Unfinished | Previous hand/discard wins | Completed-game median rounds |
| --- | ---: | ---: | ---: | ---: | ---: |
| courier | 2 | 28 | 0 | 0 | 37.5 |
| courierReplacement | 0 | 29 | 1 | 1 | 40 |

| Opponent | Aggressive wins / 10 | Replacement wins / 10 | Aggressive unfinished | Replacement unfinished |
| --- | ---: | ---: | ---: | ---: |
| Builder | 0 | 0 | 0 | 0 |
| Delver | 2 | 0 | 0 | 0 |
| Opportunist | 0 | 0 | 0 | 1 |

| Courier activity total (30 appearances) | Aggressive | Replacements |
| --- | ---: | ---: |
| deposits | 170 | 154 |
| depositValue | 814 | 392 |
| combats | 11 | 99 |
| defeats | 0 | 0 |
| teleports | 0 | 27 |
| claims | 1 | 29 |

Completed 59/60 games; 0 execution errors. Activity totals are not normalized for duration. Game rounds are not human play-time estimates.

Both source-zone access and the post-deposit shuffle changed relative to the previous batch. Every strategy benefits from the new rule. Matching initial seeds controls initial setup, but different actions and extra shuffles change subsequent RNG consumption, so site rewards, future hands, and initiative are not paired identically. These are small heuristic-bot samples, not an estimate of optimal human strategy balance. No strategy weights were tuned during the run.

Unfinished games:
- courierReplacement, seed 3, courierReplacement vs opportunist, scores [29, 42], round counter 151, actions 1659; error: None.

Reproduce:

```sh
node scripts/compare-bots.js 5 courier
node scripts/compare-bots.js 5 courier courierReplacement
```

Raw results: `all-zone-deposit-comparison.json`. Previous hand/discard-only batch: `discard-deposit-comparison.md`.

## Interpretation

Aggressive Courier improved from 0/30 wins in the previous hand/discard-only batch to 2/30, both against Delver. Replacement Courier changed from 1 win, 28 losses, and 1 unfinished to 0 wins, 29 losses, and 1 unfinished. These small samples do not establish a meaningful win-rate difference. Across the two current batches, Builder won all 20 of its appearances, and Opportunist won 19 with one unfinished game.

Aggressive Courier deposited 814 card value across its 30 appearances versus 692 previously; replacement Courier deposited 392 versus 422 previously. There is no strong evidence here that removing draw-deck timing restrictions solves Courier's performance gap. Its travel thresholds, retention decisions, and lack of deliberate recruitment or buying remain possible contributors that were not isolated in this run.
