# Initial four-strategy comparison

Historical baseline: this batch predates the Courier upgrade-replacement policy, the home-wait routing fix, and the restriction on Opportunist switching between unowned Camps. Its win rates do not evaluate those revisions.

Persistent damage is tabled. These games use full effective Health for each fight, turn-long card buffs, and 1 Movement for every tile exit. No strategy weights were changed during this comparison.

Setup: 50 banked treasure to win; default 19-flower map; two players; seeds 1–5 for each pair, repeated with reversed seats. Six pairings × five seeds × two seat orders = 60 games. Limits: 150 rounds or 15,000 actions. Both seats use the same seed-generated board and initial shuffle in each mirrored pair, but different decisions change subsequent RNG consumption, so rewards and initiative are not held identical across runs.

Completed: 58/60. Errors: 0. Completed-game rounds: minimum 26, median 49.5, mean 53.1, maximum 141. Seat wins: {2: 28, 1: 30}.

| Strategy    | Games | Wins | Losses | Unfinished |
| ----------- | ----: | ---: | -----: | ---------: |
| Courier     |    30 |    4 |     24 |          2 |
| Builder     |    30 |   23 |      7 |          0 |
| Delver      |    30 |   23 |      7 |          0 |
| Opportunist |    30 |    8 |     20 |          2 |

| Pair                  | Results                                   |
| --------------------- | ----------------------------------------- |
| builder / courier     | builder: 10                               |
| courier / delver      | delver: 9, courier: 1                     |
| courier / opportunist | courier: 3, opportunist: 5, unfinished: 2 |
| builder / delver      | builder: 6, delver: 4                     |
| builder / opportunist | builder: 7, opportunist: 3                |
| delver / opportunist  | delver: 10                                |

## Observed activity totals

| Strategy    | Claims (takeovers) | Recruits | Purchases | Teleports | Fights (defeats) | Deposits | Power/Health cards played |
| ----------- | -----------------: | -------: | --------: | --------: | ---------------: | -------: | ------------------------: |
| Courier     |             35 (5) |        0 |         0 |         2 |           27 (0) |      197 |                      64/2 |
| Builder     |           103 (18) |       30 |        20 |       135 |          331 (0) |      162 |                   405/126 |
| Delver      |             25 (7) |       29 |        40 |        55 |         598 (48) |       89 |                    333/58 |
| Opportunist |          635 (116) |       28 |        13 |       288 |        458 (106) |       92 |                   870/135 |

These are totals across 30 appearances per strategy; game duration and opponent differ. They are diagnostic, not normalized efficiency scores. Results describe these particular heuristic bots and five seeds, not optimal human strategies or proven game balance. All bots see the full board. No previous Basic-bot result is directly comparable because strategy logic and the exit rule have changed. Raw per-game results are in bot-comparison.json.

Reproduce with `node scripts/compare-bots.js 5`.

## Initial interpretation

Builder and Delver each won 23 of 30 appearances. Their direct matchup was 6–4 for Builder, too small a sample to establish an advantage. Builder's upgrades and retained cards are associated with more successful expedition play; Delver had more fights and its Fighter/Mine emphasis produced faster wins in this sample. These are strategy packages, so this experiment does not isolate the effect of any individual upgrade.

Opportunist made 635 Camp claims, including 116 takeovers, across 30 games. Its high Camp destination weight appears to encourage excessive switching among unowned Camps as well as contesting rivals. It also suffered 106 defeats. That combination is a bot-tuning concern, not evidence that Camp interaction itself is weak.

Courier won 4 games and never recruited or bought cards. Its early deposits preserve less long-term capability. Both unfinished games were Courier–Opportunist matches: seed 2 with Opportunist first ended 25–42, and seed 5 with Courier first ended 44–30. Both Couriers visited nine resource sites; their opponents visited seven and made 64 and 56 Camp claims, respectively. The results suggest weak fallback plans and distraction by Camp switching.

No strategy changes were made in response to this batch. Recommended next investigations are an improvement threshold before switching Camps and stronger progression/fallback plans for Courier. Persistent damage remains tabled.
