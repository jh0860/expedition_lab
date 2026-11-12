# Working prototype decisions

## Implemented baseline

One troop per player. Baseline 3 Movement, 2 Focus and five cards in hand. Vertex travel costs Movement. Entry and exit cost Focus. Mountains are impassable and edges between two mountain/hazard tiles are blocked. Town has unrestricted occupancy. Other vertices hold one troop.

Resource sites grant one card per player into the discard pile. Cards can be played or permanently deposited from hand at home. Inventory travels with the troop. Banked treasure is secure. Defeat returns the same troop home, removes carried treasure, preserves its upgrade and deck, and ends the turn with normal hand cleanup.

Cleared hazards stay cleared globally. Once per turn, entry into a cleared forest allows an immediate free exit. The UI asks which exit vertex to use. Cleared terrain still blocks the same edges.

Training Camps grant +1 Focus while owned. First claim is free after entering. Taking an owned Camp costs 2 carried treasure paid to the supply. Each player owns at most one. Ownership survives defeat. Switching Camps cannot repeatedly generate extra Focus in one turn.

Unique troops replace the active profile. Scout gives +1 Focus. Fighter gives +1 Power and +1 Health. Camp ownership is a separate benefit.

## Provisional implementation choices

The default test map has 19 flowers (133 hexes) and the full map has 37. The former seven-flower size remains supported by the engine for older saves. Geometry follows the uploaded HTML's offset basis (-3,1) and (-2,3). Wilderness content distribution is simplified and uses repeated Forage, Camp, Recruit, Guild and Mine flowers rather than the design document's 25-flower draw pool. Mines in the small map permit frontier testing without long journeys.

The target is 20 treasure for the tiny content set. The design document's provisional 100 remains a later calibration target. Six card definitions are provided. Starting cards are four Stride, three Prepare and three Strike. Each resource has one repeatable card definition. The market offers Nature cards for 4 carried treasure with unlimited stock. Recruitment costs 3 carried treasure and allows Scout/Fighter selection. These prices and selection rules are scaffolding.

Camp upgrades affect the current turn on first acquisition and future turns while held. Recruit Focus changes affect remaining actions immediately. Encounter monsters have Speed 2 like troops, so a seeded coin flip determines initiative. Dark encounters use 1 Power/3 Health and award 2 treasure. Black encounters use 3 Power/6 Health and award 5. Played Power lasts through the turn. Loot beyond capacity is discarded in this prototype. Treasure lost on defeat is removed.

## Next implementation work

Starting draft and Key Cards, actual resource decks and trailblazer top-three selection, finite markets, equipment and non-treasure items, Bounties, dropped loot, richer troop rosters, and more capable bots remain to implement. There is no claim that these placeholder cards or bots establish balance. Full-board travel and deadlocks need broader playtesting.

## Tabled design systems

Multiple troops, roaming monsters, raiding and defenses, Cave/Chest/Artifact, Clock and day/night events, fog of war, and the proposed rival-progress commission bonus.
