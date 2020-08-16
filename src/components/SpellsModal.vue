<template>
  <Modal
    v-show="isModalOpen"
    @close="closeModal"
    classes="side-panel spell-modal"
  >
    <template #header>
      <h2>Spells</h2>
      <p class="mana-points">Mana: {{ spark.mana }} / {{ spark.maxMana }}</p>
    </template>
    <template #body>
      <ul class="spell-tabs" v-show="spellTabs.length > 2">
        <li
          v-for="tab in spellTabs"
          :key="tab.id"
          :class="{ selected: tab.id === selectedSpellTab }"
        >
          <a
            href="#"
            @click.prevent="selectSpellTab(tab.id)"
            :title="tab.title"
          >
            <span class="icon" :class="`icon-${tab.id}`"></span>
          </a>
        </li>
      </ul>
      <ul class="spell-list">
        <li
          v-for="spell in filteredSpells"
          :key="spell.id"
          :class="{
            selected: selectedSpell && spell.id === selectedSpell.id,
            active: spell.isActive,
          }"
        >
          <a href="#" @click.prevent="selectSpell(spell.id)">
            <span class="icon" :class="`icon-${spell.icon || spell.id}`"></span>
            <span class="title">{{ spell.title }}</span>
          </a>
        </li>
      </ul>
      <SpellDetails
        :isReset="isModalOpen"
        :spell="selectedSpell"
        @updateSpell="selectSpell"
      />
    </template>
  </Modal>
</template>

<script>
import Modal from '@/components/Modal';
import SpellDetails from '@/components/SpellDetails';

export default {
  name: 'SpellsModal',
  components: {
    Modal,
    SpellDetails,
  },
  data: function() {
    return {
      isModalOpen: false,
      selectedSpellTab: 'all-spells',
      selectedSpell: undefined,
    };
  },
  computed: {
    spark() {
      return this.$store.getters.spark;
    },
    spellTabs() {
      const tabs = [{ id: 'all-spells', title: 'All spells' }];

      this.$store.getters.spark.spells
        .filter(spell => spell.category)
        .forEach(spell => {
          if (!spell.isHidden && !tabs.find(tab => spell.category === tab.id)) {
            tabs.push({
              id: spell.category,
              title:
                spell.category.charAt(0).toUpperCase() +
                spell.category.slice(1),
            });
          }
        });
      return tabs;
    },
    filteredSpells() {
      return this.$store.getters.spark.spells
        .filter(spell => {
          const isActive = this.$store.getters.world.discs.find(
            disc => disc.id === spell.id
          );
          return (
            spell.category &&
            (this.selectedSpellTab === 'all-spells' ||
              spell.category === this.selectedSpellTab) &&
            !spell.isHidden &&
            (!spell.skillCreate ||
              this.$store.getters.spark.skills.find(
                skill => skill.id === spell.skillCreate
              ).isActive ||
              isActive) &&
            (((!spell.upgrades || isActive) &&
              !this.gameAction('getDiscUpgrade', spell.id)) ||
              ['knowledge', 'boon', 'spell'].includes(spell.type))
          );
        })
        .map(spell => ({
          ...spell,
          isActive: !!this.$store.getters.world.discs.find(
            disc => disc.id === spell.id
          ),
        }));
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
      this.selectedSpell = this.$store.getters.spark.spells.find(
        spell => spell.id === id
      );
    },
  },
};
</script>

<style lang="scss">
.spell-modal {
  .modal-body {
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

    .selected a {
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
      padding: 20px 10px;
      font-size: 18px;
      line-height: 18px;
      background-color: #eee8c5;
      transition: background-color $animFast;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;

      &:hover,
      &:focus {
        text-decoration: none;
        background-color: #ddd9c0;
      }
    }
    .selected a {
      background-color: #bab69e;
    }

    .icon {
      display: inline-block;
      width: 44px;
      height: 44px;
      border-radius: 4px;
      background-size: cover;
      margin: -15px 10px -17px 0;
      border: 2px solid #ccc;
      background-color: darken($cBg, 30%);
    }

    .active .icon {
      border-color: lighten($cGreen, 10%);

      + .title {
        color: $cGreen;
      }
    }
    .title {
      text-transform: capitalize;
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
