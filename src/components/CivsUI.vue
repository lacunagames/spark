<template>
  <div>
    <ul class="civs">
      <li class="connections">
        <svg>
          <g
            v-for="conn in connections"
            :key="conn.id"
            :class="{
            static: true,
            positive: conn.isPositive,
            negative: conn.isNegative,
            visible: conn.isVisible,
            modify: conn.isModify,
          }"
          >
            <line
              class="static"
              :x1="conn.x1 + '%'"
              :y1="conn.y1 + '%'"
              :x2="conn.x2 + '%'"
              :y2="conn.y2 + '%'"
            />
            <line :x1="conn.x1 + '%'" :y1="conn.y1 + '%'" :x2="conn.x2 + '%'" :y2="conn.y2 + '%'" />
          </g>
        </svg>
      </li>
      <li
        v-for="civ in civs.civList"
        :key="civ.id"
        :style="{
          left: civs.positions[civ.index].left + '%',
          top: civs.positions[civ.index].top + '%',
        }"
      >
        <a href="#" v-on="hoverHandle(civ.id)" @click.prevent="openModal(civ)">
          <div class="title">
            <span>{{ civ.level }}</span>
            {{ civ.title }}
          </div>
          <span class="population" :class="`icon-${civ.id}`">
            <span
              :class="`icon-${civ.id}`"
              :style="{ height: Math.floor(100 - (civ.population / civ.maxPopulation) * 100) + '%' }"
            ></span>
          </span>
          <CircleMeter
            :size="70"
            :width="4"
            emptyColor="222"
            fillColor="ffe825"
            :increaseOnly="true"
            :value="civ.xp / civ.xpToLevel"
          />
        </a>
      </li>
    </ul>

    <Modal
      v-if="selectedCiv"
      v-show="isModalOpen"
      @close="closeModal"
      classes="civ-modal side-panel"
    >
      <template #body>
        <span :class="`civ-icon icon-${selectedCiv.id}`"></span>
        <h2>
          {{ selectedCiv.title }}
          <span>(Level {{ selectedCiv.level }})</span>
        </h2>
        <p class="desc">{{ selectedCiv.desc }}</p>
        <Graph :data="selectedCiv.popLog" :dataMax="selectedCiv.maxPopulation" title="Population" />
        <div class="history">
          <h3>History</h3>
          <ol>
            <li v-for="item in civLog" :key="item.id" :class="{turn: item.isTurnItem}">
              <span v-if="item.icon" :class="`icon icon-${item.icon}`"></span>
              {{ item.text }}
            </li>
          </ol>
        </div>
        <div class="boons">
          <h3>Boons</h3>
          <ol>
            <li v-for="item in boonList" :key="item.id">
              <span :class="`icon icon-${item.icon || item.id}`"></span>
              <h4>{{ item.title }}</h4>
              <p>{{ item.desc }}</p>
            </li>
          </ol>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script>
import CircleMeter from '@/components/CircleMeter';
import Modal from '@/components/Modal';
import Graph from '@/components/Graph';

export default {
  name: 'CivUI',
  components: {
    CircleMeter,
    Modal,
    Graph,
  },
  props: {
    hovered: String,
  },
  data() {
    return {
      selectedCiv: undefined,
      isModalOpen: false,
      hoverHandle(civId) {
        return {
          mouseover: () => this.$emit('hoverChange', civId),
          mouseleave: () => this.$emit('hoverChange', ''),
          focus: () => this.$emit('hoverChange', civId),
          blur: () => this.$emit('hoverChange', ''),
        };
      },
    };
  },
  computed: {
    civs() {
      return this.$store.getters.civs;
    },
    connections() {
      const world = this.$store.getters.world;
      const civs = this.$store.getters.civs;
      const connections = [];

      civs.civList.forEach(civ => {
        const civPos = civs.positions[civ.index];

        civ.connect?.forEach(discId => {
          const disc = world.discs.find(disc => disc.id === discId);

          disc.modifyDisc?.forEach(mod => {
            const otherDisc = world.discs.find(disc => disc.id === mod.disc);

            if (
              !otherDisc ||
              connections.find(conn => conn.id === `${discId}-${otherDisc.id}`)
            )
              return;
            connections.push({
              x1: world.positions[otherDisc.type][otherDisc.index].left,
              y1: world.positions[otherDisc.type][otherDisc.index].top,
              x2: world.positions[disc.type][disc.index].left,
              y2: world.positions[disc.type][disc.index].top,
              isModify: true,
              isPositive: false,
              isNegative: false,
              isVisible: [otherDisc.id, disc.id].includes(this.hovered),
              id: `${discId}-${otherDisc.id}`,
            });
          });

          connections.push({
            x1: civPos.left,
            y1: civPos.top,
            x2: world.positions[disc.type][disc.index].left,
            y2: world.positions[disc.type][disc.index].top,
            isModify: false,
            isPositive:
              disc.xpGrow > 0 || disc.popGrow > 0 || disc.actionGrow > 0,
            isNegative: disc.popGrow < 0,
            isVisible: [civ.id, disc.id].includes(this.hovered),
            id: `${discId}-${civ.id}`,
          });
        });
      });
      return connections;
    },
    boonList() {
      return this.selectedCiv?.boons.map(boonId =>
        this.$store.getters.civs.allBoons.find(boon => boon.id === boonId)
      );
    },
    civLog() {
      if (!this.selectedCiv) return [];
      return this.gameAction('getFilteredLog', {
        civ: this.selectedCiv.id,
        order: 'desc',
        insertTurn: true,
      });
    },
  },
  methods: {
    openModal(civ) {
      this.selectedCiv = civ;
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
    },
  },
};
</script>

