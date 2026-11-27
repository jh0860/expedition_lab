# Working prototype decisions

## Terminology

**Standing** is abstract victory progress. Reach 50 Standing to win. Standing is secure, survives defeat, and cannot be spent. **Treasure** is carried currency that can be spent alongside Coin or lost on defeat. **Convert treasure** transfers all carried treasure to Standing for free at base. **Convert a card** permanently removes one owned card from hand, discard, or draw deck and gains its conversion value in Standing for 1 Energy. Only the remaining draw deck is shuffled; other hand/discard cards stay in place. Banker permits both kinds of conversion remotely for the current turn, with their normal costs.

**Energy** replaces Movement as the turn resource used for travel and card conversion. Moving an edge, entering a tile, exiting a tile, or converting a card each costs 1 Energy. There is no default Energy grant; cards and troop/Camp bonuses provide it. Coin remains a separate temporary purchasing resource. The renamed terms do not change these action costs or the 50-point target.

## Implemented baseline

One troop per player. Five cards in hand. Standard troops begin each turn with zero Energy. Cards generate Energy, pooled for the turn. Moving along an edge, entering a tile, exiting a tile, and converting one card at base each cost 1 Energy. Unspent Energy expires at turn end. Mountains are impassable and edges between two mountain/hazard tiles are blocked. Town has unrestricted occupancy. Other vertices hold one troop.

Resource sites grant one card per player into the discard pile. Cards can be played from hand or permanently converted from hand, discard, or draw deck at home. Inventory travels with the troop. Standing is secure. Defeat returns the same troop home, removes carried treasure, preserves its upgrade and deck, and ends the turn with normal hand cleanup.

Cleared hazards stay cleared globally and no longer trigger combat. Every tile exit costs 1 Energy, including cleared forests; there are no free exits or once-per-turn trail benefits to track. Cleared terrain still blocks the same edges.

Training Camps grant +1 Energy while owned. First claim is free after entering. Taking an owned Camp costs 2 paid to the supply, using Coin first and carried treasure for any remainder. Each player owns at most one. Ownership survives defeat. Switching Camps cannot repeatedly generate extra Energy in one turn.

Unique troops replace the active profile. Scout gives +1 Energy. Fighter gives +1 Power and +1 Health. Camp ownership is a separate benefit.

## Provisional implementation choices

The default test map has 19 flowers (133 hexes) and the full map has 37. The former seven-flower size remains supported by the engine for older saves. Geometry follows the uploaded HTML's offset basis (-3,1) and (-2,3). Wilderness content distribution is simplified and uses repeated Forage, Camp, Recruit, Guild and Mine flowers rather than the design document's 25-flower draw pool. Mines in the small map permit frontier testing without long journeys.

The current victory target is 50 Standing. Twenty card definitions are provided: fourteen starter/exploration cards and six single-use market cards (see rosters below). The starting deck is five Wander, two Strike, and three Barter. The shared market offers two consumables from a finite six-card deck, one copy of each unique market card. Recruitment costs 3 and allows Scout/Fighter selection. Coin pays costs first, then carried treasure covers any remainder. These prices and selection rules are scaffolding.

Camp upgrades affect the current turn on first acquisition and future turns while held. Recruit Energy changes affect remaining actions immediately. Encounter monsters have Speed 2 like troops, so a seeded coin flip determines initiative. Dark encounters use 1 Power/3 Health and award 2 treasure. Black encounters use 3 Power/6 Health and award 5. Played Power and Health last through the turn. Loot beyond capacity is discarded in this prototype. Treasure lost on defeat is removed.

## Next implementation work

Starting draft and Key Cards, finite resource decks and trailblazer top-three selection, equipment and non-treasure items, Bounties, dropped loot, richer troop rosters, and more capable bots remain to implement. There is no claim that these placeholder cards or bots establish balance. Full-board travel and deadlocks need broader playtesting.

## Tabled design systems

Multiple troops, roaming monsters, raiding and defenses, Cave/Chest/Artifact, Clock and day/night events, fog of war, and the proposed rival-progress commission bonus.

## Combat preparation window

