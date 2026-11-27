# Courier restored to aggressive deposits

Courier now uses its original deposit policy: retain one Hike, deposit surplus acquired cards including useful effect cards, keep at least 5 printed Movement unless scoring the winning deposit, and consider nonmovement starter deposits only within 5 points of victory. The home-wait fix remains. Builder, Delver, Opportunist, contested Camps and recruitment sites, full effective Health per fight, and uniform 1-Movement exits are unchanged from the v2 comparison.

Protocol: 50-point target, two players, default 19-flower map, seeds 1–5 against each other strategy, both seat orders, 150-round / 15,000-action limits. This reruns 30 Courier games rather than the other 30 games in the full round-robin. The comparison uses the matching 30 games from the previous v2 batch. Same initial seeds do not fix subsequent RNG consumption when actions change.

| Opponent    | Courier wins, restored | Previous wins | Restored losses | Unfinished |
| ----------- | ---------------------: | ------------: | --------------: | ---------: |
| Builder     |                      1 |             0 |               9 |          0 |
| Delver      |                      0 |             1 |              10 |          0 |
| Opportunist |                      0 |             0 |              10 |          0 |

Restored Courier: 1 wins, 29 losses, 0 unfinished. Completed 30/30, with 0 errors. Completed-game rounds: {'min': 25, 'median': 43.0, 'mean': 45.7, 'max': 65}.

| Courier activity (30 games) | Restored | Replacement policy |
| --------------------------- | -------: | -----------------: |
| deposits                    |      178 |                148 |
| depositValue                |      835 |                430 |
| combats                     |       16 |                 96 |
| defeats                     |        0 |                  0 |
| teleports                   |        0 |                 61 |
| claims                      |        4 |                  4 |

Activity totals are not normalized for game duration. This small matched-seed comparison tests the implemented bots, not optimal human play. No further tuning was made during the run.

Reproduce with `node scripts/compare-bots.js 5 courier`. Raw results: `courier-restored.json`.

## Interpretation

Restoring aggressive deposits did not improve Courier's overall wins in this sample: both policies won 1 of 30, against different opponents. Total deposited card value rose from 430 to 835, but fights fell from 96 to 16 and teleports from 61 to zero. Thus the deposit restriction alone does not explain Courier's weak results. Its lack of deliberate recruitment and market purchases, low Camp priority, early return thresholds, and conservative fight routing remain possible contributors. These were not changed or isolated in this run.
