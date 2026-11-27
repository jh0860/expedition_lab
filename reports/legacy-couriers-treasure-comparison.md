# Older Couriers with treasure liquidation

Exactly 10 four-player games and 50 duels. Current investment-phase Courier is excluded. Older aggressive Courier converts aggressively from the outset; replacement Courier converts treasure cards and cards covered by upgrades. Shared heuristics understand the new treasure effects, preserving full conversion value at base/under Banker, requiring enough carrying space for the entire payout, and preserving cards whose full value can win. Policies were not adjusted after seeing results.

Rules: 50 Standing, 19-flower map, 20 carried-treasure limit; Trinket destroys for 5 carried treasure or converts for 7 Standing; Relic destroys for 20 or converts for 25. Recruitment Sites grant Scout (+1 Energy); Training Camps grant Fighter (+1 Power/+1 Health). Camps no longer grant Energy. Finite six-card market and all-zone card conversion remain active.

## Scheduling

Five policies share the comparison. Multiplayer uses five four-seat lineups, omitting each policy once, followed by reversed-seat repeats on the same seeds (42–46). Each policy plays eight times, twice in every seat. Duels use all ten pairings on seeds 1 and 2 in both orders (40 games), then each pairing once on seed 3 with a balanced orientation (10 games). Each policy appears in 20 duels, ten starting first. Each pair has five games; its first seat is therefore split 3/2. Limits: 150 rounds, 30,000 multiplayer actions or 15,000 duel actions.

## Multiplayer

| Policy | Appearances | Wins | Losses | Unfinished | Mean final Standing |
| --- | ---: | ---: | ---: | ---: | ---: |
| Delver | 8 | 4 | 4 | 0 | 36.6 |
| Builder | 8 | 2 | 6 | 0 | 29.1 |
| Opportunist | 8 | 2 | 6 | 0 | 29.9 |
| Courier — aggressive (older) | 8 | 2 | 6 | 0 | 35.5 |
| Courier — replacements (older) | 8 | 0 | 8 | 0 | 23.1 |

Completed 10/10. Median completed-game length: 57.5 rounds. No execution errors, finite-market conservation failures, or Standing/Energy/treasure invariant failures.

| Policy | Trinkets played | Relics played | Carried treasure from cards | Trinkets converted | Relics converted | Market purchases | Standing from cards | Standing from treasure |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Delver | 4 | 0 | 20 | 0 | 3 | 20 | 160 | 133 |
| Builder | 15 | 0 | 75 | 2 | 1 | 14 | 114 | 119 |
| Opportunist | 7 | 0 | 35 | 4 | 1 | 17 | 154 | 85 |
| Courier — aggressive (older) | 6 | 0 | 30 | 1 | 2 | 4 | 250 | 34 |
| Courier — replacements (older) | 11 | 0 | 55 | 3 | 0 | 5 | 70 | 115 |

Standing totals cover all policy appearances, including losses. Treasure payout is measured when cards are played; it does not attribute subsequent spending or scoring to those same treasure units.

## One-versus-one

| Policy | Appearances | Wins | Losses | Unfinished | Mean final Standing |
| --- | ---: | ---: | ---: | ---: | ---: |
| Delver | 20 | 16 | 4 | 0 | 46.5 |
| Builder | 20 | 11 | 8 | 1 | 38.5 |
| Opportunist | 20 | 17 | 2 | 1 | 47.6 |
| Courier — aggressive (older) | 20 | 3 | 17 | 0 | 31.4 |
| Courier — replacements (older) | 20 | 2 | 18 | 0 | 27.2 |

Completed 49/50. Median completed-game length: 44 rounds. No execution errors, finite-market conservation failures, or Standing/Energy/treasure invariant failures.

| Policy | Trinkets played | Relics played | Carried treasure from cards | Trinkets converted | Relics converted | Market purchases | Standing from cards | Standing from treasure |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Delver | 11 | 0 | 55 | 4 | 5 | 103 | 307 | 624 |
| Builder | 20 | 0 | 100 | 12 | 2 | 68 | 352 | 419 |
| Opportunist | 7 | 0 | 35 | 17 | 5 | 76 | 493 | 460 |
| Courier — aggressive (older) | 26 | 0 | 130 | 2 | 1 | 17 | 447 | 180 |
| Courier — replacements (older) | 22 | 0 | 110 | 6 | 1 | 35 | 192 | 353 |

Standing totals cover all policy appearances, including losses. Treasure payout is measured when cards are played; it does not attribute subsequent spending or scoring to those same treasure units.

## Duel pairings

| Pair | Outcome |
| --- | --- |
| Builder / Courier — aggressive (older) | Builder: 5 |
| Builder / Courier — replacements (older) | Builder: 5 |
| Builder / Delver | Delver: 5 |
| Builder / Opportunist | Opportunist: 3, Unfinished: 1, Builder: 1 |
| Courier — aggressive (older) / Courier — replacements (older) | Courier — aggressive (older): 3, Courier — replacements (older): 2 |
| Courier — aggressive (older) / Delver | Delver: 5 |
| Courier — aggressive (older) / Opportunist | Opportunist: 5 |
| Courier — replacements (older) / Delver | Delver: 5 |
| Courier — replacements (older) / Opportunist | Opportunist: 5 |
| Delver / Opportunist | Delver: 1, Opportunist: 4 |

The unfinished duel was Builder versus Opportunist, seed 3, at 32–32 Standing when the round limit was reached. Neither Courier was involved.

## Interpretation

The liquidity option is exercised: aggressive Courier plays 26 Trinkets across 20 duels, generating 130 carried treasure; replacement plays 22, generating 110. Both first liquidate a Trinket as early as round 3. They still purchase only 17 and 35 market cards respectively, versus 68 Builder, 76 Opportunist, and 103 Delver purchases across equal duel appearances. Neither older Courier deliberately recruits normally, and the aggressive policy still converts most useful upgrades rather than building an engine. Generating spending currency alone does not remedy those policy choices. Both older Couriers also retain a return-home threshold of just 2 carried treasure and immediately convert treasure at base. A 5-treasure Trinket payout therefore activates their home-return preference rather than a dedicated investment plan.

Aggressive Courier wins 2/8 multiplayer appearances; replacement wins 0/8. In duels they win 3/20 and 2/20, all against one another: each loses all 15 matches against Builder, Delver, and Opportunist. This sample does not support the prediction that early treasure access alone makes the older policies competitive in duels. The multiplayer wins are a positive but small signal.

No Relic is played for carried treasure by any policy in either batch. The bots preserve full conversion value in several situations and the full 20 payout requires an empty carrying load. These results therefore test Trinket liquidity much more directly than Relic liquidity, and cannot establish that Relic’s cash-out choice is weak for a human. The bot heuristics also avoid reduced-value cash-out at base even when saving Energy could be useful.

This is not an isolated before/after experiment. Earlier reports use different schedules and the earlier Camp/recruitment mapping; no causal improvement estimate is claimed. Five games per duel pairing and eight multiplayer appearances per policy are diagnostics, not stable estimates of human strategy strength.

## Reproduce

```sh
node scripts/compare-legacy-couriers.js multiplayer 10
node scripts/compare-legacy-couriers.js duel 50
```

Raw schedules, scores and activity: `legacy-couriers-treasure-comparison.json`.
