<template>
  <div class="spark">
    <div>
      <div class="turn-button">
        <span @click.prevent="gameCall('cheatSpark')"
          >Turn {{ world.turn }}</span
        >
        <br />
        <button class="primary" @click="gameCall('nextTurn', 2)">
          Next turn
        </button>
      </div>

      <div class="mana-orb">
        <button class="inner" @click="openModal('spells')">
          <span
            class="filled"
            :style="{ top: 100 - (spark.mana / spark.maxMana) * 100 + '%' }"
          ></span>
          <span>{{ spark.mana }}</span>
        </button>
        <button
          class="charges"
          @click="gameCall('popManaCharge')"
          :title="`Use charge to gain ${spark.chargeToMana} mana`"
        >
          <span v-for="index in spark.manaCharges" :key="index"></span>
        </button>
      </div>

      <button class="xp-orb" @click="openModal('skills')">
        <span class="inner" :class="{ flipped: isNewLevelUp }">
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
        </span>
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
      manaRestored: 0,
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
    closeModal() {
      this.$refs.spellsModal.closeModal();
      this.$refs.skillsModal.closeModal();
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
    font-size: 28px;
    text-align: center;
    text-decoration: none;
    font-family: $font;
    width: 0;
    height: 0;
    line-height: 0;
    padding: 0;
    margin: 0;

    .inner {
      padding: 15px 0px;
      position: relative;
      display: block;
      border-radius: 100px;
      color: #fff;
      width: 50px;
      height: 50px;
      overflow: hidden;
      line-height: 20px;
    }
  }

  .xp-orb {
    position: absolute;
    right: 365px;
    bottom: 165px;

    .inner {
      background-color: #585442;
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

    svg {
      position: absolute;
      left: 0;
      top: 0;
    }
  }

  .mana-orb {
    right: 300px;
    bottom: 210px;

    .inner {
      background-color: #4b4258;
      border: 2px solid #3f3d34;
      font-family: $font;
      font-size: 26px;
    }
    span {
      position: relative;
    }
    .charges {
      height: 0;
      padding: 0;
      position: absolute;

      span {
        display: inline-block;
        width: 20px;
        height: 20px;
        background-color: #35ced5;
        border: 2px solid #0463a7;
        transform: rotate(45deg);
        border-radius: 6px;
        position: absolute;
        top: -85px;
        left: 15px;
        &:hover {
          background-color: lighten(#35ced5, 10%);
        }
        &:nth-child(2) {
          top: -70px;
          left: -12px;
        }
        &:nth-child(3) {
          top: -70px;
          left: 42px;
        }
      }
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
    .inner:hover {
      background-color: lighten(#4b4258, 10%);
      .filled {
        background-color: lighten(#5204a7, 10%);
      }
    }
  }

  .turn-button {
    position: absolute;
    bottom: 20px;
    right: 310px;
    padding: 10px;
  }
}
</style>
