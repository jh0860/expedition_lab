# Courier investment/conversion comparison

Current resources are Standing (secure victory progress), carried treasure and temporary Coin (spendable), and Energy (travel and card-conversion costs). The default Courier invests in reusable cards, Scout/Camp benefits and a purchasing wallet, then commits to aggressive conversion under its documented readiness/Standing triggers. Other policies are unchanged. Replacement Courier is excluded from every game in this report.

All games use the current finite six-card market, 50 Standing target, default 19-flower map, contested Camps and recruitment sites, and conversion from hand/discard/draw deck with draw-deck shuffling. All market cards are conserved after every action, Standing cannot decrease, and treasure/Energy cannot be negative. No strategy thresholds were tuned during these runs.

## Four-player: 10 games

Seeds 42, 43 and 44. Four seat rotations per full four-game block; the clockwise strategy order reverses in the second block. Each strategy appears ten times and occupies each seat two or three times. This is not a full permutation test. Limits: 150 rounds or 30,000 actions.

| Strategy    | Wins | Losses | Unfinished |
| ----------- | ---: | -----: | ---------: |
| Delver      |    5 |      5 |          0 |
| Builder     |    2 |      8 |          0 |
| Opportunist |    0 |     10 |          0 |
| Courier     |    3 |      7 |          0 |

Completed 10/10, no execution or conservation errors. Completed-game round statistics: {'min': 28, 'median': 43.5, 'mean': 49.6, 'max': 88}.

| Game | Seed | Winner  | Rounds | Delver Standing | Builder Standing | Opportunist Standing | Courier Standing |
| ---- | ---: | ------- | -----: | --------------: | ---------------: | -------------------: | ---------------: |
| 1    |   42 | delver  |     52 |              58 |               16 |                   26 |               13 |
| 2    |   42 | delver  |     72 |              63 |               32 |                   35 |                0 |
| 3    |   42 | courier |     58 |              29 |               42 |                   30 |               50 |
| 4    |   42 | delver  |     42 |              53 |               11 |                   17 |               31 |
| 5    |   43 | courier |     37 |              12 |               30 |                   41 |               50 |
| 6    |   43 | delver  |     34 |              51 |                0 |                   14 |               30 |
| 7    |   43 | courier |     28 |              35 |                0 |                   32 |               52 |
| 8    |   43 | builder |     40 |              29 |               51 |                   34 |               11 |
| 9    |   44 | delver  |     88 |              55 |               22 |                   25 |                0 |
| 10   |   44 | builder |     45 |              17 |               53 |                   18 |               30 |

## One-versus-one: 50 games

The request for a smaller singleplayer comparison is interpreted as the earlier two-player bot comparison, not solitaire. Four complete mirrored seed blocks (seeds 1–4) produce 48 games across all six pairings. Two complementary games on seed 5 produce exactly 50 games and exactly 25 appearances per strategy. Each policy starts first 12 or 13 times. The two extra games are not mirrored; Delver–Builder and Opportunist–Courier therefore have nine games each, while the other pairs have eight. Limits: 150 rounds or 15,000 actions.

| Strategy    | Games | Wins | Losses | Unfinished |
| ----------- | ----: | ---: | -----: | ---------: |
| Delver      |    25 |   17 |      8 |          0 |
| Builder     |    25 |   15 |     10 |          0 |
| Opportunist |    25 |   11 |     13 |          1 |
| Courier     |    25 |    6 |     18 |          1 |

Completed 49/50, no execution or conservation errors. Completed-game round statistics: {'min': 25, 'median': 46, 'mean': 52.9, 'max': 148}.

| Pair                  | Outcome counts                            |
| --------------------- | ----------------------------------------- |
| builder / delver      | delver: 4, builder: 5                     |
| courier / opportunist | opportunist: 6, courier: 2, unfinished: 1 |
| delver / opportunist  | delver: 7, opportunist: 1                 |
| builder / courier     | courier: 2, builder: 6                    |
| courier / delver      | delver: 6, courier: 2                     |
| builder / opportunist | opportunist: 4, builder: 4                |

## Courier activity and phase timing

| Format      | Appearances | Market purchases | Recruitment actions | Fights | Standing from cards | Standing from treasure | Median committed-phase round |
| ----------- | ----------: | ---------------: | ------------------: | -----: | ------------------: | ---------------------: | ---------------------------: |
| multiplayer |          10 |               17 |                   8 |     49 |                 251 |                     16 |                         35.5 |
| duel        |          25 |               73 |                  21 |    142 |                 631 |                     99 |                         38.5 |

Courier won 3/10 multiplayer and 6/25 one-versus-one appearances. Its market purchasing, recruitment and combat activity confirm that it now invests instead of immediately liquidating most upgrades. Those changes are encouraging diagnostics, not proof of balance or a controlled win-rate improvement over earlier, differently scheduled batches.

Timing remains a weakness. Courier committed in the final round of four multiplayer losses and ten duel losses. A final-round commitment does not prove that it took meaningful actions under the new phase; the trace stores state transitions, not full per-action phase attribution. In the sole unfinished duel, seed 4 Opportunist–Courier reached the round limit at 39–17 Standing and Courier remained in investment throughout. Its engine was not ready and neither Standing threshold forced an exit. No fallback or threshold adjustments were made after observing this result.

The samples remain limited: only ten multiplayer games across three map seeds, and eight/nine games per duel pairing. Four-player results also include blocking, shared scarce stock and multiple sources of ownership denial. These are heuristic-bot diagnostics rather than optimal human strategy rankings. Historical reports retain their original rules, terminology, and policy definitions.

Reproduce:

```sh
node scripts/compare-current.js multiplayer 10
node scripts/compare-current.js duel 50
```

Raw results, activity totals, seat orders and Courier phase transitions: `courier-phase-comparison.json`.
