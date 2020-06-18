<template>
  <div class="graph">
    <h3>{{ title }} (Max: {{ dataMax }})</h3>
    <div
      class="label"
      v-if="hoverRect > -1"
      :class="{below: points[hoverRect].y2 < 50, before: points[hoverRect].x2 > width - 10, after: points[hoverRect].x2 < 30}"
      :style="{left: points[hoverRect].x2 + 'px', top: points[hoverRect].y2 + 20 + 'px' }"
    >
      <p>{{ points[hoverRect].val }}</p>
    </div>
    <svg class="chart" :width="width + 2 * padding" :height="height + 2 * padding">
      <rect :x="padding" :y="padding" :width="width" :height="height" />
      <line
        v-for="point in points"
        :key="point.index"
        :x1="point.x1"
        :y1="point.y1"
        :x2="point.x2"
        :y2="point.y2"
      />
      <g v-for="(point, i) in points" :key="i">
        <rect
          :x="point.rectX"
          y="0"
          :width="point.rectWidth"
          :height="height + 2 * padding"
          @mouseover="hoverLine(i)"
          @mouseleave="hoverLine(-1)"
        />
        <circle :cx="point.x2" :cy="point.y2" :r="hoverRect === i ? 7 : 2.5" />
      </g>
    </svg>
  </div>
</template>

<script>
import utils from '@/game/utils';

export default {
  name: 'Graph',
  props: {
    data: Array,
    title: String,
    dataMax: Number,
  },
  data() {
    return {
      width: 810,
      height: 150,
      resolution: 50,
      padding: 20,
      hoverRect: -1,
    };
  },
  computed: {
    maxVal() {
      return Math.max(...this.data, this.dataMax);
    },
    points() {
      const tick = this.width / this.resolution;
      let xLast, yLast;

      return this.data
        .slice(Math.max(this.data.length - this.resolution - 1, 0))
        .map((val, i) => {
          const x2 = utils.round(
            (this.width / this.resolution) * i + this.padding
          );
          const y2 = utils.round(
            ((this.maxVal - val) / this.maxVal) * this.height + this.padding
          );
          const obj = {
            x1: xLast > -1 ? xLast : x2,
            y1: yLast > -1 ? yLast : y2,
            x2,
            y2,
            rectX: x2 - tick / 2,
            rectWidth: tick,
            val,
            index: i + this.resolution + 1,
          };

          xLast = x2;
          yLast = y2;
          return obj;
        });
    },
  },
  methods: {
    hoverLine(i) {
      this.hoverRect = i;
    },
  },
};
</script>

<style lang="scss">
.graph {
  position: relative;
  background: $cBgLightest;
  overflow: hidden;

  rect {
    fill: none;
  }
  g rect {
    pointer-events: all;
    cursor: pointer;

    &:hover {
      + circle {
        transform: scale(1);
      }
    }
  }
  line,
  circle {
    stroke: $cGreen;
    stroke-width: 3;
    pointer-events: none;
  }
  circle {
    stroke-width: 2;
    fill: lighten($cGreen, 10%);
    transform-origin: center;
    transition: all $animFast;
  }

  h3 {
    position: absolute;
    top: 0;
  }
  .label {
    position: absolute;
    pointer-events: none;
    transition: all $animFast;

    p {
      position: relative;
      background: rgba($cText, 85%);
      color: #fff;
      padding: 5px 10px;
      font-size: 16px;
      line-height: 16px;
      left: -50%;
      top: -40px;
    }
    &.below p {
      top: 20px;
    }
    &.after p {
      left: -10px;
    }
    &.before p {
      left: calc(-100% + 10px);
    }
  }
  svg {
    margin: 0 -20px -20px;
  }
}
</style>