<style lang="scss">
@keyframes dash {
  to {
    stroke-dashoffset: 16;
  }
}
.civs {
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;

  .connections {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    z-index: -2;

    svg {
      width: 100%;
      height: 100%;
    }

    line {
      stroke: #666;
      stroke-width: 0;
      transition: stroke-width $animFast;
      stroke-dasharray: 8;
      animation: dash 1s linear infinite;

      &.static {
        opacity: 0.2;
        stroke-dasharray: 0;
        animation: none;
      }
    }
    .visible line {
      stroke-width: 2;
    }
    .visible .static {
      stroke-width: 6;
    }
    .positive line {
      stroke: #0b9b0b;
    }
    .negative line {
      stroke: #c53410;
    }
    .modify line:not(.static) {
      stroke-dasharray: 8 8;
    }
  }

  li {
    position: absolute;
  }

  a {
    display: inline-block;
    position: relative;
    width: 70px;
    height: 70px;
    left: -35px;
    top: -35px;
    background: no-repeat;
    background-size: cover;
    margin: 0;
    color: $cText;
    text-decoration: none;
    border: 4px solid #272725;
    border-radius: 50px;
    box-shadow: $shadow2;
    transition: box-shadow $animFast;

    &:hover {
      box-shadow: 0 0 3px 5px #ffffd556, $shadow3;
    }

    svg {
      position: absolute;
      left: -4px;
      top: -4px;
    }

    .population,
    .population span {
      position: absolute;
      left: 0;
      top: 0;
      display: inline-block;
      height: 62px;
      width: 62px;
      background-size: 62px 62px;
      background-repeat: no-repeat;
      background-position: 0 0;
      transform: translateZ(0);
      backface-visibility: hidden;
    }

    .population {
      border-radius: 50px;
      overflow: hidden;

      span {
        filter: grayscale(1);
        box-shadow: 2px 2px 6px #eae4c1;
        transition: height $animFast;
      }
    }

    .title {
      position: absolute;
      bottom: -29px;
      left: 50%;
      margin-left: -50%;
      background: #eae4c1;
      padding: 3px 10px 3px 25px;
      border-radius: 3px;
      font-size: 14px;
      z-index: -1;

      span {
        display: inline-block;
        font-size: 17px;
        padding: 3px;
        border-radius: 50px;
        border: 2px solid lighten($cBg, 5%);
        position: absolute;
        left: -10px;
        top: -1px;
        background: #fbf6d7;
        color: $cText;
        width: 30px;
        height: 30px;
        text-align: center;
      }
    }
  }
}

.civ-modal {
  header {
    padding: 0;
    h2 {
      display: none;
    }
  }
  .body {
    padding: 20px;
    display: grid;
    grid-template-columns: 80px auto 50%;
    grid-gap: 20px;
    grid-template-rows: min-content min-content min-content auto;
    grid-template-areas:
      'icon title title'
      'icon desc desc'
      'graph graph graph'
      'boons boons history';
  }
  .civ-icon {
    display: inline-block;
    width: 80px;
    height: 80px;
    border-radius: 4px;
    background-size: cover;
    grid-area: icon;
  }
  h2 {
    padding: 0;
    margin-bottom: 0;
    grid-area: title;

    span {
      font-size: 20px;
      line-height: 20px;
      padding-left: 5px;
    }
  }
  .desc {
    grid-area: desc;
    font-size: 16px;
    line-height: 24px;
    margin: -10px 0 0;
  }
  .graph {
    grid-area: graph;
    margin: 0 -20px;
    padding: 20px;
    line-height: 0;
  }
  .history,
  .boons {
    background-color: $cBgLightest;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    h3 {
      padding-left: 8px;
      margin-bottom: 5px;
    }
    ol {
      margin: 0;
      overflow: auto;
    }
    .icon {
      position: absolute;
      width: 35px;
      height: 35px;
      border-radius: 3px;
      background-size: cover;
      top: 5px;
      left: 7px;
    }
    li {
      font-size: 16px;
      line-height: 16px;
      padding: 5px 10px 5px 50px;
      height: 45px;
      position: relative;
      display: flex;
      align-items: center;

      &:not(:last-child) {
        border-bottom: 1px solid lighten($cBg, 20%);
      }
    }
  }
  .history {
    grid-area: history;

    .turn {
      padding-left: 8px;
      text-transform: uppercase;
      align-items: flex-end;
    }
  }
  .boons {
    grid-area: boons;

    ol {
      height: 100%;
    }
    li {
      flex-direction: column;
      align-items: flex-start;
      height: 50px;
      padding-left: 55px;
    }
    .icon {
      top: 5px;
      left: 8px;
      width: 40px;
      height: 40px;
    }
    h3 {
      margin-bottom: 10px;
    }
    h4 {
      font-family: $font;
      font-size: 18px;
      margin: 0 0 5px;
      padding: 3px 0 0;
    }
    p {
      font-size: 14px;
      margin-bottom: 0;
    }
  }
}
</style>
