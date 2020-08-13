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
        const left =
          coords.minX +
          ix * step * 0.7 +
          Math.floor(Math.random() * 20 * rand - 10 * rand) / 10;
        const top =
          coords.minY +
          iy * step +
          Math.floor(Math.random() * 20 * rand - 10 * rand) / 10;
        let isValid = true;
        for (let iExcl = 0; iExcl < excludeAreas.length; iExcl++) {
          const area = excludeAreas[iExcl];
          if (
            (left >= area.minX &&
              left <= area.maxX &&
              top >= area.minY &&
              top <= area.maxY) ||
            getDistance(
              {
                left: coords.minX + ix * step * 0.7,
                top: coords.minY + iy * step,
              },
              { left: area.cX, top: area.cY }
            ) <= area.range
          ) {
            isValid = false;
          }
        }
        if (isValid) {
          arr.push({ left, top });
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
    const biomes = allDiscs.filter(disc => disc.type === 'biome');
    let biomeId;
    for (let i = 0; i < 5; i++) {
      biomeId = utils.randomEl(biomes)?.id;
      this.createDisc(biomeId);
    }
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
          left: this.state.positions[i].left,
          top: this.state.positions[i].top,
        });
        if (newDistance < distance) {
          distance = newDistance;
          closestIndex = i;
        }
      }
    }
    return closestIndex;
  }

  nextTurn() {
    this.system.setState({ muteMessages: true });

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
      if (disc.currentDuration) {
        disc = this._updateStateObj('discs', disc.id, {
          currentDuration: disc.currentDuration - 1,
        });
        if (disc.currentDuration === 0) {
          this.removeDisc(disc.id);
          if (disc.onExpire) {
            this.executeActions({
              actions: disc.onExpire,
              civId: undefined,
              disc,
            });
          }
        }
      } else if (disc.durations) {
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
      const civ = this.civs.state.civList.find(civ => civ.id === item.civId);
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

    this.system.setState({ muteMessages: false });
  }

  worldTurn() {
    const civIds = this.civs.state.civList.map(civ => civ.id);
    // Villain actions
    this.state.discs.forEach(disc => {
      if (disc.villain) {
        const villain = { ...disc.villain };
        villain.mana += villain.manaPerTurn;
        disc.connects?.forEach(
          conn =>
            (villain.power = utils.round(
              villain.power +
                (this.state.discs.find(disc => disc.id === conn.discId)
                  ?.powerPerTurn || 0)
            ))
        );
        if (villain.mana >= 40) {
          const possibleActions = [
            { power: 1, discId: 'destruction-minion' },
            { power: 1, discId: 'lightning-strike' },
            { power: 2, discId: 'chaos-explosion' },
            { power: 3, discId: 'destruction-champion' },
            { power: 4, discId: 'volcano' },
            { power: 6, discId: 'destroy-biome' },
            { power: 10, discId: 'destroy-world' },
          ].filter(
            action =>
              !this.state.discs.find(disc => disc.id === action.discId) &&
              !disc.connects?.some(conn =>
                this.state.discs.find(
                  disc =>
                    disc.id === conn.discId &&
                    disc.upgrades?.includes(action.discId)
                )
              ) &&
              action.power <= villain.power
          );
          const action = utils.randomEl(possibleActions);
          if (action) {
            const actionDisc = this.state.allDisclike.find(
              disc => disc.id === action.discId
            );
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
                civIds: actionDisc.isGlobal ? undefined : civIds,
                closeToIndex: disc.index,
              });
              this._updateStateObj('discs', disc.id, {
                connects: [
                  ...(disc.connects || []),
                  { discId: actionDisc.id, isPositive: true },
                ],
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
    });
    if (this.state.turn === 1) {
      this.createDisc('god-war');
      this.logEvent({ type: 'dangerAppeared', discId: 'god-war' });
    }
    // Create random dangers
    if (this.state.turn % 12 === 0 && this.civs.state.civList.length) {
      const dangerDiscs = allDiscs
        .filter(
          disc =>
            (disc.labels?.includes('force') ||
              disc.labels?.includes('beast')) &&
            !disc.labels?.includes('noRandom') &&
            !this.state.discs.find(discFind => discFind.id === disc.id) &&
            this.state.turn / 10 >= disc.turnDamage?.val - 2 &&
            (!disc.requires ||
              disc.requires.every(discId =>
                this.state.discs.find(discFind => discFind.id === discId)
              ))
        )
        .map(disc => disc.id);
      const randomDanger = utils.randomEl(dangerDiscs);

      this.createDisc(randomDanger, { civIds });
      this.logEvent({
        type: 'dangerAppeared',
        discId: randomDanger,
        civIds,
      });
    }
  }

  createDisc(discId, { civIds, closeToIndex } = {}) {
    civIds = Array.isArray(civIds) ? civIds : [civIds];
    let returnVal, isUpgrade;
    civIds.forEach(civId => {
      let disc =
        this.state.discs.find(disc => disc.id === discId) ||
        this.state.allDisclike.find(disc => disc.id === discId);
      const civ = this.civs.state.civList.find(civ => civ.id === civId);
      const isUpgraded = this.state.discs.find(
        disc =>
          disc.upgrades?.includes(discId) && civ?.connect.includes(disc.id)
      );
      const canAfford = !disc.cost || civ?.[disc.cost.stat] >= disc.cost.value;

      if (
        !disc ||
        civ?.connect.includes(discId) ||
        isUpgraded ||
        !canAfford ||
        this.state.ending
      ) {
        returnVal = false;
        return;
      }

      [...(disc.upgrades || []), ...(disc.removes || [])].forEach(
        removeDiscId => {
          const discUnique = this.state.discs.find(
            discFind => discFind.id === `${removeDiscId}|${civId}`
          );
          const othersConnected = this.civs.state.civList.some(
            civ =>
              !civIds.includes(civ.id) && civ.connect.includes(removeDiscId)
          );
          if (civ?.connect.includes(removeDiscId) && othersConnected) {
            this.civs.disconnectDisc(civId, removeDiscId);
          }
          if (discUnique || !othersConnected) {
            isUpgrade = disc.upgrades.includes(removeDiscId);
            this.removeDisc(
              discUnique ? `${removeDiscId}|${civId}` : removeDiscId
            );
          }
          this.removeQueueItems({ discId: removeDiscId });
        }
      );

      if (disc.cost) {
        this.civs._updateStateObj('civList', civId, {
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
            this.executeActions({ actions: disc[trigger], civId, disc });
          }
        });
        returnVal = false;
        return;
      }

      disc = {
        ...disc,
        id: disc.civUnique ? `${disc.id}|${civ.id}` : disc.id,
        ...(disc.duration && !disc.isGlobal
          ? {
              durations: {
                ...(disc.durations || {}),
                [civId]: disc.duration,
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
            [civId]: Math.ceil(
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
      } else {
        this._updateStateObj('discs', disc.id, disc);
      }
      if (civId) {
        this.civs.connectDisc(civId, disc.id);
      }
      returnVal = this.state.discs.find(disc =>
        [discId, `${discId}|${civId}`].includes(disc.id)
      );
    });
    return returnVal;
  }

  removeQueueItems({ discId, civId }) {
    const removeItems = [];
    this.state.actionQueue.forEach(item => {
      if (discId && item.createDisc === discId) {
        const disc = this.state.allDisclike.find(disc => disc.id === discId);
        if (disc.onDisconnect) {
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
    const disc = this.state.discs.find(disc => disc.id === discId);
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
    this.state.discs.forEach(disc => {
      if (disc.connects?.includes(discId)) {
        this._updateStateObj('discs', disc.id, {
          connects: disc.connects.filter(filterId => filterId !== discId),
        });
      }
    });
    if (disc.onRemove) {
      civsDisconnect.forEach(civId =>
        this.executeActions({ actions: disc.onRemove, civId, disc })
      );
    }
    this.clearIndex(
      ['knowledge', 'boon'].includes(disc.type) ? disc.type : 'world',
      disc.index
    );
    this._removeStateObj('discs', disc.id);
  }

  checkDiscRemove() {
    this.state.discs.forEach(disc => {
      if (['biome'].includes(disc.type) || disc.isGlobal) {
        return;
      }
      const isConnected = this.civs.state.civList.some(civ =>
        civ.connect?.includes(disc.id)
      );

      if (!isConnected) {
        this.removeDisc(disc.id);
      }
    });
  }

  executeActions({ actions, civId, disc, villain }) {
    if (this.state.ending) {
      return;
    }
    let civ = this.civs.state.civList.find(civ => civ.id === civId);
    let civDamageTaken = civ?.pop;
    let realAddStat;
    let logOptions = {};

    actions.forEach(action => {
      if (action.createRandomDisc || action.createDisc) {
        const validRandoms = action.createRandomDisc?.filter(discId => {
          const discCheck = this.state.allDisclike.find(
            disc => disc.id === discId
          );
          return (
            !civ.connect.includes(discId) &&
            !this.state.discs.some(
              disc =>
                civ.connect.includes(disc.id) && disc.upgrades?.includes(discId)
            ) &&
            !discCheck.requires?.some(reqId => !civ.connect.includes(reqId))
          );
        });
        const discId = utils.randomEl(validRandoms) || action.createDisc;
        const discCreated =
          discId && this.createDisc(discId, { civIds: civId });
        if (!action.skipLog && discCreated) {
          logOptions = {
            type: discCreated.type === 'boon' ? 'boonAdded' : 'discCreated',
            discId: discCreated.id,
            civChanges: [{ id: civId, type: 'connect' }],
            skipMessage: false,
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
      if (action.damageCiv) {
        civ = this.civs.damageCiv(civId, {
          ...action.damageCiv,
          labels: disc.labels,
        });
        civDamageTaken = utils.round(civDamageTaken - civ.pop);
      }
      if (action.addStat) {
        realAddStat = {};
        civ = this.civs._updateStateObj(
          'civList',
          civId,
          Object.keys(action.addStat).reduce((obj, key) => {
            const stat = this.civs.state.civStats.find(
              stat => stat.name === key
            );
            const val = utils.round(civ[key] + action.addStat[key]);
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
          }, {})
        );
      }
      if (action.queueDisc || action.queueAction) {
        let queueItem = {
          createDisc: action.queueDisc,
          civId,
          conditionStat: {
            ...action.conditionStat,
            ...(action.conditionStat?.sameAsCost && disc ? disc.cost : {}),
          },
          conditionTurn: this.state.turn + (action.conditionTurn || 0),
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
      if (action.createLog || logOptions.type) {
        const log = this.logEvent({
          type: `${action.createLog}${villain ? 'Villain' : ''}`,
          stats: realAddStat || (civDamageTaken && { pop: civDamageTaken }),
          civId,
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
      if (action.showFloater) {
        this.system.showFloater(
          action.showFloater,
          action.addStat[action.showFloater],
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
          this.civs.killCiv(civId, true);
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
        civIds,
        level,
        skillId,
        civChanges,
        xpThisTurn,
        spellId,
        stats,
        villainId,
        endingType,
        buttons,
      }
    ) => {
      discId = discId?.split('|')[0];
      const discTitle = this.state.allDisclike.find(
        discFind => discFind.id === discId
      )?.title;
      const civsTitle =
        civIds &&
        this.civs.state.civList
          .filter(civ => civIds.includes(civ.id))
          .map(civ => civ.title)
          .join(', ');
      const civTitle =
        civId &&
        this.civs.state.civList.find(civFind => civFind.id === civId)?.title;
      const skillTitle = this.spark.state.skills.find(
        skillFind => skillFind.id === skillId
      )?.title;
      const getCivList = type =>
        civChanges
          ?.filter(change => change.type === type)
          .map(
            change =>
              this.civs.state.civList.find(civ => civ.id === change.id).title
          )
          .join(', ');
      const connectCivList = getCivList('connect');
      const disconnectCivList = getCivList('disconnect');
      const spellTitle =
        spellId &&
        this.spark.state.spells.find(spell => spell.id === spellId)?.title;
      let text;
      const statsList =
        stats &&
        Object.keys(stats)
          .map(
            stat =>
              `${Math.abs(stats[stat])} ${
                this.civs.state.civStats.find(
                  findStat => findStat.name === stat
                )?.title
              }`
          )
          .join(', ');
      const statsSum =
        stats && Object.values(stats).reduce((val, sum) => sum + val, 0);
      const villainTitle =
        villainId &&
        this.state.discs.find(disc => disc.id === villainId)?.title;
      const buttonDiscs = buttons?.map(id =>
        this.state.allDisclike.find(disc => disc.id === id)
      );

      switch (type) {
        case 'offering':
          return {
            text: `${civTitle} have performed an Offering ritual asking the spirit world for support.`,
            icon: civId,
            buttonDiscs,
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
              civTitle || civsTitle ? ' for ' + (civTitle || civsTitle) : ''
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
            text: `${discTitle} has been added for ${connectCivList}.`,
            icon: discId,
          };
        case 'modifyDisc':
          text = connectCivList?.length
            ? `You cast ${discTitle} for ${connectCivList}. `
            : '';
          text += disconnectCivList?.length
            ? `You removed ${discTitle} from ${disconnectCivList}.`
            : '';
          text +=
            !connectCivList?.length && !disconnectCivList?.length
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
          item.civIds?.includes(civId) ||
          item.civChanges?.some(change => change.id === civId) ||
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
