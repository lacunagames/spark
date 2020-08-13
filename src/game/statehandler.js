class StateHandler {
  constructor(subscribeState) {
    this.subscribeState = subscribeState;
    this.state = {};
    this.indexes = {};
  }

  getState() {
    return this.state;
  }

  initIndexes(...types) {
    types.forEach(
      type => (this.indexes[type] = { last: -1, free: [], custom: [] })
    );
  }

  useIndex(type, isUpgrade, index) {
    if (index !== undefined) {
      if (
        (this.indexes[type].last >= index &&
          !this.indexes[type].free.includes(index)) ||
        this.indexes[type].custom.includes(index)
      ) {
        console.log(
          `useIndex - ${type} error: Index ${index} is taken.`,
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
      return this.indexes[type].free[isUpgrade ? 'pop' : 'shift']();
    } else {
      do {
        this.indexes[type].last++;
      } while (this.indexes[type].custom.includes(this.indexes[type].last));
      return this.indexes[type].last;
    }
  }

  clearIndex(type, index) {
    if (this.indexes[type].custom.includes(index)) {
      this.indexes[type].custom.splice(
        this.indexes[type].custom.indexOf(index)
      );
    } else {
      this.indexes[type].free.push(index);
    }
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.subscribeState(newState);
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
