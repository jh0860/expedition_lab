# Unified treasure economy: 10 multiplayer games and 50 duels

Barter, Alchemy, and Precious Cache now generate 1, 2, and 5 carried treasure respectively. The cards remain reusable. No separate Coin pool remains. Purchases and site fees spend carried treasure; Standing is never spendable. Carry limit remains 20; overflow is lost. Treasure persists across turns, is lost on defeat, and converts to Standing for free at base or under Banker. Card conversion costs 1 Energy and retains the old card values. Scout/Fighter ownership rules, 50-Standing goal, finite six-card market, and 19-flower map are unchanged.

## Protocol

Same schedules as `legacy-couriers-treasure-comparison.json`: 10 four-player games across seeds 42–46, five omitted-policy lineups and reversed-seat repeats; eight appearances per policy, twice in every seat. Fifty duels cover all ten pairs five times: seeds 1 and 2 mirrored plus one balanced orientation on seed 3. Each policy plays 20 duels, ten starting first. Current phased Courier is excluded; the two older policies use the merged resource rules and updated income handling. Limits: 150 rounds, 30,000 multiplayer actions or 15,000 duel actions. No policies were adjusted after observing results.

Bots now play recurring income for carried treasure, use carried treasure exclusively for affordability, compare reusable income when evaluating replacements, and exclude destroy-on-play treasure cards from recurring-income upgrades and engine readiness. Those necessary adaptations accompany the rules change; this is a comparison of the implemented systems, not a pure human-strategy experiment.

## Multiplayer

| Strategy | Appearances | Previous wins | New wins | Losses | Mean final Standing |
| --- | ---: | ---: | ---: | ---: | ---: |
| Delver | 8 | 4 | 4 | 4 | 41.8 |
| Builder | 8 | 2 | 2 | 6 | 35.1 |
| Opportunist | 8 | 2 | 2 | 6 | 37.8 |
| Older aggressive Courier | 8 | 2 | 2 | 6 | 41.4 |
| Older replacement Courier | 8 | 0 | 0 | 8 | 37.1 |

All 10 games finished. Median length: 25.5 rounds, versus 57.5 among completed baseline games. No execution errors, market conservation failures, or negative-resource/Standing/carry invariant failures.

| Strategy | Income generated | Income generated at base | Market purchases | Standing from cards | Standing from treasure | Travel actions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Delver | 299 | 26 | 22 | 20 | 314 | 574 |
| Builder | 337 | 32 | 14 | 31 | 250 | 629 |
| Opportunist | 335 | 23 | 15 | 25 | 277 | 573 |
| Older aggressive Courier | 279 | 52 | 7 | 65 | 266 | 527 |
| Older replacement Courier | 288 | 51 | 2 | 23 | 274 | 510 |

Income counts actual treasure gained after carrying-capacity limits from the three reusable income cards. It excludes Trinket, Relic, Strike It Rich, and combat loot. Location is measured when the income card is played; it does not establish where that treasure was later spent or converted. Travel actions count edge movement, tile entry, and exit, excluding teleportation.

## Duels

| Strategy | Appearances | Previous wins | New wins | Losses | Mean final Standing |
| --- | ---: | ---: | ---: | ---: | ---: |
| Delver | 20 | 16 | 16 | 4 | 50.0 |
| Builder | 20 | 11 | 13 | 7 | 45.6 |
| Opportunist | 20 | 17 | 12 | 8 | 44.4 |
| Older aggressive Courier | 20 | 3 | 6 | 14 | 41.2 |
| Older replacement Courier | 20 | 2 | 3 | 17 | 37.2 |

All 50 games finished. Median length: 25 rounds, versus 44 among completed baseline games. No execution errors, market conservation failures, or negative-resource/Standing/carry invariant failures.

| Strategy | Income generated | Income generated at base | Market purchases | Standing from cards | Standing from treasure | Travel actions |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Delver | 693 | 39 | 88 | 136 | 864 | 1478 |
| Builder | 763 | 60 | 78 | 171 | 742 | 1686 |
| Opportunist | 755 | 66 | 72 | 157 | 730 | 1622 |
| Older aggressive Courier | 727 | 125 | 29 | 149 | 675 | 1442 |
| Older replacement Courier | 745 | 118 | 25 | 42 | 703 | 1329 |

Income counts actual treasure gained after carrying-capacity limits from the three reusable income cards. It excludes Trinket, Relic, Strike It Rich, and combat loot. Location is measured when the income card is played; it does not establish where that treasure was later spent or converted. Travel actions count edge movement, tile entry, and exit, excluding teleportation.

## Duel pairings

| Pair | Results |
| --- | --- |
| Builder / Older aggressive Courier | Builder: 4, Older aggressive Courier: 1 |
| Builder / Older replacement Courier | Builder: 5 |
| Builder / Delver | Delver: 4, Builder: 1 |
| Builder / Opportunist | Builder: 3, Opportunist: 2 |
| Older aggressive Courier / Older replacement Courier | Older replacement Courier: 2, Older aggressive Courier: 3 |
| Older aggressive Courier / Delver | Delver: 5 |
| Older aggressive Courier / Opportunist | Opportunist: 3, Older aggressive Courier: 2 |
| Older replacement Courier / Delver | Delver: 5 |
| Older replacement Courier / Opportunist | Opportunist: 4, Older replacement Courier: 1 |
| Delver / Opportunist | Delver: 2, Opportunist: 3 |

## Findings

Aggressive Courier improves from 3/20 to 6/20 duel wins; its wins outside the Courier mirror go from zero to three (one against Builder and two against Opportunist). Replacement Courier improves from 2/20 to 3/20, earning one win against Opportunist outside the mirror. Both still lose all five duels against Delver. Multiplayer win totals remain exactly the same: Delver four, Builder two, Opportunist two, aggressive Courier two, replacement Courier zero. This sample supports a modest improvement for the older Couriers, not parity with the other policies.

The scoring mix changes sharply. Aggressive Courier receives 675 duel Standing from treasure conversion and 149 from card conversion, versus 180 and 447 previously. Replacement receives 703 and 42, versus 353 and 192 previously. Treasure totals also include combat and consumable income, so they are not attributed solely to the three income cards.

The economy accelerates the entire game: multiplayer median falls from 57.5 to 25.5 rounds; completed-duel median falls from 44 to 25. All 50 duels now finish; the baseline had one unfinished Builder–Opportunist duel.

Base-only income does not dominate these bots: across duels, 408 of 3,683 reusable-income treasure (11.1%) is generated at base. Aggressive Courier generates 125/727 (17.2%) there; replacement generates 118/745 (15.8%). All policies still make substantial travel actions. This does not test an explicitly designed stay-at-base income strategy and cannot rule out such a strategy being strong for a human.

The 50-Standing target may now produce a shorter development window for permanent upgrades and market effects. Next useful tests would compare an explicit home-income policy or a higher Standing target; neither change was applied here.

These are small, deterministic heuristic-bot samples with only three duel seeds and five multiplayer seeds. The matched schedules aid comparison but do not isolate every strategic consequence, since decisions change RNG consumption and shared competition. Raw results preserve all activity and scores.

## Reproduce

```sh
node scripts/compare-treasure-economy.js multiplayer 10
node scripts/compare-treasure-economy.js duel 50
```
