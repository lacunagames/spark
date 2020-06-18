<template>
  <div class="game">
    <div class="content">
      <CivsUI :hovered="hovered" @hoverChange="hoverChanged" ref="civs" />
      <WorldUI :hovered="hovered" @hoverChange="hoverChanged" ref="world" />
      <SparkUI ref="spark" />
      <MessagesUI @openLink="openLink" />
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
      openDisc: undefined,
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
    openLink(item) {
      const disc =
        item.link === 'disc' &&
        this.$store.getters.world.discs.find(disc => disc.id === item.icon);
      const civ =
        item.link === 'civ' &&
        this.$store.getters.civs.civList.find(civ => civ.id === item.icon);

      switch (item.link) {
        case 'disc':
          return this.$refs.world.openModal(disc);
        case 'skills':
          return this.$refs.spark.openModal('skills');
        case 'civ':
          return this.$refs.civs.openModal(civ);
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
