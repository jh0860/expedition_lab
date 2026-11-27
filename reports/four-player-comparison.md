# Four-player strategy test

This is the first four-player comparison. Earlier comparisons were two-player matches. Each game contains Delver, Builder, Opportunist, and aggressive Courier; replacement Courier is excluded from this test.

Four games use seed 42 on the default 19-flower map and 50-point victory target. The policies rotate cyclically through seats so each starts in each seat once. This holds the map and initial setup by seat constant; subsequent hands, rewards and initiative may diverge as decisions consume RNG. Cyclic rotation does not test all 24 seat permutations or other map seeds. Limits are 150 rounds / 30,000 actions. All current rules apply, including six unique market consumables, end-of-turn restocking, contested sites, and deposits from any owned zone with draw-deck shuffling.

| Game | Seat order                               | Winner      | Rounds | Delver | Builder | Opportunist | Courier |
| ---- | ---------------------------------------- | ----------- | -----: | -----: | ------: | ----------: | ------: |
| 1    | delver / builder / opportunist / courier | builder     |     82 |     28 |      59 |          36 |      44 |
| 2    | builder / opportunist / courier / delver | opportunist |     62 |     32 |      13 |          52 |      34 |
| 3    | opportunist / courier / delver / builder | delver      |     51 |     55 |      40 |          31 |      34 |
| 4    | courier / delver / builder / opportunist | builder     |     56 |     32 |      54 |          10 |      38 |

All four games completed without execution errors or market-card conservation failures. Median length was 59 rounds. Scores may exceed 50 because a single card deposit or treasure-bank action transfers its full value.

| Strategy    | Wins | Mean final banked score | Market purchases | Fights | Defeats | Normal Camp takeovers | Normal recruitment takeovers |
| ----------- | ---: | ----------------------: | ---------------: | -----: | ------: | --------------------: | ---------------------------: |
| delver      |    1 |                   36.75 |               11 |     56 |       5 |                     5 |                            6 |
| builder     |    2 |                    41.5 |                3 |     30 |       0 |                    10 |                            6 |
| opportunist |    1 |                   32.25 |               10 |     37 |       7 |                    27 |                            9 |
| courier     |    0 |                    37.5 |                0 |      0 |       0 |                     2 |                            0 |

Takeover counts in this table refer to ordinary claim/recruit actions, excluding ownership gained through Seize Control. Per-card uses are recorded in the raw results. All 24 available market cards were purchased across the four games; stock was still only six cards per game despite four competitors.

Builder won twice, Delver once, and Opportunist once. Courier scored 34–44 but never purchased or fought. This is a limited diagnostic on one map, not evidence of a stable multiplayer ranking or human game balance. No strategy priorities were changed for this test. Replacement Courier remains supported for older comparisons/saves but was not entered in any of these games.

Reproduce with `node scripts/compare-four-player.js 42`. Full data: `four-player-comparison.json`.
