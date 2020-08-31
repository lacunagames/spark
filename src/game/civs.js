import StateHandler from './statehandler';
import allCivs from './data/civList';
import utils from '@/game/utils';

const defaultState = {
  positions: [
    { left: 45, top: 28 },
    { left: 57, top: 28 },
    { left: 45, top: 44 },
    { left: 57, top: 44 },
    { left: 45, top: 60 },
    { left: 57, top: 60 },
  ],
  civList: [],
  civStats: [
    { name: 'xp', defaultVal: 0, title: 'Xp' },
    {
      name: 'pop',
      maxName: 'maxPop',
      defaultVal: 30,
      maxVal: 100,
      title: 'Population',
    },
    { name: 'tech', defaultVal: 10, title: 'Tech' },
    { name: 'science', defaultVal: 0, title: 'Science' },
    { name: 'warlust', defaultVal: 30, title: 'Warlust' },
    { name: 'military', defaultVal: 0, title: 'Military power' },
    { name: 'mana', defaultVal: 50, title: 'Mana' },
    { name: 'magic', defaultVal: 0, title: 'Magic power' },
    { name: 'wealth', defaultVal: 0, title: 'Wealth' },
    { name: 'commerce', defaultVal: 0, title: 'Commerce' },
    {
      name: 'food',
      defaultVal: 20,
      title: 'Food',
      maxName: 'maxFood',
      maxVal: 100,
      minVal: 0,
    },
    { name: 'expand', defaultVal: 0, title: 'Expand' },
    {
      name: 'influence',
      defaultVal: 0,
      title: 'Influence',
      maxVal: 100,
      minVal: 0,
    },
  ],
};

