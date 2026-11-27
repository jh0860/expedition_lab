# First consumable-market strategy comparison

Rules: 50-point target; default 19-flower map; two players; full effective Health for every fight; 1 Movement for every exit; contestable Camps and recruitment sites; deposits from hand/discard/draw deck for 1 Movement each, with only the draw deck shuffled afterward. Banker allows remote card deposits with the same costs and free remote carried-treasure banking. All six market effects are implemented.

Market stock: one shared finite six-card deck, one copy of each unique consumable, two face-up slots. Purchases use Coin first, carried treasure second, and never banked score. Cards go to discard when bought, and are destroyed immediately when played. Vacant slots refill only at turn end, including before extra turns. Stock is not recycled.

Protocol: five policies, all ten pairings, seeds 1–5, both seat orders = 100 games. Each policy appears in 40 games. Limits: 150 rounds / 15,000 actions. Extra turns do not advance the round counter. All six market cards are checked for conservation after every action. No policy weights were changed during the run.

Completed 100/100; execution errors 0. Completed-game rounds: {'min': 27, 'median': 45.0, 'mean': 52.1, 'max': 148}. Seat wins: {1: 50, 2: 50}.

| Strategy           | Games | Wins | Losses | Unfinished |
| ------------------ | ----: | ---: | -----: | ---------: |
| courier            |    40 |    8 |     32 |          0 |
| courierReplacement |    40 |    4 |     36 |          0 |
| builder            |    40 |   29 |     11 |          0 |
| delver             |    40 |   31 |      9 |          0 |
| opportunist        |    40 |   28 |     12 |          0 |

| Pair                             | Results                           |
| -------------------------------- | --------------------------------- |
| courier / courierReplacement     | courier: 7, courierReplacement: 3 |
| builder / courier                | courier: 1, builder: 9            |
| courier / delver                 | delver: 10                        |
| courier / opportunist            | opportunist: 10                   |
| builder / courierReplacement     | builder: 10                       |
| courierReplacement / delver      | delver: 9, courierReplacement: 1  |
| courierReplacement / opportunist | opportunist: 10                   |
| builder / delver                 | builder: 5, delver: 5             |
| builder / opportunist            | opportunist: 5, builder: 5        |
| delver / opportunist             | delver: 7, opportunist: 3         |

## Market activity

| Strategy           | Bought | Used | Extra turns | Remote treasure banked | Remote card value deposited | Seize rival takeovers |
| ------------------ | -----: | ---: | ----------: | ---------------------: | --------------------------: | --------------------: |
| courier            |     24 |   24 |           2 |                      3 |                          19 |                     0 |
| courierReplacement |     69 |   68 |          10 |                     30 |                          33 |                     3 |
| builder            |    148 |  138 |          23 |                     48 |                         104 |                    10 |
| delver             |    175 |  169 |          25 |                    338 |                         161 |                     8 |
| opportunist        |    169 |  161 |          33 |                    124 |                         146 |                    12 |

| Card         | Purchases | Uses |
| ------------ | --------: | ---: |
| timeLord     |        94 |   93 |
| journey      |        98 |   98 |
| omnipotence  |        99 |   98 |
| strikeItRich |        96 |   96 |
| seizeControl |        98 |   80 |
| banker       |       100 |   95 |

Market stock totals: {'totalPurchases': 585, 'totalUses': 560, 'emptyAtGameEnd': 91, 'meanRemaining': 0.15}. A purchased card may remain unused when another player wins, so purchases and uses need not match.

## Comparable Courier subsets

Against only Builder, Delver, and Opportunist (30 games per Courier policy; excluding the new Courier-versus-Courier pairing):

- courier: 1 wins; outcome counts {'courier': 1, 'builder': 9, 'delver': 10, 'opportunist': 10}.
- courierReplacement: 1 wins; outcome counts {'builder': 10, 'delver': 9, 'courierReplacement': 1, 'opportunist': 10}.

The earlier all-zone/no-consumable market batch had aggressive Courier 2/30 and replacement Courier 0/30. Those earlier Couriers never deliberately bought cards, and opponents only used the Hike placeholder. Current bots plan market routes and have new consumable-use logic, while market setup/restocking/extra shuffles alter RNG consumption. These are not controlled estimates of the market rule in isolation.

The bots use provisional fixed priorities. All see the entire board. Single-use cards are reserved for effects except when depositing one immediately wins. Time Lord and Omnipotence are played when drawn; Strike It Rich waits for space for all 10 treasure; Banker uses treasure/deposit thresholds; Journey supplies needed Movement; Seize targets upgrades or rival denial. Results do not establish optimal human balance or causal rankings among individual cards. Activity counts are totals, not normalized for game duration.

Unfinished/error games:

- None.

Reproduce with `node scripts/compare-bots.js 5 all`. Full per-game activity, purchases and uses are in `consumable-market-comparison.json`.

## Interpretation

Delver won 31/40, Builder 29/40, and Opportunist 28/40. Builder–Delver and Builder–Opportunist each split 5–5; Delver beat Opportunist 7–3. This is a competitive leading group in this small sample, rather than evidence of one clearly dominant policy.

Aggressive Courier's 8/40 includes 7 wins against replacement Courier. Against the three non-Courier opponents it won only 1/30; replacement Courier also won 1/30 against those opponents, with its remaining three wins coming from the Courier pairing. These comparable subsets avoid overstating improvement from adding a new opponent.

Market engagement differed substantially. Aggressive Courier bought 24 cards across 40 appearances, replacement Courier 69, Builder 148, Delver 175, and Opportunist 169. These counts show that the market was considered and used, but the simple Courier policies still reached or funded far fewer purchases. They do not isolate whether buying more caused winning, since treasure generation, travel, timing and game length differ.

Banker enabled 543 carried treasure and 463 card value to be banked remotely across the 100 games. Time Lord produced 93 extra turns. These effects are functioning and meaningfully alter the action/scoring economy, but this batch does not establish whether the prices are balanced. The finite stock sold out in 91 games, which makes market access and purchase timing a major limitation of this first test.

All 100 games completed without execution errors, and all six market cards were conserved through stock, ownership, destruction, or unused deposits after every action. No weights or rules were changed after observing results.
