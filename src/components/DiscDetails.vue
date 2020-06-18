<template>
  <div class="disc-details" v-if="disc">
    <h2>
      <span :class="`icon icon-${disc.icon || disc.id}`"></span>
      <span class="text">{{ disc.title }}</span>
    </h2>
    <p class="disc-desc">{{ disc.desc }}</p>
    <p class="active-spell" v-if="isSpell && isActiveDisc">This effect is currently active.</p>
    <div class="civ-checks">
      <label
        v-for="civ in civList"
        v-show="isSpell || isActiveDisc || (!isActiveDisc && selectedCivs.includes(civ.id))"
        :key="civ.id"
        :class="{
          active: civ.connect.includes(disc.id),
          disabled:
            (!isSpell && !isActiveDisc) ||
            civ.discDisabledBy ||
            civ.discUpgradedBy,
        }"
        :title="
          `${
            civ.discDisabledBy
              ? 'Disabled by ' + civ.discDisabledBy.title
              : civ.discUpgradedBy
              ? 'Upgraded by ' + civ.discUpgradedBy.title
              : ''
          }`
        "
      >
        <input
          type="checkbox"
          :value="civ.id"
          :disabled="!isSpell && !isActiveDisc || civ.discDisabledBy || civ.discUpgradedBy"
          v-model="selectedCivs"
        />
        <span :class="`icon icon-${civ.id}`"></span>
        <span class="title">{{ civ.title }}</span>
      </label>
    </div>
    <p class="changes" v-if="civChanges.length && isActiveDisc">
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
    >{{isActiveDisc ? isRemove ? 'Remove' : 'Modify' : 'Create'}}</button>
  </div>
</template>

<script>
export default {
  name: 'DiscDetails',
  props: {
    disc: Object,
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
      return this.$store.getters.civs.civList.map(civ => ({
        ...civ,
        discUpgradedBy: this.$store.getters.world.discs.find(disc =>
          civ.connect.find(
            conn => conn === disc.id && disc.upgrades?.includes(this.disc?.id)
          )
        ),
        discDisabledBy: this.$store.getters.world.discs.find(disc =>
          civ.connect.find(
            conn => conn === disc.id && disc.disables?.includes(this.disc?.id)
          )
        ),
      }));
    },
    isActiveDisc() {
      return (
        this.disc &&
        this.$store.getters.world.discs.find(
          discFind => discFind.id === this.disc.id
        ) &&
        this.$store.getters.spark.skills.find(
          skill => skill.id === this.disc.skill
        )?.isActive
      );
    },
    isRemove() {
      return this.isActiveDisc && this.selectedCivs.length === 0;
    },
    civChanges() {
      if (this.isActiveDisc) {
        return this.civList
          .filter(civ => {
            return (
              civ.connect.includes(this.disc.id) !==
              this.selectedCivs.includes(civ.id)
            );
          })
          .map(civ => ({
            type: civ.connect.includes(this.disc.id) ? 'disconnect' : 'connect',
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
        disc: this.disc,
        isActive: this.isActiveDisc,
        civChanges: this.civChanges,
      });
    },
  },
  watch: {
    isReset(val) {
      if (val) {
        this.updateSelectedCivs(this.disc);
      }
    },
    disc: {
      immediate: true,
      handler(newDisc) {
        this.updateSelectedCivs(newDisc);
      },
    },
  },
  methods: {
    updateSelectedCivs(disc) {
      this.selectedCivs = this.civList
        .filter(civ => civ.connect.includes(disc?.id))
        .map(civ => civ.id);
    },
    castSpell() {
      if (
        (this.isActiveDisc &&
          this.gameAction('modifyDisc', this.disc.id, this.civChanges)) ||
        (!this.isActiveDisc &&
          this.gameAction('castSpell', this.disc.id, this.selectedCivs))
      ) {
        this.$emit('savedChanges');
      }
    },
  },
};
</script>

<style lang="scss">
.disc-details {
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
  .disc-desc {
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
