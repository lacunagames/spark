export default [
  // BIOME
  {
    id: 'dark-forest',
    title: 'Dark Forest',
    turnGrow: { food: 13 },
    skill: 'trickery',
    category: 'trickery',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'jungle',
    title: 'Jungle',
    turnGrow: { food: 16 },
    skill: 'nature',
    category: 'nature',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'desert',
    title: 'Desert',
    turnGrow: { food: 20 },
    boost: { maxFood: 500 },
    skill: 'fire',
    category: 'fire',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'grassland',
    title: 'Grassland',
    turnGrow: { food: 14 },
    skill: 'air',
    category: 'air',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'mountain',
    title: 'Mountain',
    turnGrow: { food: 10 },
    boost: { maxFood: 5 },
    skillCreate: 'earth3',
    skill: 'earth',
    category: 'earth',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'rocky-mountain',
    title: 'Rocky Mountain',
    turnGrow: { food: 10 },
    boost: { maxFood: 10 },
    upgrades: ['mountain'],
    createRequires: ['iron-ore'],
    skillCreate: 'earth3',
    skill: 'earth',
    category: 'earth',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
    labels: ['mountain'],
  },
  {
    id: 'swamp',
    title: 'Swamp',
    turnGrow: { food: 12 },
    skill: 'water',
    category: 'water',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'tundra',
    title: 'Tundra',
    turnGrow: { food: 5 },
    skillCreate: 'earth2',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'taiga',
    title: 'Taiga',
    turnGrow: { food: 7 },
    skillCreate: 'earth2',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'lake',
    title: 'Lake',
    turnGrow: { food: 9 },
    skill: 'water',
    category: 'water',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'sea',
    title: 'Sea',
    turnGrow: { food: 10 },
    skill: 'water',
    category: 'water',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'tropical-paradise',
    title: 'Tropical Paradise',
    turnGrow: { food: 20 },
    skill: 'life',
    category: 'nature',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'floating-rocks',
    title: 'Floating Rocks',
    turnGrow: { food: 11 },
    skill: 'air3',
    category: 'air',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'mushroom-forest',
    title: 'Mushroom Forest',
    turnGrow: { food: 11 },
    skill: 'life',
    category: 'nature',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'wasteland',
    title: 'Wasteland',
    turnGrow: { food: 8 },
    skill: 'fire3',
    category: 'fire',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'volcanic-lands',
    title: 'Volcanic Lands',
    turnGrow: { food: 6 },
    skill: 'fire3',
    category: 'fire',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },

  // EVENT
  {
    id: 'tiger',
    title: 'Tiger',
    turnGrow: { xp: 0.2 },
    turnDamage: { val: 3, type: 'nature' },
    shield: { val: 1, type: 'nature' },
    health: 18,
    skill: 'nature',
    category: 'nature',
    mana: 10,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'landslide',
    title: 'Landslide',
    turnGrow: { xp: 0.2 },
    turnDamage: { val: 5, type: 'earth' },
    skill: 'earth',
    category: 'earth',
    mana: 14,
    desc: 'Bla bla something',
    type: 'force',
  },
  {
    id: 'dragon',
    title: 'Red Dragon',
    turnGrow: { xp: 0.5 },
    turnDamage: { val: 9, type: 'fire' },
    shield: { val: 4, type: 'fire' },
    health: 95,
    skill: 'fire3',
    category: 'fire',
    mana: 22,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'sapphire-dragon',
    title: 'Sapphire Dragon',
    turnGrow: { xp: 0.5 },
    turnDamage: { val: 9, type: 'earth' },
    shield: { val: 5, type: 'earth' },
    health: 70,
    skill: 'earth3',
    category: 'earth',
    mana: 21,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'stone-giant',
    title: 'Stone Giant',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 7, type: 'earth' },
    shield: { val: 4, type: 'earth' },
    health: 65,
    skill: 'earth3',
    category: 'earth',
    mana: 17,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'wolf',
    title: 'Wolf',
    turnGrow: { xp: 0.15 },
    turnDamage: { val: 2, type: 'nature' },
    shield: { val: 0, type: 'nature' },
    health: 11,
    skill: 'nature',
    category: 'nature',
    mana: 7,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'lion',
    title: 'Lion',
    turnGrow: { xp: 0.2 },
    turnDamage: { val: 4, type: 'nature' },
    shield: { val: 0, type: 'nature' },
    health: 35,
    skill: 'nature',
    category: 'nature',
    mana: 12,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'panther',
    title: 'Panther',
    turnGrow: { xp: 0.2 },
    turnDamage: { val: 3, type: 'nature' },
    shield: { val: 0, type: 'nature' },
    health: 28,
    skill: 'nature',
    category: 'nature',
    mana: 10,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'salamander',
    title: 'Salamander',
    turnGrow: { xp: 0.3 },
    turnDamage: { val: 5, type: 'fire' },
    shield: { val: 1, type: 'fire' },
    health: 30,
    skill: 'fire',
    category: 'fire',
    mana: 14,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'zombie',
    title: 'Zombie',
    turnGrow: { xp: 0.2 },
    turnDamage: { val: 2, type: 'chaos' },
    shield: { val: 1, type: 'chaos' },
    health: 8,
    skill: 'decay',
    category: 'decay',
    mana: 9,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'demon',
    title: 'Demon',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 7, type: 'chaos' },
    shield: { val: 3, type: 'chaos' },
    health: 30,
    skill: 'chaos',
    category: 'chaos',
    mana: 16,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'treant',
    title: 'Treant',
    turnGrow: { xp: 0.2 },
    turnDamage: { val: 3, type: 'nature' },
    shield: { val: 0, type: 'nature' },
    health: 9,
    skill: 'nature',
    category: 'nature',
    mana: 9,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'ooze',
    title: 'Ooze',
    turnGrow: { xp: 0.3 },
    turnDamage: { val: 5, type: 'water' },
    shield: { val: 1, type: 'water' },
    health: 34,
    skill: 'decay',
    category: 'decay',
    mana: 14,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'rock-elemental',
    title: 'Rock Elemental',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 6, type: 'earth' },
    shield: { val: 3, type: 'earth' },
    health: 29,
    createRequires: ['gold-ore', 'emerald-gem'],
    skill: 'earth2',
    category: 'earth',
    mana: 16,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'cave-bear',
    title: 'Cave Bear',
    turnGrow: { xp: 0.3 },
    turnDamage: { val: 5, type: 'earth' },
    shield: { val: 1, type: 'earth' },
    health: 20,
    createRequires: ['copper-ore'],
    requires: ['mountain'],
    closeToDisc: 'mountain',
    skill: 'earth',
    category: 'earth',
    mana: 12,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'rock-bear',
    title: 'Ironhide Bear',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 6, type: 'earth' },
    shield: { val: 2, type: 'earth' },
    health: 25,
    upgrades: ['cave-bear'],
    createRequires: ['iron-ore'],
    requires: ['mountain'],
    closeToDisc: 'mountain',
    skill: 'earth2',
    category: 'earth',
    mana: 16,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'diamond-bear',
    title: 'Diamondhide Bear',
    turnGrow: { xp: 0.5 },
    turnDamage: { val: 7, type: 'earth' },
    shield: { val: 3, type: 'earth' },
    health: 40,
    upgrades: ['rock-bear'],
    createRequires: ['mithril-ore', 'diamond-gem'],
    requires: ['mountain'],
    closeToDisc: 'mountain',
    skill: 'earth3',
    category: 'earth',
    mana: 22,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'sandworm',
    title: 'Sandworm',
    turnGrow: { xp: 0.2 },
    turnDamage: { val: 2, type: 'earth' },
    shield: { val: 0, type: 'earth' },
    health: 13,
    createRequires: ['copper-ore'],
    closeToDisc: 'desert',
    skill: 'earth',
    category: 'earth',
    mana: 12,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'crystal-worm',
    title: 'Crystal Worm',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 5, type: 'earth' },
    shield: { val: 4, type: 'earth' },
    health: 33,
    upgrades: ['sandworm'],
    createRequires: ['citrine-gem', 'silver-ore'],
    closeToDisc: 'desert',
    skill: 'earth2',
    category: 'earth',
    mana: 14,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'lake-elemental',
    title: 'Lake Elemental',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 5, type: 'water' },
    shield: { val: 2, type: 'water' },
    health: 45,
    skill: 'water2',
    category: 'water',
    mana: 16,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'storm-elemental',
    title: 'Storm Elemental',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 6, type: 'air' },
    shield: { val: 1, type: 'air' },
    health: 50,
    skill: 'air2',
    category: 'air',
    mana: 16,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'giant',
    title: 'Giant',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 7, type: 'chaos' },
    shield: { val: 2, type: 'chaos' },
    health: 65,
    skill: 'chaos',
    category: 'chaos',
    mana: 16,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'hydra',
    title: 'Hydra',
    turnGrow: { xp: 0.5 },
    turnDamage: { val: 9, type: 'chaos' },
    shield: { val: 1, type: 'chaos' },
    health: 95,
    skill: 'war',
    category: 'chaos',
    mana: 22,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'vampire',
    title: 'Vampire',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 9, type: 'water' },
    shield: { val: 3, type: 'water' },
    health: 66,
    skill: 'unholy',
    category: 'chaos',
    mana: 22,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'drought',
    title: 'Drought',
    turnGrow: { xp: 0.2, food: -6 },
    turnDamage: { val: 3, type: 'fire' },
    skill: 'fire',
    category: 'fire',
    mana: 10,
    desc: 'Bla bla something',
    type: 'force',
  },
  {
    id: 'earthquake',
    title: 'Earthquake',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 7, type: 'earth' },
    skill: 'earth2',
    category: 'earth',
    mana: 18,
    desc: 'Bla bla something',
    type: 'force',
  },
  {
    id: 'volcano',
    title: 'Volcano',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 8, type: 'fire' },
    skill: 'fire2',
    category: 'fire',
    mana: 18,
    desc: 'Bla bla something',
    type: 'force',
  },
  {
    id: 'tornado',
    title: 'Tornado',
    turnGrow: { xp: 0.3 },
    turnDamage: { val: 5, type: 'air' },
    skill: 'air2',
    category: 'air',
    mana: 17,
    desc: 'Bla bla something',
    type: 'force',
  },
  {
    id: 'acid-rain',
    title: 'Acid Rain',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 6, type: 'water' },
    skill: 'water2',
    category: 'water',
    mana: 16,
    desc: 'Bla bla something',
    type: 'force',
  },
  {
    id: 'plague',
    title: 'Plague',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 7, type: 'chaos' },
    skill: 'decay',
    category: 'decay',
    mana: 17,
    desc: 'Bla bla something',
    type: 'force',
  },
  {
    id: 'pirates',
    title: 'Pirates',
    turnGrow: { xp: 0.3 },
    turnDamage: { val: 5, type: 'water' },
    shield: { val: 2, type: 'water' },
    health: 22,
    skill: 'water2',
    category: 'water',
    mana: 14,
    desc: 'Bla bla something',
    type: 'beast',
  },
  {
    id: 'god-war',
    title: 'Arthion',
    desc: `The God of Destruction came to obliterate your world. Stop him before it's too late!`,
    type: 'event',
    isGlobal: true,
    villain: {
      type: 'destruction',
      power: 1,
      mana: 35,
      manaPerTurn: 3,
    },
    alwaysConnect: [
      { disc: 'destruction-minion', isPositive: true },
      { disc: 'destruction-champion', isPositive: true },
      { disc: 'chaos-volcano', isPositive: true },
    ],
  },
  {
    id: 'destruction-minion',
    title: 'Minion of Destruction',
    turnGrow: { xp: 0.3 },
    turnDamage: { val: 3, type: 'chaos' },
    shield: { val: 1, type: 'chaos' },
    health: 20,
    mana: 15,
    powerPerTurn: 0.05,
    desc: 'Bla bla something',
    type: 'beast',
    labels: ['noRandom'],
  },
  {
    id: 'destruction-champion',
    title: 'Champion of Destruction',
    turnGrow: { xp: 0.5 },
    turnDamage: { val: 6, type: 'chaos' },
    shield: { val: 2, type: 'chaos' },
    health: 50,
    upgrades: ['destruction-minion'],
    mana: 30,
    powerPerTurn: 0.1,
    desc: 'Bla bla something',
    type: 'beast',
    labels: ['noRandom'],
  },
  {
    id: 'chaos-volcano',
    title: 'Chaos Volcano',
    turnGrow: { xp: 0.4 },
    turnDamage: { val: 7, type: 'chaos' },
    mana: 35,
    desc: 'Bla bla something',
    type: 'force',
  },
  {
    id: 'destroy-world',
    title: 'World destruction',
    mana: 40,
    desc: 'The world is about to end. Find a way to undo this spell.',
    duration: 30,
    type: 'event',
    isGlobal: true,
    labels: ['force', 'noRandom'],
    onExpire: [{ triggerEnding: 'chaos' }],
  },
  {
    id: 'potent-rock-layer',
    title: 'Potent Rock Layer',
    skill: 'earth',
    category: 'earth',
    mana: 12,
    removeDisabled: true,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: 'A potent rock layer that can be morphed into different metal ores.',
    type: 'event',
    onCast: [{ queueDisc: 'rust-ooze', conditionTurn: '3-9' }],
  },
  {
    id: 'copper-vein',
    title: 'Copper Vein',
    upgrades: ['potent-rock-layer'],
    skill: 'earth',
    category: 'earth',
    mana: 6,
    removeMana: 0,
    duration: 3,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Copper Ore.`,
    type: 'event',
    labels: ['potent-rock-layer'],
    onExpire: [
      { createDisc: 'potent-rock-layer', skipLog: true },
      { createDisc: 'copper-ore', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'potent-rock-layer', skipLog: true }],
  },
  {
    id: 'copper-ore',
    title: 'Copper Ore',
    disables: ['copper-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'potent-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
  {
    id: 'iron-vein',
    title: 'Iron Vein',
    upgrades: ['potent-rock-layer'],
    skill: 'earth',
    category: 'earth',
    mana: 10,
    removeMana: 0,
    duration: 4,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Iron Ore.`,
    type: 'event',
    labels: ['potent-rock-layer'],
    onExpire: [
      { createDisc: 'potent-rock-layer', skipLog: true },
      { createDisc: 'iron-ore', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'potent-rock-layer', skipLog: true }],
  },
  {
    id: 'iron-ore',
    title: 'Iron Ore',
    disables: ['iron-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'potent-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
  {
    id: 'silver-vein',
    title: 'Silver Vein',
    upgrades: ['potent-rock-layer'],
    skill: 'earth2',
    category: 'earth',
    mana: 12,
    removeMana: 0,
    duration: 5,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Silver Ore.`,
    type: 'event',
    labels: ['potent-rock-layer'],
    onExpire: [
      { createDisc: 'potent-rock-layer', skipLog: true },
      { createDisc: 'silver-ore', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'potent-rock-layer', skipLog: true }],
  },
  {
    id: 'silver-ore',
    title: 'Silver Ore',
    disables: ['silver-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'potent-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
  {
    id: 'gold-vein',
    title: 'Gold Vein',
    upgrades: ['potent-rock-layer'],
    skill: 'earth2',
    category: 'earth',
    mana: 14,
    removeMana: 0,
    duration: 6,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Gold Ore.`,
    type: 'event',
    labels: ['potent-rock-layer'],
    onExpire: [
      { createDisc: 'potent-rock-layer', skipLog: true },
      { createDisc: 'gold-ore', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'potent-rock-layer', skipLog: true }],
  },
  {
    id: 'gold-ore',
    title: 'Gold Ore',
    disables: ['gold-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'potent-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
  {
    id: 'mithril-vein',
    title: 'Mithril Vein',
    upgrades: ['potent-rock-layer'],
    skill: 'earth3',
    category: 'earth',
    mana: 20,
    removeMana: 0,
    duration: 7,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Iron Ore.`,
    type: 'event',
    labels: ['potent-rock-layer'],
    onExpire: [
      { createDisc: 'potent-rock-layer', skipLog: true },
      { createDisc: 'mithril-ore', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'potent-rock-layer', skipLog: true }],
  },
  {
    id: 'mithril-ore',
    title: 'Mithril Ore',
    disables: ['mithril-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'potent-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
  {
    id: 'rust-ooze',
    title: 'Rust Ooze',
    turnGrow: { xp: 0.3 },
    turnDamage: { val: 2, type: 'earth' },
    shield: { val: 0, type: 'earth' },
    health: 9,
    closeToDisc: ['potent-rock-layer', 'precious-rock-layer'],
    alwaysConnect: [
      { disc: 'potent-rock-layer', isPositive: false },
      { disc: 'precious-rock-layer', isPositive: false },
    ],
    isGlobal: true, // Required for global duration
    duration: 6,
    desc:
      'A slimy monster feeding on metal and rock inside the mountain. Can destroy potent and precious rock layers.',
    type: 'beast',
    labels: ['noRandom'],
    onExpire: [
      { destroyRandomDisc: ['potent-rock-layer', 'precious-rock-layer'] },
    ],
  },
  {
    id: 'precious-rock-layer',
    title: 'Precious Rock Layer',
    skill: 'earth2',
    category: 'earth',
    mana: 12,
    removeDisabled: true,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: 'A precious rock layer that can be morphed into various gems.',
    type: 'event',
    onCast: [{ queueDisc: 'rust-ooze', conditionTurn: '3-9' }],
  },
  {
    id: 'citrine-vein',
    title: 'Citrine Vein',
    upgrades: ['precious-rock-layer'],
    skill: 'earth2',
    category: 'earth',
    mana: 12,
    removeMana: 0,
    duration: 4,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Citrine Gems.`,
    type: 'event',
    labels: ['precious-rock-layer'],
    onExpire: [
      { createDisc: 'precious-rock-layer', skipLog: true },
      { createDisc: 'citrine-gem', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'precious-rock-layer', skipLog: true }],
  },
  {
    id: 'citrine-gem',
    title: 'Citrine Gem',
    disables: ['citrine-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'precious-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
  {
    id: 'sapphire-vein',
    title: 'Sapphire Vein',
    upgrades: ['precious-rock-layer'],
    skill: 'earth2',
    category: 'earth',
    mana: 14,
    removeMana: 0,
    duration: 5,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Sapphire Gems.`,
    type: 'event',
    labels: ['precious-rock-layer'],
    onExpire: [
      { createDisc: 'precious-rock-layer', skipLog: true },
      { createDisc: 'sapphire-gem', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'precious-rock-layer', skipLog: true }],
  },
  {
    id: 'sapphire-gem',
    title: 'Sapphire Gem',
    disables: ['sapphire-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'precious-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
  {
    id: 'emerald-vein',
    title: 'Emerald Vein',
    upgrades: ['precious-rock-layer'],
    skill: 'earth2',
    category: 'earth',
    mana: 16,
    removeMana: 0,
    duration: 6,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Emerald Gems.`,
    type: 'event',
    labels: ['precious-rock-layer'],
    onExpire: [
      { createDisc: 'precious-rock-layer', skipLog: true },
      { createDisc: 'emerald-gem', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'precious-rock-layer', skipLog: true }],
  },
  {
    id: 'emerald-gem',
    title: 'Emerald Gem',
    disables: ['emerald-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'precious-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
  {
    id: 'ruby-vein',
    title: 'Ruby Vein',
    upgrades: ['precious-rock-layer'],
    skill: 'earth3',
    category: 'earth',
    mana: 20,
    removeMana: 0,
    duration: 7,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Ruby Gems.`,
    type: 'event',
    labels: ['precious-rock-layer'],
    onExpire: [
      { createDisc: 'precious-rock-layer', skipLog: true },
      { createDisc: 'ruby-gem', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'precious-rock-layer', skipLog: true }],
  },
  {
    id: 'ruby-gem',
    title: 'Ruby Gem',
    disables: ['ruby-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'precious-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
  {
    id: 'diamond-vein',
    title: 'Diamond Vein',
    upgrades: ['precious-rock-layer'],
    skill: 'earth3',
    category: 'earth',
    mana: 22,
    removeMana: 0,
    duration: 8,
    isGlobal: true,
    closeToDisc: 'mountain',
    desc: `Produces Diamond Gems.`,
    type: 'event',
    labels: ['precious-rock-layer'],
    onExpire: [
      { createDisc: 'precious-rock-layer', skipLog: true },
      { createDisc: 'diamond-gem', skipMessage: true },
    ],
    onCancel: [{ createDisc: 'precious-rock-layer', skipLog: true }],
  },
  {
    id: 'diamond-gem',
    title: 'Diamond Gem',
    disables: ['diamond-vein'],
    isGlobal: true,
    isResource: true,
    removeDisabled: true,
    skipLog: true,
    closeToDisc: 'precious-rock-layer',
    desc: `Required resource for some spells and effects.`,
    type: 'event',
  },
];
