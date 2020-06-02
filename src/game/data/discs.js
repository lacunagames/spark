const biomes = [
  {
    id: 'forest',
    name: 'Forest',
    popGrow: 1,
  },
  {
    id: 'jungle',
    name: 'Jungle',
    popGrow: 0.8,
  },
  {
    id: 'desert',
    name: 'Desert',
    popGrow: 0.6,
  },
  {
    id: 'grassland',
    name: 'Grassland',
    popGrow: 1.1,
  },
  {
    id: 'mountain',
    name: 'Mountain',
    popGrow: 0.8,
  },
  {
    id: 'swamp',
    name: 'Swamp',
    popGrow: 9.8,
  },
];

const knowledges = [
  {
    id: 'tribal',
    name: 'Tribal tradition',
    actionGrow: 0.5,
  },
  {
    id: 'oligarchy',
    name: 'Oligarchy',
    actionGrow: 0.75,
  },
];

const actions = [
  {
    id: 'hunting',
    name: 'Hunting',
    xpGrow: 0.1,
    actionGrow: -0.25,
    modifyDisc: [
      { disc: 'tiger', chance: 0.3, popGrowMultiply: 0 },
      { disc: 'dragon', chance: 0.15, popGrowMultiply: 0 },
    ],
    skill: 'fire',
    category: 'fire',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
  },
  {
    id: 'fishing',
    name: 'Fishing',
    actionGrow: -0.25,
    popGrow: 0.25,
    skill: 'water',
    category: 'water',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
  },
  {
    id: 'gathering',
    name: 'Gathering',
    actionGrow: -0.25,
    popGrow: 0.25,
    skill: 'air',
    category: 'air',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
  },
  {
    id: 'digging',
    name: 'Digging',
    xpGrow: 1.1,
    actionGrow: -0.25,
    skill: 'earth',
    category: 'earth',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
  },
  {
    id: 'mining',
    name: 'Mining',
    xpGrow: 0.2,
    actionGrow: -0.25,
    upgrades: 'digging',
  },
  {
    id: 'town',
    name: 'Town',
    actionGrow: -0.25,
    popGrow: 0.3,
    maxPopBoost: 4,
  },
];

const events = [
  {
    id: 'tiger',
    name: 'Tiger',
    xpGrow: 0.2,
    popGrow: -3,
  },
  {
    id: 'landslide',
    name: 'Landslide',
    xpGrow: 0.2,
    popGrow: -3,
    skill: 'earth',
    category: 'earth',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
    desc: 'Bla bla something',
  },
  {
    id: 'dragon',
    name: 'Dragon',
    xpGrow: 0.5,
    popGrow: -9,
  },
];

export default [
  ...biomes.map(disc => ({ ...disc, type: 'biome' })),
  ...knowledges.map(disc => ({ ...disc, type: 'knowledge' })),
  ...actions.map(disc => ({ ...disc, type: 'action' })),
  ...events.map(disc => ({ ...disc, type: 'event' })),
];
