export default [
  // Government types
  {
    id: 'chiefdom',
    title: 'Chiefdom',
    turnGrow: { tech: 1, warlust: 1, mana: 1 },
    skill: 'order',
    category: 'order',
    mana: 4,
    desc: 'Bla bla something',
    type: 'boon',
  },
  {
    id: 'oligarchy',
    title: 'Oligarchy',
    turnGrow: { tech: 2, warlust: 1.5, mana: 1.5 },
    upgrades: ['chiefdom'],
    removes: ['autocracy', 'republic'],
    requires: ['code-of-laws'],
    skill: 'order',
    category: 'order',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
  },
  {
    id: 'autocracy',
    title: 'Autocracy',
    turnGrow: { tech: 1.5, warlust: 2.5, mana: 1 },
    upgrades: ['chiefdom'],
    removes: ['oligarchy', 'republic'],
    requires: ['code-of-laws'],
    skill: 'order',
    category: 'order',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
  },
  {
    id: 'republic',
    title: 'Republic',
    turnGrow: { tech: 2.5, warlust: 1, mana: 1.5 },
    upgrades: ['chiefdom'],
    removes: ['autocracy', 'oligarchy'],
    requires: ['code-of-laws'],
    skill: 'order',
    category: 'order',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
  },
  {
    id: 'monarchy',
    title: 'Monarchy',
    turnGrow: { tech: 2, warlust: 3, mana: 2 },
    upgrades: ['chiefdom', 'autocracy', 'oligarchy', 'republic'],
    removes: ['democracy', 'theocracy', 'technocracy'],
    requires: ['royal-code'],
    skill: 'order',
    category: 'order',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
  },
  {
    id: 'democracy',
    title: 'Democracy',
    turnGrow: { tech: 3, warlust: 2, mana: 2 },
    upgrades: ['chiefdom', 'autocracy', 'oligarchy', 'republic'],
    removes: ['monarchy', 'theocracy', 'technocracy'],
    requires: ['equality'],
    skill: 'order',
    category: 'order',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
  },
  {
    id: 'theocracy',
    title: 'Theocracy',
    turnGrow: { tech: 1, warlust: 3, mana: 3 },
    upgrades: ['chiefdom', 'autocracy', 'oligarchy', 'republic'],
    removes: ['monarchy', 'democracy', 'technocracy'],
    requires: ['religious-leadership'],
    skill: 'order',
    category: 'order',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
  },
  {
    id: 'technocracy',
    title: 'Technocracy',
    turnGrow: { tech: 4.5, warlust: 1, mana: 1.5 },
    upgrades: ['chiefdom', 'autocracy', 'oligarchy', 'republic'],
    removes: ['monarchy', 'democracy', 'theocracy'],
    requires: ['science-council'],
    skill: 'order',
    category: 'order',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
  },

  // Affinities
  {
    id: 'nature',
    title: 'Nature affinity',
    desc: 'Receives bonuses for Nature effects.',
    skill: 'life',
    category: 'nature',
    mana: 12,
    type: 'boon',
  },
  {
    id: 'peace',
    title: 'Peace affinity',
    desc: 'Receives bonuses for Peace effects.',
    skill: 'peace',
    category: 'order',
    mana: 12,
    type: 'boon',
  },
  {
    id: 'earth',
    title: 'Earth affinity',
    desc: 'Receives bonuses for Earth effects.',
    skill: 'earth2',
    category: 'earth',
    mana: 12,
    type: 'boon',
  },
  {
    id: 'science',
    title: 'Science affinity',
    desc: 'Receives bonuses for Science effects.',
    skill: 'science',
    category: 'knowledge',
    mana: 12,
    type: 'boon',
  },
  {
    id: 'art',
    title: 'Art affinity',
    desc: 'Receives bonuses for Art effects.',
    skill: 'art',
    category: 'harmony',
    mana: 12,
    type: 'boon',
  },
  {
    id: 'war',
    title: 'War affinity',
    desc: 'Receives bonuses for War effects.',
    skill: 'war',
    category: 'chaos',
    mana: 12,
    type: 'boon',
  },

  // Shields
  {
    id: 'earth-shield',
    title: 'Earth shield',
    desc:
      'Protects a civilization from harmful effects. Most effective against air.',
    skill: 'earth',
    category: 'earth',
    mana: 8,
    type: 'boon',
    duration: 11,
    protect: { mult: 0.3, type: 'earth' },
  },
  {
    id: 'water-shield',
    title: 'Water shield',
    desc:
      'Protects a civilization from harmful effects. Most effective against fire.',
    skill: 'water',
    category: 'water',
    mana: 8,
    type: 'boon',
    duration: 9,
    protect: { mult: 0.3, type: 'water' },
  },
  {
    id: 'force-shield',
    title: 'Force shield',
    desc:
      'Protects a civilization from harmful effects. Most effective against earth.',
    skill: 'air',
    category: 'air',
    mana: 8,
    type: 'boon',
    duration: 9,
    protect: { mult: 0.3, type: 'air' },
  },
  {
    id: 'fire-wall',
    title: 'Fire wall',
    desc:
      'Protects a civilization from harmful effects. Most effective against water.',
    skill: 'fire',
    category: 'fire',
    mana: 7,
    type: 'boon',
    duration: 7,
    protect: { mult: 0.3, type: 'fire' },
  },

  // Actions
  {
    id: 'discovery',
    title: 'Discovery',
    desc: 'Discovering new knowledge',
    skill: 'knowledge',
    mana: 10,
    type: 'boon',
    duration: 6,
    isDiscovery: true,
    skipLog: true,
    civUnique: true,
    cost: { stat: 'tech', value: 10 },
    onCancel: [{ addStat: { tech: 5 } }],
    onRemove: [
      {
        queueDisc: 'discovery',
        conditionStat: { sameAsCost: true },
        skipLog: true,
      },
    ],
  },
  {
    id: 'roaming-patrol',
    title: 'Roaming patrol',
    desc: 'Attacking monsters.',
    type: 'boon',
    duration: 4,
    skipLog: true,
    cost: { stat: 'warlust', value: 20 },
    onExpire: [{ addStat: { wealth: 5, xp: 1 }, createLog: 'statGain' }],
    onDisconnect: [{ queueAction: 'war' }],
  },
  {
    id: 'adventuring',
    title: 'Adventuring',
    desc: 'On a quest for battling dangerous beasts.',
    type: 'boon',
    requires: ['adventuring-spirit'],
    duration: 4,
    skipLog: true,
    cost: { stat: 'warlust', value: 20 },
    onExpire: [{ addStat: { wealth: 10, xp: 2 }, createLog: 'statGain' }],
    onDisconnect: [{ queueAction: 'war' }],
  },
  {
    id: 'treasure-hunt',
    title: 'Treasure hunt',
    desc: 'On a quest for treasure.',
    type: 'boon',
    requires: ['questing-group'],
    duration: 4,
    skipLog: true,
    cost: { stat: 'warlust', value: 40 },
    onExpire: [{ addStat: { wealth: 20, xp: 4 }, createLog: 'statGain' }],
    onDisconnect: [{ queueAction: 'war' }],
  },
  {
    id: 'pillage',
    title: 'Pillaging',
    desc: 'Looting surrounding villages.',
    type: 'boon',
    requires: ['warfare'],
    duration: 4,
    skipLog: true,
    cost: { stat: 'warlust', value: 12 },
    onExpire: [{ addStat: { wealth: 5, xp: 1 }, createLog: 'statGain' }],
    onDisconnect: [{ queueAction: 'war' }],
  },
  {
    id: 'raid',
    title: 'Raiding',
    desc: 'Looting surrounding towns.',
    type: 'boon',
    requires: ['military-strategy'],
    duration: 4,
    skipLog: true,
    cost: { stat: 'warlust', value: 20 },
    onExpire: [{ addStat: { wealth: 10, xp: 2 }, createLog: 'statGain' }],
    onDisconnect: [{ queueAction: 'war' }],
  },
  {
    id: 'military-exercise',
    title: 'Military exercise',
    desc: 'Increases military strength.',
    type: 'boon',
    requires: ['combat-training'],
    duration: 4,
    skipLog: true,
    cost: { stat: 'warlust', value: 30 },
    onExpire: [{ addStat: { military: 1 }, createLog: 'statGain' }],
    onDisconnect: [{ queueAction: 'war' }],
  },
  {
    id: 'battle',
    title: 'Battle',
    desc: 'Attacking nearby enemy cities.',
    type: 'boon',
    requires: ['siege-tactics'],
    duration: 4,
    skipLog: true,
    cost: { stat: 'warlust', value: 40 },
    onExpire: [{ addStat: { wealth: 20, xp: 4 }, createLog: 'statGain' }],
    onDisconnect: [{ queueAction: 'war' }],
  },
  {
    id: 'spiritual-offering',
    title: 'Spiritual offering',
    desc: 'Performing offering rituals to the spirit world.',
    type: 'boon',
    duration: -1,
    skipLog: true,
    cost: { stat: 'mana', value: 10 },
    onExpire: [
      {
        addStat: { wealth: 2, tech: 2, warlust: 2 },
        createLog: 'statGain',
      },
    ],
    onDisconnect: [{ queueAction: 'magic' }],
  },

  // Summons

  {
    id: 'mud-golem',
    title: 'Mud golem',
    skill: 'earth',
    category: 'earth',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
    duration: 6,
    turnGrow: { food: 5 },
    boost: { military: 3 },
  },
  {
    id: 'summon-whisperer',
    title: 'Summon  whisperer',
    skill: 'air',
    category: 'air',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
    duration: 6,
    turnGrow: { tech: 2, expand: 3 },
    boost: { military: 2 },
  },
  {
    id: 'stream-spirit',
    title: 'Stream spirit',
    skill: 'water',
    category: 'water',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
    duration: 6,
    turnGrow: { food: 3, mana: 3 },
    boost: { military: 2 },
  },
  {
    id: 'flame-familiar',
    title: 'Flame familiar',
    skill: 'fire',
    category: 'fire',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
    duration: 5,
    turnGrow: { warlust: 4, mana: 3 },
    boost: { military: 3 },
  },
  {
    id: 'wildfire',
    title: 'Wildfire',
    skill: 'fire',
    category: 'fire',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
    duration: 2,
    onConnect: [
      {
        damageCiv: { val: 10, type: 'fire' },
        createLog: 'damageCiv',
      },
    ],
    turnDamage: { val: 7, type: 'fire' },
    labels: ['force'],
  },
  {
    id: 'blizzard',
    title: 'Blizzard',
    skill: 'water',
    category: 'water',
    mana: 10,
    desc: 'Bla bla something',
    type: 'boon',
    duration: 6,
    turnDamage: { val: 3, type: 'water' },
    turnGrow: { food: -10 },
    labels: ['force'],
  },
];