import StateHandler from './statehandler';
import { allCivs } from './data/civList';
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
};

const civStats = [
  { name: 'xp', defaultVal: 0 },
  { name: 'pop', maxName: 'maxPop', defaultVal: 30, maxVal: 100 },
  { name: 'action', maxName: 'maxAction', defaultVal: 1, maxVal: 1 },
  { name: 'tech', defaultVal: 10 },
  { name: 'military', defaultVal: 0 },
  { name: 'magic', defaultVal: 0 },
  { name: 'commerce', defaultVal: 0 },
  { name: 'expand', defaultVal: 0 },
];

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
            ...civStats.reduce(
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
              civ.pop || civStats.find(stat => stat.name === 'pop')?.defaultVal,
            ],
          },
        ],
      });
      this.world.logEvent({ type: 'civCreated', civId: civ.id });
    }
    this.state.civList.forEach(civ => {
      this.world.createDisc(
        civ.biomes[Math.floor(Math.random() * civ.biomes.length)],
        civ.id
      );
      civ.startingTechs.forEach(techId =>
        this.world.createDisc(techId, civ.id)
      );
      civ.startingBoons.forEach(boonId =>
        this.world.createDisc(boonId, civ.id)
      );
      if (civ.action >= civ.level) this.civAction(civ);
    });
    this.system.setState({ muteMessages: false });
  }

  civTurn() {
    this.state.civList.forEach(civ => {
      civ = this.turnDamage(civ);
      const grow = civStats.reduce(
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

      civ = this._updateStateObj('civList', civ.id, {
        ...civStats.reduce(
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
        this.world.logEvent({ type: 'civDied', civId: civ.id });
        this._updateStateObj('civList', civ.id, { connect: [] });
        this.world.checkDiscRemove();
        this.clearIndex('civList', civ.index);
        this._removeStateObj('civList', civ.id);
      } else if (civ.action >= civ.level) {
        civ = this.civAction(civ);
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
      let maxStat = civStats.find(stat => stat.maxName === key);
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
      this.world.executeActions({ actions: disc.onConnect, civId });
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
      // console.log(`No action left for ${civ.id}`);
      return civ;
    }
    const disc = this.world.createDisc(discId, civ.id);
    this.world.logEvent({ type: 'civAction', civId: civ.id, discId });
    return this._updateStateObj('civList', civ.id, {
      action: civ.action - disc.level,
    });
  }
}

export default Civs;
