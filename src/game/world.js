import StateHandler from './statehandler';
import allDiscs from './data/discs';
import { allBoons } from './data/civList';
import allTechs from './data/civTech';

const getPosArray = areas => {
  const step = 10;
  const rand = 1;
  const arr = [];
  const orderedArr = [];
  const distance = (a, b) =>
    Math.sqrt(Math.pow(a.left - b.left, 2) + Math.pow(a.top - b.top, 2));

  areas.forEach(coords => {
    for (let ix = 0; ix < (coords.maxX - coords.minX) / (step * 0.7); ix++) {
      for (let iy = 0; iy < (coords.maxY - coords.minY) / step; iy++) {
        arr.push({
          left:
            coords.minX +
            ix * step * 0.7 +
            Math.floor(Math.random() * 20 * rand - 10 * rand) / 10,
          top:
            coords.minY +
            iy * step +
            Math.floor(Math.random() * 20 * rand - 10 * rand) / 10,
        });
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
        let currDistance = distance(orderedArr[iOrdered], arr[iArr]);

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

const positions = {
  biome: getPosArray([{ minX: 6, minY: 8, maxX: 40, maxY: 40 }]),
  event: getPosArray([
    { minX: 66, minY: 8, maxX: 96, maxY: 40 },
    { minX: 46, minY: 46, maxX: 80, maxY: 66 },
  ]),
  action: getPosArray([{ minX: 6, minY: 47, maxX: 40, maxY: 96 }]),
};

const defaultState = {
  discs: [],
  positions,
  turn: 0,
  log: [{ id: 0, items: [] }],
  allDisclike: [...allDiscs, ...allBoons, ...allTechs],
};

class World extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
    this.initIndexes('biome', 'action', 'knowledge', 'event', 'boon');
    setTimeout(() => this.initWorld());
  }

  initWorld() {
    const biomes = allDiscs.filter(disc => disc.type === 'biome');
    let biomeId;
    for (let i = 0; i < 5; i++) {
      biomeId = biomes[Math.floor(Math.random() * biomes.length)]?.id;
      this.createDisc(biomeId);
    }
  }

  nextTurn() {
    this.setState({
      turn: this.state.turn + 1,
      log: [...this.state.log, { id: this.state.turn + 1, items: [] }],
    });

    this.state.discs.forEach(disc => {
      if (disc.durations) {
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
            this.civs.disconnectDisc(civId, disc.id);
            this.checkDiscRemove([disc]);
            if (disc.onExpire) {
              this.executeActions({
                actions: disc.onExpire,
                civId,
              });
            }
          }
        });
      }
    });

    this.civs.civTurn();
    this.worldTurn();
    this.spark.sparkTurn();
  }

  worldTurn() {
    if (this.state.turn % 7 === 0 && this.civs.state.civList.length) {
      const dangerDiscs = allDiscs
        .filter(
          disc =>
            (disc.labels?.includes('force') ||
              disc.labels?.includes('beast')) &&
            !this.state.discs.find(discFind => discFind.id === disc.id)
        )
        .map(disc => disc.id);
      const randomDanger =
        dangerDiscs[Math.floor(Math.random() * dangerDiscs.length)];

      this.civs.state.civList.forEach(civ =>
        this.createDisc(randomDanger, civ.id)
      );
      this.logEvent({
        type: 'dangerAppeared',
        discId: randomDanger,
        civIds: this.civs.state.civList.map(civ => civ.id),
      });
    }
  }

  createDisc(discId, civId) {
    let disc =
      this.state.discs.find(disc => disc.id === discId) ||
      this.state.allDisclike.find(disc => disc.id === discId);
    const civ = this.civs.state.civList.find(civ => civ.id === civId);
    const isUpgraded = this.state.discs.find(
      disc => disc.upgrades?.includes(discId) && civ?.connect.includes(disc.id)
    );

    if (civ?.connect.includes(discId) || isUpgraded) {
      return false;
    }

    [...(disc.upgrades || []), ...(disc.removes || [])].forEach(upgradeMe => {
      if (civ?.connect.includes(upgradeMe))
        this.civs.disconnectDisc(civId, upgradeMe);
      if (
        !this.civs.state.civList.some(civ => civ.connect.includes(upgradeMe))
      ) {
        this.removeDisc(upgradeMe);
      }
    });

    if (disc.duration && !disc.durations) {
      disc = { ...disc, durations: { [civId]: disc.duration } };
    }

    if (disc.isDiscovery) {
      const availableTechs = allTechs.filter(
        tech =>
          tech.level <= civ.level &&
          !civ.connect.includes(tech.id) &&
          !tech.requires?.some(reqId => !civ.connect.includes(reqId))
      );
      const randomTech =
        availableTechs[Math.floor(Math.random() * availableTechs.length)];

      disc = {
        ...disc,
        id: `${disc.id}|${civ.id}`,
        isHidden: true,
      };
      if (civ.tech >= 10 && randomTech) {
        this.civs._updateStateObj('civList', civId, {
          tech: civ.tech - 10,
        });
        disc = {
          ...disc,
          title: `${disc.title}: ${randomTech.title}`,
          desc: `${disc.desc}: ${randomTech.title}.`,
          onExpire: [
            { createDisc: randomTech.id, skipMessage: true },
            ...(disc.onExpire || []),
          ],
          durations: {
            [civId]: Math.ceil(
              (disc.duration * 2 * randomTech.level) /
                (civ.tech > 29 ? Math.floor((civ.tech - 10) / 10) : 1)
            ),
          },
          isHidden: false,
        };
      }
    }

    if (typeof disc.index !== 'number') {
      this.setState({
        discs: [
          ...this.state.discs,
          { ...disc, index: this.useIndex(disc.type) },
        ],
      });
    } else if (disc.duration) {
      this._updateStateObj('discs', disc.id, {
        durations: { ...disc.durations, [civId]: disc.duration },
      });
    }
    if (civId) {
      this.civs.connectDisc(civId, disc.id);
    }
    return this.state.discs.find(disc => disc.id === discId);
  }

  removeDisc(discId) {
    const disc = this.state.discs.find(disc => disc.id === discId);

    if (!disc) {
      return;
    }
    this.civs.state.civList.forEach(civ => {
      if (civ.connect.includes(discId)) {
        this.civs.disconnectDisc(civ.id, discId);
      }
    });
    this.clearIndex(disc.type, disc.index);
    this._removeStateObj('discs', disc.id);
  }

  checkDiscRemove(checkDisc = this.state.discs) {
    checkDisc.forEach(disc => {
      if (['biome'].includes(disc.type)) {
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

  executeActions({ actions, civId }) {
    actions.forEach(action => {
      if (action.createRandomDisc || action.createDisc) {
        const discId =
          action.createRandomDisc?.[
            Math.floor(Math.random() * action.createRandomDisc.length)
          ] || action.createDisc;
        const disc = this.createDisc(discId, civId);
        if (!action.skipLog && disc) {
          let log = this.logEvent({
            type: disc.type === 'boon' ? 'boonAdded' : 'discCreated',
            discId: disc.id,
            civChanges: [{ id: civId, type: 'connect' }],
            civId,
          });
          if (!action.skipMessage) {
            this.system.showMessage(log);
          }
        }
      }
      if (action.addStat) {
        const civ = this.civs.state.civList.find(civ => civ.id === civId);
        this.civs._updateStateObj(
          'civList',
          civId,
          Object.keys(action.addStat).reduce(
            (obj, key) => ({
              ...obj,
              [key]: civ[key] + action.addStat[key],
            }),
            {}
          )
        );
      }
    });
  }

  logEvent({ type, ...args }) {
    const getDynamic = (
      type,
      { discId, civId, civIds, level, skillId, civChanges, xpThisTurn, spellId }
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

      switch (type) {
        case 'dangerAppeared':
          return {
            text: `${discTitle} appeared for ${civTitle || civsTitle}.`,
            icon: discId,
            link: 'disc',
          };
        case 'discCreated':
          return {
            text: `${discTitle} appeared for ${civTitle || civsTitle}.`,
            icon: discId,
            link: 'disc',
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
              civTitle || civsTitle ? ' for ' + civTitle || civsTitle : ''
            }.`,
            icon: spellId,
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
          text = connectCivList.length
            ? `You cast ${discTitle} for ${connectCivList}. `
            : '';
          text += disconnectCivList.length
            ? `You removed ${discTitle} from ${disconnectCivList}.`
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
