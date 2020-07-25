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
      defaultVal: 10,
      title: 'Food',
      maxName: 'maxFood',
      maxVal: 100,
    },
    { name: 'expand', defaultVal: 0, title: 'Expand' },
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
        civ = allCivs[Math.floor(Math.random() * allCivs.length)];
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
    this.world.createDisc(
      civ.biomes[Math.floor(Math.random() * civ.biomes.length)],
      civId
    );
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
  }

  civTurn() {
    this.state.civList.forEach(civ => {
      civ = this.turnDamage(civ);
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
      const newFood = civ.food + grow.food - 20;
      grow.pop += newFood / 10;
      if (newFood < 0) {
        grow.food -= newFood / 5;
      }

      civ = this._updateStateObj('civList', civ.id, {
        ...this.state.civStats.reduce(
          (obj, stat) => ({
            ...obj,
            [stat.name]: stat.maxName
              ? Math.min(
                  utils.round(civ[stat.name] + grow[stat.name]),
                  civ[stat.maxName]
                )
              : utils.round(civ[stat.name] + grow[stat.name]),
          }),
          {}
        ),
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
    const boostProps = Object.keys(disc.boost || []).reduce(
      (obj, key) => ({
        ...obj,
        [key]: civ[key] - disc.boost[key],
      }),
      {}
    );

    this._updateStateObj('civList', civId, {
      connect: civ.connect.filter(conn => conn !== discId),
      ...boostProps,
    });
    if (disc.onDisconnect) {
      this.world.executeActions({ actions: disc.onDisconnect, civId, disc });
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
    civ.connect
      .map(discId => this.world.state.discs.find(disc => disc.id === discId))
      .forEach(item => {
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
    return this._updateStateObj('civList', civ.id, {
      pop: utils.round(
        civ.pop - damages.reduce((vals, damageObj) => vals + damageObj.val, 0)
      ),
    });
  }
}

export default Civs;