An uncleared hazard reveals its encounter before initiative is rolled. The player may play any number of cards other than Arcane Passage and Seize Control from hand, then chooses Resolve combat. The fight then resolves automatically. Travel, exit, conversions, purchases, and ending the turn are unavailable during preparation. Escape cannot dismiss the dialog. Power and Health remain active for the turn after victory. Arcane Passage is unavailable during combat preparation; it cannot bypass a pending encounter. There is no mid-attack response window in this implementation.

## Unified Energy update

Focus has been merged into Energy. Scout and owned Training Camps each grant +1 Energy per turn. Camp acquisition retains its immediate once-per-turn bonus, and changing troops adjusts the remaining allowance without letting it fall below zero. Treasure conversion and market interactions cost no Energy. There is no discard-for-an-action fallback.

## Current card roster

| Name              | Effect when played             | Conversion value | Acquisition        |
| ----------------- | ------------------------------ | ---------------: | ------------------ |
| Wander            | +1 Energy                      |                1 | 5 in starting deck |
| Strike            | +1 Power                       |                1 | 2 in starting deck |
| Barter            | +1 Coin                        |                1 | 3 in starting deck |
| Hike              | +2 Energy                      |                3 | Foraging sites     |
| Supply Cache      | +2 Health                      |                3 | Foraging sites     |
| Wild Might        | +2 Power                       |                3 | Foraging sites     |
| Trinket           | None                           |                7 | Foraging sites     |
| Arcane Passage    | Move troop to any Guild        |                5 | Guilds             |
| Healer            | +5 Health                      |                5 | Guilds             |
| Magical Imbuement | +3 Energy, +1 Power            |                5 | Guilds             |
| Alchemy           | +2 Coin                        |                5 | Guilds             |
| Precious Cache    | +5 Coin                        |               10 | Mines              |
| Relic             | None                           |               25 | Mines              |
| Ancient Blessing  | +5 Power, +5 Health, +5 Energy |               10 | Mines              |

The starting deck has 10 cards. Draw up to five at turn cleanup, shuffling the discard pile when needed; Omnipotence is the only additional draw effect and draws three cards. Unplayed cards are discarded at cleanup. Nonconsumable cards played go into discard immediately; market consumables are destroyed on play. Every listed card can be permanently converted from hand, discard, or draw deck at the player's base for its conversion value, spending 1 Energy per card. Only the selected card is removed; other hand and discard cards remain in their zones. Shuffle the remaining draw deck after every card conversion, regardless of source. A nonconsumable card may be played and then converted in the same turn because it enters discard immediately; generated bonuses remain until normal turn end. A used market card is destroyed, so it cannot also be converted. None-effect cards can be played for no benefit or kept for conversion.

Resource sites award one uniformly random card from their respective pool, once per site per player, into discard. Rewards use the seeded game RNG, and pools are currently unlimited. The old Marketplace Hike purchase has been replaced by the finite consumable market.

Energy, Power, Health, and Coin generated by cards last only for the current turn. Health adds to the troop's combat Health for every fight that turn; it does not create persistent wounds or permanent upgrades. Coin pays for marketplace purchases, recruitment, and Camp takeovers before carried treasure pays any shortfall. Coin cannot be converted to Standing, does not count toward carrying capacity, and expires at turn end (including defeat).

Arcane Passage selects any Guild tile center from anywhere outside combat, with no Energy cost. Arriving grants the usual first-visit Guild reward, into discard. Revisiting grants no additional card. Teleporting to the current Guild is permitted. Leaving the destination still costs 1 Energy. It is unavailable during combat preparation.

The victory target is 50 Standing. A Relic converts for 25 Standing, half the target. Existing saves keep the victory target recorded when they were created; start a new game to use 50.

## Saves

Save format v4 records the finite market, destroyed cards, queued extra turns, and remote conversion permission, alongside the existing roster and turn pools. Loading v1–v3 saves adds a fresh market when absent and initializes the new fields; existing market states are preserved. Loading v1 first merges remaining Energy and Focus for the unfinished turn and removes future baseline allowances. Loading v1/v2 maps legacy cards as follows: Stride → Hike; Prepare → Wander; Woodland Lore → Hike; Arcane passage → the new Arcane Passage; Deep silver → Precious Cache; Strike retains its identity with its new values. Existing deck sizes are preserved rather than replaced with the new starter. New turns reset all temporary bonuses. Start a new game for the exact new starter deck.

