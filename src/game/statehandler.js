import utils from '@/game/utils';

class StateHandler {
  constructor(subscribeState) {
    this.subscribeState = subscribeState;
    this.state = {};
    this.indexes = {};
  }

  _initIndexes(...types) {
    types.forEach(
      type =>
        (this.indexes[type] = {
          last: -1,
          free: [],
          custom: [],
          lastRemoved: undefined,
        })
    );
  }

  _useIndex(type, isUpgrade, index) {
    if (isUpgrade) {
      index = this.indexes[type].lastRemoved;
    }
    if (typeof index === 'number') {
      if (
        (this.indexes[type].last >= index &&
          !this.indexes[type].free.includes(index)) ||
        this.indexes[type].custom.includes(index)
      ) {
        console.warn(
          `_useIndex - ${type} error: Index ${index} is taken.`,
          this.indexes[type]
        );
      } else {
        this.indexes[type].free = this.indexes[type].free.filter(
          ix => ix !== index
        );
        this.indexes[type].custom.push(index);
        return index;
      }
    }
    if (this.indexes[type].free.length) {
      return this.indexes[type].free.shift();
    } else {
      do {
        this.indexes[type].last++;
      } while (this.indexes[type].custom.includes(this.indexes[type].last));
      return this.indexes[type].last;
    }
  }

  _clearIndex(type, index) {
    const indexType = this.indexes[type];
    indexType.lastRemoved = index;
    if (indexType.custom.includes(index)) {
      indexType.custom = indexType.custom.filter(ix => ix !== index);
    } else {
      indexType.free.push(index);
    }
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.subscribeState(newState);
  }

  _find(arrayName, id, labelsAllowed) {
    return utils.findInArray(this.state[arrayName], id, labelsAllowed);
  }

  _updateStateKey(objName, key, newVal) {
    const stateObj = {
      ...this.state[objName],
      [key]: newVal,
    };
    this.setState({ [objName]: stateObj });
    return stateObj;
  }

  _removeStateKey(objName, key) {
    const removedKeyObj = { ...this.state[objName] };
    delete removedKeyObj[key];
    this.setState({ [objName]: removedKeyObj });
  }

  _updateStateObj(arrayName, id, updates) {
    const stateArray = this.state[arrayName].map(obj =>
      (obj.id ?? obj.index) === id ? { ...obj, ...updates } : obj
    );

    this.setState({ [arrayName]: stateArray });
    return stateArray.find(obj => (obj.id ?? obj.index) === id);
  }

  _removeStateObj(arrayName, id) {
    const stateArray = this.state[arrayName].filter(
      obj => (obj.id ?? obj.index) !== id
    );

    this.setState({ [arrayName]: stateArray });
  }
}

export default StateHandler;
