import { defaults, cards, troops, hazards, resources } from "./content.js";
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
function draw(state, p) {
  while (p.hand.length < 5) {
    if (!p.deck.length) p.deck = shuffle(state, p.discard.splice(0));
    if (!p.deck.length) break;
    p.hand.push(p.deck.pop());
  }
}
function begin(state) {
  const p = state.players[state.active];
  state.turn = {
    movement: state.config.movement,
    focus: state.config.focus + troops[p.troop].focus + (p.camp ? 1 : 0),
    power: 0,
    trail: false,
    campBonus: Boolean(p.camp),
    freeExit: null,
  };
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
  };
  state.board = buildBoard(config.radius, () => random(state));
  const bases = Object.values(state.board.tiles).filter(
    (t) => t.type === "town",
  );
  for (let i = 0; i < config.players; i++) {
    const deck = shuffle(state, [
      ...Array(4).fill("stride"),
      ...Array(3).fill("prepare"),
      ...Array(3).fill("strike"),
    ]);
    const p = {
      base: bases[i].id,
      position: `t:${bases[i].id}`,
      troop: "standard",
      camp: null,
      bank: 0,
      treasure: 0,
      deck,
      discard: [],
      hand: [],
      visited: [],
    };
    draw(state, p);
    state.players.push(p);
  }
  begin(state);
  return state;
}
export function legalActions(s) {
  if (s.winner !== null) return [];
  const p = s.players[s.active],
    actions = [];
  if (s.encounter) {
    p.hand.forEach((_, index) => actions.push({ type: "play", index }));
    actions.push({ type: "resolveCombat" });
    return actions;
  }
  if (s.turn.freeExit)
    return s.board.tiles[s.turn.freeExit].vertices
      .filter((v) => !occupied(s, v))
      .map((to) => ({ type: "exit", to }));
  const add = (type, data = {}) => actions.push({ type, ...data });
  const onTile = p.position.startsWith("t:");
  if (onTile) {
    const tile = s.board.tiles[p.position.slice(2)];
    if (s.turn.focus > 0)
      for (const vertex of tile.vertices)
        if (!occupied(s, vertex)) add("exit", { to: vertex });
    if (tile.id === p.base) {
      if (p.treasure) add("bank");
      if (s.turn.focus > 0)
        p.hand.forEach((id, index) => {
          if (cards[id].value > 0) add("deposit", { index });
        });
    }
    if (
      tile.type === "training" &&
      s.owners[tile.id] !== s.active &&
      (s.owners[tile.id] === undefined || p.treasure >= s.config.takeoverCost)
    )
      add("claim");
    if (tile.type === "recruit")
      for (const troop of ["scout", "fighter"])
        if (p.troop !== troop && p.treasure >= 3) add("recruit", { troop });
  } else {
    const v = s.board.vertices[p.position];
    if (s.turn.movement > 0)
      for (const to of v.neighbors) if (!occupied(s, to)) add("move", { to });
    if (s.turn.focus > 0)
      for (const id of v.tiles)
        if (s.board.tiles[id].type !== "mountain") add("enter", { tile: id });
    if (
      v.tiles.some((id) => s.board.tiles[id].type === "market") &&
      p.treasure >= 4
    )
      add("buy");
  }
  p.hand.forEach((_, index) => add("play", { index }));
  add("end");
  return actions;
}
function occupied(s, vertex) {
  return (
    !s.board.vertices[vertex].tiles.some((id) => s.board.tiles[id].town) &&
    s.players.some((p, i) => i !== s.active && p.position === vertex)
  );
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
    if (s.turn.freeExit) s.turn.freeExit = null;
    else s.turn.focus--;
  }
  if (action.type === "enter") {
    const tile = s.board.tiles[action.tile];
    p.position = `t:${tile.id}`;
    s.turn.focus--;
    if (hazards.has(tile.type)) {
      if (s.cleared.includes(tile.id)) {
        if (!s.turn.trail) {
          s.turn.trail = true;
          s.turn.freeExit = tile.id;
          say("used a blazed trail.");
        }
      } else {
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
    }
    if (resources[tile.type] && !p.visited.includes(tile.id)) {
      p.visited.push(tile.id);
      p.discard.push(resources[tile.type]);
      say(`acquired ${cards[resources[tile.type]].name}.`);
    }
  }
  if (action.type === "resolveCombat") {
    const monster = s.encounter;
    const tile = s.board.tiles[monster.tile];
    const power = troops[p.troop].power + s.turn.power;
    const health = troops[p.troop].health;
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
    const id = p.position.slice(2),
      old = s.owners[id];
    if (old !== undefined) {
      p.treasure -= s.config.takeoverCost;
      s.players[old].camp = null;
    }
    if (p.camp) delete s.owners[p.camp];
    s.owners[id] = s.active;
    p.camp = id;
    if (!s.turn.campBonus) {
      s.turn.focus++;
      s.turn.campBonus = true;
    }
    say("claimed a Training Camp (+1 Focus).");
  }
  if (action.type === "recruit") {
    p.treasure -= 3;
    const before = troops[p.troop].focus;
    p.troop = action.troop;
    s.turn.focus += troops[p.troop].focus - before;
    say(`recruited ${action.troop}.`);
  }
  if (action.type === "bank") {
    p.bank += p.treasure;
    p.treasure = 0;
    say("banked carried treasure.");
  }
  if (action.type === "buy") {
    p.treasure -= 4;
    p.discard.push("nature");
    say("bought Woodland lore.");
  }
  if (action.type === "play") {
    const id = p.hand.splice(action.index, 1)[0],
      card = cards[id];
    p.discard.push(id);
    s.turn.movement += card.movement || 0;
    s.turn.focus += card.focus || 0;
    s.turn.power += card.power || 0;
  }
  if (action.type === "deposit") {
    const id = p.hand.splice(action.index, 1)[0];
    p.bank += cards[id].value;
    s.turn.focus--;
    say(`deposited ${cards[id].name}.`);
  }
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
  s.active = (s.active + 1) % s.players.length;
  if (s.active === 0) s.round++;
  begin(s);
  return s;
}
// Breadth-first routing over legal geometry. Bots use the same action API as humans.
export function chooseBot(s) {
  const p = s.players[s.active],
    actions = legalActions(s);
  for (const type of ["bank", "deposit", "play"]) {
    const action = actions.find((a) => a.type === type);
    if (action) return action;
  }
  if (s.encounter) return { type: "resolveCombat" };
  const valuable = [...p.deck, ...p.hand, ...p.discard].some(
    (id) => cards[id].value > 0,
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
            .filter((id) => s.board.tiles[id].type !== "mountain")
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
