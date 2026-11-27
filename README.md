# Expedition Lab

A dependency-free JavaScript prototype for a competitive exploration and deckbuilding game. Browser pass-and-play and Node simulations use the same rules engine.

## Run locally

Use Node 20.11 or newer. Extract the download and run this command from the folder containing package.json:

```sh
npm start
```

Open http://localhost:8080. Select a seed, player count and map size, then choose New game. The default map has 19 flowers. Each flower is one central site plus its six surrounding hexes, enclosed by a black outline. Hover or keyboard-focus destinations to preview the cost. Click a gold vertex to travel or exit, or a tile's center marker to enter. Open Actions beside the hand to see grouped travel and conversion choices. Travel options name their direction and preview their destination on hover or keyboard focus. Click outside or press Escape to close the menu. End turn stays separate below the hand, including when the hand is expanded; resolve combat before ending a turn. Save/load uses versioned JSON.

## Playing cards at the table

Your hand starts as a compact overlapping stack at the bottom of the board. Click the stack or its heading to fan it out. Click a card once to select and inspect it, then click it again or use **Play selected card** to play. You can also drag a card out of the open hand onto the board; release it outside the play area or back over your hand to cancel. Select Arcane Passage or Seize Control first and choose its destination before playing or dragging.

Click outside the hand, click its heading, or press Escape to restack. The first outside click only dismisses the fan, preventing accidental board moves. Cards also support keyboard activation and arrow-key selection. Combat uses the same hand interaction; drag onto the encounter panel to prepare. Cards unavailable during combat stay visibly marked. The table shows the most recently played card; the market also displays full card faces. Visual hand state is not part of the save format and does not affect bot simulations.

The fantasy skin uses mottled olive-gray stone frames and panels, subtly worn edges, muted parchment rules panels, and original landscape vignettes. `retro.css` contains the theme; `src/card-art.js` supplies lightweight inline SVG art. Repeating stone and parchment textures live in `assets/` and require no external downloads. Card type strips and reusable-card discard reminders are omitted; only single-use market cards show a destruction reminder.

The Current Expedition ledger shows available Energy, effective Power and Health (including site and card bonuses), carried treasure with its capacity bar, and separate hand/draw/discard counts. Ownership badges and active Banker permission appear when applicable.

## Resources and conversion

| Resource         | Purpose                                                                 |
| ---------------- | ----------------------------------------------------------------------- |
| Standing         | Abstract victory progress. Reach 50 to win. Secure and cannot be spent. |
| Carried treasure | Persistent currency that can be spent or lost on defeat.                |
| Energy           | Temporary action resource supplied by cards and the Scout bonus.     |

Convert all carried treasure to Standing for free inside your base. Convert any one owned card from hand, discard pile, or draw deck for its conversion value in Standing, paying 1 Energy. The selected card is permanently removed, the remaining draw deck is shuffled, and all other hand/discard cards stay where they are. The hand is not refilled. Draw-deck choices display alphabetically so the shuffled order is not revealed.

Moving an edge, entering a tile, and exiting a tile each cost 1 Energy. Standard troops have no automatic Energy. Recruitment Sites provide Scout (+1 Energy per turn); Training Camps provide Fighter (+1 Power/+1 Health). Owning both still gives only 1 automatic Energy. Cleared forests stay cleared, with normal Energy costs and no further fights. Defeat returns the troop to base, removes carried treasure, and ends the turn; Standing, deck and owned upgrades remain.

Nonconsumable cards can be played and then converted from discard in the same turn; generated bonuses remain for the turn. Unplayed cards converted from any zone provide no play effect. Purchases and site fees spend carried treasure; Standing is never part of the payment pool.

## Combat and ownership

Entering an uncleared forest opens a preparation dialog. Play cards, then Resolve combat. Arcane Passage and Seize Control cannot be played in that window. World actions, including conversion, remain locked until combat resolves. Power and Health bonuses stack and last through the turn. Every fight uses full effective Health; persistent damage remains tabled.

A player may own one Training Camp and one recruitment site. An unowned Camp is free to claim after entering; a rival Camp costs 2. Recruitment acquisition or takeover costs 3 and grants Scout. Training Camps grant Fighter. Losing either site removes only its corresponding bonus. Ownership survives defeat. Opportunist acquires unowned sites only when it owns none of that type, and otherwise seeks rival-owned replacements.

## Consumable Marketplace

One shared six-card market deck has one copy of each unique card. Two offers are visible. Buy from a vertex bordering a Marketplace using carried treasure; buying costs no Energy and puts the card in discard. Vacant slots refill only at turn end, including before a Time Lord extra turn. Exhausted stock does not recycle.

| Card           | Price | Effect                                                |
| -------------- | ----: | ----------------------------------------------------- |
| Time Lord      |     4 | Extra turn after normal cleanup and reset             |
| Journey        |     3 | +5 Energy                                             |
| Omnipotence    |     3 | Draw three cards                                      |
| Strike It Rich |     5 | +10 carried treasure, subject to carrying capacity    |
| Seize Control  |     4 | Take ownership of a Camp or recruitment site          |
| Banker         |     3 | Convert carried treasure and cards anywhere this turn |

Every market card is destroyed on play, like exile, and cannot then be converted. An unused copy can instead be converted for Standing equal to its purchase price. Banker converts carried treasure for free; each remote card conversion still costs 1 Energy and shuffles the remaining draw deck. The card named Banker keeps its name.

## Courier's investment and conversion plan

Courier initially retains useful cards and spendable treasure, and seeks Scout recruitment, a first Camp, safe fights and useful market purchases. It can still convert treasure cards and excess copies during this phase.

