// Provisional playtest values. Change these before changing engine code.
export const defaults = {
  seed: 42,
  players: 2,
  radius: 1,
  goal: 20,
  movement: 3,
  focus: 2,
  takeoverCost: 2,
  carry: 20,
};
export const cards = {
  stride: { name: "Stride", movement: 2, value: 0 },
  prepare: { name: "Prepare", focus: 1, value: 0 },
  strike: { name: "Strike", power: 2, value: 0 },
  nature: { name: "Woodland lore", movement: 2, value: 3 },
  sorcery: { name: "Arcane passage", focus: 2, value: 6 },
  mine: { name: "Deep silver", power: 3, value: 10 },
};
export const troops = {
  standard: { power: 1, health: 2, focus: 0 },
  scout: { power: 1, health: 2, focus: 1 },
  fighter: { power: 2, health: 3, focus: 0 },
};
export const hazards = new Set(["dark", "black"]);
export const resources = { forage: "nature", guild: "sorcery", mine: "mine" };
