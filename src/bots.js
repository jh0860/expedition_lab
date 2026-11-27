import { cards, playerStats, resources, hazards } from "./content.js";

// Strategy weights are provisional. Decisions are deterministic and use no RNG.
export const botStrategies = {
  courier: {
    name: "Courier",
    description: "Build an expedition engine, then convert aggressively",
    bankAt: 2,
    homeValue: 3,
    risk: 0,
    forage: 12,
    guild: 8,
    mine: 8,
    training: 1,
    recruit: 1,
    fight: 2,
    keep: { hike: 1 },
  },
  builder: {
    name: "Builder",
    description: "Keep upgrades, recruit Scout, secure a Camp",
    bankAt: 8,
    homeValue: 8,
    risk: 0,
    forage: 9,
    guild: 14,
    mine: 12,
    training: 22,
    recruit: 24,
    fight: 3,
    keep: {
      hike: 2,
      magicalImbuement: 2,
      ancientBlessing: 2,
      arcanePassage: 1,
      wildMight: 1,
      healer: 1,
      alchemy: 1,
    },
  },
  delver: {
    name: "Delver",
    description: "Fighter bonus, combat preparation and Mine expeditions",
    bankAt: 10,
    homeValue: 10,
    risk: 0.5,
    forage: 7,
    guild: 12,
    mine: 28,
    training: 24,
    recruit: 10,
    fight: 12,
    keep: {
      hike: 2,
      wildMight: 2,
      healer: 2,
      supplyCache: 1,
      ancientBlessing: 2,
      magicalImbuement: 1,
      arcanePassage: 1,
      preciousCache: 1,
    },
  },
  opportunist: {
    name: "Opportunist",
    description: "Contest Camps, exploit trails and Guild travel",
    bankAt: 6,
    homeValue: 7,
    risk: 0.5,
    forage: 9,
    guild: 18,
    mine: 15,
    training: 19,
    recruit: 12,
    fight: 7,
    keep: {
      hike: 1,
      magicalImbuement: 2,
      ancientBlessing: 1,
      arcanePassage: 2,
      wildMight: 1,
      healer: 1,
      alchemy: 1,
    },
  },
};

botStrategies.courierAggressive = {
  ...botStrategies.courier,
  name: "Courier — aggressive (legacy)",
  description: "Convert aggressively from the outset, without an investment phase",
};

botStrategies.courierReplacement = {
  ...botStrategies.courier,
  name: "Courier — replacements",
  description: "Convert treasure cards and weaker cards covered by upgrades",
};

export function courierPlan(s, p) {
  if (p.courierPhase === "convert") return "convert";
  const owned = [...p.hand, ...p.deck, ...p.discard].filter(
    (id) => !cards[id].singleUse,
  );
  const energy = owned.reduce((n, id) => n + (cards[id].movement || 0), 0);
  const income = owned.filter(id => !cards[id].destroyOnPlay).reduce((n, id) => n + (cards[id].treasure || 0), 0);
  const ready =
    energy >= 8 && income >= 5 && Boolean(p.recruitSite || p.camp);
  const close =
    p.bank >= 0.6 * s.config.goal ||
    p.bank + p.treasure >= s.config.goal ||
    [...p.hand, ...p.deck, ...p.discard].some(
      (id) => p.bank + cards[id].value >= s.config.goal,
    );
  const pressure = s.players.some(
    (other) => other !== p && other.bank >= 0.8 * s.config.goal,
  );
  return ready || close || pressure ? "convert" : "invest";
}
const courierInvestment = {
  bankAt: 8,
  homeValue: 7,
  forage: 12,
  guild: 18,
  mine: 14,
  training: 16,
  recruit: 20,
  fight: 8,
  keep: {
    hike: 2,
    magicalImbuement: 2,
    ancientBlessing: 1,
    alchemy: 1,
    preciousCache: 1,
    wildMight: 1,
    supplyCache: 1,
    healer: 1,
    arcanePassage: 1,
  },
};

const effectKeys = ["movement", "power", "health", "treasure"];
const hasEffect = (id) =>
  !cards[id].destroyOnPlay && (cards[id].teleport || effectKeys.some((key) => cards[id][key]));
