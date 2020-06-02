<template>
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
      <a href="#" v-on="hoverHandle(civ.id)">
        <div class="title">
          <span>{{ civ.level }}</span>
          {{ civ.name }}
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
</template>

<script>
import CircleMeter from '@/components/CircleMeter';

export default {
  name: 'CivUI',
  components: {
    CircleMeter,
  },
  props: {
    hovered: String,
  },
  data() {
    return {
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
</style>
