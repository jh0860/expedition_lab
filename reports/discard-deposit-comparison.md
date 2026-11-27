# Hand and discard deposits: both Courier policies

Global rule: at base, deposit cards from hand or discard for 1 Movement each; draw-deck cards remain unavailable. Played cards enter discard immediately and may be deposited in the same turn without revoking their generated bonuses. Site rewards in discard can be deposited without first drawing them.

Both policies use the current contestable Camps and recruitment sites, 50-point target, default 19-flower map, and uniform 1-Movement tile exits. Each policy plays Builder, Delver, and Opportunist on seeds 1–5 with both seat orders, totaling 30 games per policy, 60 games overall. Limits remain 150 rounds / 15,000 actions. All players, including opponents, use the new deposit rule. All strategies play numeric effects before depositing when useful; no teleport is triggered just to cash out a card. No strategy weights were changed mid-run.

| Courier policy     | Wins | Losses | Unfinished | Completed-game median rounds |
| ------------------ | ---: | -----: | ---------: | ---------------------------: |
| courier            |    0 |     30 |          0 |                         38.0 |
| courierReplacement |    1 |     28 |          1 |                           40 |

| Opponent    | Aggressive wins / 10 | Replacement wins / 10 | Replacement unfinished |
| ----------- | -------------------: | --------------------: | ---------------------: |
| Builder     |                    0 |                     1 |                      0 |
| Delver      |                    0 |                     0 |                      0 |
| Opportunist |                    0 |                     0 |                      1 |

| Courier activity total (30 appearances per policy) | Aggressive | Replacements |
| -------------------------------------------------- | ---------: | -----------: |
| deposits                                           |        158 |          152 |
| depositValue                                       |        692 |          422 |
| combats                                            |         13 |          117 |
| defeats                                            |          0 |            0 |
| teleports                                          |          1 |           60 |
| claims                                             |          1 |           15 |

59/60 games finished; there were no execution errors. The old hand-only aggressive policy won 1/30, and the old hand-only replacement policy won 1/30 on the matching seed/opponent protocol. This global rule also changes opponents, and bot source-zone handling was updated, so the comparison does not isolate a benefit solely to Courier. Subsequent RNG consumption differs with decisions, despite matching initial seeds.

The revised deposit rule eliminates redraw waits for cards already in discard. It also permits use-and-cash-out turns, reducing the old tension between using a card now and depositing it now. Example: Hike supplies 2 Movement, then its deposit costs 1 Movement and adds 3 banked points; 1 Movement remains. Power/Health-card activity counts now include cards played at base before cashing them out, and should not be interpreted as combat preparation alone.

Courier remains weak against these particular opponents. The aggressive policy scores more through card deposits; the replacement policy retains more combat and teleport capability. Neither policy gained a clear relative advantage from discard access in this small sample. These are heuristic-bot results, not conclusions about optimal human play. No further tuning was performed.

Unfinished games:

- courierReplacement, seed 3, courierReplacement vs opportunist: scores [32, 37], final round counter 151.

Reproduce:

```sh
node scripts/compare-bots.js 5 courier
node scripts/compare-bots.js 5 courier courierReplacement
```

Raw results: `discard-deposit-comparison.json`. Earlier reports used hand-only deposits and remain historical snapshots.
