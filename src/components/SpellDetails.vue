<template>
  <div class="spell-details" v-if="spell">
    <h2>
      <span :class="`icon icon-${spell.icon || spell.id}`"></span>
      <span class="text">{{ spell.title }}</span>
    </h2>
    <p class="spell-desc">{{ spell.desc }}</p>
    <p
      v-if="spell.duration"
    >Duration: {{ spell.duration }} {{ spell.duration > 1 ? 'turns' : 'turn' }}</p>
    <p
      class="active-spell"
      v-if="isSpell && (isActiveDisc || activeBoon)"
    >This effect is currently active.</p>
    <div class="civ-checks">
      <label
        v-for="civ in civList"
        v-show="isSpell || isActiveDisc || (!isActiveDisc && selectedCivs.includes(civ.id))"
        :key="civ.id"
        :class="{
          active: isBoon ? activeBoon && activeBoon.civs.includes(civ.id) : civ.connect.includes(spell.id),
          disabled:
            (!isSpell && !isActiveDisc) || civ.requiresDisc ||
            civ.disabledBy ||
            civ.upgradedBy,
        }"
        :title="
          `${
            civ.requiresDisc
              ? 'Requires ' + civ.requiresDisc.title
              : civ.disabledBy
              ? 'Disabled by ' + civ.disabledBy.title
              : civ.upgradedBy
              ? 'Upgraded by ' + civ.upgradedBy.title
              : civ.duration > 0
              ? civ.duration === 1
                ? 'Last turn'
                : civ.duration + ' turns left'
              : ''
          }`
        "
      >
        <input
          type="checkbox"
          :value="civ.id"
          :disabled="!isSpell && !isActiveDisc || civ.requiresDisc || civ.disabledBy || civ.upgradedBy"
          v-model="selectedCivs"
        />
        <span :class="`icon icon-${civ.id}`"></span>
        <span class="title">{{ civ.title }}</span>
      </label>
    </div>
    <p class="changes" v-if="civChanges.length && (isActiveDisc || activeBoon)">
      Changes:
      <span
        v-for="change in civChanges"
        :key="change.id"
        :class="change.type === 'connect' ? 'connect' : 'disconnect'"
      >{{ change.type === 'connect' ? 'Connect' : 'Disconnect'}} {{change.title}}</span>
    </p>
    <p v-show="manaCost">Mana cost: {{ manaCost }}</p>
    <button
      v-if="isSpell || isActiveDisc"
      class="primary"
      @click.prevent="castSpell"
    >{{isActiveDisc || activeBoon ? isRemove ? 'Remove' : 'Modify' : 'Create'}}</button>
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
      return this.$store.getters.civs.civList.map(civ => {
        const missingRequired = this.spell?.requires?.find(
          id =>
            !civ.connect.includes(id) &&
            !this.$store.getters.civs.boons.find(
              boon => boon.id === id && boon.civs.includes(civ.id)
            )
        );
        return {
          ...civ,
          requiresDisc:
            missingRequired &&
            this.$store.getters.world.allDisclike.find(
              disc => disc.id === missingRequired
            ),
          upgradedBy: this.isBoon
            ? this.$store.getters.civs.boons.find(
                boon =>
                  boon.upgrades?.includes(this.spell?.id) &&
                  boon.civs.includes(civ.id)
              )
            : this.$store.getters.world.discs.find(disc =>
                civ.connect.find(
                  conn =>
                    conn === disc.id && disc.upgrades?.includes(this.spell?.id)
                )
              ),
          disabledBy: this.isBoon
            ? this.$store.getters.civs.boons.find(
                boon =>
                  boon.disables?.includes(this.spell?.id) &&
                  boon.civs.includes(civ.id)
              )
            : this.$store.getters.world.discs.find(disc =>
                civ.connect.find(
                  conn =>
                    conn === disc.id && disc.disables?.includes(this.spell?.id)
                )
              ),
          duration: this.activeBoon?.durations?.[
            this.activeBoon?.civs?.indexOf(civ.id)
          ],
        };
      });
    },
    isBoon() {
      return this.spell?.type === 'boon';
    },
    activeBoon() {
      return this.$store.getters.civs.boons.find(
        boon => boon.id === this.spell?.id
      );
    },
    isActiveDisc() {
      return (
        !this.isBoon &&
        this.$store.getters.world.discs.find(
          discFind => discFind.id === this.spell.id
        ) &&
        this.$store.getters.spark.skills.find(
          skill => skill.id === this.spell.skill
        )?.isActive
      );
    },
    isRemove() {
      return (
        (this.isActiveDisc || this.activeBoon) && this.selectedCivs.length === 0
      );
    },
    civChanges() {
      if (this.isActiveDisc) {
        return this.civList
          .filter(civ => {
            return (
              civ.connect.includes(this.spell.id) !==
              this.selectedCivs.includes(civ.id)
            );
          })
          .map(civ => ({
            type: civ.connect.includes(this.spell.id)
              ? 'disconnect'
              : 'connect',
            id: civ.id,
            title: civ.title,
          }));
      } else if (this.activeBoon) {
        return this.civList
          .filter(
            civ =>
              this.activeBoon.civs.includes(civ.id) !==
              this.selectedCivs.includes(civ.id)
          )
          .map(civ => ({
            type: this.activeBoon.civs.includes(civ.id)
              ? 'disconnect'
              : 'connect',
            id: civ.id,
            title: civ.title,
          }));
      } else {
        return this.selectedCivs.map(civ => ({
          type: 'connect',
          id: civ,
          title: this.civList.find(civFind => civFind.id === civ)?.title,
        }));
      }
    },
    manaCost() {
      if (!this.isSpell && !this.isActiveDisc) {
        return 0;
      }
      return this.gameAction('getManaCost', {
        [this.isBoon ? 'boonId' : 'discId']: this.spell.id,
        isActive: this.isActiveDisc || !!this.activeBoon,
        civChanges: this.civChanges,
      });
    },
  },
  watch: {
    isReset(val) {
      if (val) {
        this.updateSelectedCivs(this.spell);
      }
    },
    spell: {
      immediate: true,
      handler(newDisc) {
        this.updateSelectedCivs(newDisc);
      },
    },
  },
  methods: {
    updateSelectedCivs(spell) {
      this.selectedCivs = this.civList
        .filter(civ =>
          this.isBoon
            ? this.activeBoon?.civs.includes(civ.id)
            : civ.connect.includes(spell?.id)
        )
        .map(civ => civ.id);
    },
    castSpell() {
      if (
        (this.isActiveDisc &&
          this.gameAction('modifyDisc', this.spell.id, this.civChanges)) ||
        (this.activeBoon &&
          this.gameAction('modifyBoon', this.spell.id, this.civChanges)) ||
        (!this.isActiveDisc &&
          !this.activeBoon &&
          this.gameAction('castSpell', this.spell.id, this.selectedCivs))
      ) {
        this.$emit('savedChanges');
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
    margin: 0 -10px 40px;

    label {
      display: inline-block;
      margin: 10px;
      position: relative;
      cursor: pointer;
    }

    input {
      position: absolute;
      left: -9999em;
    }

    .icon {
      display: inline-block;
      width: 60px;
      height: 60px;
      background-size: cover;
      border: 3px solid #ccc;
      border-radius: 50px;
      box-shadow: $shadow2;
    }
    .title {
      position: absolute;
      bottom: -20px;
      left: 0;
      right: 0;
      text-align: center;
    }

    input:checked + .icon {
      border-color: $cBlue;
      & .title {
        color: $cBlue;
      }
    }

    .active input:checked + .icon {
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
