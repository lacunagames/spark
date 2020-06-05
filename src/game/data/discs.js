const biomes = [
  {
    id: 'forest',
    title: 'Forest',
    popGrow: 1,
  },
  {
    id: 'jungle',
    title: 'Jungle',
    popGrow: 0.8,
  },
  {
    id: 'desert',
    title: 'Desert',
    popGrow: 0.6,
  },
  {
    id: 'grassland',
    title: 'Grassland',
    popGrow: 1.1,
  },
  {
    id: 'mountain',
    title: 'Mountain',
    popGrow: 0.8,
  },
  {
    id: 'swamp',
    title: 'Swamp',
    popGrow: 9.8,
  },
];

const knowledges = [
  {
    id: 'tribal',
    title: 'Tribal tradition',
    actionGrow: 0.1,
    maxActionBoost: 1,
  },
  {
    id: 'oligarchy',
    title: 'Oligarchy',
    actionGrow: 0.15,
    maxActionBoost: 1.5,
  },
];

const actions = [
  {
    id: 'hunting',
    title: 'Hunting',
    xpGrow: 0.1,
    modifyDisc: [
      { disc: 'tiger', chance: 0.3, popGrowMultiply: 0 },
      { disc: 'dragon', chance: 0.15, popGrowMultiply: 0 },
    ],
    skill: 'fire',
    category: 'fire',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
    level: 1,
  },
  {
    id: 'fishing',
    title: 'Fishing',
    popGrow: 0.25,
    skill: 'water',
    category: 'water',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
    level: 1,
  },
  {
    id: 'gathering',
    title: 'Gathering',
    popGrow: 0.25,
    skill: 'air',
    category: 'air',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
    level: 1,
  },
  {
    id: 'digging',
    title: 'Digging',
    xpGrow: 1.1,
    skill: 'earth',
    category: 'earth',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
    level: 1,
  },
  {
    id: 'mining',
    title: 'Mining',
    xpGrow: 0.2,
    upgrades: 'digging',
    level: 2,
  },
  {
    id: 'town',
    title: 'Town',
    popGrow: 0.3,
    maxPopBoost: 4,
    level: 2,
  },
];

const events = [
  {
    id: 'tiger',
    title: 'Tiger',
    xpGrow: 0.2,
    popGrow: -3,
    skill: 'nature',
    category: 'nature',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
    desc: 'Bla bla something',
  },
  {
    id: 'landslide',
    title: 'Landslide',
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
    title: 'Dragon',
    xpGrow: 0.5,
    popGrow: -9,
    skill: 'fire',
    category: 'fire',
    mana: 10,
    addCivMana: 4,
    removeCivMana: 7,
    desc: 'Bla bla something',
  },
];

export default [
  ...biomes.map(disc => ({ ...disc, type: 'biome' })),
  ...knowledges.map(disc => ({ ...disc, type: 'knowledge' })),
  ...actions.map(disc => ({ ...disc, type: 'action' })),
  ...events.map(disc => ({ ...disc, type: 'event' })),
];
