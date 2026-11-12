# Expedition Lab

A dependency-free JavaScript starter for a competitive exploration and deckbuilding game. Browser pass-and-play and Node simulations share the same rules engine.

## Run locally

Install Node 20.11 or newer, extract this folder, then run these commands from it.

```sh
npm start
```

Open http://localhost:8080. Browser modules need the local server. Select a seed and map size, then choose New game. The default map has 19 flowers. Click enlarged gold vertices to move or exit, and the center marker of a highlighted tile to enter. Hover or keyboard-focus a destination to see a ring, route line, and action cost before clicking. The sidebar exposes all legal actions as buttons. Play cards for extra actions or turn-long Power. Return inside your own base to bank treasure or deposit resource cards from hand. Bot action advances one decision and Bot turn completes the active player's turn. Save and load use versioned JSON files.

```sh
npm test
npm run simulate -- 10
```

The simulation prints seeds, winners, rounds, action counts, and final scores. It stops at 150 rounds or 15,000 actions and reports unfinished games explicitly. Bots are basic route-following smoke-test agents, not balance evaluators.

## Change the game

- `src/content.js` holds provisional values, cards, troop profiles, and encounter categories.
- `src/board.js` builds the interlocking flower geometry and legal edge graph.
- `src/game.js` owns state, seeded randomness, legal actions, transitions, and the initial bot.
- `src/app.js` renders state and submits actions to the engine.
- `DESIGN.md` distinguishes agreed rules from implementation assumptions.
- `tests/game.test.js` checks important rule interactions.

State is JSON serializable. `applyAction` returns a new state, rejects illegal actions, and shares immutable board geometry. Future bots should call `legalActions` and `applyAction` instead of reimplementing rules. Browser and Node runs of this engine use the same seeded random generator. Save format v1 supports this prototype only.

## GitHub

This folder is a local Git repository with an initial commit. Create an empty GitHub repository, then add its URL and push.

```sh
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

The site is buildless. Publish the repository root through a static host such as GitHub Pages. Relative URLs also work under a repository subpath. No dependencies need installation to run or test. A `.nojekyll` file is included. Online multiplayer requires additional infrastructure.

## Encounter decision window

Entering an uncleared hazard opens a combat dialog showing the monster, troop stats, reward, and hand. Play cards before pressing Resolve combat. All current cards can be played, including Movement and Focus cards whose bonuses can be used after victory. World actions are locked until combat resolves. The dialog cannot be dismissed to skip the encounter. Cleared forests use the trail rule without opening combat. Pending encounters survive save/load and use the shared bot rules.
