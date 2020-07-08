import StateHandler from './statehandler';
import { allCivs, allBoons } from './data/civList';
import utils from '@/game/utils';

const defaultState = {
  positions: [
    { left: 44, top: 12 },
    { left: 56, top: 12 },
    { left: 44, top: 28 },
    { left: 56, top: 28 },
    { left: 44, top: 44 },
    { left: 56, top: 44 },
  ],
  civList: [],
  boons: [],
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
      civ.startingBoons.forEach(boonId => this.addBoon(boonId, civ.id));
      civ.startingTechs.forEach(techId =>
        this.world.createDisc(techId, civ.id)
      );
      if (civ.action >= civ.level) this.civAction(civ);
    });
    this.system.setState({ muteMessages: false });
  }

  civTurn() {
    this.state.boons.forEach(boon => {
      const durations = boon.durations.map(val => (val > 0 ? val - 1 : val));
      this._updateStateObj('boons', boon.id, { durations });
      durations.forEach((val, index) => {
        if (val === 0) {
          this.world.logEvent({
            type: 'civLostBoon',
            boon: boon.id,
            civ: boon.civs[index],
          });
          this.removeBoon(boon.id, boon.civs[index]);
        }
      });
    });
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
      });

      civ = this.turnDamage(civ);

      if (isLevelUp && civ.population > 0) {
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
      } else if (civ.action >= civ.level) {
        civ = this.civAction(civ);
      }
      this._updateStateObj('civList', civ.id, {
        popLog: [...civ.popLog, civ.population],
      });
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
    if (disc.onConnect) {
      this.world.executeActions({ actions: disc.onConnect, civId });
    }
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

  addBoon(boonId, civId) {
    const boon =
      this.state.boons.find(boon => boon.id === boonId) ||
      allBoons.find(boon => boon.id === boonId);

    if (boon.civs) {
      this._updateStateObj('boons', boonId, {
        ...boon,
        civs: [...boon.civs, civId],
        durations: [...boon.durations, boon.duration || -1],
      });
    } else {
      this.setState({
        boons: [
          ...this.state.boons,
          {
            ...boon,
            civs: [civId],
            durations: [boon.duration || -1],
          },
        ],
      });
    }
    [...(boon.upgrades || []), ...(boon.removes || [])].forEach(boonId =>
      this.removeBoon(boonId, civId)
    );
  }

  removeBoon(boonId, civId) {
    const boon = this.state.boons.find(boon => boon.id === boonId);
    if (!boon) return;
    const index = boon.civs.indexOf(civId);
    const isRemove = boon.civs.length === 1 && index > -1;

    if (isRemove) {
      this._removeStateObj('boons', boonId);
    } else {
      this._updateStateObj('boons', boonId, {
        ...boon,
        civs: boon.civs.filter((item, i) => i !== index),
        durations: boon.durations.filter((item, i) => i !== index),
      });
    }
  }

  turnDamage(civ) {
    const protects = [];
    const damages = [];
    const typeMatrix = {
      earth: { strong: ['air'], weak: ['arcane'] },
      fire: { strong: ['water'], weak: ['arcane'] },
      water: { strong: ['fire'], weak: ['arcane'] },
      air: { strong: ['earth'], weak: ['arcane'] },
      nature: { strong: ['decay'], weak: ['arcane'] },
      decay: { strong: ['nature'], weak: ['arcane'] },
      chaos: { strong: ['order'] },
      order: { strong: ['chaos'] },
      arcane: {
        strong: [
          'air',
          'earth',
          'water',
          'fire',
          'nature',
          'decay',
          'chaos',
          'order',
        ],
      },
    };
    const setDamage = (damageObj, protectObj) => {
      let typeMult = 1;
      if (typeMatrix[protectObj.type].strong?.includes(damageObj.type)) {
        typeMult = 1.5;
      } else if (typeMatrix[protectObj.type].weak?.includes(damageObj.type)) {
        typeMult = 0.5;
      } else if (protectObj.type !== damageObj.type) {
        typeMult = 0.85;
      }
      if (protectObj.mult) {
        damageObj.val *= protectObj.mult * (1 / typeMult);
      }
      if (protectObj.val && damageObj.val > 0) {
        let val = protectObj.val * typeMult;
        damageObj.val -= val;
        protectObj.val -= damageObj.val + val;
        damageObj.val = Math.max(damageObj.val, 0);
        protectObj.val = Math.max(protectObj.val, 0);
      }
      return damageObj.val === 0;
    };
    [
      ...civ.connect.map(discId =>
        this.world.state.discs.find(disc => disc.id === discId)
      ),
      ...this.state.boons.filter(boon => boon.civs.includes(civ.id)),
    ].forEach(item => {
      if (
        item.turnProtect &&
        (!item.turnProtect.chance || item.turnProtect.chance < Math.random())
      ) {
        protects.push({ ...item.turnProtect, item });
      }
      if (
        item.turnDamage &&
        (!item.turnDamage.chance || item.turnDamage.chance < Math.random())
      ) {
        damages.push({ ...item.turnDamage, item });
      }
    });

    damages.forEach(damageObj => {
      protects.some(protectObj => {
        if (
          (!protectObj.validLabels ||
            protectObj.validLabels.some(label =>
              damageObj.item.labels?.includes(label)
            )) &&
          (!damageObj.validLabels ||
            damageObj.validLabels.some(label =>
              protectObj.item.labels?.includes(label)
            ))
        ) {
          return setDamage(damageObj, protectObj);
        }
      });
    });
    console.log(
      civ.id,
      utils.round(damages.reduce((vals, damageObj) => vals + damageObj.val, 0))
    );
    return this._updateStateObj('civList', civ.id, {
      population: utils.round(
        civ.population -
          damages.reduce((vals, damageObj) => vals + damageObj.val, 0)
      ),
    });
  }

  civAction(civ) {
    const possibleActions = [];
    civ.connect.forEach(discId => {
      const disc = this.world.state.discs.find(disc => disc.id === discId);
      const obsolete = civ.connect.some(
        conn =>
          conn !== disc.id &&
          this.world.state.allDisclike
            .find(disc => disc.id === conn)
            ?.upgrades?.includes(disc.id)
      );

      if (
        disc.actionDisc &&
        !obsolete &&
        !civ.connect.includes(disc.actionDisc)
      ) {
        possibleActions.push(disc.actionDisc);
      }
    });
    const discId =
      possibleActions[Math.floor(Math.random() * possibleActions.length)];

    if (!discId) {
      console.log(`No action left for ${civ.id}`);
      return civ;
    }
    const disc = this.world.createDisc(discId, civ.id);
    this.world.logEvent({ type: 'civAction', civ: civ.id, disc: discId });
    return this._updateStateObj('civList', civ.id, {
      action: civ.action - disc.level,
    });
  }
}

export default Civs;
