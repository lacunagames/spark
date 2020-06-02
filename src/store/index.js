import Vue from 'vue';
import Vuex from 'vuex';
import Game from '@/store/game.js';

Vue.use(Vuex);

export default new Vuex.Store({
  modules: {
    Game,
  },
});
