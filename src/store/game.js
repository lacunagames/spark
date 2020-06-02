import Spark from '../game/spark';
import World from '../game/world';
import Civs from '../game/civs';
import System from '../game/system';

import Vue from 'vue';

const state = {};
const getters = {};
const actions = {};
const mutations = {};
let timer;
let unsavedState = {};

Vue.prototype.gameAction = (action, ...args) => {
  if (
    action[0] === '_' ||
    ['constructor', 'subscribeState'].indexOf(action) !== -1
  )
    return false;

  const moduleName = Object.keys(modules).find(
    moduleName => typeof modules[moduleName][action] === 'function'
  );

  return modules[moduleName][action](...args);
};

const stateChanged = (moduleName, newState) => {
  clearTimeout(timer);
  unsavedState[moduleName] = {
    ...(unsavedState[moduleName] || state[moduleName]),
    ...newState,
  };
  timer = setTimeout(() => {
    Object.keys(unsavedState).forEach(name =>
      mutations[name](unsavedState[name])
    );
    unsavedState = {};
  }, 0);
};

const modules = {
  spark: new Spark(newState => stateChanged('spark', newState)),
  world: new World(newState => stateChanged('world', newState)),
  civs: new Civs(newState => stateChanged('civs', newState)),
  system: new System(newState => stateChanged('system', newState)),
};

Object.keys(modules).forEach(moduleName => {
  state[moduleName] = modules[moduleName].getState();
  getters[moduleName] = state => state[moduleName];
  mutations[moduleName] = newState => (state[moduleName] = newState);

  Object.keys(modules).forEach(otherName => {
    if (otherName !== moduleName) {
      modules[otherName][moduleName] = modules[moduleName];
    }
  });
});

export default {
  state,
  getters,
  actions,
  mutations,
};
