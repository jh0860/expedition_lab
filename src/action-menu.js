import { cards } from "./content.js";

const terrainNames = { town:"Town", forest:"Forest", dark:"Dark Forest", black:"Black Forest", mountain:"Mountain", forage:"Foraging Site", guild:"Guild", mine:"Mine", training:"Training Camp", recruit:"Recruitment Site", market:"Marketplace" };
export const travelKey = a => a.type === "enter" ? `tile:${a.tile}` : `vertex:${a.to}`;
export function travelDescription(state, action) {
  const p=state.players[state.active];
  if (action.type === "enter") return `Enter ${terrainNames[state.board.tiles[action.tile].type]}`;
  const from=p.position.startsWith("t:") ? state.board.tiles[p.position.slice(2)] : state.board.vertices[p.position];
  const to=state.board.vertices[action.to];
  const direction=["East","Southeast","South","Southwest","West","Northwest","North","Northeast"][(Math.round(Math.atan2(to.y-from.y,to.x-from.x)*4/Math.PI)+8)%8];
  return `${action.type === "exit" ? "Exit" : "Move"} ${direction}`;
}
export function renderActionMenu(root, state, actions, {onAction, label}) {
  root.replaceChildren();
  const p=state.players[state.active];
  const addGroup=(title, rows) => {
    if(!rows.length) return;
    const group=document.createElement("section");
    const heading=document.createElement("h3"); heading.textContent=title; group.append(heading);
    for(const {action, text, note, key} of rows) {
      const button=document.createElement("button"); button.className="action-menu-option";
      button.type="button";
      const name=document.createElement("span"); name.textContent=text;
      const detail=document.createElement("small"); detail.textContent=note;
      button.append(name,detail);
      if(key) button.dataset.travelKey=key;
      button.onclick=()=>onAction(action);
      group.append(button);
    }
    root.append(group);
  };
  const travel=actions.filter(a=>["move","exit","enter"].includes(a.type));
  addGroup("Travel · hover or focus to preview",travel.map(a=>({
    action:a,text:travelDescription(state,a),key:travelKey(a),
    note:a.type === "enter" ? "Tile center · 1 Energy" : `${[...new Set(state.board.vertices[a.to].tiles.map(id=>terrainNames[state.board.tiles[id].type]))].join(" / ")} · 1 Energy`,
  })));
  addGroup("At your location",actions.filter(a=>["claim","recruit","buy","bank"].includes(a.type)).map(a=>({action:a,text:label(a),note:a.type === "bank" ? `${p.treasure} treasure becomes Standing` : ""})));
  const conversions=new Map();
  for(const action of actions.filter(a=>a.type === "deposit")) {
    const zone=action.zone || "hand", id=p[zone][action.index], key=`${zone}:${id}`;
    if(conversions.has(key)) conversions.get(key).copies++;
    else conversions.set(key,{action,id,zone,copies:1});
  }
  addGroup("Convert a card",[...conversions.values()].sort((a,b)=>a.zone.localeCompare(b.zone)||cards[a.id].name.localeCompare(cards[b.id].name)).map(({action,id,zone,copies})=>({
    action,text:`${cards[id].name} · ${cards[id].value} Standing`,note:`${{hand:"Hand",discard:"Discard",deck:"Draw pile"}[zone]}${copies>1?` · ${copies} copies available`:""} · 1 Energy`,
  })));
  if (!root.children.length) {
    const message=document.createElement("p"); message.className="action-menu-empty";
    message.textContent=state.winner !== null ? "The expedition is complete." : state.encounter ? "Prepare your cards and resolve combat first." : "Play a card for Energy to travel or convert cards.";
    root.append(message);
  }
}
