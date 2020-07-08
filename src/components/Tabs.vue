<template>
  <div class="tabs">
    <header class="tabs-header">
      <a
        href="#"
        v-for="tabName in tabList"
        :key="tabName"
        :class="{ active: tabName === activeTab }"
        @click.prevent="activeTab = tabName"
      >
        <h3>{{ tabName }}</h3>
      </a>
    </header>
    <div class="tabs-body" :class="{ 'slide-right': slideRight }">
      <transition-group name="tab" tag="div">
        <div :name="activeTab" :key="activeTab">
          <slot :name="activeTab"></slot>
        </div>
      </transition-group>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Tabs',
  props: {
    tabList: Array,
  },
  data() {
    return {
      activeTab: undefined,
      slideRight: false,
    };
  },
  watch: {
    tabList: {
      immediate: true,
      handler(newList) {
        if (!newList.includes(this.activeTab)) {
          this.activeTab = newList[0];
        }
      },
    },
    activeTab(newTab, oldTab) {
      this.slideRight =
        this.tabList.indexOf(newTab) < this.tabList.indexOf(oldTab);
    },
  },
};
</script>

<style lang="scss">
.tabs {
  height: 100%;
  display: grid;
  grid-template-columns: 100%;
  grid-template-rows: 50px auto;
  grid-template-areas:
    'header'
    'body';

  .tabs-header {
    overflow: hidden;
    grid-area: header;

    a,
    h3 {
      display: inline-block;
      margin-bottom: 0;
    }

    a {
      padding: 7px 10px;
      position: relative;
      background-color: transparent;
      transition: background-color $animFast;
      border-radius: 3px;
      &:hover {
        background-color: $cBgLightest;
      }

      h3 {
        transition: color $animFast;
        padding: 7px 0 3px;
      }
      &:after {
        content: '';
        position: absolute;
        bottom: 4px;
        left: 15px;
        right: 15px;
        height: 2px;
        background: $cGreen;
        transition: opacity $animFast;
        opacity: 0;
      }
    }
    .active {
      pointer-events: none;
      h3 {
        color: darken($cGreen, 10%);
      }
      &:after {
        opacity: 1;
      }
    }
  }
  .tabs-body {
    grid-area: body;
    position: relative;
    background-color: $cBgLightest;

    &,
    > div,
    > div > div {
      height: 100%;
      overflow: hidden;
    }
  }
}
.tab-enter-active,
.tab-leave-active {
  transition: transform $animFast;
}
.tab-enter,
.tab-leave-active {
  transform: translateX(100%);

  .slide-right & {
    transform: translateX(-100%);
  }
}
.tab-leave-active {
  position: absolute;
  width: 100%;
  transform: translateX(-100%);

  .slide-right & {
    transform: translateX(100%);
  }
}
</style>
