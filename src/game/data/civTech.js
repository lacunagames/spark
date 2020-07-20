export default [
  {
    id: 'hunting',
    title: 'Hunting',
    skill: 'fire',
    category: 'fire',
    mana: 10,
    level: 1,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'fishing',
    title: 'Fishing',
    turnGrow: { pop: 0.25 },
    skill: 'water',
    category: 'water',
    mana: 10,
    level: 1,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'gathering',
    title: 'Gathering',
    turnGrow: { pop: 0.25 },
    skill: 'air',
    category: 'air',
    mana: 10,
    level: 1,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'digging',
    title: 'Digging',
    skill: 'earth',
    category: 'earth',
    mana: 10,
    level: 1,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'mining',
    title: 'Mining',
    requires: ['digging'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'town',
    title: 'Town',
    turnGrow: { pop: 0.3 },
    boost: { maxPop: 40 },
    level: 2,
    mana: 10,
    addCivMana: 6,
    removeCivMana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'bronze-working',
    title: 'Bronze working',
    requires: ['mining'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { military: 1 } }],
  },
  {
    id: 'smelting',
    title: 'Smelting',
    requires: ['bronze-working'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'iron-working',
    title: 'Iron working',
    requires: ['smelting'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { military: 1 } }],
  },
  {
    id: 'metal-casting',
    title: 'Metal casting',
    requires: ['iron-working'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'mithril-working',
    title: 'Mithril working',
    requires: ['metal-casting'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { military: 2 } }],
  },
  {
    id: 'cave-dwellers',
    title: 'Cave dwellers',
    turnGrow: { pop: 0.3 },
    requires: ['racial'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'underground-housing',
    title: 'Underground housing',
    turnGrow: { pop: 0.3 },
    requires: ['cave-dwellers'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'great-caverns',
    title: 'Great caverns',
    turnGrow: { pop: 0.3 },
    requires: ['underground-housing'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'hearth-of-the-mountain',
    title: 'Hearth of the mountain',
    turnGrow: { pop: 0.6 },
    requires: ['great-caverns'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'earth-chants',
    title: 'Earth chants',
    requires: ['digging'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { magic: 1 } }],
  },
  {
    id: 'earth-incantations',
    title: 'Earth incantations',
    requires: ['earth-chants'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { magic: 1 } }],
  },
  {
    id: 'earth-magic',
    title: 'Earth magic',
    requires: ['earth-incantations'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { magic: 1 } }],
  },
  {
    id: 'master-earth-adept',
    title: 'Master earth adept',
    requires: ['earth-magic'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { magic: 1 } }],
  },
  {
    id: 'crystal-extraction',
    title: 'Crystal extraction',
    requires: ['mining'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'gemology',
    title: 'Gemology',
    requires: ['crystal-extraction'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'crystal-magic',
    title: 'Crystal magic',
    requires: ['gemology'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { magic: 2 } }],
  },
  {
    id: 'masonry',
    title: 'Masonry',
    requires: ['mining'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'construction',
    title: 'Construction',
    requires: ['masonry'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'engineering',
    title: 'Engineering',
    requires: ['construction'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'machinery',
    title: 'Machinery',
    requires: ['engineering'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'science-council',
    title: 'Science council',
    requires: ['machinery'],
    skill: 'knowledge',
    category: 'knowledge',
    onConnect: [{ createDisc: 'technocracy' }],
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'automation',
    title: 'Automation',
    requires: ['science-council'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'robotics',
    title: 'Robotics',
    requires: ['automation'],
    skill: 'earth',
    category: 'earth',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },

  {
    id: 'writing',
    title: 'Writing',
    skill: 'knowledge',
    category: 'knowledge',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'code-of-laws',
    title: 'Code of Laws',
    requires: ['writing'],
    skill: 'order',
    category: 'order',
    onConnect: [{ createRandomDisc: ['oligarchy', 'autocracy', 'republic'] }],
    mana: 10,
    level: 1,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'constitution',
    title: 'Constitution',
    requires: ['code-of-laws'],
    skill: 'order',
    category: 'order',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'priesthood',
    title: 'Priesthood',
    requires: ['code-of-laws'],
    skill: 'order',
    category: 'order',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'religious-law',
    title: 'Religious law',
    requires: ['priesthood'],
    skill: 'order',
    category: 'order',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'religious-leadership',
    title: 'Religious leadership',
    requires: ['religious-law'],
    skill: 'order',
    category: 'order',
    onConnect: [{ createDisc: 'theocracy' }],
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'theology',
    title: 'Theology',
    requires: ['religious-leadership'],
    skill: 'order',
    category: 'order',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'royal-code',
    title: 'Royal code',
    requires: ['constitution'],
    skill: 'order',
    category: 'order',
    onConnect: [{ createDisc: 'monarchy' }],
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'equality',
    title: 'Equality',
    requires: ['constitution'],
    skill: 'order',
    category: 'order',
    onConnect: [{ createDisc: 'democracy' }],
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'currency',
    title: 'Currency',
    requires: ['writing'],
    skill: 'trickery',
    category: 'trickery',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { commerce: 1 } }],
  },
  {
    id: 'taxation',
    title: 'Taxation',
    requires: ['currency'],
    skill: 'trickery',
    category: 'trickery',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { commerce: 1 } }],
  },
  {
    id: 'guilds',
    title: 'Guilds',
    requires: ['taxation'],
    skill: 'trickery',
    category: 'trickery',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'mercantilism',
    title: 'Mercantilism',
    requires: ['guild'],
    skill: 'trickery',
    category: 'trickery',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { commerce: 1 } }],
  },
  {
    id: 'trade',
    title: 'Trade',
    requires: ['mercantilism'],
    skill: 'trickery',
    category: 'trickery',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { commerce: 1 } }],
  },
  {
    id: 'philosophy',
    title: 'Philosophy',
    requires: ['writing'],
    skill: 'knowledge',
    category: 'knowledge',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'mathematics',
    title: 'Mathematics',
    requires: ['philosophy'],
    skill: 'knowledge',
    category: 'knowledge',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'alchemy',
    title: 'Alchemy',
    requires: ['philosophy'],
    skill: 'knowledge',
    category: 'knowledge',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
  },
  {
    id: 'blasting-powder',
    title: 'Blasting powder',
    requires: ['alchemy'],
    skill: 'knowledge',
    category: 'knowledge',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { military: 2 } }],
  },
  {
    id: 'gold-creation',
    title: 'Gold creation',
    requires: ['blasting-powder'],
    skill: 'knowledge',
    category: 'knowledge',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { commerce: 2 } }],
  },
  {
    id: 'philosophers-stone',
    title: `Philosopher's stone`,
    requires: ['gold-creation'],
    skill: 'knowledge',
    category: 'knowledge',
    level: 1,
    mana: 10,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { magic: 2 } }],
  },
  {
    id: 'warfare',
    title: 'Warfare',
    requires: ['hunting'],
    skill: 'chaos',
    category: 'chaos',
    mana: 10,
    level: 1,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { military: 1 } }],
  },
  {
    id: 'military-strategy',
    title: 'Military strategy',
    requires: ['warfare'],
    skill: 'chaos',
    category: 'chaos',
    mana: 10,
    level: 1,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { military: 1 } }],
  },
  {
    id: 'archery',
    title: 'Archery',
    requires: ['hunting'],
    skill: 'fire',
    category: 'fire',
    mana: 10,
    level: 1,
    desc: 'Bla bla something',
    type: 'knowledge',
    onConnect: [{ addStat: { military: 1 } }],
  },
];