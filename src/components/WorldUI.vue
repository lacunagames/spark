<template>
  <div class="world">
    <div
      v-for="(pos, index) in world.positions"
      :key="index"
      :style="{
        position: 'absolute',
        left: pos.left + '%',
        top: pos.top + '%',
        width: '5px',
        height: '5px',
        background: 'red',
        borderRadius: '10px',
        opacity: 0.6,
      }"
    ></div>
    <ul class="discs">
      <li
        v-for="disc in realDiscs"
        :key="disc.id"
        :class="disc.type"
        :style="{
          left: world.positions[disc.index].left + '%',
          top: world.positions[disc.index].top + '%',
        }"
      >
        <a
          href="#"
          :class="{
            large: disc.villain || disc.type === 'biome',
          }"
          :title="disc.title"
          v-on="hoverHandle(disc.id)"
          @click.prevent="openModal(disc)"
        >
          <span
            :class="{
              background: true,
              icon: true,
              [`icon-${disc.id}`]: true,
            }"
          >
            <span
              :class="`health icon icon-${disc.id}`"
              v-if="disc.health"
              :style="{
                height: disc.healthMissing + '%',
              }"
            >
            </span>
          </span>
          <CircleMeter
            v-if="disc.isGlobal && disc.duration"
            :size="50"
            :width="3"
            emptyColor="222"
            fillColor="ee1e26"
            :value="(disc.currentDuration - 1) / disc.duration"
          />
        </a>
      </li>
    </ul>
    <Modal v-show="isModalOpen" @close="closeModal" classes="disc-modal">
      <template #body>
        <SpellDetails
          :isReset="isModalOpen"
          :spell="selectedDisc"
          @updateSpell="updateSelectedDisc"
        />
      </template>
    </Modal>
  </div>
</template>

<script>
import utils from '@/game/utils';
import Modal from '@/components/Modal';
import SpellDetails from '@/components/SpellDetails';
import CircleMeter from '@/components/CircleMeter';

export default {
  name: 'WorldUI',
  components: {
    Modal,
    SpellDetails,
    CircleMeter,
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
    realDiscs() {
      return this.$store.getters.world.discs
        .filter(disc => !['knowledge', 'boon'].includes(disc.type))
        .map(disc => ({
          ...disc,
          healthMissing: utils.round(
            100 -
              ((this.$store.getters.world.healths[disc.id] ?? disc.health) /
                disc.health) *
                100
          ),
        }));
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
    updateSelectedDisc(discId) {
      this.selectedDisc =
        this.$store.getters.world.discs.find(disc => disc.id === discId) ||
        this.$store.getters.world.allDisclike.find(disc => disc.id === discId);
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

      .background {
        overflow: hidden;
        border-radius: 30px;
        display: inline-block;
        width: 100%;
        height: 100%;
        position: relative;
      }

      .health {
        filter: grayscale(1);
        box-shadow: 2px 2px 6px #eae4c1;
        transition: height 0.2s ease-out;
        display: inline-block;
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
      }

      &:hover {
        box-shadow: 0 0 2px 4px #ffffd241, $shadow3;
      }

      svg {
        position: absolute;
        left: -3px;
        top: -3px;
      }

      &.large {
        width: 60px;
        height: 60px;
        left: -30px;
        top: -30px;
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
