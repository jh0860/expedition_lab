import { playerStats } from "./content.js";

const icons = {
  energy: '<path d="m14 2-9 12h6l-1 8 9-12h-6z"/>',
  power: '<path d="m7 17 11-12 3-2v4L10 20m-5-8 7 7m-5-2-4 4"/>',
  health: '<path d="M12 21S2 15 2 8a5 5 0 0 1 10-1 5 5 0 0 1 10 1c0 7-10 13-10 13Z"/>',
  treasure: '<path d="M3 10V7a9 5 0 0 1 18 0v14H3Zm0 0h18M7 3v18M17 3v18m-7-11v5h4v-5"/>',
  cards: '<path d="M7 7h14v15H7zM3 17V3h14M10 11h8m-8 4h6"/>',
};
function node(tag, className, text) {
  const el = document.createElement(tag);
  el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}
function icon(name) {
  const el=node("span",`expedition-icon icon-${name}`);
  el.innerHTML=`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
  return el;
}
export function renderExpedition(root, state, color) {
  const p=state.players[state.active], stats=playerStats(p);
  root.replaceChildren();
  root.style.setProperty("--expedition-player", color);
  const heading=node("div","expedition-owner");
  heading.append(node("strong","",`Player ${state.active+1}`));
  const bonuses=node("span","expedition-bonuses");
  for (const [owned,label,title] of [
    [p.recruitSite,"Scout","Recruitment Site: +1 Energy each turn"],
    [p.camp,"Fighter","Training Camp: +1 Power and +1 Health"],
  ]) if(owned) {
    const badge=node("span","expedition-badge",label);
    badge.title=title; bonuses.append(badge);
  }
  if (!bonuses.children.length) bonuses.append(node("span","expedition-standard","Standard troop"));
  heading.append(bonuses); root.append(heading);

  const resources=node("dl","expedition-resources");
  for (const [name,label,value,bonus] of [
    ["energy","Energy",state.turn.movement,0],
    ["power","Power",stats.power+state.turn.power,state.turn.power],
    ["health","Health",stats.health+state.turn.health,state.turn.health],
  ]) {
    const cell=node("div",`expedition-stat stat-${name}`);
    const term=node("dt",""); term.append(icon(name),node("span","",label));
    const amount=node("dd","",String(value));
    const note=node("span","expedition-stat-note",name === "energy" ? "Available" : bonus ? `+${bonus} from cards` : name === "power" ? "Per attack" : "Per encounter");
    cell.append(term,amount,note); resources.append(cell);
  }
  root.append(resources);

  const purse=node("div","expedition-purse");
  const purseTop=node("div","expedition-purse-heading");
  const purseLabel=node("span",""); purseLabel.append(icon("treasure"),node("span","","Carried treasure"));
  const purseValue=node("span","expedition-treasure-value");
  purseValue.append(node("strong","",String(p.treasure)),node("span","",` / ${state.config.carry}`));
  purseTop.append(purseLabel,purseValue);
  const meter=node("div","expedition-capacity");
  meter.setAttribute("role","meter"); meter.setAttribute("aria-label","Treasure carrying capacity");
  meter.setAttribute("aria-valuemin","0"); meter.setAttribute("aria-valuemax",String(state.config.carry)); meter.setAttribute("aria-valuenow",String(p.treasure));
  const fill=node("span",""); fill.style.width=`${Math.min(100,p.treasure/state.config.carry*100)}%`; meter.append(fill);
  purse.append(purseTop,meter); root.append(purse);

  const piles=node("dl","expedition-piles");
  for(const [label,count] of [["Hand",p.hand.length],["Draw pile",p.deck.length],["Discard",p.discard.length]]) {
    const cell=node("div",""); cell.append(node("dt","",label),node("dd","",String(count))); piles.append(cell);
  }
  const pileHeading=node("div","expedition-pile-heading"); pileHeading.append(icon("cards"),node("span","","Your cards"));
  root.append(pileHeading,piles);
  if (state.turn.remoteBanking) {
    const effect=node("div","expedition-active-effect","Banker active · Convert anywhere this turn"); root.append(effect);
  }
  if (p.bot === "courier") {
    const plan=node("div","expedition-plan");
    plan.append(node("span","","Courier plan"),node("span","",p.courierPhase === "convert" ? "Converting" : "Investing")); root.append(plan);
  }
}
