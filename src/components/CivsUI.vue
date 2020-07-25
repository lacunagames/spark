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
            <line
              :x1="conn.x1 + '%'"
              :y1="conn.y1 + '%'"
              :x2="conn.x2 + '%'"
              :y2="conn.y2 + '%'"
            />
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
              :style="{
                height: Math.floor(100 - (civ.pop / civ.maxPop) * 100) + '%',
              }"
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
        <Graph
          :data="selectedCiv.popLog"
          :dataMax="selectedCiv.maxPop"
          title="Population"
        />
        <div class="left-info">
          <Tabs :tabList="['Stats', 'Techs']">
            <template #Stats>
              <div class="stats">
                <p>Xp: {{ selectedCiv.xp }} / {{ selectedCiv.xpToLevel }}</p>
                <p>
                  Science: {{ selectedCiv.science }} ({{ selectedCiv.tech }}
                  tech)
                </p>
                <p>
                  Military: {{ selectedCiv.military }} ({{
                    selectedCiv.warlust
                  }}
                  warlust)
                </p>
                <p>
                  Magic: {{ selectedCiv.magic }} ({{ selectedCiv.mana }} mana)
                </p>
                <p>
                  Commerce: {{ selectedCiv.commerce }} ({{ selectedCiv.wealth }}
                  wealth)
                </p>
                <p>Food: {{ selectedCiv.food }} / {{ selectedCiv.maxFood }}</p>
                <p>Expand: {{ selectedCiv.expand }}</p>
              </div>
            </template>
            <template #Techs>
              <div class="techs">
                <ol>
                  <li v-for="item in techList" :key="item.id">
                    <span :class="`icon icon-${item.icon || item.id}`"></span>
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.desc }}</p>
                  </li>
                </ol>
              </div>
            </template>
          </Tabs>
        </div>
        <div class="right-info">
          <Tabs :tabList="['Boons', 'History']">
            <template #Boons>
              <div class="boons">
                <ol>
                  <li v-for="item in boonList" :key="item.id">
                    <span :class="`icon icon-${item.icon || item.id}`"></span>
                    <button
                      v-if="item.hasRemove"
                      type="button"
                      class="close remove-boon"
                      title="Remove boon"
                      @click="gameAction('modifyDisc', item.id, selectedCiv.id)"
                    >
                      <span class="mana">{{ item.removeCost }}</span> ✕
                    </button>
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.desc }}</p>
                    <div class="duration">
                      {{
                        item.civDuration > -1
                          ? item.civDuration > 1
                            ? item.civDuration + ' turns left'
                            : 'Last turn'
                          : 'Permanent'
                      }}
                    </div>
                  </li>
                </ol>
              </div>
            </template>
            <template #History>
              <div class="history">
                <ol>
                  <li v-if="civLog.length === 0" class="empty">
                    No items yet.
                  </li>
                  <li
                    v-for="item in civLog"
                    :key="item.id"
                    :class="{ turn: item.isTurnItem }"
                  >
                    <span
                      v-if="item.icon"
                      :class="`icon icon-${item.icon}`"
                    ></span>
                    {{ item.text }}
                  </li>
                </ol>
              </div>
            </template>
          </Tabs>
        </div>
      </template>
    </Modal>
  </div>
</template>

<script>
import CircleMeter from '@/components/CircleMeter';
import Modal from '@/components/Modal';
import Graph from '@/components/Graph';
import Tabs from '@/components/Tabs';