## Combat stats and benefit duration

Standard has 1 Power and 2 Health. Scout keeps those combat stats and grants +1 Energy each turn. Fighter has 2 Power and 3 Health. Recruitment replaces the profile for 3 Coin/treasure; profiles do not stack. The selected profile survives defeat but is lost if another player takes its recruitment site.

Power is damage per attack. Health determines how many enemy attacks the troop can survive. Played Power and Health add to the profile, stack, and last until turn end. They are not spent by fighting. There is no persistent damage tracker: each encounter uses full profile Health plus the current turn's Health bonus. Even a card named Healer therefore grants a temporary combat Health bonus, rather than healing a tracked wound. Played cards enter discard immediately, and can supply their effect again only after being drawn and played again. converting a card instead permanently removes it and gives no play effect.

Current combat buffs are Strike (+1 Power), Wild Might (+2 Power), Magical Imbuement (+1 Power and +3 Energy), Supply Cache (+2 Health), Healer (+5 Health), and Ancient Blessing (+5 Power, +5 Health, +5 Energy). There are no permanent stat buffs from cards or equipment.

Entering an uncleared Dark or Black Forest starts the preparation window. Dark guardians have 1 Power / 3 Health and reward 2 carried treasure; Black guardians have 3 Power / 6 Health and reward 5. All current troops and guardians have Speed 2; initiative is a seeded 50/50 roll. After preparation, attacks alternate until one side falls. The engine calculates this directly: attacks needed = ceil(enemy Health / troop Power); hits until defeat = ceil(troop Health / enemy Power). Fewer required attacks guarantees victory; equal counts means the first attacker wins. There are no responses between attacks or retreat option. Other world actions are locked during preparation; Arcane Passage cannot escape a pending encounter.

Victory clears that tile globally and leaves the troop on the tile with full combat Health and all turn bonuses intact. Treasure obeys the 20 carry limit. Defeat returns the same troop to base, removes all carried treasure, preserves Standing, deck, troop profile and Camp ownership, then ends the turn and removes temporary bonuses.

Camps grant +1 Energy per turn, with no Power or Health. Claiming requires entering the Camp tile; the first claim is free, taking another player's Camp costs 2 (Coin first, then carried treasure), and the previous owner gets no payment. Each player holds at most one Camp. A newly acquired Camp grants its Energy immediately if that player's turn has not already received a Camp bonus. Switching Camps cannot farm extra Energy. Camp ownership survives defeat but can be taken by another player.

Cleared forests remain cleared for the game and do not trigger another fight. They have no owner, combat stat bonus, or Energy discount. Every exit costs 1 Energy, as with all other tiles, and clearing does not remove blocked edges. There is no immediate mandatory exit or per-turn trail allowance. Old saves drop the obsolete pending free-exit and trail-use flags when loaded.

Persistent damage between fights and turns is tabled for future design work. Possible future rules include current/maximum Health, free full healing at base, and healing cards restoring Health up to the maximum; troop Health, enemy damage, and healing amounts would need coordinated recalibration. None of these proposals is implemented. Current Health buffs remain temporary and each fight starts at full effective Health.

## Bot policy revision

Courier now invests before converting aggressively. It retains up to two Hikes and Magical Imbuements, and one each of Ancient Blessing, Alchemy, Precious Cache, Wild Might, Supply Cache, Healer, and Arcane Passage. It still converts no-effect cards and excess copies while investing. It deliberately seeks Scout recruitment, a first Camp, safe fights for treasure, and market support. Spendable carried treasure is retained during investment rather than automatically converted at base, except to win or when the carrying limit is full. Its initial home thresholds are 7 eligible conversion value or 8 carried treasure, rather than the former 3/2.

The plan commits permanently to its conversion phase when any of these is true: (1) the deck has at least 8 reusable printed Energy and 5 recurring printed Coin across hand/deck/discard, plus an upgraded troop or owned Camp; (2) Standing reaches 60% of the target; (3) a rival reaches 80%; (4) carried treasure or one owned card could supply the remaining Standing needed to win. Single-use market cards do not satisfy the reusable resource thresholds. At the default 50 target, the Standing thresholds are 30 and 40. This is a provisional heuristic, not a proven optimal timing rule.