function upgrades(better, weaker) {
  if (!hasEffect(weaker) || cards[weaker].teleport || cards[better].teleport)
    return false;
  return (
    effectKeys.every(
      (key) => (cards[better][key] || 0) >= (cards[weaker][key] || 0),
    ) &&
    effectKeys.some(
      (key) => (cards[better][key] || 0) > (cards[weaker][key] || 0),
    )
  );
}
// Each stronger copy covers one removed copy. Deposited intermediate upgrades
// can support a replacement chain, but strict improvement prevents cycles.
function coversReplacements(owned, removed) {
  const tokens = [...owned, ...removed];
  const assigned = new Map();
  function match(id, seen) {
    for (let i = 0; i < tokens.length; i++) {
      if (seen.has(i) || !upgrades(tokens[i], id)) continue;
      seen.add(i);
      if (!assigned.has(i) || match(assigned.get(i), seen)) {
        assigned.set(i, id);
        return true;
      }
    }
    return false;
  }
  return removed.every((id) => match(id, new Set()));
}
export function courierDeposits(p) {
  const owned = [...p.hand, ...p.deck, ...p.discard].filter(
    (id) => !cards[id].singleUse,
  );
  const history = (p.courierReplacements || []).filter(hasEffect);
  const selected = owned.filter((id) => !hasEffect(id));
  const candidates = owned
    .filter(hasEffect)
    .sort((a, b) =>
      effectKeys.reduce(
        (n, key) => n + (cards[a][key] || 0) - (cards[b][key] || 0),
        0,
      ),
    );
  let remaining = [...owned];
  let movement = owned.reduce((n, id) => n + (cards[id].movement || 0), 0);
  const removed = [...history];
  for (const id of candidates) {
    if (cards[id].movement && movement - cards[id].movement < 5) continue;
    const next = [...remaining];
    next.splice(next.indexOf(id), 1);
    if (coversReplacements(next, [...removed, id])) {
      selected.push(id);
      removed.push(id);
      remaining = next;
      movement -= cards[id].movement || 0;
    }
  }
  return selected;
}

