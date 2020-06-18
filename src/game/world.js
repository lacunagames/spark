import StateHandler from './statehandler';
import allDiscs from './data/discs';

const getPosArray = (minX, minY, maxX, maxY) => {
  const step = 10;
  const rand = 1;
  const arr = [];
  const orderedArr = [];
  const distance = (a, b) =>
    Math.sqrt(Math.pow(a.left - b.left, 2) + Math.pow(a.top - b.top, 2));

  for (let ix = 0; ix < (maxX - minX) / (step * 0.7); ix++) {
    for (let iy = 0; iy < (maxY - minY) / step; iy++) {
      arr.push({
        left:
          minX +
          ix * step * 0.7 +
          Math.floor(Math.random() * 20 * rand - 10 * rand) / 10,
        top:
          minY +
          iy * step +
          Math.floor(Math.random() * 20 * rand - 10 * rand) / 10,
      });
    }
  }
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
  biome: [...getPosArray(6, 8, 40, 40)],
  knowledge: [...getPosArray(46, 46, 80, 66)],
  event: [...getPosArray(66, 8, 96, 40)],
  action: [...getPosArray(6, 47, 40, 96)],
};

const defaultState = {
  discs: [],
  positions,
  turn: 0,
  log: [{ id: 0, items: [] }],
};

class World extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
    this.initIndexes('biome', 'knowledge', 'action', 'event');
    this.initWorld();
  }

  initWorld() {}

  nextTurn() {
    this.setState({
      turn: this.state.turn + 1,
      log: [...this.state.log, { id: this.state.turn + 1, items: [] }],
    });

    this.civs.civTurn();
    this.spark.sparkTurn();
    if (this.state.turn === 7) {
      this.createDisc(
        'tiger',
        this.civs.state.civList.map(civ => civ.id)
      );
      this.logEvent({
        type: 'dangerAppeared',
        disc: 'tiger',
        civs: this.civs.state.civList.map(civ => civ.id),
      });
    }
  }

  createDisc(discId, civIds) {
    const disc = allDiscs.find(disc => disc.id === discId);
    civIds = Array.isArray(civIds) ? civIds : [civIds];
    const upgraded = this.state.discs.find(disc =>
      disc.upgrades?.includes(discId)
    );

    if (
      upgraded &&
      civIds.every(civId =>
        this.civs.state.civList
          .find(civ => civ.id === civId)
          ?.connect.includes(upgraded.id)
      )
    ) {
      return false;
    }
    disc.upgrades?.forEach(upgradeMe => {
      if (
        this.civs.state.civList.every(
          civ => civ.connect.includes(upgradeMe) === civIds.includes(civ.id)
        )
      )
        this.removeDisc(upgradeMe);
    });

    if (!this.state.discs.find(disc => disc.id === discId)) {
      this.setState({
        discs: [
          ...this.state.discs,
          { ...disc, index: this.useIndex(disc.type) },
        ],
      });
    }
    this.civs.state.civList.forEach(civ => {
      if (civIds.includes(civ.id) && !civ.connect.includes(upgraded?.id)) {
        this.civs.connectDisc(civ.id, discId);
        disc.upgrades?.forEach(upgradeMe => {
          if (civ.connect.includes(upgradeMe))
            this.civs.disconnectDisc(civ.id, upgradeMe);
        });
      }
    });
    return this.state.discs.find(disc => disc.id === discId);
  }

  removeDisc(discId) {
    const disc = this.state.discs.find(disc => disc.id === discId);

    this.civs.state.civList.forEach(
      civ =>
        civ.connect.includes(discId) && this.civs.disconnectDisc(civ.id, discId)
    );
    this.clearIndex(disc.type, disc.index);
    this._removeStateObj('discs', disc.id);
  }

  checkDiscRemove() {
    this.state.discs.forEach(disc => {
      const isConnected = this.civs.state.civList.some(civ =>
        civ.connect?.includes(disc.id)
      );

      if (!isConnected) {
        this.removeDisc(disc.id);
      }
    });
  }

  logEvent({ type, ...args }) {
    const getDynamic = (
      type,
      { disc, civ, civs, level, skill, civChanges }
    ) => {
      const discTitle = this.state.discs.find(discFind => discFind.id === disc)
        ?.title;
      const civsTitle =
        civs &&
        this.civs.state.civList
          .filter(civ => civs.includes(civ.id))
          .map(civ => civ.title)
          .join(', ');
      const civTitle = this.civs.state.civList.find(
        civFind => civFind.id === civ
      )?.title;
      const skillTitle = this.spark.state.skills.find(
        skillFind => skillFind.id === skill
      )?.title;
      const civChangesTitle = civChanges
        ?.map(change => {
          const civTitle = this.civs.state.civList.find(
            civ => civ.id === change.id
          ).title;
          return `${civTitle} have been ${
            change.type === 'connect' ? 'connected' : 'disconnected'
          }`;
        })
        .join(', ');

      switch (type) {
        case 'dangerAppeared':
          return {
            text: `${discTitle} appeared for ${civsTitle}.`,
            icon: disc,
            link: 'disc',
          };
        case 'civLevelUp':
          return {
            text: `${civTitle} reached level ${level}.`,
            icon: civ,
            link: 'civ',
          };
        case 'civAction':
          return {
            text: `${discTitle} connected by ${civTitle}.`,
            icon: disc,
            link: 'disc',
          };
        case 'civDied':
          return {
            text: `${civTitle} went extinct.`,
            icon: civ,
          };
        case 'sparkSpell':
          return {
            text: `You created ${discTitle} for ${civsTitle}.`,
            icon: disc,
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
            icon: skill,
            link: 'skills',
          };
        case 'modifyDisc':
          return {
            text: `${discTitle} has been modified. ${civChangesTitle}.`,
            icon: disc,
            link: 'disc',
          };
        case 'removeDisc':
          return {
            text: `${discTitle} has been removed.`,
            icon: disc,
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
        ...this.state.log[this.state.log.length - 1].items,
        {
          type,
          ...args,
          ...getDynamic(type, args),
        },
      ],
    });
  }

  getFilteredLog({
    civ,
    fromTurn,
    toTurn,
    lastTurn,
    disc,
    type,
    order = 'asc',
    insertTurn = false,
  }) {
    const log = [];
    const method = order === 'asc' ? 'push' : 'unshift';
    const validItem = item => {
      return (
        civ !== undefined &&
        (item.civ === civ ||
          item.civs?.includes(civ) ||
          item.civChanges?.some(change => change.id === civ) ||
          (disc !== undefined && item.disc === disc) ||
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
