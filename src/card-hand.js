import { cards } from "./content.js";
import { cardArtwork } from "./card-art.js";

function identity(card) {
  if (card.treasure || card.name === "Trinket" || card.name === "Relic") return "treasure";
  if (card.teleport || card.draw || card.extraTurn || card.seize || card.remoteBanking) return "arcane";
  if (card.movement) return "energy";
  if (card.power) return "power";
  if (card.health) return "health";
  return "coin";
}
function textElement(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  el.textContent = text;
  return el;
}
export function describeCard(card) {
  const lines = ["movement", "power", "health"].filter(k => card[k]).map(k =>
    `+${card[k]} ${k === "movement" ? "Energy" : k[0].toUpperCase() + k.slice(1)}`);
  if (card.teleport) lines.push("Move to any Guild.");
  if (card.extraTurn) lines.push("Take an extra turn after this turn ends.");
  if (card.draw) lines.push(`Draw ${card.draw} cards.`);
  if (card.treasure) lines.push(`Gain ${card.treasure} carried treasure.`);
  if (card.seize) lines.push("Take ownership of any Recruitment Site or Training Camp.");
  if (card.remoteBanking) lines.push("Convert treasure and cards anywhere this turn. Pay normal conversion costs.");
  return lines;
}
export function cardFace(id) {
  const card = cards[id], type = identity(card);
  const fragment = document.createDocumentFragment();
  fragment.append(textElement("span", "card-title", card.name));
  const art = document.createElement("span");
  art.className = `card-art${describeCard(card).join(" ").length > 80 ? " is-compact" : ""}`;
  art.innerHTML = cardArtwork(id, type);
  fragment.append(art);
  const rules = textElement("span", "card-rules", "");
  describeCard(card).forEach(line => rules.append(textElement("span", "", line)));
  fragment.append(rules);
  if (card.singleUse)
    fragment.append(textElement("span", "card-lifetime", "Destroy after playing"));
  const footer = textElement("span", "card-value", "");
  footer.append(textElement("strong", "", `${card.value}`));
  footer.setAttribute("aria-label", `Conversion value: ${card.value} Standing`);
  footer.title = `Convert for ${card.value} Standing`;
  fragment.append(footer);
  return { fragment, type };
}

