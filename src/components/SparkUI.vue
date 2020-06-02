<template>
  <div class="spark">
    <div>
      <div class="turn-button">
        Turn {{ world.turn }}
        <br />
        <button class="primary" @click="gameAction('nextTurn', 2)">Next turn</button>
      </div>

      <button class="mana-orb" @click="openModal('spells')">
        <span class="filled" :style="{ top: 100 - (spark.mana / spark.maxMana) * 100 + '%' }"></span>
        <span>{{ spark.mana }}</span>
      </button>

      <button class="xp-orb" :class="{ flipped: isNewLevelUp }" @click="openModal('skills')">
        <span>{{ isNewLevelUp ? '+' : sparkLevel }}</span>
        <CircleMeter
          :size="50"
          :width="4"
          emptyColor="222"
          fillColor="ffe825"
          :increaseOnly="true"
          :value="spark.xp / spark.xpToLevel"
          @flipped="xpFlipped"
        />
      </button>
    </div>
    <SpellsModal ref="spellsModal" />
    <SkillsModal ref="skillsModal" />
  </div>
</template>

<script>
import CircleMeter from '@/components/CircleMeter';
import SpellsModal from '@/components/SpellsModal';
import SkillsModal from '@/components/SkillsModal';

export default {
  name: 'SparkUI',
  components: {
    CircleMeter,
    SpellsModal,
    SkillsModal,
  },
  data: function() {
    return {
      sparkLevel: 1,
      isNewLevelUp: true,
    };
  },
  computed: {
    spark() {
      return this.$store.getters.spark;
    },
    world() {
      return this.$store.getters.world;
    },
  },
  watch: {
    spark: function(newSpark, oldSpark) {
      if (newSpark.xp >= oldSpark.xp) {
        this.sparkLevel = newSpark.level;
      }
    },
  },
  methods: {
    xpFlipped() {
      this.sparkLevel = this.spark.level;
      this.isNewLevelUp = true;
    },
    openModal(type) {
      if (type === 'skills') this.isNewLevelUp = false;
      this.$refs[`${type}Modal`].openModal();
    },
  },
};
</script>

<style lang="scss">
.spark {
  &:before {
    content: '';
    position: absolute;
    right: -70px;
    bottom: -300px;
    width: 500px;
    height: 500px;
    border-radius: 300px;
    background: #eee8c5;
  }

  &:after {
    content: '';
    background: url(~@/assets/images/spark-avatar.png) no-repeat;
    background-size: cover;
    height: 225px;
    width: 150px;
    position: absolute;
    right: 70px;
    bottom: 50px;
  }

  .xp-orb,
  .mana-orb {
    display: block;
    position: absolute;
    border-radius: 100px;
    color: #fff;
    width: 50px;
    height: 50px;
    font-size: 28px;
    padding: 15px 0px;
    text-align: center;
    overflow: hidden;
    text-decoration: none;
    font-family: $font;
  }

  .xp-orb {
    position: absolute;
    right: 330px;
    bottom: 100px;
    border-radius: 100px;
    background-color: #585442;

    svg {
      position: absolute;
      left: 0;
      top: 0;
    }

    &:hover {
      background-color: #756f52;
    }

    &.flipped {
      background-color: #14bc00;

      &:hover {
        background-color: #22e10c;
      }
    }
  }

  .mana-orb {
    right: 270px;
    bottom: 150px;
    background-color: #4b4258;
    border: 2px solid #3f3d34;

    &:hover {
      background-color: lighten(#4b4258, 10%);

      .filled {
        background-color: lighten(#5204a7, 10%);
      }
    }

    span {
      position: relative;
    }

    .filled {
      display: inline-block;
      position: absolute;
      margin-top: -1px;
      bottom: -1px;
      left: 0;
      right: 0;
      top: 0;
      background-color: #5204a7;
      border-top: 2px solid #8235d5;
      transition: top $animFast, background-color $animFast;
    }
  }

  .turn-button {
    position: absolute;
    bottom: 20px;
    right: 340px;
    padding: 10px;
  }
}
</style>
