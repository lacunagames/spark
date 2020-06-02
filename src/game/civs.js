import StateHandler from './statehandler';

const allCivs = [
  {
    id: 'trolls',
    name: 'Trolls',
    level: 1,
    population: 100,
    maxPopulation: 140,
    popLevelGrow: 40,
    xpToLevel: 12,
    xpLevelGrow: 2,
    biomes: ['jungle', 'desert', 'swamp'],
    govs: ['tribal'],
    actionDiscs: [
      { id: 'hunting', level: 1 },
      { id: 'fishing', level: 1 },
      { id: 'gathering', level: 1 },
      { id: 'town', level: 2 },
    ],
  },
  {
    id: 'humans',
    name: 'Humans',
    level: 1,
    population: 100,
    maxPopulation: 120,
    popLevelGrow: 30,
    xpToLevel: 10,
    xpLevelGrow: 2,
    biomes: ['grassland', 'jungle', 'mountain'],
    govs: ['tribal', 'oligarchy'],
    actionDiscs: [
      { id: 'digging', level: 1 },
      { id: 'fishing', level: 1 },
      { id: 'gathering', level: 1 },
      { id: 'town', level: 2 },
      { id: 'mining', level: 2 },
    ],
  },
  {
    id: 'dwarves',
    name: 'Dwarves',
    level: 1,
    population: 100,
    maxPopulation: 100,
    popLevelGrow: 20,
    xpToLevel: 12,
    xpLevelGrow: 3,
    biomes: ['grassland', 'mountain'],
    govs: ['tribal', 'oligarchy'],
    actionDiscs: [
      { id: 'hunting', level: 1 },
      { id: 'fishing', level: 1 },
      { id: 'digging', level: 1 },
      { id: 'town', level: 2 },
      { id: 'mining', level: 2 },
    ],
  },
  {
    id: 'gnomes',
    name: 'Gnomes',
    level: 1,
    population: 100,
    maxPopulation: 120,
    popLevelGrow: 30,
    xpToLevel: 10,
    xpLevelGrow: 4,
    biomes: ['mountain', 'swamp', 'forest'],
    govs: ['oligarchy'],
    actionDiscs: [
      { id: 'digging', level: 1 },
      { id: 'fishing', level: 1 },
      { id: 'gathering', level: 1 },
      { id: 'town', level: 2 },
      { id: 'mining', level: 2 },
    ],
  },
  {
    id: 'elves',
    name: 'Elves',
    level: 1,
    population: 100,
    maxPopulation: 100,
    popLevelGrow: 10,
    xpToLevel: 14,
    xpLevelGrow: 4,
    biomes: ['swamp', 'forest'],
    govs: ['oligarchy'],
    actionDiscs: [
      { id: 'hunting', level: 1 },
      { id: 'fishing', level: 1 },
      { id: 'gathering', level: 1 },
      { id: 'town', level: 2 },
    ],
  },
  {
    id: 'orcs',
    name: 'Orcs',
    level: 1,
    population: 100,
    maxPopulation: 140,
    popLevelGrow: 20,
    xpToLevel: 12,
    xpLevelGrow: 2,
    biomes: ['grassland', 'forest', 'desert'],
    govs: ['tribal', 'oligarchy'],
    actionDiscs: [
      { id: 'hunting', level: 1 },
      { id: 'digging', level: 1 },
      { id: 'gathering', level: 1 },
      { id: 'town', level: 2 },
      { id: 'mining', level: 2 },
    ],
  },
];

const defaultState = {
  positions: [
    { left: 44, top: 12 },
    { left: 56, top: 12 },
  ],
  civList: [],
  turn: 1,
};