Once committed, Courier uses its former aggressive conversion priorities: retain one Hike, convert surplus exploration cards, preserve at least 5 printed Energy unless one conversion finishes the game, and consider non-Energy starter cards within 5 Standing of victory. It again converts carried treasure promptly and uses the short-trip 3/2 thresholds. Phase commitment survives lost upgrades and save/load, preventing oscillation as cards are converted. The interface shows the active Courier plan. Replacement Courier is a separate legacy comparison policy and does not use this two-phase plan.

Opportunist takes an unowned Camp only when it has none; with a Camp already held it targets only rival-owned Camps. This is a bot decision rule: human players may still switch between unowned Camps under the existing game rules. Recruit sites now have separate ownership and grant Scout/Fighter profiles while held. Their acquisition and takeover price is 3.

## Contested recruitment sites

Entering a recruitment tile allows paying 3 to claim it and choose Scout or Fighter. This applies to unowned sites and rival-owned sites, with Coin used first and carried treasure covering any remainder. There is no additional Camp takeover fee. The owner marker is displayed on the tile. Taking a rival's site removes their recruitment ownership and returns their troop to Standard immediately. Each player may own one recruitment site and one Training Camp independently; claiming another recruitment site releases the previous recruitment site, but preserves their Camp. Replacing a profile at one's own site also costs 3. Switching between two Scout sites does not grant another Energy point. Ownership and the upgrade survive defeat. The troop bonus lasts only while its recruitment site remains owned.

Opportunist applies the same destination rule to both types: acquire an unowned site when it has none of that type; once it owns one, target only rival-owned replacement sites. Builder and Delver acquire their first recruitment site but do not deliberately seek replacement sites while holding one. Courier now deliberately recruits Scout during its investment phase. These restrictions describe bot choices; human players may switch sites freely when they pay the cost.

Older saves keep their existing troop profile and initialize recruitment ownership to none. Those legacy upgrades are not attached to a contestable site until the player recruits under the new rules. New games use site-backed upgrades from the start.

## conversions from all owned card zones: two Courier policies

The all-zone conversion rule applies to every player and strategy. Conversion actions identify the source zone and remove that exact card copy; legacy hand-conversion action shapes remain valid. After every card conversion, shuffle only the remaining draw deck. Other hand and discard cards stay in place, and the hand is not refilled. Costs, base-only access, combat restrictions, and immediate victory checks are unchanged. Playing and converting the same card is allowed, and already-generated Energy, Power, Health, or Coin is not revoked by the conversion. Newly acquired site rewards are also eligible immediately once the troop reaches base with Energy to convert them.

The toolbar exposes Courier (aggressive) and Courier — replacements. The latter preserves useful cards until stronger copies justify their removal; two Hikes cover two Wander removals across turns and saves. Strict numeric improvements preserve every weaker-card effect; teleport cards are not numeric substitutes. A multi-effect upgrade covers one replacement, with transitive upgrade chains permitted. Both policies preserve a minimum of 5 printed Energy, except the aggressive policy may bypass that floor for a winning convert. Replacement history is recorded only for the replacement policy. Both can visit markets and use consumables. The revised default Courier also recruits during its investment phase; replacement Courier retains its earlier recruitment policy. Both keep the home-wait fix. Other strategies also use the new source zones and play numeric effects before converting when useful.

Deck-convert choices are shown alphabetically in the interface so the newly shuffled draw order is not revealed. Selecting an unplayed card for convert does not activate its effect; playing effects still requires a card in hand. Both Courier policies can use Energy from hand to fund conversions from any zone. If Energy cannot be generated or no eligible cards remain under their policy, they may end their turn. Existing saves use this rule immediately when loaded. Reports before `all-zone-convert-comparison.md` predate draw-deck access and the after-convert shuffle. The current matched 60-game rerun completed 59 games without errors: aggressive Courier won 2/30; replacement Courier won 0/30 with one unfinished game.

## Banker — implemented market card

Purchase cost: 3 Coin/carried treasure. Unused conversion value: 3 Standing. Single use: destroy means remove from the game, like exile; it does not enter discard after play.

Effect: **This turn, you may convert carried treasure and convert cards without being at your base. converting carried treasure is free. Each card conversioned from your hand, discard pile, or draw deck still costs 1 Energy. Destroy this card.**