export default {
  name: 'CivUI',
  components: {
    CircleMeter,
    Modal,
    Graph,
    Tabs,
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
    boonList() {
      const civ = this.$store.getters.civs.civList.find(
        civ => civ.id === this.selectedCiv?.id
      );
      if (!civ) return [];
      return this.$store.getters.world.discs
        .filter(
          disc =>
            disc.type === 'boon' &&
            !disc.isHidden &&
            civ.connect.includes(disc.id)
        )
        .map(disc => {
          const hasRemove = !!this.$store.getters.spark.skills.find(
            skill => skill.isActive && skill.id === disc.skill
          );
          return {
            ...disc,
            civDuration: disc.durations?.[this.selectedCiv.id],
            hasRemove,
            removeCost: this.gameAction(
              'getManaCost',
              disc.id,
              this.selectedCiv.id
            ),
          };
        });
    },
    techList() {
      const civ = this.$store.getters.civs.civList.find(
        civ => civ.id === this.selectedCiv?.id
      );
      if (!civ) return [];
      return civ.connect
        .map(discId =>
          this.$store.getters.world.discs.find(
            findDisc => findDisc.id === discId
          )
        )
        .filter(disc => disc.type === 'knowledge' && !disc.isHidden)
        .reverse();
    },
    connections() {
      const world = this.$store.getters.world;
      const civs = this.$store.getters.civs;
      const connections = [];

      civs.civList.forEach(civ => {
        const civPos = civs.positions[civ.index];

        civ.connect?.forEach(discId => {
          const disc = world.discs.find(disc => disc.id === discId);

          if (['knowledge', 'boon'].includes(disc.type)) return;

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
            isPositive: false,
            isNegative: false,
            isVisible: [civ.id, disc.id].includes(this.hovered),
            id: `${discId}-${civ.id}`,
          });
        });
      });
      return connections;
    },
    civLog() {
      if (!this.selectedCiv) return [];
      {
        this.$store.getters.world.log; // to trigger value update on log change
      }
      return this.gameAction('getFilteredLog', {
        civId: this.selectedCiv.id,
        order: 'desc',
        insertTurn: true,
      });
    },
  },
  watch: {
    boonList() {
      this.selectedCiv = this.$store.getters.civs.civList.find(
        civ => civ.id === this.selectedCiv?.id
      );
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
  .modal-header {
    padding: 0;
    h2 {
      display: none;
    }
  }
  .modal-body {
    padding: 20px;
    display: grid;
    grid-template-columns: 80px auto 50%;
    grid-gap: 20px;
    grid-template-rows: min-content min-content min-content auto;
    grid-template-areas:
      'icon title title'
      'icon desc desc'
      'graph graph graph'
      'left-info left-info right-info';
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
  .left-info,
  .right-info {
    overflow: hidden;
    grid-area: left-info;
  }
  .right-info {
    grid-area: right-info;
  }
  .history,
  .boons,
  .techs {
    background-color: $cBgLightest;
    display: flex;
    flex-direction: column;
    height: 100%;
    overflow: auto;

    ol {
      margin: 0;
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
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;

      &:not(:last-child) {
        border-bottom: 1px solid lighten($cBg, 20%);
      }
    }
    .empty {
      padding: 30px 10px;
      font-style: italic;
    }
  }
  .history {
    .turn {
      padding-left: 8px;
      text-transform: uppercase;
    }
  }
  .boons,
  .techs {
    padding: 10px 0;
    ol {
      height: 100%;
    }
    li {
      height: 68px;
      padding-left: 60px;
    }
    .icon {
      top: 11px;
      left: 8px;
      width: 45px;
      height: 45px;
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
    .duration {
      font-size: 14px;
      line-height: 21px;
    }
    .close {
      position: relative;
      top: 0;
      right: -5px;
      float: right;
      background: $cError;
      border-radius: 100px;
      padding: 4px 10px 4px 25px;
      color: #fff;
      font-size: 14px;
      line-height: 16px;
      height: auto;
      overflow: hidden;

      .mana {
        font-size: 18px;
        border-right: 1px solid lighten($cError, 10%);
        padding-right: 5px;
        margin-right: 3px;
        &:before {
          content: '';
          position: absolute;
          left: 4px;
          top: 4px;
          border-radius: 50px;
          width: 12px;
          height: 12px;
          display: inline-block;
          background: $cMana;
          border: 2px solid lighten($cMana, 15%);
        }
      }

      &:hover {
        background-color: lighten($cError, 10%);
      }
    }
  }
  .boons {
    li {
      display: block;
    }
    p {
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }
  .stats {
    padding: 15px 10px;
    font-size: 18px;
  }
}
</style>
