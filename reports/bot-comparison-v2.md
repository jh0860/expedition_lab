# Revised strategies and contested recruitment

Historical snapshot: Courier used the upgrade-replacement deposit policy in this batch. It was subsequently restored to aggressive depositing; see `courier-restored.md` for the matched rerun.

This run includes Courier upgrade-replacement deposits, the home-wait fix, restricted Opportunist Camp switching, and contested recruitment sites. A recruitment-site takeover costs 3 and removes the previous owner’s troop upgrade. No further strategy changes were made during the run. Persistent damage remains tabled; each fight uses full effective Health. Every exit costs 1 Movement.

Protocol: 50 banked treasure, default 19-flower map, two players, seeds 1–5 per pairing with both seat orders. Six pairs × five seeds × two orders = 60 games, limited to 150 rounds or 15,000 actions. Mirrored seeds share initial setup but subsequent RNG consumption depends on decisions. This is a small diagnostic sample, not an estimate of optimal human strategy balance.

Completed 59/60; 0 errors. Completed-game rounds: {'min': 29, 'median': 45, 'mean': 48.2, 'max': 127}. Seat wins: {2: 26, 1: 33}.

| Strategy    | Wins | Losses | Unfinished | Previous wins |
| ----------- | ---: | -----: | ---------: | ------------: |
| Courier     |    1 |     29 |          0 |             4 |
| Builder     |   20 |      9 |          1 |            23 |
| Delver      |   16 |     14 |          0 |            23 |
| Opportunist |   22 |      7 |          1 |             8 |

Each strategy appears in 30 games. The previous batch predates multiple behavior and rule changes, so this comparison cannot isolate a causal effect of contested recruitment.

| Pair                  | Results                                   |
| --------------------- | ----------------------------------------- |
| builder / courier     | builder: 10                               |
| courier / delver      | courier: 1, delver: 9                     |
| courier / opportunist | opportunist: 10                           |
| builder / delver      | delver: 3, builder: 7                     |
| builder / opportunist | unfinished: 1, opportunist: 6, builder: 3 |
| delver / opportunist  | opportunist: 6, delver: 4                 |

| Strategy    | Camp claims | Camp takeovers | Recruitment actions | Recruitment takeovers | Fights | Defeats | Deposits |
| ----------- | ----------: | -------------: | ------------------: | --------------------: | -----: | ------: | -------: |
| Courier     |           4 |              0 |                   0 |                     0 |     96 |       0 |      148 |
| Builder     |         102 |             28 |                  44 |                    11 |    288 |       0 |      164 |
| Delver      |          33 |              3 |                  47 |                    11 |    571 |      61 |       79 |
| Opportunist |         129 |             90 |                  58 |                    33 |    477 |     102 |      167 |

Activity counts are totals across 30 appearances, not rates normalized for game duration. Recruitment takeovers exclude claiming unowned sites and changing profile at an owned site.

Unfinished games:

- Seed 1, builder vs opportunist: scores [41, 35], 1608 actions, final round counter 151.

Reproduce with `node scripts/compare-bots.js 5`. Raw results: `bot-comparison-v2.json`. Historical baseline: `bot-comparison.md`.

## Interpretation

Opportunist's wins increased from 8 to 22, and its Camp claims fell from 635 to 129. It made 90 Camp takeovers and 33 recruitment-site takeovers. These counts show the revised bot is contesting ownership rather than repeatedly switching between unowned Camps. It still suffered 102 defeats across its 30 appearances, so the new win total does not imply efficient risk management.

Builder won 20 games and beat Delver 7–3. Opportunist won its Builder matchup 6–3 with one unfinished game, and its Delver matchup 6–4. These are small samples and multiple changes were introduced together.

Courier won 1 game versus 4 in the baseline. It fought 96 times versus 27 in the baseline with no defeats in either batch, while its total deposit value fell from 875 to 430. This is consistent with retaining more capability but scoring less through deposits. The figures are not normalized for duration and do not isolate which policy change caused the difference. A trace review is needed before changing its retention policy again.

The only unfinished game was seed 1 with Builder first and Opportunist second, ending at 41–35 after the 150-round limit. No tuning was performed after this run.
