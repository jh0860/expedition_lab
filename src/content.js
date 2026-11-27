// Provisional playtest values. Change these before changing engine code.
export const defaults = {
  seed: 42,
  players: 2,
  radius: 2,
  goal: 50,
  movement: 0,
  takeoverCost: 2,
  carry: 20,
};
export const cards = {
  wander: { name: "Wander", movement: 1, value: 1 },
  strike: { name: "Strike", power: 1, value: 1 },
  barter: { name: "Barter", treasure: 1, value: 1 },
  hike: { name: "Hike", movement: 2, value: 3 },
  supplyCache: { name: "Supply Cache", health: 2, value: 3 },
  wildMight: { name: "Wild Might", power: 2, value: 3 },
  trinket: { name: "Trinket", treasure: 5, destroyOnPlay: true, value: 7 },
  arcanePassage: { name: "Arcane Passage", teleport: "guild", value: 5 },
  healer: { name: "Healer", health: 5, value: 5 },
  magicalImbuement: {
    name: "Magical Imbuement",
    movement: 3,
    power: 1,
    value: 5,
  },
  alchemy: { name: "Alchemy", treasure: 2, value: 5 },
  preciousCache: { name: "Precious Cache", treasure: 5, value: 10 },
  relic: { name: "Relic", treasure: 20, destroyOnPlay: true, value: 25 },
  ancientBlessing: {
    name: "Ancient Blessing",
    power: 5,
    health: 5,
    movement: 5,
    value: 10,
  },
};
export const marketDeck = [
  "timeLord",
  "journey",
  "omnipotence",
  "strikeItRich",
  "seizeControl",
  "banker",
];
Object.assign(cards, {
  timeLord: {
    name: "Time Lord",
    extraTurn: true,
    cost: 4,
    value: 4,
    singleUse: true,
  },
  journey: { name: "Journey", movement: 5, cost: 3, value: 3, singleUse: true },
  omnipotence: {
    name: "Omnipotence",
    draw: 3,
    cost: 3,
    value: 3,
    singleUse: true,
  },
  strikeItRich: {
    name: "Strike It Rich",
    treasure: 10,
    cost: 5,
    value: 5,
    singleUse: true,
  },
  seizeControl: {
    name: "Seize Control",
    seize: true,
    cost: 4,
    value: 4,
    singleUse: true,
  },
  banker: {
    name: "Banker",
    remoteBanking: true,
    cost: 3,
    value: 3,
    singleUse: true,
  },
});
export const startingDeck = [
  ...Array(5).fill("wander"),
  ...Array(2).fill("strike"),
  ...Array(3).fill("barter"),
];
export const troops = {
  standard: { power: 1, health: 2, movement: 0 },
  scout: { power: 1, health: 2, movement: 1 },
  fighter: { power: 2, health: 3, movement: 0 },
};
export const hazards = new Set(["dark", "black"]);
export const resources = {
  forage: ["hike", "supplyCache", "wildMight", "trinket"],
  guild: ["arcanePassage", "healer", "magicalImbuement", "alchemy"],
  mine: ["preciousCache", "relic", "ancientBlessing"],
};

// Site bonuses are independent; troop labels are retained only for compatibility.
export function playerStats(p) {
  return {
    power: 1 + (p.camp ? 1 : 0),
    health: 2 + (p.camp ? 1 : 0),
    movement: p.recruitSite ? 1 : 0,
  };
}
export function bonusKey(p) {
  return p.recruitSite
    ? p.camp ? "scout+fighter" : "scout"
    : p.camp ? "fighter" : "standard";
}
