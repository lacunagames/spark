import StateHandler from './statehandler';
import allDiscs from './data/discs';

const allCivs = [
  {
    id: 'trolls',
    title: 'Trolls',
    level: 1,
    population: 100,
    maxPopulation: 140,
    popLevelGrow: 40,
    xpToLevel: 12,
    xpLevelGrow: 2,
    biomes: ['jungle', 'desert', 'swamp'],
    govs: ['tribal'],
    actionDiscs: ['hunting', 'fishing', 'gathering', 'town'],
  },
  {
    id: 'humans',
    title: 'Humans',
    level: 1,
    population: 100,
    maxPopulation: 120,
    popLevelGrow: 30,
    xpToLevel: 10,
    xpLevelGrow: 2,
    biomes: ['grassland', 'jungle', 'mountain'],
    govs: ['tribal', 'oligarchy'],
    actionDiscs: ['digging', 'fishing', 'gathering', 'town', 'mining'],
  },
  {
    id: 'dwarves',
    title: 'Dwarves',
    level: 1,
    population: 100,
    maxPopulation: 100,
    popLevelGrow: 20,
    xpToLevel: 12,
    xpLevelGrow: 3,
    biomes: ['grassland', 'mountain'],
    govs: ['tribal', 'oligarchy'],
    actionDiscs: ['digging', 'fishing', 'hunting', 'town', 'mining'],
  },
  {
    id: 'gnomes',
    title: 'Gnomes',
    level: 1,
    population: 100,
    maxPopulation: 120,
    popLevelGrow: 30,
    xpToLevel: 10,
    xpLevelGrow: 4,
    biomes: ['mountain', 'swamp', 'forest'],
    govs: ['oligarchy'],
    actionDiscs: ['digging', 'fishing', 'gathering', 'town', 'mining'],
  },
  {
    id: 'elves',
    title: 'Elves',
    level: 1,
    population: 100,
    maxPopulation: 100,
    popLevelGrow: 10,
    xpToLevel: 14,
    xpLevelGrow: 4,
    biomes: ['swamp', 'forest'],
    govs: ['oligarchy'],
    actionDiscs: ['hunting', 'fishing', 'gathering', 'town'],
  },
  {
    id: 'orcs',
    title: 'Orcs',
    level: 1,
    population: 100,
    maxPopulation: 140,
    popLevelGrow: 20,
    xpToLevel: 12,
    xpLevelGrow: 2,
    biomes: ['grassland', 'forest', 'desert'],
    govs: ['tribal', 'oligarchy'],
    actionDiscs: ['hunting', 'digging', 'gathering', 'town', 'mining'],
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
            maxAction: 1,
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
      let grow = { pop: 0, xp: 0, action: 0 };

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
              Object.keys(multipliers).forEach(key => {
                multipliers[key] *=
                  mod[`${key}GrowMultiply`] !== undefined
                    ? mod[`${key}GrowMultiply`]
                    : 1;
              });
            }
          });
        });
        if (!disc.chance || Math.random() < disc.chance) {
          Object.keys(grow).forEach(key => {
            if (disc[`${key}Grow`])
              grow[key] += disc[`${key}Grow`] * multipliers[key];
          });
        }
      });

      const isLevelUp = civ.xp + grow.xp >= civ.xpToLevel;
      let maxPop = civ.maxPopulation;

      if (isLevelUp) {
        grow.pop += civ.popLevelGrow * (civ.population / civ.maxPopulation);
        grow.xp -= civ.xpToLevel;
        maxPop += civ.popLevelGrow;
      }

      civ = this._updateStateObj('civList', civ.id, {
        level: civ.level + (isLevelUp ? 1 : 0),
        xp: civ.xp + grow.xp,
        xpToLevel: civ.xpToLevel + (isLevelUp ? civ.xpLevelGrow : 0),
        maxAction: civ.maxActionBoost + (isLevelUp ? 1 : 0),
        action: civ.action + grow.action,
        population: Math.min(maxPop, civ.population + grow.pop),
        maxPopulation: maxPop,
      });

      if (isLevelUp) {
        this.world.logEvent({
          type: 'civLevelUp',
          civ: civ.id,
          level: civ.level,
        });
      }
      if (civ.population <= 0) {
        this.world.logEvent({ type: 'civDied', civ: civ.id });
        this.clearIndex('civList', civ.index);
        this._removeStateObj('civList', civ.id);
      } else if (civ.action >= civ.level) this.civAction(civ);
    });
    this.world.checkDiscRemove();
  }

  connectDisc(civId, discId) {
    const civ = this.state.civList.find(civ => civ.id === civId);
    const disc = this.world.state.discs.find(disc => disc.id === discId);
    const isBoost = disc.maxPopBoost || disc.maxActionBoost;
    const boostProps = {
      maxPopulation: civ.maxPopulation + (disc.maxPopBoost || 0),
      population:
        civ.population +
        (disc.maxPopBoost || 0) * (civ.population / civ.maxPopulation),
      maxAction: civ.maxAction + (disc.maxActionBoost || 0),
    };

    this._updateStateObj('civList', civId, {
      connect: [...civ.connect, discId],
      ...(isBoost ? boostProps : {}),
    });
  }

  disconnectDisc(civId, discId) {
    const civ = this.state.civList.find(civ => civ.id === civId);
    const disc = this.world.state.discs.find(disc => disc.id === discId);
    const isBoost = disc.maxPopBoost || disc.maxActionBoost;
    const newMaxPop = civ.maxPopulation - (disc.maxPopBoost || 0);
    const boostProps = {
      maxPopulation: newMaxPop,
      population: Math.min(civ.population, newMaxPop),
      maxAction: civ.maxAction - (disc.maxActionBoost || 0),
    };

    this._updateStateObj('civList', civId, {
      connect: civ.connect.filter(conn => conn !== discId),
      ...(isBoost ? boostProps : {}),
    });
  }

  civAction(civ) {
    const possibleActions = civ.actionDiscs.filter(action => {
      const discLevel = allDiscs.find(disc => disc.id === action).level;
      return !civ.connect.includes(action) && discLevel <= civ.level;
    });
    const discId =
      possibleActions[Math.floor(Math.random() * possibleActions.length)];

    if (!discId) {
      return console.log(`No action left for ${civ.id}`);
    }
    const disc = this.world.createDisc(discId, civ.id);
    this.world.logEvent({ type: 'civAction', civ: civ.id, disc: discId });
    this._updateStateObj('civList', civ.id, {
      action: civ.action - disc.level,
    });
  }
}

export default Civs;
