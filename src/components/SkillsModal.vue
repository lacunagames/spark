<template>
  <Modal
    v-show="isModalOpen"
    @close="closeModal"
    classes="side-panel skills-modal"
  >
    <template #header>
      <h2>Powers</h2>
      <p class="skill-points" v-show="spark.skillPoints">
        You have {{ spark.skillPoints }} point{{
          spark.skillPoints === 1 ? '' : 's'
        }}
        left
      </p>
    </template>
    <template #body>
      <ul class="skill-tree">
        <li class="connections">
          <svg viewBox="0 0 100 100">
            <line
              v-for="(conn, index) in skillConnections"
              :class="{
                active: conn.isActive,
                filled: conn.isFilled,
                disabled: conn.isDisabled,
              }"
              :key="index"
              :x1="conn.x1"
              :y1="conn.y1"
              :x2="conn.x2"
              :y2="conn.y2"
              stroke-width="0.3"
            />
          </svg>
        </li>
        <li
          v-for="skill in skills"
          :key="skill.id"
          :style="{ left: `${skill.pos[0]}%`, top: `${skill.pos[1]}%` }"
        >
          <button
            :title="skill.title"
            @click.prevent="gameCall('learnSkill', skill.id)"
            :class="{
              active: skill.isActive,
              minor: skill.minor,
              disabled: skill.isDisabled,
            }"
            :disabled="false"
          >
            <span :class="[`icon icon-${skill.icon || skill.id}`]"></span>
          </button>
        </li>
      </ul>
    </template>
  </Modal>
</template>

<script>
import Modal from '@/components/Modal';

export default {
  name: 'SparkUI',
  components: {
    Modal,
  },
  data: function() {
    return {
      isModalOpen: false,
    };
  },
  computed: {
    spark() {
      return this.$store.getters.spark;
    },
    skills() {
      return this.$store.getters.spark.skills.filter(skill => !skill.isHidden);
    },
    skillConnections() {
      const skillConnections = [];

      this.skills.forEach(skill => {
        skill.connect?.forEach(otherName => {
          const otherSkill = this.skills.find(skill => skill.id === otherName);

          skillConnections.push({
            x1: skill.pos[0],
            y1: skill.pos[1],
            x2: otherSkill.pos[0],
            y2: otherSkill.pos[1],
            isActive: skill.isActive && otherSkill.isActive,
            isDisabled: skill.isDisabled || otherSkill.isDisabled,
          });
        });

        skill.requires?.forEach(otherName => {
          const otherSkill = this.skills.find(skill => skill.id === otherName);

          skillConnections.push({
            x1: skill.pos[0],
            y1: skill.pos[1],
            x2: otherSkill.pos[0],
            y2: otherSkill.pos[1],
            isActive: skill.isActive,
            isFilled: otherSkill.isActive,
            isDisabled: !otherSkill.isActive,
          });
        });
      });
      return skillConnections;
    },
  },
  methods: {
    openModal() {
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
    },
  },
};
</script>

<style lang="scss">
.skills-modal {
  .skill-points {
    margin: 0 50px;
    padding: 4px 8px;
    color: #fff;
    background-color: #1a821f;
  }

  .skill-tree {
    position: relative;
    width: 750px;
    height: 750px;
    margin: 100px 30px 40px;

    li {
      position: absolute;
    }

    .connections {
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;

      svg {
        width: 100%;
        height: 100%;
      }
      line {
        transition: stroke $animFast;
        stroke: #222;

        &.filled {
          stroke: #0d5cff;
        }
        &.active {
          stroke: #25d625;
        }
        &.disabled {
          stroke: #aaa;
        }
      }
    }

    button {
      font: $font;
      width: 40px;
      height: 40px;
      padding: 0;
      margin: 0;
      position: relative;
      left: -20px;
      top: -20px;
      font-size: 1px;
      z-index: 2;
      background: none;
      box-shadow: none;

      span {
        background-size: cover;
        display: block;
        height: 100%;
        transition: filter $animFast;
        transition: border-color $animFast, filter $animFast;
        border: 2px solid #555;
        border-radius: 10px;
        box-shadow: $shadow1;
        filter: grayscale(0);
      }
      &.minor {
        width: 30px;
        height: 30px;
        margin: 5px 0 0 5px;

        span {
          border-radius: 30px;
        }
      }
      &.active span {
        border-color: #25d625;
      }
      &.disabled span {
        filter: grayscale(0.8);
      }
    }
  }
}
</style>
