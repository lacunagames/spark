import StateHandler from './statehandler';
import allDiscs from './data/discs';
import { allCivs, allBoons } from './data/civList';

const defaultState = {
  positions: [
    { left: 44, top: 12 },
    { left: 56, top: 12 },
    { left: 44, top: 28 },
    { left: 56, top: 28 },
    { left: 44, top: 44 },
    { left: 56, top: 44 },
  ],
  allBoons,
  civList: [],
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
            popLog: [civ.population],
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
      if (civ.action >= civ.level) this.civAction(civ);
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
      let pop = Math.min(
        maxPop,
        Math.round((civ.population + grow.pop + Number.EPSILON) * 100) / 100
      );

      if (isLevelUp) {
        grow.pop += civ.popLevelGrow * (civ.population / civ.maxPopulation);
        grow.xp -= civ.xpToLevel;
        maxPop += civ.popLevelGrow;
      }

      civ = this._updateStateObj('civList', civ.id, {
        level: civ.level + (isLevelUp ? 1 : 0),
        xp: civ.xp + grow.xp,
        xpToLevel: civ.xpToLevel + (isLevelUp ? civ.xpLevelGrow : 0),
        maxAction: civ.maxAction + (isLevelUp ? 1 : 0),
        action: civ.action + grow.action,
        population: pop,
        maxPopulation: maxPop,
        popLog: [...civ.popLog, pop],
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
      const obsolete = civ.connect.some(
        conn =>
          conn !== action &&
          allDiscs.find(disc => disc.id === conn)?.upgrades?.includes(action)
      );
      return (
        !civ.connect.includes(action) && discLevel <= civ.level && !obsolete
      );
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
