export default [
  // BIOME
  {
    id: 'forest',
    title: 'Forest',
    popGrow: 1,
    skill: 'trickery',
    category: 'trickery',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'jungle',
    title: 'Jungle',
    popGrow: 0.8,
    skill: 'nature',
    category: 'nature',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'desert',
    title: 'Desert',
    popGrow: 0.6,
    skill: 'fire',
    category: 'fire',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'grassland',
    title: 'Grassland',
    popGrow: 1.1,
    skill: 'air',
    category: 'air',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'mountain',
    title: 'Mountain',
    popGrow: 0.8,
    skill: 'earth',
    category: 'earth',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },
  {
    id: 'swamp',
    title: 'Swamp',
    popGrow: 9.8,
    skill: 'water',
    category: 'water',
    mana: 10,
    desc: 'Bla bla something',
    type: 'biome',
  },

  // ACTION
  {
    id: 'hunting-group',
    title: 'Hunting group',
    turnProtect: {
      chance: 0.3,
      val: 3,
      type: 'nature',
      validLabels: ['beast'],
    },
    category: 'fire',
    mana: 10,
    level: 1,
    desc: 'Bla bla something',
    type: 'action',
  },

  // EVENT
  {
    id: 'tiger',
    title: 'Tiger',
    xpGrow: 0.2,
    turnDamage: { val: 3, type: 'nature' },
    skill: 'nature',
    category: 'nature',
    mana: 10,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'landslide',
    title: 'Landslide',
    xpGrow: 0.2,
    turnDamage: { val: 5, type: 'earth' },
    skill: 'earth',
    category: 'earth',
    mana: 14,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['force'],
  },
  {
    id: 'dragon',
    title: 'Dragon',
    xpGrow: 0.5,
    turnDamage: { val: 9, type: 'fire' },
    skill: 'fire3',
    category: 'fire',
    mana: 22,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'wolves',
    title: 'Wolves',
    xpGrow: 0.1,
    turnDamage: { val: 2, type: 'nature' },
    skill: 'nature',
    category: 'nature',
    mana: 7,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'lion',
    title: 'Lion',
    xpGrow: 0.2,
    turnDamage: { val: 4, type: 'nature' },
    skill: 'nature',
    category: 'nature',
    mana: 12,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'panther',
    title: 'Panther',
    xpGrow: 0.2,
    turnDamage: { val: 3, type: 'nature' },
    skill: 'nature',
    category: 'nature',
    mana: 10,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'salamander',
    title: 'Salamander',
    xpGrow: 0.3,
    turnDamage: { val: 5, type: 'fire' },
    skill: 'fire',
    category: 'fire',
    mana: 14,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'zombie',
    title: 'Zombie',
    xpGrow: 0.2,
    turnDamage: { val: 3, type: 'decay' },
    skill: 'decay',
    category: 'decay',
    mana: 9,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'demon',
    title: 'Demon',
    xpGrow: 0.4,
    turnDamage: { val: 7, type: 'chaos' },
    skill: 'chaos',
    category: 'chaos',
    mana: 16,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'treant',
    title: 'Treant',
    xpGrow: 0.2,
    turnDamage: { val: 3, type: 'nature' },
    skill: 'nature',
    category: 'nature',
    mana: 9,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'ooze',
    title: 'Ooze',
    xpGrow: 0.3,
    turnDamage: { val: 5, type: 'decay' },
    skill: 'decay',
    category: 'decay',
    mana: 14,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'rock-elemental',
    title: 'Rock elemental',
    xpGrow: 0.4,
    turnDamage: { val: 6, type: 'earth' },
    skill: 'earth2',
    category: 'earth',
    mana: 16,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'lake-elemental',
    title: 'Lake elemental',
    xpGrow: 0.4,
    turnDamage: { val: 5, type: 'water' },
    skill: 'water2',
    category: 'water',
    mana: 16,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'storm-elemental',
    title: 'Storm elemental',
    xpGrow: 0.4,
    turnDamage: { val: 6, type: 'storm' },
    skill: 'air2',
    category: 'air',
    mana: 16,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'giant',
    title: 'Giant',
    xpGrow: 0.4,
    turnDamage: { val: 7, type: 'chaos' },
    skill: 'chaos',
    category: 'chaos',
    mana: 16,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'hydra',
    title: 'Hydra',
    xpGrow: 0.5,
    turnDamage: { val: 9, type: 'chaos' },
    skill: 'war',
    category: 'chaos',
    mana: 22,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'vampire',
    title: 'Vampire',
    xpGrow: 0.4,
    turnDamage: { val: 9, type: 'decay' },
    skill: 'unholy',
    category: 'chaos',
    mana: 22,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
  {
    id: 'drought',
    title: 'Drought',
    xpGrow: 0.2,
    turnDamage: { val: 3, type: 'fire' },
    skill: 'fire',
    category: 'fire',
    mana: 10,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['force'],
  },
  {
    id: 'earthquake',
    title: 'Earthquake',
    xpGrow: 0.4,
    turnDamage: { val: 7, type: 'earth' },
    skill: 'earth2',
    category: 'earth',
    mana: 18,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['force'],
  },
  {
    id: 'volcano',
    title: 'Volcano',
    xpGrow: 0.4,
    turnDamage: { val: 8, type: 'fire' },
    skill: 'fire2',
    category: 'fire',
    mana: 18,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['force'],
  },
  {
    id: 'tornado',
    title: 'Tornado',
    xpGrow: 0.3,
    turnDamage: { val: 5, type: 'air' },
    skill: 'air2',
    category: 'air',
    mana: 17,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['force'],
  },
  {
    id: 'acid-rain',
    title: 'Acid rain',
    xpGrow: 0.4,
    turnDamage: { val: 6, type: 'water' },
    skill: 'water2',
    category: 'water',
    mana: 16,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['force'],
  },
  {
    id: 'plague',
    title: 'Plague',
    xpGrow: 0.4,
    turnDamage: { val: 7, type: 'decay' },
    skill: 'decay',
    category: 'decay',
    mana: 17,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['force'],
  },
  {
    id: 'pirates',
    title: 'Pirates',
    xpGrow: 0.3,
    turnDamage: { val: 5, type: 'nature' },
    skill: 'water2',
    category: 'water',
    mana: 14,
    desc: 'Bla bla something',
    type: 'event',
    labels: ['beast'],
  },
];
