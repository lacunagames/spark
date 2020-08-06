import StateHandler from './statehandler';
import allCivs from './data/civList';
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
    { name: 'mana', defaultVal: 0, title: 'Mana' },
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
    setTimeout(() => this.initCivs(), 0);
  }

  initCivs() {
    for (let i = 0; i < 2; i++) {
      let civ;
      do {
        civ = utils.randomEl(allCivs);
      } while (!this.createCiv(civ.id));
    }
    this.system.setState({ muteMessages: false });
  }

  createCiv(civId) {
    let civ = allCivs.find(civ => civ.id === civId);
    if (this.state.civList.find(civ => civ.id === civId)) {
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
          connect: [],
          popLog: [
            civ.pop ||
              this.state.civStats.find(stat => stat.name === 'pop')?.defaultVal,
          ],
        },
      ],
    });
    this.world.logEvent({ type: 'civCreated', civId: civId });
    this.world.createDisc(utils.randomEl(civ.biomes), civId);
    civ.startingTechs.forEach(techId => this.world.createDisc(techId, civId));
    civ.startingBoons.forEach(boonId => this.world.createDisc(boonId, civId));
    this.world.executeActions({
      actions: [
        { queueAction: 'war' },
        { queueAction: 'magic' },
        { queueAction: 'commerce' },
        { queueAction: 'expand' },
      ],
      civId,
    });
    return this.state.civList.find(civ => civ.id === civId);
  }

  killCiv(civId, isShowMessage) {
    const log = this.world.logEvent({ type: 'civDied', civId: civId });
    if (isShowMessage) {
      this.system.showMessage(log);
    }
    this._updateStateObj('civList', civId, { connect: [] });
    this.world.checkDiscRemove();
    this.world.removeQueueItems({ civId: civId });
    this.clearIndex(
      'civList',
      this.state.civList.find(civ => civ.id === civId)?.index
    );
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
        const turnGrow = this.world.state.discs.find(disc => disc.id === discId)
          ?.turnGrow;
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
    const civ = this.state.civList.find(civ => civ.id === civId);
    const disc = this.world.state.discs.find(disc => disc.id === discId);
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
    const civ = this.state.civList.find(civ => civ.id === civId);
    const disc = this.world.state.discs.find(disc => disc.id === discId);
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
    const civ = this.state.civList.find(civ => civ.id === civId);
    const protects = [];
    damageObj = { ...damageObj };
    civ.connect
      .map(discId => this.world.state.discs.find(disc => disc.id === discId))
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
      type: 'order',
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
          let damageVal = damageObj.val * (1 / typeMult);
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
    let civ = this.state.civList.find(civ => civ.id === civId);
    civ.connect
      .map(discId => this.world.state.discs.find(disc => disc.id === discId))
      .forEach(item => {
        if (
          item.turnDamage &&
          (!item.turnDamage.chance || item.turnDamage.chance < Math.random())
        ) {
          damages.push({ ...item.turnDamage, labels: item.labels });
        }
      });

    damages.forEach(damageObj => this.damageCiv(civ.id, damageObj));
    return this.state.civList.find(civ => civ.id === civId);
  }
}

export default Civs;
