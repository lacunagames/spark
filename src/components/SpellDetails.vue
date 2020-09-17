<template>
  <div class="spell-details" v-if="spell">
    <h2>
      <span :class="`icon icon-${spell.icon || spell.id}`"></span>
      <span class="text">{{ spell.title }}</span>
    </h2>
    <p class="spell-desc">{{ spell.desc }}</p>
    <p v-if="requiresList.length" class="req-list">
      Requires:
      <span
        v-for="item in requiresList"
        :key="item.id"
        :class="{
          'req-icon-wrap': true,
          disabled: item.disabled,
          missing: item.missing,
        }"
      >
        <span :class="`icon icon-${item.icon || item.id}`"></span>
        {{ item.title }}
      </span>
    </p>
    <p v-if="spell.influence">Influence required: {{ spell.influence }}%</p>
    <p v-if="spell.duration">
      <span v-if="!activeDisc || !spell.isGlobal">
        Duration: {{ spell.duration }}
        {{ spell.duration > 1 ? 'turns' : 'turn' }}
      </span>
      <span v-if="activeDisc && spell.isGlobal">
        {{
          activeDisc.currentDuration === 1
            ? 'Last turn.'
            : activeDisc.currentDuration + ' turns left.'
        }}
      </span>
    </p>
    <p v-if="spell.health">
      Health: {{ currentHealth ? currentHealth + ' / ' : '' }}
      {{ spell.health }}
    </p>

    <div class="civ-checks" v-show="spellButtons.length">
      <button
        v-for="button in spellButtons"
        :key="button.id"
        :class="{ active: button.isActive, disabled: button.disabledText }"
        :disabled="!!button.disabledText"
        :title="button.disabledText"
        @click.prevent="
          castSpell(button.civId || button.targetId, button.upgId)
        "
      >
        <span class="icon-wrap">
          <span :class="`icon icon-${button.icon}`"></span>
        </span>
        <CircleMeter
          v-if="
            typeof button.rechargePercent === 'number' &&
              button.rechargePercent < 1
          "
          :size="68"
          :width="4"
          emptyColor="222"
          fillColor="ccc"
          :value="button.rechargePercent"
        />
        <span class="title">{{ button.title }}</span>
        <span class="mana" :class="{ remove: button.isActive }">
          <span
            class="inner mana-circle-before"
            :class="{ pre: button.manaCost.charge }"
          >
            {{ button.manaCost.mana }}
          </span>
          <span
            class="inner mana-charge-circle-before"
            v-if="button.manaCost.charge"
            >{{ button.manaCost.charge }}
          </span>
        </span>
        <span class="duration" v-show="button.duration > 0 && button.isActive">
          {{
            button.duration === 1
              ? 'Last turn'
              : button.duration + ' turns left'
          }}
        </span>
        <span
          :class="{
            influence: true,
            valid: button.influence >= spell.influence,
          }"
          v-show="spell.influence"
        >
          Influence: {{ button.influence }}%
        </span>
      </button>
    </div>
    <div class="villain" v-if="spell.villain">
      <h3>Villain stats</h3>
      <ul>
        <li>Type: {{ spell.villain.type }}</li>
        <li>Power: {{ spell.villain.power }}</li>
        <li>
          Mana: {{ spell.villain.mana }} (+{{ spell.villain.manaPerTurn }}/turn)
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
import utils from '@/game/utils';
import CircleMeter from '@/components/CircleMeter';

export default {
  name: 'SpellDetails',
  components: {
    CircleMeter,
  },
  props: {
    spell: Object,
    isReset: Boolean,
  },
  computed: {
    activeDisc() {
      this.$store.getters.world.discs;
      return utils.findInArray(this.$store.getters.world.discs, this.spell?.id);
    },
    currentHealth() {
      return this.spell && this.$store.getters.world.healths[this.spell.id];
    },
    spellButtons() {
      this.spell,
        this.isReset,
        this.$store.getters.spark.skills,
        this.$store.getters.civs.civList,
        this.$store.getters.world.discs;
      return this.gameCall('getSpellButtons', this.spell.id);
    },
    requiresList() {
      if (!this.spell) {
        return [];
      }
      return [
        ...(this.spell.requires || []),
        ...(this.spell.createRequires || []),
      ].map(discId => {
        this.$store.getters.world.discs;
        const disc = utils.findInArray(
          this.$store.getters.world.allDisclike,
          discId
        );
        const isReqActive = utils.findInArray(
          this.$store.getters.world.discs,
          discId,
          true
        );
        return {
          ...disc,
          disabled:
            (this.spell.createRequires.includes(discId) && this.activeDisc) ||
            this.spellButtons.every(button => button.upgId || button.isActive),
          missing: !isReqActive,
        };
      });
    },
  },
  methods: {
    castSpell(targetId, upgradeId) {
      const resp = this.gameCall(
        'castSpell',
        upgradeId || this.spell.id,
        targetId
      );
      if (resp) {
        setTimeout(() => {
          if (resp.isRemove && resp.discUpgradedFrom) {
            this.$emit('updateSpell', resp.discUpgradedFrom);
          } else if (upgradeId) {
            this.$emit('updateSpell', upgradeId);
          }
        });
      }
    },
  },
};
</script>

