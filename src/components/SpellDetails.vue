<template>
  <div class="spell-details" v-if="spell">
    <h2>
      <span :class="`icon icon-${spell.icon || spell.id}`"></span>
      <span class="text">{{ spell.title }}</span>
    </h2>
    <p class="spell-desc">{{ spell.desc }}</p>
    <p v-if="spell.duration">
      <span v-if="!isActiveDisc || !spell.isGlobal">
        Duration: {{ spell.duration }}
        {{ spell.duration > 1 ? 'turns' : 'turn' }}
      </span>
      <span v-if="isActiveDisc && spell.isGlobal">
        {{
          spell.currentDuration === 1
            ? 'Last turn.'
            : spell.currentDuration + ' turns left.'
        }}
      </span>
    </p>
    <div class="civ-checks" v-show="canModify || selectedCivs.length">
      <button
        v-show="canCreate"
        :class="{ active: isActiveDisc }"
        @click.prevent="castSpell()"
      >
        <span
          :class="`icon icon-${isActiveDisc ? 'destroy' : 'create'}`"
        ></span>
        <span class="title">{{
          isActiveDisc ? 'Destroy' : spell.type === 'spell' ? 'Cast' : 'Create'
        }}</span>
        <span class="mana" :class="{ remove: isActiveDisc }">
          <span class="inner mana-circle-before">{{ civlessManaCost }}</span>
        </span>
      </button>
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
          <span class="inner mana-circle-before">{{ civ.manaCost }}</span>
        </span>
        <span class="duration" v-show="civ.duration > 0 && civ.hasDisc">
          ({{
            civ.duration === 1 ? 'Last turn' : civ.duration + ' turns left'
          }})
        </span>
      </label>
      <button
        v-for="upgrade in upgradeList"
        @click.prevent="castUpgrade(upgrade)"
        :key="upgrade.id"
        :class="{ disabled: upgrade.disabledTitle }"
        :title="upgrade.disabledTitle"
      >
        <span :class="`icon icon-${upgrade.icon || upgrade.id}`"></span>
        <span class="title">Upgrade to {{ upgrade.title }}</span>
        <span class="mana" v-show="!upgrade.disabledTitle">
          <span class="inner mana-circle-before">{{ upgrade.mana }}</span>
        </span>
      </button>
    </div>
    <div class="villain" v-if="spell.villain">
      <h3>Villain stats</h3>
      <ul>
        <li>Type: {{ spell.villain.type }}</li>
        <li>Health: {{ spell.villain.health }}</li>
        <li>Power: {{ spell.villain.power }}</li>
        <li>
          Mana: {{ spell.villain.mana }} (+{{ spell.villain.manaPerTurn }}/turn)
        </li>
      </ul>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SpellDetails',
  props: {
    spell: Object,
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
      if (this.gameAction('isGlobalCastSpell', this.spell?.id)) {
        return [];
      }
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
          upgradedBy:
            this.spell &&
            this.gameAction('getDiscUpgrade', this.spell.id, civ.id),
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
    isActiveDisc() {
      return this.$store.getters.world.discs.find(
        disc => disc.id === this.spell?.id
      );
    },
    canModify() {
      return this.$store.getters.spark.skills.find(
        skill => skill.id === this.spell.skill
      )?.isActive;
    },
    canCreate() {
      if (!this.spell || !this.canModify) {
        return false;
      }

      return (
        (this.spell.type === 'biome' &&
          (!this.spell.skillCreate ||
            this.$store.getters.spark.skills.find(
              skill => skill.id === this.spell.skillCreate
            )?.isActive)) ||
        this.gameAction('isGlobalCastSpell', this.spell?.id)
      );
    },
    civlessManaCost() {
      return this.canCreate
        ? this.gameAction('getManaCost', this.spell?.id)
        : 0;
    },
    upgradeList() {
      if (
        !this.spell ||
        !this.canModify ||
        ['knowledge', 'boon', 'spell'].includes(this.spell.type)
      ) {
        return [];
      }
      return this.$store.getters.world.allDisclike
        .filter(disc => disc.upgrades?.includes(this.spell.id))
        .map(disc => {
          let disabledTitle;
          const skill = this.$store.getters.spark.skills.find(
            skill => skill.id === disc.skill
          );
          const skillCreate =
            disc.skillCreate &&
            this.$store.getters.spark.skills.find(
              skill => skill.id === disc.skillCreate
            );
          const missingRequiredId = disc.requires?.find(
            discId =>
              !this.$store.getters.world.discs.find(disc => disc.id === discId)
          );

          if (
            !skill.isActive ||
            (disc.skillCreate && !skillCreate.isActive) ||
            missingRequiredId
          ) {
            disabledTitle = `Requires ${
              !skill.isActive
                ? skill.title
                : missingRequiredId
                ? this.$store.getters.world.allDisclike.find(
                    disc => disc.id === missingRequiredId
                  )?.title
                : skillCreate.title
            }.`;
          }
          if (!this.isActiveDisc && !disabledTitle) {
            disabledTitle = `${this.spell.title} has to be active to upgrade.`;
          }
          return {
            ...disc,
            mana: disabledTitle ? 0 : this.gameAction('getManaCost', disc.id),
            disabledTitle,
          };
        });
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
      const resp = this.gameAction('castSpell', this.spell.id, civId);
      if (resp) {
        setTimeout(() => {
          if (resp.isRemove && resp.discUpgradedFrom) {
            this.$emit('updateSpell', resp.discUpgradedFrom);
          } else {
            this.updateSelectedCivs(this.spell);
          }
        });
      }
    },
    castUpgrade(upgrade) {
      if (upgrade.disabledTitle) {
        return false;
      }
      if (this.gameAction('castSpell', upgrade.id)) {
        setTimeout(() => this.$emit('updateSpell', upgrade.id), 0);
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
    flex-wrap: wrap;
    margin: 0 -10px 10px;
    padding-top: 10px;

    label,
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

    input {
      position: absolute;
      left: -9999em;
    }
    .active .icon {
      border-color: $cGreen;
      & + .title {
        color: $cGreen;
      }
    }
    .disabled .icon {
      box-shadow: none;
      filter: grayscale(0.7);
      border-color: #ddd;
    }
    .active.disabled .icon {
      border-color: #444;
      & + .title {
        color: $cText;
      }
    }

    .icon {
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
          position: absolute;
          left: 3px;
          top: 3px;
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
