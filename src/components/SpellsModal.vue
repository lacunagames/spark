<template>
  <Modal v-show="isModalOpen" @close="closeModal" classes="side-panel spell-modal">
    <template #header>
      <h2>Spells</h2>
      <p class="mana-points">Mana: {{ spark.mana }} / {{ spark.maxMana }}</p>
    </template>
    <template #body>
      <ul class="spell-tabs" v-show="spellTabs.length > 2">
        <li v-for="tab in spellTabs" :key="tab.id" :class="{active: tab.id === selectedSpellTab}">
          <a href="#" @click.prevent="selectSpellTab(tab.id)" :title="tab.title">
            <span class="icon" :class="`icon-${tab.id}`"></span>
          </a>
        </li>
      </ul>
      <ul class="spell-list">
        <li
          v-for="spell in filteredSpells"
          :key="spell.id"
          :class="{active: selectedSpell && spell.id === selectedSpell.id}"
        >
          <a href="#" @click.prevent="selectSpell(spell.id)">
            <span class="icon" :class="`icon-${spell.icon || spell.id}`"></span>
            <span class="title">{{ spell.title }}</span>
          </a>
        </li>
      </ul>
      <div class="spell-details" v-if="selectedSpell">
        <h2>
          <span :class="`icon icon-${ selectedSpell.icon || selectedSpell.id }`"></span>
          <span class="text">{{ selectedSpell.title }}</span>
        </h2>
        <p class="spell-desc">{{ selectedSpell.desc }}</p>
        <div class="civ-checks">
          <label v-for="civ in civList" :key="civ.id">
            <input type="checkbox" :value="civ.id" v-model="selectedCivs" />
            <span :class="`icon icon-${civ.id}`"></span>
            <span class="title">{{ civ.title }}</span>
          </label>
        </div>
        <p>Mana cost: {{ selectedSpell.mana * selectedCivs.length }}</p>
        <button class="primary" @click.prevent="castSpell">Create</button>
      </div>
    </template>
  </Modal>
</template>

<script>
import Modal from '@/components/Modal';

export default {
  name: 'SpellsModal',
  components: {
    Modal,
  },
  data: function() {
    return {
      isModalOpen: false,
      selectedSpellTab: 'all-spells',
      selectedSpell: undefined,
      selectedCivs: [],
    };
  },
  computed: {
    spark() {
      return this.$store.getters.spark;
    },
    civList() {
      return this.$store.getters.civs.civList;
    },
    spellTabs() {
      const tabs = [{ id: 'all-spells', title: 'All spells' }];

      this.$store.getters.spark.spells.forEach(spell => {
        if (!tabs.find(tab => spell.category === tab.id)) {
          tabs.push({
            id: spell.category,
            title:
              spell.category.charAt(0).toUpperCase() + spell.category.slice(1),
          });
        }
      });
      return tabs;
    },
    filteredSpells() {
      return this.$store.getters.spark.spells.filter(
        spell =>
          !this.$store.getters.world.discs.find(
            disc => disc.id === spell.createDisc || disc.id === spell.id
          ) &&
          (this.selectedSpellTab === 'all-spells' ||
            spell.category === this.selectedSpellTab)
      );
    },
  },
  watch: {
    filteredSpells: function(newSpells) {
      if (!newSpells.find(spell => spell.id === this.selectedSpell?.id)) {
        this.selectedSpell = newSpells[0];
      }
    },
  },
  methods: {
    openModal() {
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
    },
    selectSpellTab(id) {
      this.selectedSpellTab = id;
    },
    selectSpell(id) {
      this.selectedCivs = [];
      this.selectedSpell = this.filteredSpells.find(spell => spell.id === id);
    },
    castSpell() {
      if (
        this.gameAction('castSpell', this.selectedSpell.id, this.selectedCivs)
      ) {
        this.closeModal();
      }
    },
  },
};
</script>

<style lang="scss">
.spell-modal {
  .body {
    padding: 75px 0 0;
    display: grid;
    grid-template-columns: 250px auto;
    grid-template-rows: min-content auto;
    grid-template-areas:
      'tabs tabs'
      'list details';
  }

  .spell-tabs {
    grid-area: tabs;
    margin: 0;
    padding-left: 50px;
    border-bottom: 1px solid #8b8357;

    li {
      display: inline-block;
      margin: 0 10px -5px;
    }

    a {
      display: inline-block;
      border: 2px solid #eee8c5;
      border-radius: 1px;
      overflow: hidden;
      line-height: 0;

      span {
        display: inline-block;
        width: 40px;
        height: 40px;
        background-size: cover;
      }
    }

    .active a {
      border-color: #1a821f;
    }
  }
  .spell-list {
    grid-area: list;
    margin: 0;
    overflow: auto;

    a {
      display: block;
      color: $cText;
      padding: 10px;
      font-size: 18px;
      line-height: 14px;
      background-color: #eee8c5;
      transition: background-color $animFast;

      &:hover,
      &:focus {
        text-decoration: none;
        background-color: #ddd9c0;
      }
    }
    .active a {
      background-color: #bab69e;
    }

    .icon {
      display: inline-block;
      width: 40px;
      height: 40px;
      border-radius: 4px;
      background-size: cover;
      margin-right: 15px;
    }
    .title {
      position: relative;
      bottom: 15px;
      text-transform: capitalize;
    }
  }
  .spell-details {
    grid-area: details;
    background: #f9f6e4;
    padding: 20px;

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

    .spell-desc {
      font-size: 18px;
      margin-bottom: 40px;
    }
  }
  .civ-checks {
    margin-bottom: 60px;

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
    }
    .title {
      position: absolute;
      bottom: -20px;
      left: 0;
      right: 0;
      text-align: center;
    }

    input:checked + .icon {
      border-color: #1a821f;
    }

    input:checked + .icon + .title {
      color: #1a821f;
    }
  }
  .mana-points {
    margin: 0 50px;
    padding: 4px 8px;
    color: #fff;
    background-color: #5204a7;
  }
}
</style>