It commits to aggressive conversion when its reusable engine is ready (at least 8 printed Energy and 5 printed recurring treasure income across its cards, plus a troop/Camp bonus), when its Standing reaches 60% of the target, when a rival reaches 80%, or when treasure or one owned card can finish the game. Default Standing thresholds are 30 and 40. Single-use cards do not satisfy engine thresholds.

During investment it holds carried treasure for spending, except to win or when carrying capacity is full. Later it converts treasure promptly and cashes out surplus exploration cards. Phase commitment persists through lost upgrades and save/load. The interface shows the active plan. These are provisional heuristics; DESIGN.md records exact retention limits. Legacy replacement Courier remains a separate comparison policy.

## Tests and simulations

```sh
npm test
npm run simulate -- 10
node scripts/compare-four-player.js 42
node scripts/compare-bots.js 5 all
node scripts/compare-legacy-couriers.js multiplayer 10
node scripts/compare-legacy-couriers.js duel 50
node scripts/compare-treasure-economy.js multiplayer 10
node scripts/compare-treasure-economy.js duel 50
```

The four-player script rotates Courier, Builder, Delver and Opportunist through four seats on one map seed; replacement Courier is excluded. The full five-policy comparison runs 100 two-player games. Simulations use the same legal-action API as human play and check market-card conservation. They are heuristic-bot diagnostics, not estimates of optimal human play or human game duration.

Reports in `reports/` are historical snapshots. The merged-currency results are in `reports/treasure-economy-comparison.md`. Courier phase changes are evaluated in `reports/courier-phase-comparison.md`. The new treasure-card effects and corrected site bonuses are evaluated with both older Couriers in `reports/legacy-couriers-treasure-comparison.md`; that schedule excludes the current phased Courier. Existing reports retain their original terminology and policy descriptions.

## Project structure and saves

- `src/content.js`: card values, site bonus stats, resource pools and market stock.
- `src/board.js`: map geometry and legal edges.
- `src/game.js`: state, rules, seeded randomness and save loading.
- `src/bots.js`: strategy priorities, routing and Courier phases.
- `src/app.js`: browser interface.
- `src/tile-art.js`: board palette and icons.
- `src/card-hand.js`: stacked/fanned card interaction and card faces.
- `src/card-art.js`: original fantasy card vignettes.
- `retro.css`: vintage card frames, parchment and interface theme.
- `DESIGN.md`: current rules, assumptions and tabled systems.
- `tests/`: rule and strategy checks.

`applyAction` returns a new state and rejects illegal actions. Board geometry is shared and immutable. Save format v6 supports the market and migrates older saves. Internal fields/action identifiers such as `bank`, `deposit` and `movement` are retained for compatibility; their game labels are Standing, conversion and Energy. The optional saved `courierPhase` defaults to investment and advances under the current thresholds when an older save loads. Start a new game for the exact current starter deck.

## GitHub

Copy the downloaded sources into your existing working repository to preserve its Git history. For a new repository, initialize it and commit first. Create an empty GitHub repository, then add its URL and push:

```sh
git init -b main
git add .
git commit -m "Initial prototype"
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

The site is buildless. Publish the repository root through GitHub Pages or another static host. Relative URLs support a repository subpath. No dependencies need installation to run or test. A .nojekyll file is included. Online multiplayer needs additional infrastructure.

## Current Courier comparison

The revised Courier was tested in 10 four-player games and 50 one-versus-one games, excluding replacement Courier. Multiplayer wins: Delver 5, Courier 3, Builder 2, Opportunist 0. Duel wins across 25 appearances each: Delver 17, Builder 15, Opportunist 11, Courier 6; one Opportunist–Courier game reached the round limit. No execution or market-card conservation errors occurred. Courier now purchases, recruits and fights, but can still remain in investment too long. The report and raw data are `reports/courier-phase-comparison.md` and `.json`.

```sh
node scripts/compare-current.js multiplayer 10
node scripts/compare-current.js duel 50
```

Trinket can be played and destroyed for 5 carried treasure, or converted normally for 7 Standing. Relic offers 20 carried treasure or 25 Standing. The carried payout costs no Energy, respects the 20 carry limit, and can be spent or lost on defeat. Destroyed copies cannot also be converted. Older saves retain remaining Energy for the unfinished turn; future turns use the corrected Scout/Fighter site bonuses. Reports before `legacy-couriers-treasure-comparison.md` predate these changes.


## Unified treasure economy

Barter, Alchemy, and Precious Cache now generate 1, 2, and 5 carried treasure respectively. There is no separate Coin pool. Treasure is persistent, spendable, limited to 20, vulnerable to defeat, and freely convertible to Standing at base or under Banker. Income cards remain reusable; converting the card itself still costs 1 Energy and removes it for its original Standing value. Converting treasure remains free, including treasure generated at base. The central-town conversion alternative is not implemented.

Save v6 migrates any unspent Coin in an older unfinished turn into the active player’s carried treasure, capped at capacity, and removes the old pool. Bots evaluate recurring treasure income separately from destroy-on-play treasure cards. Replacement upgrades compare recurring income amounts; Trinket and Relic cannot replace reusable income cards. Reports before `treasure-economy-comparison.md` use the earlier currency rules.


## Refreshing a GitHub Pages deployment

Before uploading changed source files, run `npm run refresh-assets`. This updates asset URLs from the contents of the current files, including nested JavaScript modules and textures, so browsers request matching versions. Upload the updated `index.html` along with the source, styles, and `assets/` folder. The generated import map preserves relative project URLs such as `/expedition_lab/`; no bundler is required. Run the command again after further edits.

If a page still shows an older layout immediately after deployment, use Ctrl+Shift+R (Windows) or Command+Shift+R (Mac). An incognito/private window can help check whether the ordinary browser has cached an older release. Existing game saves are unaffected.
