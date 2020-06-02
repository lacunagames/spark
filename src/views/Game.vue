<template>
  <div class="game">
    <div class="content">
      <CivsUI :hovered="hovered" @hoverChange="hoverChanged" />
      <WorldUI :hovered="hovered" @hoverChange="hoverChanged" />
      <SparkUI />
      <MessagesUI />
    </div>
  </div>
</template>

<script>
import CivsUI from '@/components/CivsUI';
import WorldUI from '@/components/WorldUI';
import SparkUI from '@/components/SparkUI';
import MessagesUI from '@/components/MessagesUI';

export default {
  name: 'Game',
  components: {
    CivsUI,
    WorldUI,
    SparkUI,
    MessagesUI,
  },
  data() {
    return {
      hovered: '',
      timer: undefined,
    };
  },
  methods: {
    hoverChanged(hovered) {
      clearTimeout(this.timer);
      if (hovered) {
        this.timer = setTimeout(() => {
          this.hovered = hovered;
        }, 200);
      } else {
        this.hovered = '';
      }
    },
  },
};
</script>

<style lang="scss">
.game {
  height: 100%;

  .content {
    position: relative;
    height: 100%;
    min-height: 600px;
    max-width: 1200px;
    min-width: 900px;
    margin: 0 auto;
  }
}
</style>