class Civs extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
    this.initIndexes('civList');
  }

  initCivs() {
    for (let i = 0; i < 2; i++) {
      let civ;
      do {
        civ = utils.randomEl(allCivs);
      } while (!this.createCiv(civ.id));
    }
  }

  createCiv(civId) {
    let civ = allCivs.find(civ => civ.id === civId);
    if (this._find('civList', civId)) {
      return false;
    }
    this.setState({
      civList: [
        ...this.state.civList,
        {
          ...this.state.civStats.reduce(
            (obj, stat) => ({
              ...obj,
              [stat.name]: stat.defaultVal,
              ...(stat.maxName
                ? {
                    [stat.maxName]: stat.maxVal,
                  }
                : {}),
              ...(stat.minName
                ? {
                    [stat.minName]: stat.minVal,
                  }
                : {}),
            }),
            {}
          ),
          ...civ,
          level: 1,
          index: this.useIndex('civList'),
          influenceDecay: 0.01,
          connect: [],
          popLog: [
            civ.pop ||
              this.state.civStats.find(stat => stat.name === 'pop')?.defaultVal,
          ],
        },
      ],
    });
    this.world.logEvent({ type: 'civCreated', civId });
    this.world.createDisc(utils.randomEl(civ.biomes), { targetIds: civId });
    [...civ.startingTechs, 'code-of-laws'].forEach(techId =>
      this.world.createDisc(techId, { targetIds: civId })
    );
    civ.startingBoons.forEach(boonId =>
      this.world.createDisc(boonId, { targetIds: civId })
    );
    this.world.executeActions({
      actions: [
        { queueAction: 'war' },
        { queueAction: 'magic' },
        { queueAction: 'commerce' },
        { queueAction: 'expand' },
      ],
      civId,
    });
    return this._find('civList', civId);
  }

  killCiv(civId) {
    const civ = this._find('civList', civId);
    this.system.showMessage(this.world.logEvent({ type: 'civDied', civId }));
    civ.connect.forEach(discId => {
      const disc = this.world._find('discs', discId);
      if (
        !['biome', 'beast'].includes(disc.type) &&
        !disc.isGlobal &&
        !this.state.civList.find(
          civFind => civFind.id !== civId && civFind.connect.includes(discId)
        )
      ) {
        this.world.removeDisc(discId);
      } else {
        this.disconnectDisc(civId, discId);
      }
    });
    this.world.checkDiscRemove();
    this.world.removeQueueItems({ civId, skipActions: true });
    this.clearIndex('civList', civ?.index);
    this._removeStateObj('civList', civId);
    if (this.state.civList.length === 0) {
      this.world.executeActions({ actions: [{ triggerEnding: 'extinction' }] });
    }
  }

  civTurn() {
    this.state.civList.forEach(civ => {
      civ = this.turnDamage(civ.id);
      const grow = this.state.civStats.reduce(
        (obj, stat) => ({ ...obj, [stat.name]: 0 }),
        {}
      );

      civ.connect.forEach(discId => {
        const turnGrow = this.world._find('discs', discId)?.turnGrow;
        if (turnGrow && (!turnGrow.chance || Math.random() < turnGrow.chance)) {
          Object.keys(turnGrow).forEach(key => {
            if (typeof grow[key] === 'number') {
              grow[key] += turnGrow[key];
            }
          });
        }
      });

      const isLevelUp = civ.xp + grow.xp >= civ.xpToLevel;

      if (isLevelUp) {
        grow.pop += civ.popLevelGrow * (civ.pop / civ.maxPop);
        grow.xp -= civ.xpToLevel;
        civ = this._updateStateObj('civList', civ.id, {
          maxPop: civ.maxPop + civ.popLevelGrow,
          level: civ.level + 1,
          xpToLevel: civ.xpToLevel + civ.xpLevelGrow,
        });
      }
      grow.food -= (civ.pop + grow.pop) / 5;
      const newFood = civ.food + grow.food - (civ.pop + grow.pop) / 5;
      grow.pop += newFood / 10;
      if (newFood < 0) {
        grow.food -= newFood / 5;
      }
      grow.influence -=
        (civ.influence + grow.influence) *
        civ.influenceDecay *
        (1 + (civ.influence + grow.influence) / 50);

      civ = this._updateStateObj('civList', civ.id, {
        ...this.state.civStats.reduce((obj, stat) => {
          const val = utils.round(civ[stat.name] + grow[stat.name]);
          const valCapped = Math.min(
            val,
            civ[stat.maxName] ?? stat.maxVal ?? val
          );
          return {
            ...obj,
            [stat.name]: Math.max(
              valCapped,
              civ[stat.minName] ?? stat.minVal ?? valCapped
            ),
          };
        }, {}),
      });

      if (isLevelUp && civ.pop > 0) {
        this.world.logEvent({
          type: 'civLevelUp',
          civId: civ.id,
          level: civ.level,
        });
      }
      if (civ.pop <= 0) {
        this.killCiv(civ.id);
      }
      this._updateStateObj('civList', civ.id, {
        popLog: [...civ.popLog, civ.pop],
      });
    });
    this.world.checkDiscRemove();
  }

  connectDisc(civId, discId) {
    const civ = this._find('civList', civId);
    const disc = this.world._find('discs', discId);
    const boostProps = Object.keys(disc.boost || []).reduce((obj, key) => {
      let maxStat = this.state.civStats.find(stat => stat.maxName === key);
      return {
        ...obj,
        ...(maxStat
          ? {
              [key]: civ[key] + disc.boost[key],
              [maxStat.name]: Math.min(
                civ[key] + disc.boost[key],
                civ[maxStat.name]
              ),
            }
          : { [key]: civ[key] + disc.boost[key] }),
      };
    }, {});

    this._updateStateObj('civList', civId, {
      connect: [...civ.connect, discId],
      ...boostProps,
    });
    if (disc.onConnect) {
      this.world.executeActions({ actions: disc.onConnect, civId, disc });
    }
  }

  disconnectDisc(civId, discId) {
    const civ = this._find('civList', civId);
    const disc = this.world._find('discs', discId);
    if (!civ || !disc) {
      return console.warn(
        `disconnectDisc error - civId: ${civId}, discId: ${discId}.`
      );
    }
    const boostProps = Object.keys(disc.boost || []).reduce((obj, key) => {
      const maxStat = this.state.civStats.find(stat => stat.maxName === key);
      const newVal = utils.round(civ[key] - disc.boost[key]);
      return {
        ...obj,
        [key]: newVal,
        ...(maxStat
          ? { [maxStat.name]: Math.min(civ[maxStat.name], newVal) }
          : {}),
      };
    }, {});

    this._updateStateObj('civList', civId, {
      connect: civ.connect.filter(conn => conn !== discId),
      ...boostProps,
    });
    if (disc.onDisconnect) {
      this.world.executeActions({ actions: disc.onDisconnect, civId, disc });
    }
  }

  damageCiv(civId, damageObj) {
    const civ = this._find('civList', civId);
    const protects = [];
    damageObj = { ...damageObj };
    civ.connect
      .map(discId => this.world._find('discs', discId))
      .forEach(item => {
        if (
          item.protect &&
          (!item.protect.chance || item.protect.chance < Math.random())
        ) {
          protects.push({ ...item.protect, id: item.id, labels: item.labels });
        }
      });

    protects.push({
      mult: 1 / (0.15 * civ.military + 1),
      type: 'chaos',
      validLabels: ['beast'],
    });
    protects.push({
      mult: 1 / (0.15 * civ.magic + 1),
      type: 'arcane',
      validLabels: ['force'],
    });

    protects.some(protectObj => {
      if (
        (!protectObj.validLabels ||
          protectObj.validLabels.some(label =>
            damageObj.labels?.includes(label)
          )) &&
        (!damageObj.validLabels ||
          damageObj.validLabels.some(label =>
            protectObj.labels?.includes(label)
          ))
      ) {
        let matrix = this.world.state.damageMatrix;
        let typeMult = 1;
        if (matrix[protectObj.type].includes(damageObj.type)) {
          typeMult = this.world.state.strongDamageMult;
        } else if (matrix[damageObj.type].includes(protectObj.type)) {
          typeMult = 1 / this.world.state.strongDamageMult;
        }
        if (protectObj.mult) {
          damageObj.val *= Math.min(protectObj.mult * (1 / typeMult), 1);
        }
        if (protectObj.val && damageObj.val > 0) {
          let damageVal = damageObj.val;
          let protectVal = protectObj.val * typeMult;
          damageObj.val = Math.max(damageObj.val - protectVal, 0);
          this.world._updateStateObj('discs', protectObj.id, {
            protect: {
              ...protectObj,
              val: Math.max(protectObj.val - damageVal, 0),
            },
          });
        }
        return damageObj.val === 0;
      }
    });
    if (damageObj.val) {
      return this._updateStateObj('civList', civId, {
        pop: utils.round(civ.pop - damageObj.val),
      });
    }
    return civ;
  }

  turnDamage(civId) {
    const damages = [];
    let civ = this._find('civList', civId);
    civ.connect
      .map(discId => this.world._find('discs', discId))
      .forEach(item => {
        if (
          item.turnDamage &&
          (!item.turnDamage.chance || item.turnDamage.chance < Math.random())
        ) {
          damages.push({ ...item.turnDamage, labels: item.labels });
        }
      });

    damages.forEach(damageObj => this.damageCiv(civ.id, damageObj));
    return this._find('civList', civId);
  }
}

export default Civs;
