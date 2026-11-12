import { createGame, legalActions, applyAction, chooseBot } from "./game.js";
import { cards } from "./content.js";
let state = createGame();
const colors = ["#f0bd62", "#7ac9d6", "#de91b1", "#adce77"];
const fills = {
  market: "#87532f",
  town: "#69766a",
  forest: "#315949",
  mountain: "#555f63",
  dark: "#233a34",
  black: "#302d49",
  forage: "#83703b",
  training: "#455e85",
  recruit: "#5a6b42",
  guild: "#5c4980",
  mine: "#66503b",
};
const names = {
  market: "Market",
  town: "Town",
  forest: "",
  mountain: "▲",
  dark: "1★",
  black: "2★",
  forage: "Forage",
  training: "Camp",
  recruit: "Recruit",
  guild: "Guild",
  mine: "Mine",
};
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
      bank: "Bank treasure",
      claim: "Claim Camp",
      buy: "Buy Nature (4)",
      recruit: `Recruit ${a.troop} (3)`,
      deposit: `Deposit ${cards[state.players[state.active].hand[a.index]]?.name}`,
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
function render() {
  const p = state.players[state.active],
    actions = legalActions(state);
  $("status").textContent =
    state.winner === null
      ? `Round ${state.round} · Player ${state.active + 1}`
      : `Player ${state.winner + 1} wins`;
  $("scores").replaceChildren();
  state.players.forEach((player, i) => {
    const div = document.createElement("div");
    div.className = "score";
    div.style.setProperty("--player", colors[i]);
    div.textContent = `Player ${i + 1} · ${player.troop}     ${player.bank} / ${state.config.goal}`;
    $("scores").append(div);
  });
  $("details").textContent =
    `Movement ${state.turn.movement} · Focus ${state.turn.focus} · Power +${state.turn.power} · Carried treasure ${p.treasure} · Deck ${p.deck.length} · Discard ${p.discard.length}`;
  $("hand").replaceChildren();
  p.hand.forEach((id, index) => {
    const c = cards[id],
      a = actions.find((a) => a.type === "play" && a.index === index);
    if (a)
      button(
        `${c.name} · ${c.movement ? `+${c.movement} Move` : c.focus ? `+${c.focus} Focus` : `+${c.power} Power`} · Deposit ${c.value}`,
        a,
        $("hand"),
      );
  });
  $("actions").replaceChildren();
  actions
    .filter((a) => a.type !== "play")
    .forEach((a) => button(label(a), a, $("actions")));
  $("log").replaceChildren();
  state.log
    .slice(-12)
    .reverse()
    .forEach((text) => {
      const li = document.createElement("li");
      li.textContent = text;
      $("log").append(li);
    });
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
  for (const t of tiles) {
    const a = actions.find((a) => a.type === "enter" && a.tile === t.id);
    const poly = element("polygon", {
      points: t.vertices
        .map((id) => {
          const v = state.board.vertices[id];
          return `${v.x},${v.y}`;
        })
        .join(" "),
      fill: fills[t.type],
      class: `tile ${a ? "legal" : ""}`,
    });

    const text = element("text", { x: t.x, y: t.y + 0.08, class: "label" });
    text.textContent = names[t.type];
    if (state.cleared.includes(t.id))
      element("text", { x: t.x, y: t.y - 0.25, class: "cleared" }).textContent =
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
      `Enter ${tile.type} tile center · 1 Focus`,
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
    const cost =
      action.type === "move"
        ? "1 Movement"
        : state.turn.freeExit
          ? "free trail exit"
          : "1 Focus";
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
$("new").onclick = () => {
  state = createGame({
    seed: Number($("seed").value),
    players: Number($("players").value),
    radius: Number($("radius").value),
  });
  render();
};
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
    new Blob([JSON.stringify({ version: 1, state })], {
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
    if (data.version !== 1 || !data.state?.board || !data.state?.players)
      throw Error("Unsupported save.");
    legalActions(data.state);
    state = data.state;
    render();
  } catch (error) {
    alert(`Could not load save. ${error.message}`);
  }
  event.target.value = "";
};
render();
