import StateHandler from './statehandler';
import allDiscs from './data/discs';
import allBoons from './data/boons';
import allTechs from './data/civTech';
import allSpells from './data/spells';
import utils from '@/game/utils';

const getDistance = (a, b) =>
  Math.sqrt(Math.pow(a.left - b.left, 2) + Math.pow(a.top - b.top, 2));
const getPosArray = (areas, excludeAreas) => {
  const step = 10;
  const rand = 1;
  const arr = [];
  const orderedArr = [];

  areas.forEach(coords => {
    for (let ix = 0; ix < (coords.maxX - coords.minX) / (step * 0.7); ix++) {
      for (let iy = 0; iy < (coords.maxY - coords.minY) / step; iy++) {
        const left = coords.minX + ix * step * 0.7;
        const top = coords.minY + iy * step;
        let isValid = true;
        for (let iExcl = 0; iExcl < excludeAreas.length; iExcl++) {
          const area = excludeAreas[iExcl];
          if (
            (left >= area.minX &&
              left <= area.maxX &&
              top >= area.minY &&
              top <= area.maxY) ||
            getDistance({ left, top }, { left: area.cX, top: area.cY }) <=
              area.range
          ) {
            isValid = false;
          }
        }
        if (isValid) {
          arr.push({
            left: left + Math.floor(Math.random() * 20 * rand - 10 * rand) / 10,
            top: top + Math.floor(Math.random() * 20 * rand - 10 * rand) / 10,
          });
        }
      }
    }
  });
  orderedArr.push(arr.splice(Math.floor(Math.random() * arr.length), 1)[0]);
  for (let i = arr.length; i > 0; i--) {
    let maxDistance = 0;
    let maxI = 0;
    for (let iArr = 0; iArr < arr.length; iArr++) {
      let itemDistance = 1000;

      for (let iOrdered = 0; iOrdered < orderedArr.length; iOrdered++) {
        let currDistance = getDistance(orderedArr[iOrdered], arr[iArr]);

        if (itemDistance > currDistance) itemDistance = currDistance;
      }
      if (itemDistance > maxDistance) {
        maxDistance = itemDistance;
        maxI = iArr;
      }
    }
    orderedArr.push(arr.splice(maxI, 1)[0]);
  }

  return orderedArr;
};

const positions = getPosArray(
  [{ minX: 6, minY: 8, maxX: 96, maxY: 96 }],
  [
    { minX: 35, minY: 25, maxX: 65, maxY: 55 },
    { minX: 0, minY: 75, maxX: 40, maxY: 100 },
    { cX: 100, cY: 100, range: 52 },
  ]
);

const defaultState = {
  discs: [],
  positions,
  turn: 0,
  log: [{ id: 0, items: [] }],
  allDisclike: [...allDiscs, ...allBoons, ...allSpells, ...allTechs],
  actionQueue: [],
  ending: false,
  damageMatrix: {
    earth: ['water', 'fire'], // Water and Fire are weak against Earth
    fire: ['water', 'nature'],
    water: ['air', 'nature'],
    air: ['fire', 'earth'],
    nature: ['earth', 'air'],
    chaos: ['air', 'earth', 'water', 'fire', 'nature'],
    arcane: ['air', 'earth', 'water', 'fire', 'nature', 'chaos'],
  },
  strongDamageMult: 1.5,
  healths: {},
  healthRegen: 0.05,
  connectionTypes: {}, // Eg. 'trolls|lake': 0 - negative, 1 - positive
};