<style lang="scss">
.spell-details {
  grid-area: details;
  background: #f9f6e4;
  padding: 20px;
  overflow: auto;

  p {
    font-size: 16px;
  }

  h2 {
    padding-top: 0;

    .text {
      position: relative;
      bottom: 20px;
    }

    .icon {
      display: inline-block;
      width: 87px;
      height: 87px;
      border-radius: 4px;
      margin-right: 20px;
    }
  }
  .active-spell {
    background-color: lighten($cBg, 40%);
    color: $cGreen;
    padding: 7px 20px;
    margin: 0 -20px 20px;
  }
  p {
    margin-bottom: 25px;
  }
  .spell-desc {
    font-size: 18px;
  }
  .req-list {
    display: flex;
    padding-top: 10px;
  }
  .req-icon-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    margin: -10px 3px 5px;
    font-size: 12px;
    line-height: 12px;
    width: 60px;

    .icon {
      display: inline-block;
      border: 2px solid $cText;
      margin-bottom: 5px;
      width: 30px;
      height: 30px;
      border-radius: 30px;
    }

    &.missing {
      color: $cError;
      .icon {
        border-color: $cError;
      }
    }
    &.disabled {
      color: #666;
      .icon {
        border-color: #666;
        filter: grayscale(0.8);
      }
    }
  }
  .civ-checks {
    display: flex;
    flex-wrap: wrap;
    margin: 0 -10px 10px;
    padding-top: 10px;

    button {
      display: flex;
      margin: 0 10px 30px 0;
      position: relative;
      cursor: pointer;
      width: 90px;
      flex-direction: column;
      align-items: center;
      height: auto;
      background: none;
      padding: 0;
      font-size: inherit;
      font-family: inherit;
      box-shadow: none;
      line-height: inherit;
      color: inherit;
    }

    .active .icon-wrap {
      border-color: $cGreen;
      & + .title {
        color: $cGreen;
      }
    }
    .disabled .icon-wrap {
      box-shadow: none;
      .icon {
        filter: grayscale(0.7);
      }
    }
    .active.disabled .icon-wrap {
      & + .title {
        color: $cText;
      }
    }

    .icon-wrap {
      display: inline-block;
      width: 68px;
      height: 68px;
      border: 4px solid #ccc;
      border-radius: 50px;
      box-shadow: $shadow2;
      margin-bottom: 6px;
    }

    .icon {
      display: inline-block;
      width: 62px;
      height: 62px;
      margin: -1px;
      background-size: cover;
      border-radius: 50px;
    }
    .circle-meter {
      position: absolute;
      top: 0;
    }
    .title {
      margin-bottom: 6px;
    }

    .mana {
      margin: 0 -5px 6px;
      .inner {
        padding: 2px 10px 2px 25px;
        display: inline-block;
        border-radius: 100px;
        background: $cGreen;
        color: #fff;
        position: relative;
        &:before {
          position: absolute;
          left: 3px;
          top: 3px;
        }
        &.mana-charge-circle-before:before {
          top: 9px;
        }
      }
      .pre {
        padding-right: 5px;
        border-radius: 100px 0 0 100px;
        & + .inner {
          border-radius: 0 100px 100px 0;
        }
      }
      &.remove .inner {
        background: $cError;
      }
    }

    .disabled .mana {
      display: none;
    }

    .duration,
    .influence {
      display: inline-block;
      font-size: 12px;
      line-height: 18px;
    }
    .influence {
      color: $cError;
      &.valid {
        color: $cGreen;
      }
    }

    .disabled {
      cursor: default;
    }
  }
  .changes span {
    display: inline-block;
    padding: 2px 5px;
    margin: 0 5px;
    color: #fff;
    background: $cGreen;
    font-size: 12px;
    line-height: 12px;

    &.disconnect {
      background: $cError;
    }
  }
}
</style>