Remote treasure conversion transfers all currently carried treasure into permanent Standing, exactly like treasure conversion at base. It does not consume Energy or shuffle the draw deck. Remote card conversions follow the normal removal and draw-deck shuffle rules. Banker's permission lasts through the current turn, so treasure acquired later that turn can also be converted to Standing remotely. It does not grant permission to use world actions during combat preparation. The destroyed Banker cannot itself be converted after use. Banker keeps its card name; its effect uses conversion terminology. Banker and all six market cards are implemented. The Marketplace no longer sells Hike.

## Consumable market — implemented

One shared market has two fixed offer slots. Its draw pile contains one copy of each of the six market cards. Shuffle and fill both slots at game setup. A player on a vertex bordering a Marketplace may buy either visible card for its listed cost, using turn Coin first and carried treasure for any remainder. Standing is never spendable. Buying costs no Energy and places the purchased card in discard. The purchased slot stays empty for the rest of that turn; fill empty slots only at turn end, after hand cleanup/drawing and before the next turn (including an extra turn). There are no recycled or replenished copies after the six-card stock runs out.

| Card           | Purchase cost | Effect                                                              | Unused conversion value |
| -------------- | ------------: | ------------------------------------------------------------------- | ----------------------: |
| Time Lord      |             4 | Queue an extra turn after this turn ends                            |                       4 |
| Journey        |             3 | +5 Energy                                                           |                       3 |
| Omnipotence    |             3 | Draw three cards                                                    |                       3 |
| Strike It Rich |             5 | Gain 10 carried treasure, subject to the 20 carry limit             |                       5 |
| Seize Control  |             4 | Take any recruitment site or Training Camp                          |                       4 |
| Banker         |             3 | This turn, convert carried treasure and convert cards from anywhere |                       3 |

Every market card is single use: destroy it immediately when played, before resolving its effect, and record it separately from discard. Destroyed cards never return to the market or a player's deck and cannot be converted after use. Unused market cards can be converted normally for their listed values, with no play effect; this permanently removes them from market circulation. Playing Omnipotence removes itself from hand, then draws up to three cards available from deck/discard, giving a usual net gain of two cards. Draw effects can exceed the normal five-card hand size.

Time Lord's extra turn is queued for its owner and happens immediately after the current turn ends, including a turn ended by defeat. Cleanup discards the remaining hand and draws a normal five-card hand, the market restocks, and the same player begins a fresh turn. All temporary pools and Banker permission reset; Scout/Camp Energy is granted normally. Initiative, wounds, and treasure loss on defeat are unchanged. The round counter advances only on normal rotation from the last seat to the first, not for extra turns.

Seize Control targets a site without moving the troop or paying the ordinary takeover/recruitment price. Camp acquisition applies the usual one-Camp limit and immediate once-per-turn Energy bonus. Recruitment acquisition applies the usual one-recruitment-site limit and lets the new owner choose Scout or Fighter; the previous owner returns to Standard. The player relinquishes their previous site of the same type. Owned sites cannot be targeted merely to reacquire their bonus. Arcane Passage and Seize Control are unavailable during combat preparation; the other consumables may be played, but world actions stay locked until combat resolves. treasure conversion and conversions under Banker retain the same combat restriction.

## Market-aware bot policies

All five policies plan routes to affordable market offers and use both Coin and carried treasure. They keep single-use market cards for their effects, except when an unused convert would immediately win. Consumables do not count as permanent upgrades or reusable Energy in the Courier retention rules. Both Courier variants retain their distinct exploration-card conversion policies.

Shared play heuristics use Time Lord and Omnipotence when drawn; Strike It Rich when all 10 treasure fit; Banker away from base when carried treasure or eligible conversions justify it; Journey when Energy is needed; and Seize Control for a new benefit or rival denial, avoiding unowned replacement sites with no gain. Market priorities differ by policy: Courier favors Banker/treasure, Builder favors extra turns/draw/ownership, Delver favors expedition support, and Opportunist favors Seize Control. These are first-pass fixed heuristics, not trained or optimized purchasing decisions. Coin generation is played before buying to avoid spending carried treasure unnecessarily. Standing is never part of an affordability calculation.