class Civs extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
    this.initIndexes('civList');
    setTimeout(() => this.initCivs(), 0);
  }

  initCivs() {
    let civ;

    for (let i = 0; i < 2; i++) {
      do {
        civ = allCivs[Math.floor(Math.random() * allCivs.length)];
      } while (this.state.civList.find(civFind => civFind.id === civ?.id));

      this.setState({
        civList: [
          ...this.state.civList,
          {
            ...civ,
            xp: 0,
            action: 1,
            actionGrow: 0,
            index: this.useIndex('civList'),
            connect: [],
          },
        ],
      });
    }
    this.state.civList.forEach(civ => {
      this.world.createDisc(
        civ.biomes[Math.floor(Math.random() * civ.biomes.length)],
        civ.id
      );
      this.world.createDisc(
        civ.govs[Math.floor(Math.random() * civ.govs.length)],
        civ.id
      );
      if (civ.action >= 1) this.civAction(civ);
    });
  }

  civTurn() {
    this.state.civList.forEach(civ => {
      let popGrow = 0;
      let xpGrow = 0;
      let actionGrow = 0;
      let keepup = [];
      let newConnect = [...civ.connect];
      let removeBoost = { maxPop: 0 };

      civ.connect.forEach(discId => {
        const disc = this.world.state.discs.find(disc => disc.id === discId);
        const multipliers = { pop: 1, xp: 1, action: 1 };

        civ.connect.forEach(modifierId => {
          const modifier = this.world.state.discs.find(
            disc => disc.id === modifierId
          );

          modifier.modifyDisc?.forEach(mod => {
            if (
              mod.disc === discId &&
              (!mod.chance || Math.random() < mod.chance)
            ) {
              multipliers.pop *=
                mod.popGrowMultiply !== undefined ? mod.popGrowMultiply : 1;
              multipliers.xp *=
                mod.xpGrowMultiply !== undefined ? mod.xpGrowMultiply : 1;
              multipliers.action *=
                mod.actionGrowMultiply !== undefined
                  ? mod.actionGrowMultiply
                  : 1;
            }
          });
        });
        if (!disc.chance || Math.random() < disc.chance) {
          if (disc.popGrow) popGrow += disc.popGrow * multipliers.pop;
          if (disc.xpGrow) xpGrow += disc.xpGrow * multipliers.xp;
          if (disc.actionGrow)
            actionGrow += disc.actionGrow * multipliers.action;
        }

        if (disc.actionGrow < 0) {
          keepup.push(disc);
        }
      });

      const isLevelUp = civ.xp + xpGrow >= civ.xpToLevel;
      const overCapacity = civ.action + actionGrow + civ.actionGrow < 0;

      if (overCapacity) {
        let cutConnect = keepup[Math.floor(Math.random() * keepup.length)];

        newConnect.splice(newConnect.indexOf(cutConnect.id), 1);
        removeBoost.maxPop = cutConnect.maxPopBoost || 0;
      }
      const maxPopulation =
        civ.maxPopulation +
        (isLevelUp ? civ.popLevelGrow : 0) -
        removeBoost.maxPop;

      civ = this._updateStateObj('civList', civ.id, {
        level: civ.level + (isLevelUp ? 1 : 0),
        xp: civ.xp + xpGrow + (isLevelUp ? -civ.xpToLevel : 0),
        xpToLevel: civ.xpToLevel + (isLevelUp ? civ.xpLevelGrow : 0),
        action: overCapacity ? 0 : civ.action + actionGrow + civ.actionGrow,
        actionGrow:
          isLevelUp && civ.level === 1 ? civ.actionGrow + 0.25 : civ.actionGrow,
        population: Math.min(
          maxPopulation,
          civ.population +
            popGrow +
            (isLevelUp
              ? civ.popLevelGrow * (civ.population / civ.maxPopulation)
              : 0)
        ),
        maxPopulation,
        connect: overCapacity ? newConnect : civ.connect,
      });

      if (civ.population <= 0) {
        this.clearIndex('civList', civ.index);
        this._removeStateObj('civList', civ.id);
      } else if (civ.action >= 1) this.civAction(civ);
    });
    this.world.checkDiscRemove();
  }

  connectDisc(civId, discId) {
    const civ = this.state.civList.find(civ => civ.id === civId);

    this._updateStateObj('civList', civId, {
      connect: [...civ.connect, discId],
    });
  }

  disconnectDisc(civId, discId) {
    const civ = this.state.civList.find(civ => civ.id === civId);

    this._updateStateObj('civList', civId, {
      connect: civ.connect.filter(conn => conn !== discId),
    });
  }

  civAction(civ) {
    const possibleActions = civ.actionDiscs.filter(
      action => !civ.connect.includes(action.id) && action.level <= civ.level
    );
    const worldAction = this.world.createDisc(
      possibleActions[Math.floor(Math.random() * possibleActions.length)].id,
      civ.id
    );

    this._updateStateObj('civList', civ.id, {
      action: civ.action - 1,
      maxPopulation: civ.maxPopulation + (worldAction.maxPopBoost || 0),
    });
  }
}

export default Civs;
