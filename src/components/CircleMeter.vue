<template>
  <div class="circle-meter">
    <svg :width="size" :height="size">
      <circle
        :r="radius"
        :cx="center"
        :cy="center"
        :style="{stroke: `#${emptyColor}`, 'stroke-width': width}"
      />
      <circle
        :r="radius"
        :cx="center"
        :cy="center"
        class="progress"
        :class="{'no-transition': noTransition}"
        :style="{
          'stroke-dasharray': `${dashVal * lineLength} ${lineLength}`,
          'stroke': `#${flipping ? emptyColor : fillColor}`,
          'stroke-width': width,
        }"
      />
    </svg>
  </div>
</template>

<script>
export default {
  name: 'CircleMeter',
  props: {
    size: Number,
    width: Number,
    emptyColor: String,
    fillColor: String,
    increaseOnly: Boolean,
    value: Number,
  },
  data: function() {
    return {
      dashVal: this.value,
      flipping: false,
      noTransition: false,
      lastVal: 0,
      timer: undefined,
    };
  },
  computed: {
    radius() {
      return this.size / 2 - this.width / 2;
    },
    center() {
      return this.size / 2;
    },
    lineLength() {
      return (this.size - this.width) * Math.PI;
    },
  },
  watch: {
    value: function(newVal, oldVal) {
      if (!this.increaseOnly || (newVal >= oldVal && !this.timer)) {
        this.dashVal = newVal;
      } else {
        this.lastVal = newVal;
        if (this.timer) return;
        this.dashVal = 1;
        this.timer = setTimeout(() => {
          this.flipping = true;
          this.$emit('flipped');
          this.timer = setTimeout(() => {
            this.noTransition = true;
            this.dashVal = 0;
            this.flipping = false;
            this.timer = setTimeout(() => {
              this.noTransition = false;
              this.dashVal = this.lastVal;
              this.timer = undefined;
            }, 50);
          }, 150);
        }, 250);
      }
    },
  },
};
</script>

<style lang="scss">
.circle-meter {
  svg {
    pointer-events: none;
    transform: rotate(-90deg);
  }

  circle {
    fill: none;
    transition: stroke $animFast;
  }

  .progress {
    transition: stroke-dasharray 0.25s linear, stroke $animFast;
  }

  .no-transition {
    transition: none;
  }
}
</style>
