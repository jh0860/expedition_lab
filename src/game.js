import {
  defaults,
  cards,
  playerStats,
  bonusKey,
  hazards,
  resources,
  startingDeck,
  marketDeck,
} from "./content.js";
import { chooseStrategy, botStrategies, courierPlan } from "./bots.js";
import { buildBoard } from "./board.js";
export function random(state) {
  state.rng = (Math.imul(state.rng, 1664525) + 1013904223) >>> 0;
  return state.rng / 4294967296;
}
function shuffle(state, array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(random(state) * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
function draw(state, p, count = Math.max(0, 5 - p.hand.length)) {
  for (let i = 0; i < count; i++) {
    if (!p.deck.length) p.deck = shuffle(state, p.discard.splice(0));
    if (!p.deck.length) break;
    p.hand.push(p.deck.pop());
  }
}
function begin(state) {
  const p = state.players[state.active];
  state.turn = {
    movement: state.config.movement + playerStats(p).movement,
    power: 0,
    health: 0,
    scoutBonus: Boolean(p.recruitSite),
    remoteBanking: false,
  };
  updateCourierPlans(state);
}
function updateCourierPlans(s) {
  for (const p of s.players) {
    p.troop = bonusKey(p);
    if (p.bot === "courier") p.courierPhase = courierPlan(s, p);
  }
}
export function createGame(options = {}) {
  const config = { ...defaults, ...options };
  if (
    !Number.isInteger(config.players) ||
    config.players < 2 ||
    config.players > 4 ||
    ![1, 2, 3].includes(config.radius) ||
    !Number.isFinite(config.goal) ||
    config.goal <= 0
  )
    throw Error("Use 2–4 players, radius 1, 2 or 3, and a positive goal.");
  const state = {
    config,
    rng: Number(config.seed) >>> 0,
    active: 0,
    round: 1,
    winner: null,
    encounter: null,
    cleared: [],
    owners: {},
    log: [],
    players: [],
    destroyed: [],
  };
  state.board = buildBoard(config.radius, () => random(state));
  const bases = Object.values(state.board.tiles).filter(
    (t) => t.type === "town",
  );
  for (let i = 0; i < config.players; i++) {
    const deck = shuffle(state, [...startingDeck]);
    const p = {
      base: bases[i].id,
      position: `t:${bases[i].id}`,
      troop: "standard",
      bot: config.bots?.[i] || "courier",
      camp: null,
      recruitSite: null,
      bank: 0,
      treasure: 0,
      deck,
      discard: [],
      hand: [],
      visited: [],
      courierReplacements: [],
      extraTurns: 0,
      courierPhase: "invest",
    };
    draw(state, p);
    state.players.push(p);
  }
  if (
    state.players.some(
      (p) => p.bot !== "basic" && !Object.hasOwn(botStrategies, p.bot),
    )
  )
    throw Error("Unknown bot strategy in player configuration.");
  setupMarket(state);
  begin(state);
  return state;
}
export function legalActions(s) {
  if (s.winner !== null) return [];
  const p = s.players[s.active],
    actions = [];
  if (s.encounter) {
    p.hand.forEach((id, index) => {
      if (!cards[id].teleport && !cards[id].seize)
        actions.push({ type: "play", index });
    });
    actions.push({ type: "resolveCombat" });
    return actions;
  }
  const add = (type, data = {}) => actions.push({ type, ...data });
  const onTile = p.position.startsWith("t:");
  if (onTile) {
    const tile = s.board.tiles[p.position.slice(2)];
    if (s.turn.movement > 0)
      for (const vertex of tile.vertices)
        if (!occupied(s, vertex)) add("exit", { to: vertex });
    if (
      tile.type === "training" &&
      s.owners[tile.id] !== s.active &&
      (s.owners[tile.id] === undefined ||
        p.treasure >= s.config.takeoverCost)
    )
      add("claim");
    if (
      tile.type === "recruit" &&
      s.owners[tile.id] !== s.active &&
      p.treasure >= 3
    )
      add("recruit", { troop: "scout" });
  } else {
    const v = s.board.vertices[p.position];
    if (s.turn.movement > 0)
      for (const to of v.neighbors) if (!occupied(s, to)) add("move", { to });
    if (s.turn.movement > 0)
      for (const id of v.tiles)
        if (s.board.tiles[id].type !== "mountain") add("enter", { tile: id });
    if (v.tiles.some((id) => s.board.tiles[id].type === "market"))
      s.market.offers.forEach((id, index) => {
        if (id && p.treasure >= cards[id].cost)
          add("buy", { index });
      });
  }
  if (p.position === `t:${p.base}` || s.turn.remoteBanking) {
    if (p.treasure) add("bank");
    if (s.turn.movement > 0)
      for (const zone of ["hand", "discard", "deck"])
        p[zone].forEach((id, index) => {
          if (cards[id].value > 0)
            add("deposit", { ...(zone !== "hand" ? { zone } : {}), index });
        });
  }
  p.hand.forEach((id, index) => {
    if (cards[id].teleport) {
      Object.values(s.board.tiles)
        .filter((tile) => tile.type === "guild")
        .forEach((tile) => add("play", { index, tile: tile.id }));
    } else if (cards[id].seize) {
      Object.values(s.board.tiles)
        .filter(
          (tile) =>
            ["training", "recruit"].includes(tile.type) &&
            s.owners[tile.id] !== s.active,
        )
        .forEach((tile) => {
          if (tile.type === "recruit") {
            add("play", { index, tile: tile.id, troop: "scout" });
          } else add("play", { index, tile: tile.id });
        });
    } else add("play", { index });
  });
  add("end");
  return actions;
}
function setupMarket(s) {
  s.market = {
    deck: shuffle(s, [...marketDeck]),
    offers: [null, null],
    deposited: [],
  };
  restockMarket(s);
}
function restockMarket(s) {
  for (let i = 0; i < 2; i++) {
    if (!s.market.offers[i] && s.market.deck.length)
      s.market.offers[i] = s.market.deck.pop();
  }
}
function ownCamp(s, p, id) {
  const old = s.owners[id];
  if (old !== undefined && old !== s.active) s.players[old].camp = null;
  if (p.camp && p.camp !== id) delete s.owners[p.camp];
  s.owners[id] = s.active;
  p.camp = id;
}
function ownRecruit(s, p, id) {
  const old = s.owners[id];
  if (old !== undefined && old !== s.active) {
    s.players[old].recruitSite = null;
    s.players[old].troop = "standard";
  }
  if (p.recruitSite && p.recruitSite !== id) delete s.owners[p.recruitSite];
  s.owners[id] = s.active;
  p.recruitSite = id;
  if (!s.turn.scoutBonus) {
    s.turn.movement++;
    s.turn.scoutBonus = true;
  }
}
function occupied(s, vertex) {
  return (
    !s.board.vertices[vertex].tiles.some((id) => s.board.tiles[id].town) &&
    s.players.some((p, i) => i !== s.active && p.position === vertex)
  );
}
function spend(s, p, cost) {
  p.treasure -= cost;
}
function rewardSite(s, p, tile, say) {
  const pool = resources[tile.type];
  if (pool && !p.visited.includes(tile.id)) {
    p.visited.push(tile.id);
    const id = pool[Math.floor(random(s) * pool.length)];
    p.discard.push(id);
    say(`acquired ${cards[id].name}.`);
  }
}
export function applyAction(state, action) {
  if (
    !legalActions(state).some(
      (a) => JSON.stringify(a) === JSON.stringify(action),
    )
  )
    throw Error("Illegal action");
  const s = structuredClone({ ...state, board: null });
  s.board = state.board;
  const p = s.players[s.active];
  const say = (text) => {
    s.log.push(`R${s.round} · P${s.active + 1} ${text}`);
    s.log = s.log.slice(-100);
  };
  if (action.type === "move") {
    p.position = action.to;
    s.turn.movement--;
  }
  if (action.type === "exit") {
    p.position = action.to;
    s.turn.movement--;
  }
  if (action.type === "enter") {
    const tile = s.board.tiles[action.tile];
    p.position = `t:${tile.id}`;
    s.turn.movement--;
    if (hazards.has(tile.type) && !s.cleared.includes(tile.id)) {
      s.encounter = {
        tile: tile.id,
        name:
          tile.type === "black"
            ? "Black Forest guardian"
            : "Dark Forest guardian",
        power: tile.type === "black" ? 3 : 1,
        health: tile.type === "black" ? 6 : 3,
        speed: 2,
        loot: tile.type === "black" ? 5 : 2,
      };
      say(`encountered ${s.encounter.name}.`);
    }
    rewardSite(s, p, tile, say);
  }
  if (action.type === "resolveCombat") {
    const monster = s.encounter;
    const tile = s.board.tiles[monster.tile];
    const power = playerStats(p).power + s.turn.power;
    const health = playerStats(p).health + s.turn.health;
    const first = random(s) < 0.5;
    const strikes = Math.ceil(monster.health / power);
    const hits = Math.ceil(health / monster.power);
    s.encounter = null;
    say(first ? "attacked first." : "the monster attacked first.");
    if (first ? strikes <= hits : strikes < hits) {
      s.cleared.push(tile.id);
      p.treasure = Math.min(s.config.carry, p.treasure + monster.loot);
      say(`cleared ${tile.type} forest and recovered to full Health.`);
    } else {
      p.position = `t:${p.base}`;
      p.treasure = 0;
      say("was defeated and returned home.");
      return endTurn(s);
    }
  }
  if (action.type === "claim") {
    const id = p.position.slice(2);
    if (s.owners[id] !== undefined) spend(s, p, s.config.takeoverCost);
    ownCamp(s, p, id);
    say("claimed a Training Camp (Fighter: +1 Power/+1 Health).");
  }
  if (action.type === "recruit") {
    spend(s, p, 3);
    ownRecruit(s, p, p.position.slice(2));
    say(`claimed a Recruitment Site (Scout: +1 Energy).`);
  }
  if (action.type === "bank") {
    p.bank += p.treasure;
    p.treasure = 0;
    say("converted carried treasure to Standing.");
  }
  if (action.type === "buy") {
    const id = s.market.offers[action.index];
    spend(s, p, cards[id].cost);
    p.discard.push(id);
    s.market.offers[action.index] = null;
    say(`bought ${cards[id].name}; market slot restocks at turn end.`);
  }
  if (action.type === "play") {
    const id = p.hand.splice(action.index, 1)[0],
      card = cards[id];
    if (card.singleUse || card.destroyOnPlay) s.destroyed.push(id);
    else p.discard.push(id);
    s.turn.movement += card.movement || 0;
    s.turn.power += card.power || 0;
    s.turn.health += card.health || 0;
    if (card.extraTurn) p.extraTurns++;
    if (card.draw) draw(s, p, card.draw);
    if (card.treasure)
      p.treasure = Math.min(s.config.carry, p.treasure + card.treasure);
    if (card.remoteBanking) s.turn.remoteBanking = true;
    if (card.seize) {
      const tile = s.board.tiles[action.tile];
      if (tile.type === "training") ownCamp(s, p, tile.id);
      else ownRecruit(s, p, tile.id);
    }
    if (card.singleUse || card.destroyOnPlay) say(`used and destroyed ${card.name}.`);
    if (card.teleport) {
      const tile = s.board.tiles[action.tile];
      p.position = `t:${tile.id}`;
      say(`used Arcane Passage to reach Guild ${tile.id}.`);
      rewardSite(s, p, tile, say);
    }
  }
  if (action.type === "deposit") {
    const id = p[action.zone || "hand"].splice(action.index, 1)[0];
    if (p.bot === "courierReplacement" && !cards[id].singleUse)
      p.courierReplacements.push(id);
    if (cards[id].singleUse) s.market.deposited.push(id);
    p.bank += cards[id].value;
    s.turn.movement--;
    p.deck = shuffle(s, p.deck);
    say(
      `converted ${cards[id].name} to Standing; shuffled the remaining draw deck.`,
    );
  }
  updateCourierPlans(s);
  if (p.bank >= s.config.goal) {
    s.winner = s.active;
    say("won the game.");
  }
  if (action.type === "end") return endTurn(s);
  return s;
}
function endTurn(s) {
  const p = s.players[s.active];
  p.discard.push(...p.hand.splice(0));
  draw(s, p);
  restockMarket(s);
  if (p.extraTurns > 0) p.extraTurns--;
  else {
    s.active = (s.active + 1) % s.players.length;
    if (s.active === 0) s.round++;
  }
  begin(s);
  return s;
}
// Breadth-first routing over legal geometry. Bots use the same action API as humans.
export function chooseBot(s, strategy = s.players[s.active].bot || "courier") {
  if (s.winner !== null) return { type: "end" };
  return strategy === "basic"
    ? chooseBasicBot(s)
    : chooseStrategy(s, legalActions(s), strategy);
}
function chooseBasicBot(s) {
  const p = s.players[s.active],
    actions = legalActions(s);
  for (const type of ["bank", "deposit", "play"]) {
    const action = actions.find(
      (a) =>
        a.type === type &&
        (type !== "deposit" ||
          cards[p[a.zone || "hand"][a.index]].value >= 3) &&
        (type !== "play" ||
          !cards[p.hand[a.index]].teleport ||
          !p.visited.includes(a.tile)),
    );
    if (action) return action;
  }
  if (s.encounter) return { type: "resolveCombat" };
  const valuable = [...p.deck, ...p.hand, ...p.discard].some(
    (id) => cards[id].value >= 3,
  );
  const targets =
    valuable || p.treasure >= 4
      ? [`t:${p.base}`]
      : Object.values(s.board.tiles)
          .filter((t) => resources[t.type] && !p.visited.includes(t.id))
          .map((t) => `t:${t.id}`);
  if (targets.includes(p.position)) return { type: "end" };
  const queue = [{ at: p.position, first: null }],
    seen = new Set([p.position]);
  for (let i = 0; i < queue.length; i++) {
    const node = queue[i];
    if (targets.includes(node.at)) return node.first || { type: "end" };
    const tile = node.at.startsWith("t:");
    let next = tile
      ? s.board.tiles[node.at.slice(2)].vertices.map((to) => ({
          at: to,
          action: { type: "exit", to },
        }))
      : [
          ...s.board.vertices[node.at].neighbors.map((to) => ({
            at: to,
            action: { type: "move", to },
          })),
          ...s.board.vertices[node.at].tiles
            .filter((id) => {
              const type = s.board.tiles[id].type;
              if (type === "mountain") return false;
              if (!hazards.has(type) || s.cleared.includes(id)) return true;
              const power = playerStats(p).power + s.turn.power;
              const health = playerStats(p).health + s.turn.health;
              return (
                Math.ceil((type === "black" ? 6 : 3) / power) <=
                Math.ceil(health / (type === "black" ? 3 : 1))
              );
            })
            .map((id) => ({
              at: `t:${id}`,
              action: { type: "enter", tile: id },
            })),
        ];
    for (const step of next) {
      const first =
        node.first ||
        actions.find((a) => JSON.stringify(a) === JSON.stringify(step.action));
      if (first && !seen.has(step.at)) {
        seen.add(step.at);
        queue.push({ at: step.at, first });
      }
    }
  }
  return { type: "end" };
}

export function loadGame(save) {
  if (
    ![1, 2, 3, 4, 5, 6].includes(save?.version) ||
    !save.state?.board ||
    !Array.isArray(save.state?.players) ||
    !save.state?.turn ||
    !save.state?.config
  ) {
    throw Error("Unsupported save.");
  }
  const state = structuredClone(save.state);
  if (!state.market) setupMarket(state);
  state.destroyed ||= [];
  state.turn.remoteBanking ??= false;
  delete state.turn.freeExit;
  delete state.turn.trail;
  delete state.turn.campBonus;
  state.turn.scoutBonus ??= Boolean(state.players[state.active].recruitSite);
  if (save.version === 1) {
    // Preserve the unfinished turn's remaining allowance. New turns use the new rules.
    state.turn.movement += state.turn.focus || 0;
    state.config.movement = 0;
    delete state.turn.focus;
    delete state.config.focus;
    state.log.push(
      "Legacy save converted: remaining actions merged into Energy; future turns start with Scout bonus only.",
    );
  }
  if (save.version < 3) {
    const translations = {
      stride: "hike",
      prepare: "wander",
      nature: "hike",
      sorcery: "arcanePassage",
      mine: "preciousCache",
    };
    for (const p of state.players) {
      for (const zone of ["hand", "deck", "discard"])
        p[zone] = p[zone].map((id) => translations[id] || id);
    }
    state.turn.health = 0;
    state.log.push(
      "Card roster updated: legacy cards translated to the new list; existing decks retained.",
    );
  }
  if (save.version < 6 && state.turn.coin !== undefined) {
    if (!Number.isFinite(state.turn.coin) || state.turn.coin < 0)
      throw Error("Invalid legacy currency in save.");
    const active = state.players[state.active];
    active.treasure = Math.min(state.config.carry, active.treasure + state.turn.coin);
  }
  delete state.turn.coin;
  for (const p of state.players) {
    p.bot ||= "courier";
    p.recruitSite ??= null;
    p.extraTurns ??= 0;
    p.courierPhase ??= "invest";
    if (!["invest", "convert"].includes(p.courierPhase))
      throw Error("Invalid Courier phase in save.");
    p.courierReplacements ||= [];
    if (
      !Array.isArray(p.courierReplacements) ||
      p.courierReplacements.some((id) => !cards[id])
    )
      throw Error("Invalid replacement history in save.");
    if (p.bot !== "basic" && !Object.hasOwn(botStrategies, p.bot))
      throw Error("Unknown bot strategy in save.");
    if ([...p.hand, ...p.deck, ...p.discard].some((id) => !cards[id]))
      throw Error("Unknown card in save.");
  }
  if (
    ![state.turn.health, state.turn.power].every(
      (n) => Number.isFinite(n) && n >= 0,
    )
  )
    throw Error("Invalid turn bonus in save.");
  if (!Number.isFinite(state.turn.movement) || state.turn.movement < 0) {
    throw Error("Invalid Energy allowance in save.");
  }
  if (
    !Array.isArray(state.market.deck) ||
    !Array.isArray(state.market.offers) ||
    state.market.offers.length !== 2 ||
    !Array.isArray(state.market.deposited) ||
    !Array.isArray(state.destroyed) ||
    [
      ...state.market.deck,
      ...state.market.offers.filter(Boolean),
      ...state.market.deposited,
    ].some((id) => !marketDeck.includes(id)) ||
    state.destroyed.some(
      (id) => !cards[id] || !(cards[id].singleUse || cards[id].destroyOnPlay),
    ) ||
    state.players.some(
      (p) => !Number.isInteger(p.extraTurns) || p.extraTurns < 0,
    ) ||
    typeof state.turn.remoteBanking !== "boolean"
  )
    throw Error("Invalid market or extra-turn state in save.");
  updateCourierPlans(state);
  legalActions(state);
  return state;
}
