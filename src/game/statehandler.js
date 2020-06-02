class StateHandler {
  constructor(subscribeState) {
    this.subscribeState = subscribeState;
    this.state = {};
    this.indexes = {};
  }

  getState() {
    return this.state;
  }

  initIndexes(...arr) {
    arr.forEach(type => (this.indexes[type] = { last: -1, free: [] }));
  }

  useIndex(type) {
    if (this.indexes[type].free.length) {
      return this.indexes[type].free.shift();
    } else {
      this.indexes[type].last++;
      return this.indexes[type].last;
    }
  }

  clearIndex(type, index) {
    this.indexes[type].free.push(index);
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.subscribeState(newState);
  }

  _updateStateObj(arrayName, id, updates) {
    const stateArray = this.state[arrayName].map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    );

    this.setState({ [arrayName]: stateArray });
    return stateArray.find(obj => obj.id === id);
  }

  _removeStateObj(arrayName, id) {
    const stateArray = this.state[arrayName].filter(obj => obj.id !== id);

    this.setState({ [arrayName]: stateArray });
  }
}

export default StateHandler;
