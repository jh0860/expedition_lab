import {
  createGame,
  legalActions,
  applyAction,
  chooseBot,
  loadGame,
} from "./game.js";
import { botStrategies } from "./bots.js";
import { cards, troops } from "./content.js";
import { tileColors, tileIconUrl } from "./tile-art.js";
let state = createGame();
const colors = ["#f0bd62", "#7ac9d6", "#de91b1", "#adce77"];
const $ = (id) => document.getElementById(id);
function act(action) {
  try {
    state = applyAction(state, action);
    render();
  } catch (error) {
    alert(error.message);
  }
}
function label(a) {
  return (
    {
      end: "End turn",
      resolveCombat: "Resolve combat",
      bank: "Convert treasure to Standing (free)",
      claim: "Claim Camp",
      buy: `Buy ${cards[state.market.offers[a.index]]?.name} (${cards[state.market.offers[a.index]]?.cost} Coin/treasure)`,
      recruit: `Claim recruitment site / ${a.troop} (3 Coin/treasure)`,
      deposit: `Convert ${cards[state.players[state.active][a.zone || "hand"][a.index]]?.name} (${a.zone || "hand"}) · 1 Energy`,
      move: "Move",
      exit: "Exit",
      enter: `Enter ${state.board.tiles[a.tile]?.type}`,
    }[a.type] || a.type
  );
}
function button(text, action, parent) {
  const b = document.createElement("button");
  b.textContent = text;
  b.onclick = () => act(action);
  parent.append(b);
}
function cardEffects(card) {
  const effects = ["movement", "power", "health", "coin"]
    .filter((key) => card[key])
    .map(
      (key) =>
        `+${card[key]} ${key === "movement" ? "Energy" : key[0].toUpperCase() + key.slice(1)}`,
    );
  if (card.teleport) effects.push("Move to any Guild");
  if (card.extraTurn) effects.push("Extra turn after normal cleanup");
  if (card.draw) effects.push(`Draw ${card.draw} cards`);
  if (card.treasure) effects.push(`+${card.treasure} carried treasure`);
  if (card.seize) effects.push("Take a Camp or recruitment site");
  if (card.remoteBanking)
    effects.push("Convert treasure and cards anywhere this turn");
  if (card.singleUse) effects.push("Destroy on use");
  return effects.join(" · ") || "No play effect";
}
function renderCard(id, index, actions, parent) {
  const card = cards[id];
  const plays = actions.filter((a) => a.type === "play" && a.index === index);
  const text = `${card.name} · ${cardEffects(card)} · Conversion ${card.value} Standing`;
  if ((card.teleport || card.seize) && plays.length) {
    const row = document.createElement("div");
    const select = document.createElement("select");
    select.setAttribute(
      "aria-label",
      card.seize
        ? "Seize Control target site"
        : "Arcane Passage destination Guild",
    );
    plays.forEach((a, i) => {
      const option = document.createElement("option");
      option.value = i;
      option.textContent = card.seize
        ? `${state.board.tiles[a.tile].type} ${a.tile}${a.troop ? ` — ${a.troop}` : ""} (${state.owners[a.tile] === undefined ? "unowned" : `Player ${state.owners[a.tile] + 1}`})`
        : `Guild ${a.tile}${state.players[state.active].visited.includes(a.tile) ? " (visited)" : " (unvisited)"}`;
      select.append(option);
    });
    row.append(select);
    const b = document.createElement("button");
    b.textContent = text;
    b.onclick = () => act(plays[Number(select.value)]);
    row.append(b);
    parent.append(row);
  } else if (plays.length) button(text, plays[0], parent);
  else {
    const b = document.createElement("button");
    b.textContent = `${text} · Unavailable now`;
    b.disabled = true;
    parent.append(b);
  }
}
function render() {
  const p = state.players[state.active],
    actions = legalActions(state);
  $("bot-strategy").value = p.bot || "courier";
  $("status").textContent =
    state.winner === null
      ? `Round ${state.round} · Player ${state.active + 1}`
      : `Player ${state.winner + 1} wins`;
  $("scores").replaceChildren();
  state.players.forEach((player, i) => {
    const div = document.createElement("div");
    div.className = "score";
    div.style.setProperty("--player", colors[i]);
    div.textContent = `Player ${i + 1} · ${player.troop} · Standing ${player.bank} / ${state.config.goal}`;
    $("scores").append(div);
  });
  $("details").textContent =
    `Energy ${state.turn.movement} · Power +${state.turn.power} · Health +${state.turn.health} · Coin ${state.turn.coin} · Carried treasure ${p.treasure}${state.turn.remoteBanking ? " · Remote conversion active" : ""} · Deck ${p.deck.length} · Discard ${p.discard.length}${p.bot === "courier" ? ` · Courier: ${p.courierPhase === "convert" ? "conversion" : "investment"}` : ""}`;
  $("market").replaceChildren();
  state.market.offers.forEach((id, index) => {
    const line = document.createElement("p");
    line.textContent = id
      ? `${cards[id].name} · Cost ${cards[id].cost} · ${cardEffects(cards[id])} · Conversion ${cards[id].value} Standing`
      : "Empty slot — restocks at turn end if stock remains";
    $("market").append(line);
    const buy = actions.find((a) => a.type === "buy" && a.index === index);
    if (buy) button(label(buy), buy, $("market"));
  });
  const stock = document.createElement("small");
  stock.textContent = `${state.market.deck.length} cards in reserve · ${state.destroyed.length} destroyed. Pay with Coin/carried treasure; Standing cannot be spent.`;
  $("market").append(stock);
  $("hand").replaceChildren();
  p.hand.forEach((id, index) => renderCard(id, index, actions, $("hand")));
  $("actions").replaceChildren();
  const actionButtons = actions.filter((a) => a.type !== "play");
  const fromDeck = (a) => a.type === "deposit" && a.zone === "deck";
  // Search choices expose card identities, not their shuffled draw order.
  const deckDeposits = actionButtons
    .filter(fromDeck)
    .sort((a, b) =>
      cards[p.deck[a.index]].name.localeCompare(cards[p.deck[b.index]].name),
    );
  [...actionButtons.filter((a) => !fromDeck(a)), ...deckDeposits].forEach((a) =>
    button(label(a), a, $("actions")),
  );
  $("log").replaceChildren();
  state.log
    .slice(-12)
    .reverse()
    .forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      $("log").append(li);
    });
  renderCombat();
  const svg = $("board");
  svg.replaceChildren();
  $("destination").textContent =
    "Hover over a destination to preview your move.";
  const tiles = Object.values(state.board.tiles),
    xs = tiles.map((t) => t.x),
    ys = tiles.map((t) => t.y);
  svg.setAttribute(
    "viewBox",
    `${Math.min(...xs) - 1.15} ${Math.min(...ys) - 1.15} ${Math.max(...xs) - Math.min(...xs) + 2.3} ${Math.max(...ys) - Math.min(...ys) + 2.3}`,
  );
  const element = (tag, attrs) => {
    const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    svg.append(el);
    return el;
  };
  const defs = element("defs", {});
  defs.innerHTML =
    '<linearGradient id="tile-light" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="white" stop-opacity=".07"/><stop offset=".65" stop-color="white" stop-opacity="0"/></linearGradient>';
  for (const t of tiles) {
    const a = actions.find((a) => a.type === "enter" && a.tile === t.id);
    const poly = element("polygon", {
      points: t.vertices
        .map((id) => {
          const v = state.board.vertices[id];
          return `${v.x},${v.y}`;
        })
        .join(" "),
      fill: tileColors[t.type],
      class: `tile terrain-${t.type} ${a ? "legal" : ""}`,
    });

    const title = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "title",
    );
    title.textContent =
      t.type === "dark"
        ? "Dark Forest · 1-star encounter"
        : t.type === "black"
          ? "Black Forest · 2-star encounter"
          : t.type;
    poly.append(title);
    element("polygon", {
      points: poly.getAttribute("points"),
      fill: "url(#tile-light)",
      class: "tile-light",
    });
    if (["forage", "training", "recruit", "guild"].includes(t.type)) {
      element("polygon", {
        points: t.vertices
          .map((id) => {
            const vertex = state.board.vertices[id];
            return `${t.x + (vertex.x - t.x) * 0.8},${t.y + (vertex.y - t.y) * 0.8}`;
          })
          .join(" "),
        class: "tile-inset",
      });
    }
    element("image", {
      href: tileIconUrl(t.type),
      x: t.x - 1,
      y: t.y - 1,
      width: 2,
      height: 2,
      class: "terrain-icon",
      "aria-hidden": "true",
    });
    if (state.cleared.includes(t.id))
      element("text", { x: t.x, y: t.y + 0.68, class: "cleared" }).textContent =
        "✓";
    if (state.owners[t.id] !== undefined)
      element("circle", {
        cx: t.x,
        cy: t.y - 0.4,
        r: 0.14,
        fill: colors[state.owners[t.id]],
      });
  }
  // Only explicit destination targets receive clicks. Tile faces are passive.
  const preview = element("g", {
    class: "move-preview",
    "pointer-events": "none",
  });
  function clearPreview() {
    preview.replaceChildren();
    $("destination").textContent =
      "Hover over a destination to preview your move.";
  }
  function bindDestination(target, action, destination, description) {
    target.setAttribute("role", "button");
    target.setAttribute("tabindex", "0");
    target.setAttribute("aria-label", description);
    function showPreview() {
      clearPreview();
      const from = p.position.startsWith("t:")
        ? state.board.tiles[p.position.slice(2)]
        : state.board.vertices[p.position];
      const line = element("line", {
        x1: from.x,
        y1: from.y,
        x2: destination.x,
        y2: destination.y,
        class: "preview-line",
      });
      const ring = element("circle", {
        cx: destination.x,
        cy: destination.y,
        r: 0.32,
        class: "preview-ring",
      });
      preview.append(line, ring);
      // Keep overlays above the board while allowing targets to receive input.
      svg.append(preview);
      $("destination").textContent = description;
    }
    target.onpointerenter = showPreview;
    target.onpointerleave = clearPreview;
    target.onfocus = showPreview;
    target.onblur = clearPreview;
    target.onclick = (event) => {
      event.stopPropagation();
      act(action);
    };
    target.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        act(action);
      }
    };
  }
  for (const action of actions.filter((action) => action.type === "enter")) {
    const tile = state.board.tiles[action.tile];
    const target = element("circle", {
      cx: tile.x,
      cy: tile.y,
      r: 0.34,
      class: "tile-target",
    });
    bindDestination(
      target,
      action,
      tile,
      `Enter ${tile.type} tile center · 1 Energy`,
    );
  }
  for (const action of actions.filter(
    (action) => action.type === "move" || action.type === "exit",
  )) {
    const vertex = state.board.vertices[action.to];
    const target = element("circle", {
      cx: vertex.x,
      cy: vertex.y,
      r: 0.28,
      class: "vertex-target",
    });
    element("circle", {
      cx: vertex.x,
      cy: vertex.y,
      r: 0.18,
      class: "vertex",
    });
    const cost = "1 Energy";
    bindDestination(
      target,
      action,
      vertex,
      `${action.type === "move" ? "Move" : "Exit"} to vertex · ${cost}`,
    );
  }
  state.players.forEach((player, i) => {
    const pos = player.position.startsWith("t:")
      ? state.board.tiles[player.position.slice(2)]
      : state.board.vertices[player.position];
    element("circle", {
      cx: pos.x + (player.position.startsWith("t:") ? (i - 0.5) * 0.18 : 0),
      cy: pos.y - 0.13,
      r: 0.15,
      fill: colors[i],
      class: "piece",
    });
  });
}
function renderCombat() {
  const dialog = $("combat");
  if (!state.encounter) {
    if (dialog.open) dialog.close();
    return;
  }
  const monster = state.encounter;
  const player = state.players[state.active];
  const troop = troops[player.troop];
  $("combat-title").textContent = monster.name;
  $("combat-stats").textContent =
    `Your ${player.troop}: ${troop.power + state.turn.power} Power · ${troop.health + state.turn.health} Health · 2 Speed. ` +
    `Monster: ${monster.power} Power · ${monster.health} Health · ${monster.speed} Speed. ` +
    `Reward: ${monster.loot} treasure (carry limit applies).`;
  $("combat-hand").replaceChildren();
  const actions = legalActions(state);
  player.hand.forEach((id, index) =>
    renderCard(id, index, actions, $("combat-hand")),
  );
  if (!player.hand.length)
    $("combat-hand").textContent = "No cards remaining in hand.";
  if (!dialog.open) dialog.showModal();
}
$("combat").addEventListener("cancel", (event) => event.preventDefault());
$("resolve-combat").onclick = () => act({ type: "resolveCombat" });
$("new").onclick = () => {
  state = createGame({
    seed: Number($("seed").value),
    players: Number($("players").value),
    radius: Number($("radius").value),
  });
  render();
};
$("bot-strategy").onchange = (event) => {
  state = structuredClone(state);
  state.players[state.active].bot = event.target.value;
  render();
};
for (const [id, strategy] of Object.entries(botStrategies)) {
  const option = document.createElement("option");
  option.value = id;
  option.textContent = strategy.name;
  option.title = strategy.description;
  $("bot-strategy").append(option);
}
const basicOption = document.createElement("option");
basicOption.value = "basic";
basicOption.textContent = "Basic (previous bot)";
$("bot-strategy").append(basicOption);
$("step").onclick = () => {
  if (state.winner === null) act(chooseBot(state));
};
$("turn").onclick = () => {
  const active = state.active;
  let count = 0;
  while (state.active === active && state.winner === null && count++ < 100)
    state = applyAction(state, chooseBot(state));
  render();
};
$("save").onclick = () => {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify({ version: 4, state })], {
      type: "application/json",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "expedition-save.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};
$("load").onchange = async (event) => {
  try {
    const data = JSON.parse(await event.target.files[0].text());
    state = loadGame(data);
    render();
  } catch (error) {
    alert(`Could not load save. ${error.message}`);
  }
  event.target.value = "";
};
render();
