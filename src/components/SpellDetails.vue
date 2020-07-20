<template>
  <div class="spell-details" v-if="spell">
    <h2>
      <span :class="`icon icon-${spell.icon || spell.id}`"></span>
      <span class="text">{{ spell.title }}</span>
    </h2>
    <p class="spell-desc">{{ spell.desc }}</p>
    <p v-if="spell.duration">
      Duration: {{ spell.duration }} {{ spell.duration > 1 ? 'turns' : 'turn' }}
    </p>
    <div class="civ-checks">
      <label
        v-for="civ in civList"
        v-show="canModify || selectedCivs.includes(civ.id)"
        :key="civ.id"
        :class="{
          active: civ.hasDisc,
          disabled:
            !canModify || civ.requiresDisc || civ.disabledBy || civ.upgradedBy,
        }"
        :title="
          `${
            civ.requiresDisc
              ? 'Requires ' + civ.requiresDisc.title
              : civ.disabledBy
              ? 'Disabled by ' + civ.disabledBy.title
              : civ.upgradedBy
              ? 'Upgraded by ' + civ.upgradedBy.title
              : ''
          }`
        "
      >
        <input
          type="checkbox"
          :value="civ.id"
          :disabled="
            !canModify || civ.requiresDisc || civ.disabledBy || civ.upgradedBy
          "
          v-model="selectedCivs"
          @click.prevent="castSpell(civ.id)"
        />
        <span :class="`icon icon-${civ.id}`"></span>
        <span class="title">{{ civ.title }}</span>
        <span
          class="mana"
          :class="{ remove: civ.hasDisc }"
          v-show="
            canModify && !civ.requiresDisc && !civ.disabledBy && !civ.upgradedBy
          "
        >
          <span class="inner">{{ civ.manaCost }}</span>
        </span>
        <span class="duration" v-show="civ.duration > 0 && civ.hasDisc">
          ({{
            civ.duration === 1 ? 'Last turn' : civ.duration + ' turns left'
          }})
        </span>
      </label>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SpellDetails',
  props: {
    spell: Object,
    isSpell: Boolean,
    isReset: Boolean,
  },
  data: function() {
    return {
      selectedCivs: [],
    };
  },
  computed: {
    civList() {
      const activeDisc = this.$store.getters.world.discs.find(
        disc => disc.id === this.spell?.id
      );
      return this.$store.getters.civs.civList.map(civ => {
        const missingRequired = this.spell?.requires?.find(
          id => !civ.connect.includes(id)
        );
        return {
          ...civ,
          requiresDisc:
            missingRequired &&
            this.$store.getters.world.allDisclike.find(
              disc => disc.id === missingRequired
            ),
          upgradedBy: this.$store.getters.world.discs.find(disc =>
            civ.connect.find(
              conn =>
                conn === disc.id && disc.upgrades?.includes(this.spell?.id)
            )
          ),
          disabledBy: this.$store.getters.world.discs.find(disc =>
            civ.connect.find(
              conn =>
                conn === disc.id && disc.disables?.includes(this.spell?.id)
            )
          ),
          duration: activeDisc?.durations?.[civ.id],
          manaCost: this.gameAction('getManaCost', this.spell?.id, civ.id),
          hasDisc: civ.connect.includes(activeDisc?.id),
        };
      });
    },
    canModify() {
      return this.$store.getters.spark.skills.find(
        skill => skill.id === this.spell.skill
      )?.isActive;
    },
  },
  watch: {
    spell: {
      immediate: true,
      handler(newSpell) {
        this.updateSelectedCivs(newSpell);
      },
    },
    isReset() {
      this.updateSelectedCivs(this.spell);
    },
  },
  methods: {
    updateSelectedCivs(newSpell) {
      this.selectedCivs = this.$store.getters.civs.civList
        .filter(civ => civ.connect.includes(newSpell?.id))
        .map(civ => civ.id);
    },
    castSpell(civId) {
      if (this.gameAction('castSpell', this.spell.id, civId)) {
        setTimeout(() => this.updateSelectedCivs(this.spell), 10);
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
  .spell-desc {
    font-size: 18px;
    margin-bottom: 40px;
  }
  .civ-checks {
    display: flex;
    margin: 0 -10px 40px;
    padding-top: 10px;

    label {
      display: flex;
      margin: 0 10px 0 0;
      position: relative;
      cursor: pointer;
      width: 90px;
      flex-direction: column;
      text-align: center;
    }

    input {
      position: absolute;
      left: -9999em;
    }
    input:checked + .icon {
      border-color: $cGreen;
      & + .title {
        color: $cGreen;
      }
    }
    input:disabled + .icon {
      box-shadow: none;
      filter: grayscale(0.7);
      border-color: #ddd;
    }
    input:disabled:checked + .icon,
    .active input:disabled:checked + .icon {
      border-color: #444;
      & + .title {
        color: $cText;
      }
    }

    .icon {
      position: relative;
      left: 15px;
      display: inline-block;
      width: 60px;
      height: 60px;
      background-size: cover;
      border: 3px solid #ccc;
      border-radius: 50px;
      box-shadow: $shadow2;
      margin-bottom: 6px;
    }
    .title {
      margin-bottom: 6px;
    }

    .mana {
      margin: 0 0 6px;
      .inner {
        padding: 2px 10px 2px 25px;
        display: inline-block;
        border-radius: 100px;
        background: $cGreen;
        color: #fff;
        position: relative;
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
      &.remove .inner {
        background: $cError;
      }
    }

    .duration {
      font-size: 12px;
      line-height: 18px;
      font-style: italic;
    }

    label.disabled {
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
