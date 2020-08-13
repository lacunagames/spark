<template>
  <transition name="ending-fade" :duration="500" v-if="ending">
    <div class="ending-screen">
      <div class="modal">
        <img
          :src="getImgUrl('ending-' + ending + '.png')"
          width="250"
          height="250"
        />
        <h3>The world has ended by {{ ending }}.</h3>
        <button class="primary" @click="$router.go()">Restart game</button>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'EndingUI',
  computed: {
    ending() {
      return this.$store.getters.world.ending;
    },
  },
  methods: {
    getImgUrl(img) {
      return require('../assets/images/' + img);
    },
  },
};
</script>

<style lang="scss">
.ending-fade-enter,
.ending-fade-leave-active {
  .ending-screen,
  .modal {
    opacity: 0;
  }
}
.ending-fade-enter-active,
.ending-fade-leave-active {
  .ending-screen,
  .modal {
    transition: opacity 500ms ease;
  }
}
.ending-screen {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;

  .modal {
    position: absolute;
    margin: 20px auto;
    background: #eee8c5;
    border-radius: 1px;
    box-shadow: 2px 2px 20px 1px;
    overflow-x: auto;
    position: relative;
    width: 500px;
    z-index: 110;
    padding: 20px;
  }
  img {
    float: left;
    margin-right: 20px;
  }
}
</style>