class World extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
    this.initIndexes('world', 'knowledge', 'boon');
    setTimeout(() => this.initWorld());
  }

  initWorld() {
    this.civs.initCivs();
    const biomes = allDiscs.filter(
      disc => disc.type === 'biome' && !disc.upgrades
    );
    let biomeId;
    let counter = this.state.discs.filter(disc => disc.type == 'biome').length;

    this.createDisc('mountain');
    while (counter < 6) {
      biomeId = utils.randomEl(biomes)?.id;
      if (!this.state.discs.find(disc => disc.id == biomeId)) {
        this.createDisc(biomeId);
        counter++;
      }
    }
    this.spark.initSpark();
  }

  getClosestWorldIndex(index) {
    const civIndex = typeof index === 'string' && +index.split('civ-')[1];
    const pos = {
      left:
        typeof civIndex === 'number' && civIndex > -1
          ? this.civs.state.positions[civIndex].left
          : this.state.positions[index].left,
      top:
        typeof civIndex === 'number' && civIndex > -1
          ? this.civs.state.positions[civIndex].top
          : this.state.positions[index].top,
    };
    let closestIndex = 0;
    let distance = 1000;

    for (let i = 0; i < this.state.positions.length; i++) {
      if (
        i !== index &&
        !this.state.discs.find(
          disc => !['knowledge', 'boon'].includes(disc.type) && disc.index === i
        )
      ) {
        const newDistance = getDistance(pos, {
          ...this.state.positions[i],
        });
        if (newDistance < distance) {
          distance = newDistance;
          closestIndex = i;
        }
      }
    }
    return closestIndex;
  }

  getDiscUpgrade(discId, civId) {
    const upgradeDiscs = [];
    this.state.allDisclike.forEach(disc => {
      if (disc.upgrades?.includes(discId)) {
        upgradeDiscs.push(disc);
      }
    });
    let activeUpgrade = upgradeDiscs.find(upg =>
      civId
        ? this.civs._find('civList', civId)?.connect.includes(upg.id)
        : this._find('discs', upg.id)
    );
    let i = 0;
    while (!activeUpgrade && i < upgradeDiscs.length) {
      activeUpgrade = this.getDiscUpgrade(upgradeDiscs[i].id, civId);
      i++;
    }
    if (activeUpgrade && typeof activeUpgrade.index !== 'number') {
      activeUpgrade = this._find('discs', activeUpgrade.id);
    }
    return activeUpgrade;
  }

  nextTurn() {
    this.system.setState({ muteMessages: true, isSparkTurn: false });

    this.state.log[this.state.turn].items.forEach((log, index) => {
      if (log.onSkip || log.buttons) {
        if (log.onSkip) {
          this.executeActions({
            actions: log.onSkip,
            civId: log.civId,
            disc: { id: log.discId },
          });
        }
        this.turnLogStatic(index);
      }
    });

    this.setState({
      turn: this.state.turn + 1,
      log: [...this.state.log, { id: this.state.turn + 1, items: [] }],
    });

    this.civs.civTurn();
    this.worldTurn();
    this.spark.sparkTurn();

    this.state.discs.forEach(disc => {
      if (disc?.currentDuration) {
        disc = this._updateStateObj('discs', disc.id, {
          currentDuration: disc.currentDuration - 1,
        });
        if (disc?.currentDuration === 0) {
          this.removeDisc(disc.id);
          if (disc.onExpire) {
            this.executeActions({
              actions: disc.onExpire,
              civId: undefined,
              disc,
            });
          }
        }
      } else if (disc?.durations) {
        const durations = Object.keys(disc.durations).reduce(
          (obj, civId) => ({
            ...obj,
            [civId]:
              disc.durations[civId] > 0
                ? disc.durations[civId] - 1
                : disc.durations[civId],
          }),
          {}
        );
        this._updateStateObj('discs', disc.id, { durations });
        Object.keys(durations).forEach(civId => {
          if (durations[civId] === 0) {
            if (!disc.skipLog) {
              this.logEvent({
                type: 'civLostBoon',
                discId: disc.id,
                civId: civId,
              });
            }
            if (
              this.civs.state.civList.some(
                civ => civ.id !== civId && civ.connect.includes(disc.id)
              )
            ) {
              delete durations[civId];
              this._updateStateObj('discs', disc.id, { durations });
              this.civs.disconnectDisc(civId, disc.id);
            } else {
              this.removeDisc(disc.id);
            }
            if (disc.onExpire) {
              this.executeActions({ actions: disc.onExpire, civId, disc });
            }
          }
        });
      }
    });

    const removeItems = [];
    this.state.actionQueue.forEach(item => {
      const civ = this.civs._find('civList', item.civId);
      if (
        (!item.conditionStat ||
          civ[item.conditionStat.stat] >= item.conditionStat.value) &&
        (!item.conditionTurn || item.conditionTurn <= this.state.turn)
      ) {
        this.executeActions({ actions: [item], civId: item.civId });
        removeItems.push(item);
      }
    });
    if (removeItems.length) {
      this.setState({
        actionQueue: this.state.actionQueue.filter(
          item => !removeItems.includes(item)
        ),
      });
    }

    this.system.setState({ muteMessages: false, isSparkTurn: true });
  }

  worldTurn() {
    const civIds = this.civs.state.civList.map(civ => civ.id);
    this.state.discs.forEach(disc => {
      // VILLAIN actions
      if (disc.villain) {
        const villain = { ...disc.villain };
        villain.mana += villain.manaPerTurn;
        disc.alwaysConnect?.forEach(
          obj =>
            (villain.power = utils.round(
              villain.power + (this._find('discs', obj.disc)?.powerPerTurn || 0)
            ))
        );
        if (villain.mana >= 40) {
          const possibleActions = [
            { power: 1, discId: 'destruction-minion' },
            { power: 1, discId: 'lightning-strike' },
            { power: 2, discId: 'chaos-explosion' },
            { power: 3, discId: 'destruction-champion' },
            { power: 4, discId: 'chaos-volcano' },
            { power: 6, discId: 'destroy-biome' },
            { power: 10, discId: 'destroy-world' },
          ].filter(
            action =>
              !this._find('discs', action.discId) &&
              !disc.connect?.some(conn =>
                this._find('discs', conn)?.upgrades?.includes(action.discId)
              ) &&
              action.power <= villain.power
          );
          const action = utils.randomEl(possibleActions);
          if (action) {
            const actionDisc = this._find('allDisclike', action.discId);
            villain.mana -= actionDisc.mana;
            if (actionDisc.type === 'spell') {
              const civId = actionDisc.isGlobal
                ? undefined
                : utils.randomEl(civIds);
              this.executeActions({
                actions: actionDisc.onCast,
                civId,
                disc: actionDisc,
                villain: disc,
              });
              if (!actionDisc.skipLog) {
                this.logEvent({
                  type: 'spellVillain',
                  civId,
                  discId: actionDisc.id,
                  villainId: disc.id,
                });
              }
            } else {
              this.createDisc(actionDisc.id, {
                targetIds: actionDisc.isGlobal ? undefined : civIds,
                closeToIndex: disc.index,
              });
              this.logEvent({
                type: 'dangerAppearedVillain',
                discId: actionDisc.id,
                civIds: actionDisc.isGlobal ? undefined : civIds,
                villainId: disc.id,
              });
            }
          }
        }
        this._updateStateObj('discs', disc.id, { villain });
      }

      // BEAST Heal / Damage
      if (['beast', 'force'].includes(disc.type)) {
        if (this.state.healths[disc.id] < disc.health) {
          const newHealth = Math.min(
            disc.health,
            utils.round(
              this.state.healths[disc.id] +
                (disc.healthRegen ?? this.state.healthRegen) * disc.health
            )
          );
          this._updateStateKey('healths', disc.id, newHealth);
        }
        disc.connect?.forEach(conn => {
          const otherDisc = this._find('discs', conn);
          [
            [otherDisc, disc],
            [disc, otherDisc],
          ].forEach(pair => {
            if (!pair[0]?.health || !pair[1]?.turnDamage) {
              return;
            }
            this.damageTarget(pair[0].id, pair[1].turnDamage);
            if (this.state.healths[pair[0].id] <= 0) {
              this.removeDisc(pair[0].id);
              this.logEvent({
                type: 'beastKilled',
                discId: pair[1].id,
                targetId: pair[0].id,
              });
            }
          });
        });
      }
    });
    if (this.state.turn === 1) {
      this.createDisc('god-war');
      this.logEvent({ type: 'dangerAppeared', discId: 'god-war' });
    }

    // Create random dangers
    if (this.state.turn % 12 === 0 || this.state.turn === 2) {
      const dangerDiscs = allDiscs
        .filter(
          disc =>
            ['force', 'beast'].includes(disc.type) &&
            !disc.labels?.includes('noRandom') &&
            !this._find('discs', disc.id) &&
            this.state.turn / 10 >= disc.turnDamage?.val - 2 &&
            (!disc.requires ||
              disc.requires.every(discId => this._find('discs', discId)))
        )
        .map(disc => disc.id);
      const randomDanger = utils.randomEl(dangerDiscs);
      if (randomDanger) {
        this.createDisc(randomDanger, { targetIds: civIds });
        this.logEvent({
          type: 'dangerAppeared',
          discId: randomDanger,
          civIds,
        });
      }
    }
  }

  createDisc(discId, { targetIds, closeToIndex } = {}) {
    targetIds = Array.isArray(targetIds) ? targetIds : [targetIds];
    let returnVal, isUpgrade;
    targetIds.forEach(targetId => {
      let disc =
        this._find('discs', discId) || this._find('allDisclike', discId);
      const civ = this.civs._find('civList', targetId);
      const target = !civ && this._find('discs', targetId);
      closeToIndex =
        closeToIndex ??
        (disc.closeToDisc &&
          this._find('discs', disc.closeToDisc, true)?.index) ??
        (disc.closeToCiv && civ && `civ-${civ.index}`);
      const isUpgraded = this.state.discs.find(
        disc =>
          disc.upgrades?.includes(discId) && civ?.connect.includes(disc.id)
      );
      const canAfford =
        !disc.cost || !civ || civ?.[disc.cost.stat] >= disc.cost.value;

      if (
        !disc ||
        civ?.connect.includes(discId) ||
        target?.connect?.includes(discId) ||
        disc?.connect?.includes(targetId) ||
        isUpgraded ||
        !canAfford ||
        this.state.ending
      ) {
        return false;
      }

      [...(disc.removes || []), ...(disc.upgrades || [])].forEach(
        removeDiscId => {
          const discUnique = this._find('discs', `${removeDiscId}|${targetId}`);
          const othersConnected =
            this.civs.state.civList.some(
              civ =>
                !targetIds.includes(civ.id) &&
                civ.connect.includes(removeDiscId)
            ) ||
            this.state.discs.some(
              disc =>
                !targetIds.includes(disc.id) &&
                disc.connect?.includes(removeDiscId)
            );
          if (civ?.connect.includes(removeDiscId) && othersConnected) {
            this.civs.disconnectDisc(targetId, removeDiscId);
          }
          if (
            target?.connect?.includes(removeDiscId) ||
            (this._find('discs', removeDiscId)?.connect?.includes(targetId) &&
              othersConnected)
          ) {
            this.disconnectDisc(targetId, removeDiscId);
          }
          if (discUnique || !othersConnected) {
            isUpgrade = disc.upgrades.includes(removeDiscId);
            this.removeDisc(
              discUnique ? `${removeDiscId}|${targetId}` : removeDiscId
            );
          }
          this.removeQueueItems({ discId: removeDiscId });
        }
      );

      if (disc.cost && civ) {
        this.civs._updateStateObj('civList', targetId, {
          [disc.cost.stat]: civ[disc.cost.stat] - disc.cost.value,
        });
      }

      if (disc.duration === -1) {
        [
          'onCreate',
          'onConnect',
          'onExpire',
          'onDisconnect',
          'onRemove',
        ].forEach(trigger => {
          if (disc[trigger]) {
            this.executeActions({
              actions: disc[trigger],
              civId: civ?.id,
              targetId: target?.id,
              disc,
            });
          }
        });
        returnVal = false;
        return;
      } else if (disc.onCreate) {
        this.executeActions({
          actions: disc.onCreate,
          civId: civ?.id,
          targetId: target?.id,
          disc,
        });
      }

      disc = {
        ...disc,
        id: disc.civUnique ? `${disc.id}|${civ.id}` : disc.id,
        ...(disc.duration && !disc.isGlobal
          ? {
              durations: {
                ...(disc.durations || {}),
                [targetId]: disc.duration,
              },
            }
          : {}),
        ...(disc.duration && disc.isGlobal
          ? { currentDuration: disc.duration }
          : {}),
      };

      if (disc.isDiscovery) {
        const availableTechs = allTechs.filter(
          tech =>
            tech.level <= civ.level &&
            !civ.connect.includes(tech.id) &&
            !tech.requires?.some(reqId => !civ.connect.includes(reqId))
        );
        const randomTech = utils.randomEl(availableTechs);

        if (!randomTech) {
          returnVal = false;
          return;
        }
        disc = {
          ...disc,
          title: `${disc.title}: ${randomTech.title}`,
          desc: `${disc.desc}: ${randomTech.title}.`,
          onExpire: [{ createDisc: randomTech.id }, ...(disc.onExpire || [])],
          durations: {
            [targetId]: Math.ceil(
              (disc.duration * randomTech.level) /
                (civ.tech > 19 ? 1 + 0.1 * Math.floor((civ.tech - 15) / 5) : 1)
            ),
          },
        };
      }

      if (typeof disc.index !== 'number') {
        this.setState({
          discs: [
            ...this.state.discs,
            {
              ...disc,
              index: this.useIndex(
                ['knowledge', 'boon'].includes(disc.type) ? disc.type : 'world',
                isUpgrade,
                closeToIndex !== undefined &&
                  !['knowledge', 'boon'].includes(disc.type)
                  ? this.getClosestWorldIndex(closeToIndex)
                  : undefined
              ),
            },
          ],
        });

        this.state.allDisclike.forEach(upg => {
          if (upg.rechargeTurns && upg.upgrades?.includes(discId)) {
            this.spark._updateStateKey(
              'discRecharge',
              upg.id,
              this.state.turn + upg.rechargeTurns
            );
          }
        });
      } else {
        this._updateStateObj('discs', disc.id, disc);
      }
      if (civ) {
        this.civs.connectDisc(targetId, disc.id);
      } else if (target) {
        const isPositive = false; // TO DO rules for positive?
        this.connectDisc(targetId, disc.id, isPositive);
      }
      if (disc.connectTo?.disc) {
        this.connectDisc(
          this._find('discs', disc.connectTo.disc, true)?.id,
          disc.id,
          disc.connectTo.isPositive
        );
      }
      returnVal = this.state.discs.find(disc =>
        [discId, `${discId}|${targetId}`].includes(disc.id)
      );
    });
    return returnVal;
  }

  connectDisc(targetId, discId, isPositive) {
    const disc = this._find('discs', discId);
    if (isPositive !== undefined) {
      this._updateStateKey(
        'connectionTypes',
        `${discId}|${targetId}`,
        isPositive
      );
    }
    return this._updateStateObj('discs', discId, {
      connect: [...(disc.connect || []), targetId],
    });
  }

  disconnectDisc(targetId, discId) {
    const disc = this._find('discs', discId);
    if (disc.connect?.includes(targetId)) {
      return this._updateStateObj('discs', discId, {
        connect: disc.connect?.filter(conn => conn !== targetId),
      });
    } else {
      const target = this._find('discs', targetId);
      return this._updateStateObj('discs', targetId, {
        connect: target.connect?.filter(conn => conn !== discId),
      });
    }
  }

  removeQueueItems({ discId, civId, skipActions }) {
    const removeItems = [];
    this.state.actionQueue.forEach(item => {
      if (discId && item.createDisc === discId) {
        const disc = this._find('allDisclike', discId);
        if (!skipActions && disc.onDisconnect) {
          this.executeActions({
            actions: disc.onDisconnect,
            civId: item.civId,
            disc,
          });
        }
        removeItems.push(item);
      } else if (civId && item.civId === civId) {
        removeItems.push(item);
      }
    });
    this.setState({
      actionQueue: this.state.actionQueue.filter(
        item => !removeItems.includes(item)
      ),
    });
  }

  removeDisc(discId) {
    const disc = this._find('discs', discId);
    const civsDisconnect = [];

    if (!disc || this.state.ending) {
      return;
    }
    this.civs.state.civList.forEach(civ => {
      if (civ.connect.includes(discId)) {
        this.civs.disconnectDisc(civ.id, discId);
        civsDisconnect.push(civ.id);
      }
    });
    this.state.discs.forEach(discFind => {
      if (
        discFind.connect?.includes(discId) ||
        disc.connect?.includes(discFind.id)
      ) {
        this.disconnectDisc(discFind.id, discId);
      }
    });
    this.clearIndex(
      ['knowledge', 'boon'].includes(disc.type) ? disc.type : 'world',
      disc.index
    );
    this._removeStateObj('discs', disc.id);
    this._removeStateKey('healths', discId);
    if (disc.onRemove) {
      [
        ...(civsDisconnect.length ? civsDisconnect : [undefined]),
      ].forEach(civId =>
        this.executeActions({ actions: disc.onRemove, civId, disc })
      );
    }
  }

  checkDiscRemove() {
    this.state.discs.forEach(disc => {
      if (['biome', 'beast'].includes(disc.type) || disc.isGlobal) {
        return;
      }
      const isConnected =
        disc.connect?.length ||
        this.civs.state.civList.some(civ => civ.connect?.includes(disc.id)) ||
        this.state.discs.find(discFind => discFind.connect?.includes(disc.id));

      if (!isConnected) {
        this.removeDisc(disc.id);
      }
    });
  }

  damageTarget(targetId, damageObj) {
    const target = this._find('discs', targetId);
    if (target?.health) {
      let mult = 1;
      const matrix = this.state.damageMatrix;
      if (matrix[damageObj.type].includes(target.shield?.type)) {
        mult = this.state.strongDamageMult;
      } else if (matrix[target.shield?.type]?.includes(damageObj.type)) {
        mult = 1 / this.state.strongDamageMult;
      }
      const damage =
        damageObj.val *
        Math.min(
          (target.shield ? 1 / (0.15 * target.shield.val + 1) : 1) * mult,
          1
        );
      const newHealth = Math.max(
        utils.round((this.state.healths[targetId] || target.health) - damage),
        0
      );
      this._updateStateKey('healths', targetId, newHealth);
    }
  }

  executeActions({ actions, civId, targetId, disc, villain }) {
    if (this.state.ending) {
      return;
    }
    let civ = this.civs._find('civList', civId);
    let target = this._find('discs', targetId);
    let targetHealthChange = this.state.healths[targetId] || target?.health;
    let civDamageTaken = civ?.pop;
    let realAddStat, realSparkStat;
    let logOptions = {};

    actions.forEach(action => {
      if (
        (action.sparkOnly && !this.system.state.isSparkTurn) ||
        (action.noSparkOnly && this.system.state.isSparkTurn)
      ) {
        return false;
      }
      if (action.createRandomDisc || action.createDisc) {
        const validRandoms = action.createRandomDisc?.filter(discId => {
          const discCheck = this._find('allDisclike', discId);
          return (
            (civ
              ? !civ.connect.includes(discId)
              : !this._find('discs', discId)) &&
            !this.state.discs.some(
              disc =>
                civ.connect.includes(disc.id) && disc.upgrades?.includes(discId)
            ) &&
            !discCheck.requires?.some(reqId => !civ.connect.includes(reqId))
          );
        });
        let discId = utils.randomEl(validRandoms) || action.createDisc;
        const activeDisc = this._find('discs', discId);
        if (
          action.createDisc &&
          (civ ? civ.connect.includes(discId) : activeDisc)
        ) {
          discId = undefined;
          if (activeDisc.duration) {
            this.executeActions({
              actions: [
                {
                  queueDisc: action.createDisc,
                  conditionTurn:
                    utils.getNumber(action.conditionTurn) +
                    (civ
                      ? activeDisc.durations[civ.id]
                      : activeDisc.currentDuration),
                },
              ],
              civId,
              disc,
            });
          }
        }
        const discCreated =
          discId && this.createDisc(discId, { targetIds: civId });
        if (!action.skipLog && discCreated) {
          logOptions = {
            type: discCreated.type === 'boon' ? 'boonAdded' : 'discCreated',
            discId: discCreated.id,
            civChanges: civId && [{ id: civId, type: 'connect' }],
            skipMessage: !!action.skipMessage,
          };
        }
      }
      if (
        action.destroyDisc ||
        action.destroyRandomDisc ||
        action.destroyRandomDiscByType
      ) {
        const validRandoms = this.state.discs.filter(
          disc =>
            action.destroyDisc === disc.id ||
            action.destroyRandomDisc?.includes(disc.id) ||
            disc.labels?.includes(action.destroyDisc) ||
            disc.labels?.find(id => action.destroyRandomDisc?.includes(id)) ||
            action.destroyRandomDiscByType === disc.type
        );
        const discId = utils.randomEl(validRandoms)?.id;
        if (discId) {
          const civIds = this.civs.state.civList
            .filter(civ => civ.connect.includes(discId))
            .map(civ => civ.id);
          this.removeDisc(discId);
          if (!action.skipLog) {
            logOptions = {
              type: 'discRemoved',
              discId,
              civId: undefined,
              civIds,
              skipMessage: false,
            };
          }
        }
      }
      if (action.damageAny && civId) {
        action = {
          ...action,
          damageCiv: action.damageAny,
          createLog:
            action.createLog === 'damageAny' ? 'damageCiv' : action.createLog,
        };
        delete action.damageAny;
      }
      if (action.damageCiv) {
        civ = this.civs.damageCiv(civId, {
          ...(action.damageCiv || action.damageAny),
          labels: [...disc.labels, disc.type],
        });
        civDamageTaken = utils.round(civDamageTaken - civ.pop);
      }
      if (action.damageAny) {
        this.damageTarget(targetId, { ...action.damageAny });
        targetHealthChange = utils.round(
          this.state.healths[targetId] - targetHealthChange
        );

        if (this.state.healths[targetId] <= 0) {
          this.removeDisc(targetId);
          logOptions = {
            type: 'beastKilled',
            skipMessage: false,
          };
        }
      }

      if (action.addStat || action.removeStat) {
        realAddStat = {};
        civ = this.civs._updateStateObj(
          'civList',
          civId,
          Object.keys(action.addStat || action.removeStat).reduce(
            (obj, key) => {
              const stat = this.civs.state.civStats.find(
                stat => stat.name === key
              );
              const val = utils.round(
                civ[key] + (action.addStat?.[key] || -action.removeStat[key])
              );
              const valCapped = Math.min(
                val,
                civ[stat.maxName] ?? stat.maxVal ?? val
              );
              const newVal = Math.max(
                valCapped,
                civ[stat.minName] ?? stat.minVal ?? val
              );
              realAddStat[key] = utils.round(newVal - civ[key]);
              return {
                ...obj,
                [key]: newVal,
              };
            },
            {}
          )
        );
      }
      if (action.queueDisc || action.queueAction) {
        let queueItem = {
          createDisc: action.queueDisc,
          civId,
          conditionStat: action.conditionStat && {
            ...action.conditionStat,
            ...(action.conditionStat?.sameAsCost && disc ? disc.cost : {}),
          },
          conditionTurn:
            this.state.turn + (utils.getNumber(action.conditionTurn) || 0),
          skipLog: action.skipLog,
        };
        if (action.queueAction) {
          const statNames = {
            war: 'warlust',
            magic: 'mana',
            commerce: 'wealth',
            expand: 'expand',
          };
          queueItem = {
            ...queueItem,
            actionType: action.queueAction,
            conditionStat: { stat: statNames[action.queueAction], value: 40 },
            conditionTurn: this.state.turn + 2,
            skipLog: true,
          };
        }
        this.setState({ actionQueue: [...this.state.actionQueue, queueItem] });
      }
      if (action.actionType) {
        const randomDiscs = {
          war: [
            'roaming-patrol',
            'pillage',
            'raid',
            'military-exercise',
            'battle',
            'adventuring',
            'treasure-hunt',
          ],
          magic: ['spiritual-offering'],
        };
        this.executeActions({
          actions: [{ createRandomDisc: randomDiscs[action.actionType] }],
          civId,
          disc,
        });
      }
      if (action.triggerEnding) {
        this.setState({ ending: action.triggerEnding });
        logOptions = {
          type: 'ending',
          endingType: action.triggerEnding,
        };
      }
      if (action.sparkStat) {
        realSparkStat = this.spark.updateStats(
          action.sparkStat,
          action.canOverflow
        );
      }
      if (action.createLog || logOptions.type) {
        const log = this.logEvent({
          type: `${action.createLog}${villain ? 'Villain' : ''}`,
          stats: {
            ...realAddStat,
            ...(action.damageCiv ? { pop: civDamageTaken } : {}),
            ...(action.damageAny ? { health: targetHealthChange } : {}),
          },
          sparkStat: realSparkStat,
          civId,
          targetId,
          discId: disc?.id,
          villainId: villain?.id,
          onSkip: action.onSkip,
          buttons: action.buttons,
          ...logOptions,
        });
        if (!action.skipMessage) {
          this.system.showMessage(log);
        }
      }
      if (
        action.showFloater &&
        ((typeof realAddStat?.[action.showFloater] === 'number' &&
          realAddStat?.[action.showFloater] !== 0) ||
          (typeof realSparkStat?.[action.showFloater] === 'number' &&
            realSparkStat?.[action.showFloater] !== 0))
      ) {
        this.system.showFloater(
          action.showFloater,
          realAddStat?.[action.showFloater] ||
            realSparkStat?.[action.showFloater],
          civId
        );
      }
      if (
        (action.addStat?.pop || action.damageCiv) &&
        this.state.turn === civ.popLog.length - 1
      ) {
        this.civs._updateStateObj('civList', civId, {
          popLog: [
            ...civ.popLog.filter((el, i) => i !== civ.popLog.length - 1),
            civ.pop,
          ],
        });
        if (civ.pop <= 0) {
          this.civs.killCiv(civId);
        }
      }
    });
  }

  logEvent({ type, ...args }) {
    const getDynamic = (
      type,
      {
        discId,
        civId,
        targetId,
        civIds,
        level,
        skillId,
        civChanges,
        targetChanges,
        xpThisTurn,
        spellId,
        stats,
        villainId,
        endingType,
        buttons,
        sparkStat,
      }
    ) => {
      discId = discId?.split('|')[0];
      const discTitle = this._find('allDisclike', discId)?.title;
      const civsTitle =
        civIds &&
        this.civs.state.civList
          .filter(civ => civIds.includes(civ.id))
          .map(civ => civ.title)
          .join(', ');
      const civTitle = civId && this.civs._find('civList', civId)?.title;
      const targetTitle =
        (targetId && this.civs._find('civList', civId)?.title) ||
        this._find('allDisclike', targetId)?.title;
      const skillTitle = this.spark._find('skills', skillId)?.title;
      const getTargetList = type =>
        (civChanges || targetChanges)
          ?.filter(change => change.type === type)
          .map(
            change =>
              this.civs._find('civList', change.id)?.title ||
              this._find('allDisclike', change.id)?.title
          )
          .join(', ');
      const connectTargetList = getTargetList('connect');
      const disconnecTargetList = getTargetList('disconnect');
      const spellTitle = spellId && this.spark._find('spells', spellId)?.title;
      let text;
      const statsList =
        stats &&
        Object.keys(stats)
          .map(
            stat =>
              `${Math.abs(stats[stat])} ${
                [
                  ...this.civs.state.civStats,
                  { name: 'health', title: 'Health' },
                ].find(findStat => findStat.name === stat)?.title
              }`
          )
          .join(', ');
      const statsSum =
        stats && Object.values(stats).reduce((val, sum) => sum + val, 0);
      const villainTitle = villainId && this._find('discs', villainId)?.title;
      const buttonDiscs = buttons?.map(id => this._find('allDisclike', id));
      const sparkStatText =
        sparkStat &&
        Object.keys(sparkStat)
          .map(
            stat =>
              `${sparkStat[stat] > 0 ? '+' : ''}${
                sparkStat[stat]
              } ${stat.charAt(0).toUpperCase() + stat.slice(1)}`
          )
          .join(', ');

      switch (type) {
        case 'beastKilled':
          return {
            text: `${targetTitle} has been killed by ${discTitle}.`,
            icon: targetId,
          };
        case 'sparkStat':
          return {
            text: `Your stats have changed. ${sparkStatText}.`,
            icon: 'xp-gain',
          };
        case 'offering':
          return {
            text: `${civTitle} have performed an Offering ritual asking the spirit world for blessings.`,
            icon: civId,
            buttonDiscs,
          };
        case 'damageAny':
          return {
            text: `${targetTitle} lost ${statsList} from ${discTitle}.`,
            icon: targetId,
            link: 'disc',
          };
        case 'damageCiv':
          return {
            text: `${civTitle} lost ${statsList} from ${discTitle}.`,
            icon: civId,
            link: 'civ',
          };
        case 'damageCivVillain':
          return {
            text: `${civTitle} lost ${statsList} from ${villainTitle}'s ${discTitle}.`,
            icon: civId,
            link: 'civ',
          };
        case 'statGain':
          return {
            text: `${civTitle} ${
              statsSum >= 0 ? 'gained' : 'lost'
            } ${statsList} from ${discTitle}.`,
            icon: civId,
            link: 'civ',
          };
        case 'dangerAppeared':
          return {
            text: `${discTitle} appeared${
              civTitle || civsTitle ? ' for ' + (civTitle || civsTitle) : ''
            }.`,
            icon: discId,
            link: 'disc',
          };
        case 'dangerAppearedVillain':
          return {
            text: `${villainTitle} created ${discTitle}${
              civTitle || civsTitle ? ' for ' + (civTitle || civsTitle) : ''
            }.`,
            icon: discId,
            link: 'disc',
          };
        case 'discCreated':
          return {
            text: `${discTitle} appeared${
              civTitle || civsTitle ? ' for ' + (civTitle || civsTitle) : ''
            }.`,
            icon: discId,
            link: 'disc',
          };
        case 'discRemoved':
        case 'discRemovedVillain':
          return {
            text: `${discTitle} has been destroyed${
              villainTitle ? ' by ' + villainTitle : ''
            }. ${
              civsTitle || civTitle
                ? (civsTitle || civTitle) + ' have been disconnected.'
                : ''
            }`,
            icon: discId,
          };
        case 'civLevelUp':
          return {
            text: `${civTitle} reached level ${level}.`,
            icon: civId,
            link: 'civ',
          };
        case 'civAction':
          return {
            text: `${discTitle} connected by ${civTitle}.`,
            icon: discId,
            link: 'disc',
          };
        case 'civCreated':
          return {
            text: `${civTitle} have been created.`,
            icon: civId,
            link: 'civ',
          };
        case 'civDied':
          return {
            text: `${civTitle} went extinct.`,
            icon: civId,
          };
        case 'sparkSpell':
          return {
            text: `You cast ${spellTitle}${
              targetTitle || civsTitle
                ? ' for ' + (targetTitle || civsTitle)
                : ''
            }.`,
            icon: spellId,
            link: 'disc',
          };
        case 'spellVillain':
          return {
            text: `${villainTitle} cast ${discTitle}${
              civTitle || civsTitle ? ' for ' + (civTitle || civsTitle) : ''
            }.`,
            icon: villainId,
            link: 'disc',
          };
        case 'sparkLevelUp':
          return {
            text: `You reached level ${level}.`,
            icon: 'levelup',
            link: 'skills',
          };
        case 'sparkSkillLearned':
          return {
            text: `You learnt ${skillTitle}.`,
            icon: skillId,
            link: 'skills',
          };
        case 'sparkXpGained':
          return {
            text: `You gained ${xpThisTurn} experience point${
              xpThisTurn > 1 ? 's' : ''
            }.`,
            icon: 'xp-gain',
            link: 'skills',
          };
        case 'boonAdded':
          return {
            text: `${discTitle} has been added for ${connectTargetList}.`,
            icon: discId,
            link: 'disc',
          };
        case 'modifyDisc':
          text = connectTargetList?.length
            ? `You cast ${discTitle} for ${connectTargetList}. `
            : '';
          text += disconnecTargetList?.length
            ? `You removed ${discTitle} from ${disconnecTargetList}.`
            : '';
          text +=
            !connectTargetList?.length && !disconnecTargetList?.length
              ? `You cast ${discTitle}.`
              : '';
          return {
            text,
            icon: discId,
          };
        case 'removeDisc':
          return {
            text: `${discTitle} has been removed.`,
            icon: discId,
          };
        case 'civGainedBoon':
          return {
            text: `${civTitle} have gained the ${discTitle} boon.`,
            icon: discId,
          };
        case 'civLostBoon':
          return {
            text: `${civTitle} have lost the ${discTitle} boon.`,
            icon: discId,
          };
        case 'ending':
          return {
            text: `The world has ended by ${endingType}.`,
            icon: 'destroy-world',
          };
        default:
          return {
            text: `${type} has no text yet`,
            icon: undefined,
          };
      }
    };
    this._updateStateObj('log', this.state.turn, {
      items: [
        ...this.state.log[this.state.turn].items,
        {
          index: this.state.log[this.state.turn].items.length,
          type,
          ...args,
          ...getDynamic(type, args),
        },
      ],
    });
    return this.state.log[this.state.turn].items[
      this.state.log[this.state.turn].items.length - 1
    ];
  }

  turnLogStatic(index) {
    const log = this.state.log[this.state.turn].items.find(
      item => item.index === index
    );
    // eslint-disable-next-line no-unused-vars
    const { onSkip, buttons, buttonDiscs, ...logUpdated } = log;
    this._updateStateObj('log', this.state.turn, {
      items: [
        ...this.state.log[this.state.turn].items.slice(0, index),
        { ...logUpdated, buttonsRemoved: true },
        ...this.state.log[this.state.turn].items.slice(index + 1),
      ],
    });
  }

  getFilteredLog({
    civId,
    fromTurn,
    toTurn,
    lastTurn,
    discId,
    type,
    order = 'asc',
    insertTurn = false,
  }) {
    const log = [];
    const method = order === 'asc' ? 'push' : 'unshift';
    const validItem = item => {
      return (
        civId !== undefined &&
        (item.civId === civId ||
          item.targetId === civId ||
          item.civIds?.includes(civId) ||
          [...(item.civChanges || []), ...(item.targetChanges || [])]?.some(
            change => change.id === civId
          ) ||
          (discId !== undefined && item.discId === discId) ||
          (type !== undefined &&
            type === 'spark' &&
            item.type.includes('spark')))
      );
    };
    fromTurn =
      lastTurn && this.state.turn - lastTurn > 0
        ? this.state.turn - lastTurn
        : fromTurn || 0;
    toTurn = toTurn || this.state.turn;

    this.state.log.forEach(turnLog => {
      if (turnLog.id >= fromTurn && turnLog.id <= toTurn) {
        turnLog.items.forEach((item, index) => {
          if (validItem(item)) {
            log[method]({
              ...item,
              id: turnLog.id + '-' + index,
              turn: turnLog.id,
            });
          }
        });
      }
    });

    if (insertTurn) {
      let turnCount = -1;
      let index = 0;
      while (index < log.length) {
        if (log[index].turn !== turnCount) {
          turnCount = log[index].turn;
          log.splice(index, 0, {
            id: log[index].turn,
            text: `Turn ${log[index].turn}`,
            isTurnItem: true,
          });
          index++;
        }
        index++;
      }
    }

    return log;
  }
}

export default World;
