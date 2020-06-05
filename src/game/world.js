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
    const upgraded = this.state.discs.find(disc => disc.upgrades === discId);

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
    if (
      disc.upgrades &&
      this.civs.state.civList.every(
        civ => civ.connect.includes(disc.upgrades) === civIds.includes(civ.id)
      )
    )
      this.removeDisc(disc.upgrades);

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
        if (disc.upgrades && civ.connect.includes(disc.upgrades))
          this.civs.disconnectDisc(civ.id, disc.upgrades);
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
    const getDynamic = (type, { disc, civ, civs, level }) => {
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

      switch (type) {
        case 'dangerAppeared':
          return {
            text: `${discTitle} appeared for ${civsTitle}.`,
            icon: disc,
          };
        case 'civLevelUp':
          return {
            text: `${civTitle} reached level ${level}.`,
            icon: civ,
          };
        case 'civAction':
          return {
            text: `${civTitle} have connected to ${discTitle}.`,
            icon: disc,
          };
        case 'civDied':
          return {
            text: `${civTitle} went extinct.`,
            icon: civ,
          };
        case 'sparkSpell':
          return {
            text: `You created ${discTitle} for ${civsTitle}}.`,
            icon: disc,
          };
        case 'sparkLevelUp':
          return {
            text: `You reached level ${level}.`,
            icon: 'levelup',
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
}

export default World;