export function chooseStrategy(s, actions, strategy) {
  const baseProfile = botStrategies[strategy];
  if (!baseProfile) throw Error(`Unknown bot strategy: ${strategy}`);
  const p = s.players[s.active];
  const investing = strategy === "courier" && courierPlan(s, p) === "invest";
  const profile = investing
    ? { ...baseProfile, ...courierInvestment }
    : baseProfile;
  const isCourier = ["courier", "courierAggressive", "courierReplacement"].includes(strategy);
  const depositedId = (a) => p[a.zone || "hand"][a.index];
  const all = [...p.hand, ...p.deck, ...p.discard];
  const count = (id) => all.filter((card) => card === id).length;
  const totalMovement = all
    .filter((id) => !cards[id].singleUse)
    .reduce((n, id) => n + (cards[id].movement || 0), 0);
  const spendable =
    p.treasure +
    p.hand.reduce((n, id) => n + (cards[id].treasure || 0), 0);
  const canDeposit = (id) => {
    if (cards[id].singleUse) return p.bank + cards[id].value >= s.config.goal;
    if (p.bank + p.treasure + cards[id].value >= s.config.goal) return true;
    // Keep a functioning travel deck until the final scoring push.
    if (cards[id].movement && totalMovement - cards[id].movement < 5)
      return false;
    if (cards[id].value === 1) return id !== "wander"; // trim starter combat/income only near the finish
    return count(id) > (profile.keep[id] || 0);
  };
  const depositable =
    strategy === "courierReplacement"
      ? [
          ...courierDeposits(p),
          ...all.filter(
            (id) =>
              cards[id].singleUse && p.bank + cards[id].value >= s.config.goal,
          ),
        ]
      : all.filter(
          (id) =>
            canDeposit(id) &&
            (cards[id].value > 1 || p.bank >= s.config.goal - 5),
        );
  const depositValue = depositable.reduce((n, id) => n + cards[id].value, 0);
  const deposit = actions
    .filter((a) => a.type === "deposit" && depositable.includes(depositedId(a)))
    .sort(
      (a, b) => cards[depositedId(b)].value - cards[depositedId(a)].value,
    )[0];
  const bank = actions.find((a) => a.type === "bank");
  const convertTreasureNow =
    !investing ||
    p.bank + p.treasure >= s.config.goal ||
    p.treasure >= s.config.carry;
  if (bank && convertTreasureNow) return bank;
  if (deposit) {
    const id = depositedId(deposit),
      card = cards[id];
    // A numeric-effect card can be used before its permanent deposit. A
    // teleport would leave base, so never trigger it merely to cash it out.
    if (
      !deposit.zone &&
      !card.teleport &&
      !card.singleUse &&
      !card.destroyOnPlay &&
      p.bank + card.value < s.config.goal &&
      (card.movement || card.power || card.health || card.treasure)
    ) {
      const play = actions.find(
        (a) => a.type === "play" && a.index === deposit.index && !a.tile,
      );
      if (play) return play;
    }
    return deposit;
  }
  const plays = actions.filter((a) => a.type === "play");
  const playWhere = (predicate) =>
    plays.find(
      (a) =>
        !cards[p.hand[a.index]].teleport &&
        predicate(cards[p.hand[a.index]], a),
    );
  const timeLord = playWhere((card) => card.extraTurn);
  if (timeLord) return timeLord;
  const drawCards = playWhere((card) => card.draw);
  if (drawCards) return drawCards;
  if (s.encounter) {
    // Only spend enough combat cards to guarantee victory; retain Energy/treasure
    // in hand until the world window returns (unless attached to a needed buff).
    const strikes = Math.ceil(
      s.encounter.health / (playerStats(p).power + s.turn.power),
    );
    const hits = Math.ceil(
      (playerStats(p).health + s.turn.health) / s.encounter.power,
    );
    if (strikes >= hits) {
      const buff = playWhere((card) => card.power || card.health);
      if (buff) return buff;
    }
    return actions.find((a) => a.type === "resolveCombat");
  }
  const atBase = p.position === `t:${p.base}`;
  const riches = playWhere(
    (card) =>
      card.treasure &&
      s.config.carry - p.treasure >= card.treasure &&
      (!card.destroyOnPlay ||
        (!atBase &&
          !s.turn.remoteBanking &&
          p.bank + card.value < s.config.goal &&
          !p.hand.some((id) => cards[id].remoteBanking))),
  );
  if (riches) return riches;
  const banker = playWhere((card) => card.remoteBanking);
  const potentialMove =
    s.turn.movement +
    p.hand.reduce((n, id) => n + (cards[id].movement || 0), 0);
  if (
    banker &&
    !atBase &&
    !s.turn.remoteBanking &&
    ((p.treasure >= profile.bankAt && convertTreasureNow) ||
      p.bank + p.treasure >= s.config.goal ||
      (depositValue >= profile.homeValue && potentialMove > 0))
  )
    return banker;
  const desiredTroop = "scout";
  const seize = plays
    .filter((a) => cards[p.hand[a.index]].seize)
    .map((a) => {
      const tile = s.board.tiles[a.tile],
        owner = s.owners[a.tile];
      const rival = owner !== undefined && owner !== s.active;
      if (tile.type === "recruit" && a.troop !== desiredTroop)
        return { a, score: 0 };
      const gain =
        tile.type === "training"
          ? !p.camp
          : !p.recruitSite;
      return {
        a,
        score:
          (gain ? 25 : 0) +
          (rival ? (strategy === "opportunist" ? 20 : 10) : 0),
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)[0];
  if (seize) return seize.a;
  const mayRecruit = (id) => {
    const owner = s.owners[id];
    if (owner === s.active) return false;
    return (
      !p.recruitSite || (strategy === "opportunist" && owner !== undefined)
    );
  };
  const recruit = actions.find(
    (a) =>
      a.type === "recruit" &&
      a.troop === desiredTroop &&
      mayRecruit(p.position.slice(2)),
  );
  const claim = actions.find((a) => a.type === "claim");
  if ((!isCourier || investing) && recruit) return recruit;
  const mayClaim = (tileId) =>
    !p.camp ||
    (strategy === "opportunist" &&
      s.owners[tileId] !== undefined &&
      s.owners[tileId] !== s.active);
  if (claim && mayClaim(p.position.slice(2))) return claim;
  const incomeCard = playWhere((card) => card.treasure && !card.destroyOnPlay && !card.singleUse && p.treasure < s.config.carry);
  const onRecruit =
    p.position.startsWith("t:") &&
    s.board.tiles[p.position.slice(2)].type === "recruit";
  const onCamp =
    p.position.startsWith("t:") &&
    s.board.tiles[p.position.slice(2)].type === "training";
  const atMarket =
    !p.position.startsWith("t:") &&
    s.board.vertices[p.position].tiles.some(
      (id) => s.board.tiles[id].type === "market",
    );
  const marketPriorities = investing
    ? {
        banker: 20,
        journey: 22,
        timeLord: 24,
        omnipotence: 24,
        strikeItRich: 24,
        seizeControl: 28,
      }
    : isCourier
      ? {
          banker: 28,
          journey: 20,
          timeLord: 24,
          omnipotence: 20,
          strikeItRich: 28,
          seizeControl: 18,
        }
      : strategy === "opportunist"
        ? {
            banker: 24,
            journey: 20,
            timeLord: 26,
            omnipotence: 22,
            strikeItRich: 24,
            seizeControl: 32,
          }
        : strategy === "delver"
          ? {
              banker: 26,
              journey: 24,
              timeLord: 24,
              omnipotence: 24,
              strikeItRich: 24,
              seizeControl: 18,
            }
          : {
              banker: 20,
              journey: 20,
              timeLord: 28,
              omnipotence: 26,
              strikeItRich: 22,
              seizeControl: 26,
            };
  const marketOptions = s.market.offers.filter(
    (id) => id && cards[id].cost <= spendable,
  );
  const wantsPurchase =
    marketOptions.length > 0 && p.bank + p.treasure < s.config.goal;
  if (
    incomeCard &&
    ((onRecruit &&
      (!isCourier || investing) &&
      mayRecruit(p.position.slice(2)) &&
      spendable >= 3) ||
      (onCamp &&
        s.owners[p.position.slice(2)] !== s.active &&
        mayClaim(p.position.slice(2)) &&
        spendable >= s.config.takeoverCost) ||
      (atMarket && wantsPurchase))
  )
    return incomeCard;
  const buy = actions
    .filter((a) => a.type === "buy")
    .sort(
      (a, b) =>
        marketPriorities[s.market.offers[b.index]] -
        marketPriorities[s.market.offers[a.index]],
    )[0];
  if (buy && wantsPurchase) return buy;
  // At home, generate Movement before consuming a valuable card for its effect.
  if (
    (atBase || s.turn.remoteBanking) &&
    all.some((id) => depositable.includes(id))
  ) {
    const move = playWhere((card) => card.movement);
    if (move) return move;
  }
  // All owned cards are available at base. If no Movement can be generated,
  // end the turn here rather than leaving and routing back to the same goal.
  if ((atBase || s.turn.remoteBanking) && depositable.length)
    return { type: "end" };

  const power =
    playerStats(p).power +
    s.turn.power +
    p.hand.reduce((n, id) => n + (cards[id].power || 0), 0);
  const health =
    playerStats(p).health +
    s.turn.health +
    p.hand.reduce((n, id) => n + (cards[id].health || 0), 0);
  const allowedFight = (type) => {
    const attacks = Math.ceil((type === "black" ? 6 : 3) / power);
    const hits = Math.ceil(health / (type === "black" ? 3 : 1));
    return profile.risk ? attacks <= hits : attacks < hits;
  };
  const urgentHome =
    p.bank + p.treasure + depositValue >= s.config.goal ||
    p.treasure >= s.config.carry;
  const returnHome =
    urgentHome ||
    p.treasure >= profile.bankAt ||
    depositValue >= profile.homeValue;
  const targetValue = (tile) => {
    if (tile.id === p.base)
      return returnHome
        ? urgentHome
          ? 1000
          : 35
        : p.treasure || depositValue
          ? 2
          : 0;
    if (urgentHome) return 0;
    if (resources[tile.type] && !p.visited.includes(tile.id))
      return profile[tile.type];
    if (
      tile.type === "training" &&
      s.owners[tile.id] !== s.active &&
      mayClaim(tile.id) &&
      (s.owners[tile.id] === undefined || spendable >= s.config.takeoverCost)
    )
      return (
        profile.training +
        (strategy === "opportunist" && s.owners[tile.id] !== undefined ? 8 : 0)
      );
    if (
      tile.type === "recruit" &&
      mayRecruit(tile.id) &&
      spendable >= 3 &&
      (!isCourier || investing)
    )
      return (
        profile.recruit +
        (strategy === "opportunist" &&
        s.owners[tile.id] !== undefined &&
        s.owners[tile.id] !== s.active
          ? 8
          : 0)
      );
    if (
      hazards.has(tile.type) &&
      !s.cleared.includes(tile.id) &&
      allowedFight(tile.type)
    )
      return profile.fight;
    return 0;
  };
  const tiles = Object.values(s.board.tiles);
  const blocked = (vertex) =>
    !s.board.vertices[vertex].tiles.some((id) => s.board.tiles[id].town) &&
    s.players.some((other, i) => i !== s.active && other.position === vertex);
  const neighbors = (at) =>
    at.startsWith("t:")
      ? s.board.tiles[at.slice(2)].vertices
          .filter((id) => !blocked(id))
          .map((to) => ({ at: to, action: { type: "exit", to }, cost: 1 }))
      : [
          ...s.board.vertices[at].neighbors
            .filter((id) => !blocked(id))
            .map((to) => ({ at: to, action: { type: "move", to }, cost: 1 })),
          ...s.board.vertices[at].tiles
            .filter((id) => {
              const tile = s.board.tiles[id];
              return (
                tile.type !== "mountain" &&
                (!hazards.has(tile.type) ||
                  s.cleared.includes(id) ||
                  allowedFight(tile.type))
              );
            })
            .map((id) => ({
              at: `t:${id}`,
              action: { type: "enter", tile: id },
              cost: 1,
            })),
        ];
  // Dijkstra distances use the same Movement cost for every tile. Teleports are
  // candidate first steps, so their destinations compete with walking routes.
  const queue = [{ at: p.position, cost: 0, first: null }];
  const bestCost = new Map();
  for (const a of plays.filter((a) => cards[p.hand[a.index]].teleport))
    queue.push({ at: `t:${a.tile}`, cost: 0.25, first: a });
  let best = null;
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const node = queue.shift();
    if (bestCost.has(node.at) && bestCost.get(node.at) <= node.cost) continue;
    bestCost.set(node.at, node.cost);
    if (
      node.at.startsWith("t:") ||
      (wantsPurchase &&
        !urgentHome &&
        s.board.vertices[node.at]?.tiles.some(
          (id) => s.board.tiles[id].type === "market",
        ))
    ) {
      const value = node.at.startsWith("t:")
        ? targetValue(s.board.tiles[node.at.slice(2)])
        : Math.max(...marketOptions.map((id) => marketPriorities[id]));
      const score = value / (node.cost + 2);
      if (value > 0 && node.first && (!best || score > best.score))
        best = { score, action: node.first };
    }
    for (const step of neighbors(node.at)) {
      if (
        bestCost.has(step.at) &&
        bestCost.get(step.at) <= node.cost + step.cost
      )
        continue;
      queue.push({
        at: step.at,
        cost: node.cost + step.cost,
        first: node.first || step.action,
      });
    }
  }
  if (best) {
    const exact = actions.find(
      (a) => JSON.stringify(a) === JSON.stringify(best.action),
    );
    if (exact) return exact;
    const movement = playWhere((card) => card.movement);
    if (movement) return movement;
  }
  return { type: "end" };
}
