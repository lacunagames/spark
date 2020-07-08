<template>
  <div class="world">
    <ul class="discs">
      <li
        v-for="disc in NoTechDiscs"
        :key="disc.id"
        :class="disc.type"
        :style="{
          left: world.positions[disc.type][disc.index].left + '%',
          top: world.positions[disc.type][disc.index].top + '%',
        }"
      >
        <a
          href="#"
          :class="`icon-${disc.id}`"
          :title="disc.title"
          v-on="hoverHandle(disc.id)"
          @click.prevent="openModal(disc)"
        ></a>
      </li>
    </ul>
    <Modal v-show="isModalOpen" @close="closeModal" classes="disc-modal">
      <template #body>
        <SpellDetails
          :isSpell="false"
          :isReset="isModalOpen"
          :spell="selectedDisc"
          @savedChanges="closeModal"
        />
      </template>
    </Modal>
  </div>
</template>

<script>
import Modal from '@/components/Modal';
import SpellDetails from '@/components/SpellDetails';

export default {
  name: 'WorldUI',
  components: {
    Modal,
    SpellDetails,
  },
  data() {
    return {
      isModalOpen: false,
      selectedDisc: undefined,
      hoverHandle(discId) {
        return {
          mouseover: () => this.$emit('hoverChange', discId),
          mouseleave: () => this.$emit('hoverChange', ''),
          focus: () => this.$emit('hoverChange', discId),
          blur: () => this.$emit('hoverChange', ''),
        };
      },
    };
  },
  computed: {
    spark() {
      return this.$store.getters.spark;
    },
    world() {
      return this.$store.getters.world;
    },
    NoTechDiscs() {
      return this.$store.getters.world.discs.filter(
        disc => disc.type !== 'knowledge'
      );
    },
  },
  methods: {
    openModal(disc) {
      this.selectedDisc = disc;
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
    },
  },
};
</script>

<style lang="scss">
.world {
  height: 100%;

  .disc-modal {
    .modal-header {
      padding: 0;
      border: none;
      h2 {
        display: none;
      }
    }
    .modal-body {
      padding: 0;
    }
  }

  .discs {
    margin-bottom: 0;

    li {
      position: absolute;
    }

    a {
      display: inline-block;
      width: 50px;
      height: 50px;
      border-radius: 30px;
      box-shadow: $shadow1;
      background-size: cover;
      border: 2px solid #666;
      position: relative;
      left: -25px;
      top: -25px;
      transition: box-shadow $animFast;

      &:hover {
        box-shadow: 0 0 2px 4px #ffffd241, $shadow3;
      }
    }

    .biome a {
      border-color: #1c791c;
    }

    .knowledge a {
      border-color: #2121c5;
    }
  }
}
</style>