// Visual hand state stays outside the rules/save state. Every play is resolved
// against fresh legal actions, including targeted cards and combat restrictions.
export function createCardHand(root, { onPlay, targetLabel, dropTarget }) {
  let context, expanded = false, selected = null, owner, drag = null;
  let suppressClickUntil = 0;
  root.classList.add("card-hand");
  const heading = textElement("div", "hand-heading", "");
  const toggle = textElement("button", "hand-toggle", "Your hand");
  toggle.type = "button";
  const counts = textElement("span", "hand-counts", "");
  heading.append(toggle, counts);
  const fan = textElement("div", "hand-fan", "");
  const controls = textElement("div", "hand-controls", "");
  const hint = textElement("p", "hand-hint", "");
  hint.setAttribute("aria-live", "polite");
  root.replaceChildren(heading, fan, controls, hint);
  toggle.onclick = () => { expanded = !expanded; selected = null; paint(); };
  function choices(index) {
    return context.actions.filter(a => a.type === "play" && a.index === index);
  }
  function play(index) {
    const available = choices(index);
    if (!available.length) return;
    const select = controls.dataset.index === String(index) ? controls.querySelector("select") : null;
    const action = available[Number(select?.value || 0)];
    selected = null;
    onPlay(action);
  }
  function collapse() { expanded = false; selected = null; paint(); }
  function paint() {
    if (!context) return;
    root.classList.toggle("is-expanded", expanded);
    root.classList.toggle("has-selection", selected !== null);
    toggle.textContent = `${context.playerLabel} · ${context.hand.length} cards ${expanded ? "−" : "+"}`;
    toggle.setAttribute("aria-expanded", String(expanded));
    counts.textContent = `Deck ${context.deckCount} · Discard ${context.discardCount}`;
    fan.replaceChildren(); controls.replaceChildren();
    controls.dataset.index = String(selected);
    const width = Math.min(root.parentElement.clientWidth - 24, window.innerWidth - 32, 1000);
    const cardWidth = window.innerWidth <= 600 ? 138 : 164;
    const count = context.hand.length;
    const spread = Math.min(cardWidth * 0.88, Math.max(12, (width - cardWidth) / Math.max(1, count - 1)));
    const fanWidth = count ? cardWidth + spread * (count - 1) : cardWidth;
    fan.style.setProperty("--fan-width", `${fanWidth}px`);
    fan.style.setProperty("--card-width", `${cardWidth}px`);
    context.hand.forEach((id, index) => {
      const card = cards[id], middle = index - (count - 1) / 2;
      const b = textElement("button", "game-card hand-card", "");
      b.type = "button";
      const {fragment, type} = cardFace(id);
      b.dataset.type = type;
      b.append(fragment);
      b.classList.toggle("is-selected", selected === index);
      b.classList.toggle("is-unavailable", !choices(index).length);
      b.setAttribute("aria-pressed", String(selected === index));
      b.setAttribute("aria-label", `${card.name}. ${describeCard(card).join(" ")} Convert for ${card.value} Standing. ${expanded ? selected === index ? "Activate again to play." : "Select card." : "Open your hand."}`);
      b.style.setProperty("--card-x", `${middle * (expanded ? spread : 5)}px`);
      b.style.setProperty("--card-angle", `${middle * (expanded ? Math.min(3, 18 / Math.max(1,count)) : 2)}deg`);
      b.style.setProperty("--card-y", `${expanded ? Math.abs(middle) * 3 : Math.abs(middle) * -1}px`);
      b.style.setProperty("--card-layer", selected === index ? count + 2 : index + 1);
      b.onclick = () => {
        if (Date.now() < suppressClickUntil) return;
        if (!expanded) { expanded = true; selected = null; paint(); }
        else if (selected === index) play(index);
        else { selected = index; paint(); fan.children[index]?.focus({preventScroll:true}); }
      };
      b.onpointerdown = event => startDrag(event, index, b);
      b.onkeydown = event => {
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          expanded = true;
          selected = (index + (event.key === "ArrowRight" ? 1 : count - 1)) % count;
          paint(); fan.children[selected]?.focus();
        }
      };
      fan.append(b);
    });
    if (!count) fan.append(textElement("p", "empty-hand", "Your hand is empty. End your turn to draw again."));
    hint.textContent = !count ? "" : !expanded ? "Click the stack to fan out your hand" : selected === null ? "Select a card · click outside to restack" : !choices(selected).length ? "This card cannot be played right now." : "Click the selected card again, or drag it onto the table to play";
    if (selected !== null && choices(selected).length) {
      const available = choices(selected);
      controls.append(textElement("span", "selected-card-name", cards[context.hand[selected]].name));
      if (available[0].tile) {
        const select = document.createElement("select");
        select.setAttribute("aria-label", "Card destination");
        available.forEach((a, i) => {
          const option = textElement("option", "", targetLabel(a));
          option.value = i; select.append(option);
        });
        controls.append(select);
      }
      const playButton = textElement("button", "play-card-button", "Play selected card");
      playButton.onclick = () => play(selected);
      controls.append(playButton);
    }
  }
  function finishDrag(event, cancelled = false) {
    if (!drag) return;
    const current = drag;
    drag = null;
    current.el.removeEventListener("pointermove", moveDrag);
    current.el.removeEventListener("pointerup", finishDrag);
    current.el.removeEventListener("pointercancel", cancelDrag);
    if (current.el.hasPointerCapture(current.pointerId)) current.el.releasePointerCapture(current.pointerId);
    current.ghost?.remove();
    const zone = dropTarget();
    zone?.classList.remove("card-drop-active");
    root.classList.remove("is-dragging");
    if (current.moved) {
      suppressClickUntil = Date.now() + 350;
      const bounds = zone?.getBoundingClientRect();
      const over = bounds && event.clientX >= bounds.left && event.clientX <= bounds.right && event.clientY >= bounds.top && event.clientY <= bounds.bottom;
      const handBounds = root.getBoundingClientRect();
      const overHand = event.clientX >= handBounds.left && event.clientX <= handBounds.right && event.clientY >= handBounds.top && event.clientY <= handBounds.bottom;
      if (!cancelled && over && !overHand) play(current.index);
      else paint();
    }
  }
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    if (!drag.moved && Math.hypot(event.clientX-drag.x, event.clientY-drag.y) < 9) return;
    event.preventDefault();
    if (!drag.moved) {
      drag.moved = true;
      // Keep the pointer-captured original mounted until the gesture ends.
      selected = drag.index;
      drag.ghost = drag.el.cloneNode(true);
      drag.ghost.className = "game-card drag-card";
      drag.ghost.removeAttribute("id");
      drag.ghost.setAttribute("aria-hidden", "true");
      (root.closest("dialog") || document.body).append(drag.ghost);
      root.classList.add("is-dragging");
      dropTarget()?.classList.add("card-drop-active");
    }
    drag.ghost.style.left = `${event.clientX}px`;
    drag.ghost.style.top = `${event.clientY}px`;
  }
  function cancelDrag(event) { finishDrag(event, true); }
  function startDrag(event, index, el) {
    if (!expanded || !choices(index).length || event.button !== 0) return;
    if (choices(index)[0].tile && selected !== index) return;
    drag = {index, el, pointerId:event.pointerId, x:event.clientX, y:event.clientY, moved:false};
    el.setPointerCapture(event.pointerId);
    el.addEventListener("pointermove", moveDrag);
    el.addEventListener("pointerup", finishDrag, {once:true});
    el.addEventListener("pointercancel", cancelDrag, {once:true});
  }
  document.addEventListener("click", event => {
    if (root.hidden) return;
    if (Date.now() < suppressClickUntil) {
      event.preventDefault(); event.stopImmediatePropagation(); return;
    }
    if (expanded && !root.contains(event.target)) {
      collapse(); event.preventDefault(); event.stopImmediatePropagation();
    }
  }, true);
  document.addEventListener("keydown", event => {
    if (!root.hidden && event.key === "Escape" && expanded) {
      event.preventDefault(); event.stopPropagation();
      if (drag) finishDrag({clientX:-1,clientY:-1},true);
      collapse(); toggle.focus();
    }
  });
  const resize = new ResizeObserver(() => { if (!drag) paint(); });
  resize.observe(root.parentElement);
  return {
    update(next) {
      if (drag) finishDrag({clientX:-1,clientY:-1},true);
      if (owner !== next.owner) expanded = false;
      owner = next.owner; context = next; selected = null; paint();
    },
    reset() { collapse(); owner = undefined; },
  };
}
