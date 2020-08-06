const spells = [
  {
    id: 'rage',
    title: 'Rage',
    skill: 'chaos',
    category: 'chaos',
    mana: 10,
    desc: 'Increases Warlust of a civilization.',
    type: 'spell',
    onCast: [{ addStat: { warlust: 20 } }],
  },
  {
    id: 'arcane-attunement',
    title: 'Arcane attunement',
    skill: 'arcane',
    category: 'arcane',
    mana: 10,
    desc: 'Increases Civilization Mana.',
    type: 'spell',
    onCast: [{ addStat: { mana: 20 } }],
  },
  {
    id: 'lightning-strike',
    title: 'Lightning strike',
    skill: 'air',
    category: 'air',
    mana: 10,
    desc: 'Bla bla something',
    type: 'spell',
    skipLog: true,
    onCast: [
      {
        damageCiv: { type: 'air', val: 20 },
        createLog: 'damageCiv',
      },
    ],
    labels: ['force'],
  },
  {
    id: 'chaos-explosion',
    title: 'Chaos explosion',
    skill: 'chaos',
    category: 'chaos',
    mana: 20,
    desc: 'Bla bla something',
    type: 'spell',
    skipLog: true,
    onCast: [
      {
        damageCiv: { type: 'chaos', val: 35 },
        createLog: 'damageCiv',
      },
    ],
    labels: ['force'],
  },
  {
    id: 'destroy-biome',
    title: 'Destroy biome',
    skill: 'chaos',
    category: 'chaos',
    mana: 40,
    desc: 'Destroys a random biome.',
    type: 'spell',
    skipLog: true,
    onCast: [{ destroyRandomDiscByType: 'biome' }],
  },
];

export default spells;
