<template>
  <div>
    <button class="log-toggle" title="Toggle logs" @click="showLog = !showLog">
      <span class="icon icon-log-list"></span>
    </button>
    <transition-group name="log" tag="div">
      <div class="log" :key="turn" v-if="showLog">
        <button type="button" class="close" @click="showLog = false">
          <span class="access">Close modal</span>✕
        </button>
        <h2 class="h3">Turn {{ turn }}</h2>
        <ul>
          <li v-if="logItems.length === 0">
            <a href="#" class="disabled">Nothing to report</a>
          </li>
          <li v-for="log in logItems" :key="log.index">
            <a
              href="#"
              @click.prevent="$emit('openLink', log)"
              :class="{ disabled: !log.link }"
            >
              <span v-if="log.icon" :class="`icon icon-${log.icon}`"></span>
              {{ log.text }}
            </a>
            <div
              class="button-wrap"
              v-if="log.buttonDiscs || log.buttonsRemoved"
            >
              <button
                v-for="btn in log.buttonDiscs"
                :key="btn.id"
                class="button-small"
                :disabled="!!btn.disabledText"
                :title="btn.disabledText || btn.desc"
                @click="clickLogButton(btn, log)"
              >
                <span class="mana">
                  <span
                    class="mana-circle-before"
                    :class="{ 'pre-charge': btn.manaCost.charge }"
                  ></span>
                  {{ btn.manaCost.mana }}
                  <span
                    class="mana-charge-circle-before"
                    v-if="btn.manaCost.charge"
                  ></span>
                  {{ btn.manaCost.charge || '' }}
                </span>
                {{ btn.title }}
              </button>
              <span class="completed checked-before" v-if="log.buttonsRemoved"
                >Completed</span
              >
            </div>
          </li>
        </ul>
      </div>
    </transition-group>
    <div class="messages">
      <transition-group name="msg" tag="ul">
        <li v-for="msg in messages" :key="msg.index">
          <span
            :class="msg.type"
            @click.once="gameAction('clearMessage', msg.index)"
            >{{ msg.text }}</span
          >
        </li>
        <li v-if="errorMessage" :key="errorMessage.index" class="system-error">
          <span
            class="error"
            @click.once="gameAction('clearMessage', errorMessage.index)"
            >{{ errorMessage.text }}</span
          >
        </li>
      </transition-group>
    </div>
    <div class="mouse-effects">
      <span
        v-for="floater in floaters"
        :class="{
          floater: true,
          [floater.type]: true,
          'mana-circle-before': floater.type === 'mana',
          'mana-charge-circle-before': floater.type === 'charge',
          'influence-circle-before': floater.type === 'influence',
        }"
        :key="floater.index"
        :style="{
          left: floater.x + 'px',
          top: floater.y - 20 + 'px',
        }"
      >
        {{ floater.value }}
        <span
          v-if="floater.civId"
          class="civ-icon icon"
          :class="{ [`icon-${floater.civId}`]: true }"
        ></span>
      </span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessagesUI',
  data() {
    return {
      showLog: true,
      validLogs: [],
    };
  },
  created() {
    this.unwatchLog = this.$watch('log', newLog => {
      this.validLogs = newLog[0].items.map(item => item.index);
      this.unwatchLog();
    });
  },
  computed: {
    errorMessage() {
      return this.$store.getters.system.errorMessage;
    },
    messages() {
      return this.$store.getters.system.messages;
    },
    log() {
      return this.$store.getters.world.log;
    },
    turn() {
      return this.$store.getters.world.turn;
    },
    floaters() {
      return this.$store.getters.system.floaters;
    },
    logItems() {
      return this.log[this.turn].items
        .filter(log => this.validLogs.includes(log.index))
        .map(log => {
          return {
            ...log,
            buttonDiscs: log.buttonDiscs?.map(disc => {
              const skill = this.$store.getters.spark.skills.find(
                skill => skill.id === disc.skill
              );
              return {
                ...disc,
                disabledText:
                  disc.skill && !skill.isActive
                    ? `Requires the ${skill.title} skill.`
                    : '',
                manaCost: this.gameAction('getManaCost', disc.id, log.civId),
              };
            }),
          };
        });
    },
  },
  watch: {
    turn(newTurn) {
      const newItems = this.$store.getters.world.log[newTurn].items;
      this.validLogs = newItems.map(item => item.index);
      this.showLog = newItems.length > 0 && !this.$store.getters.world.ending;
    },
  },
  methods: {
    clickLogButton(btn, log) {
      if (this.gameAction('castSpell', btn.id, log.civId)) {
        this.gameAction('turnLogStatic', log.index);
      }
    },
  },
};
</script>

<style lang="scss">
@keyframes float-away {
  from {
    transform: translate(0, 0);
    opacity: 0;
  }
  5% {
    opacity: 1;
  }
  60% {
    opacity: 1;
  }
  to {
    transform: translate(15px, -75px);
    opacity: 0;
  }
}
.mouse-effects {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
  font-size: 18px;
  text-shadow: -1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff,
    1px 1px 0 #fff;
  color: $cText;

  .floater {
    position: absolute;
    animation: float-away 2s linear;
    opacity: 0;
  }
  .mana-circle-before,
  .mana-charge-circle-before,
  .influence-circle-before {
    padding-left: 16px;
    &:before {
      position: absolute;
      left: -5px;
      top: 1px;
    }
  }
  .mana-charge-circle-before:before {
    left: -5px;
    top: 5px;
  }
  .influence-circle-before:before {
    left: -5px;
    top: 0;
  }
  .civ-icon {
    position: absolute;
    top: -4px;
    right: -29px;
    display: inline-block;
    width: 25px;
    height: 25px;
    border-radius: 30px;
  }
}
.log-toggle {
  position: absolute;
  bottom: 15px;
  left: 15px;
  padding: 0;
  border-radius: 2px;
  overflow: hidden;

  .icon {
    width: 45px;
    height: 45px;
    display: inline-block;
  }
}
.log {
  position: absolute;
  left: 15px;
  bottom: 15px;
  padding: 15px;
  background-color: $cBgLight;
  border-radius: 3px;
  box-shadow: $shadow2;
  width: 300px;

  ul {
    margin: 0 -15px -15px;
    border-top: 1px solid rgba($cText, 0.3);
  }

  .close {
    position: absolute;
    top: 5px;
    right: 5px;
  }

  li {
    &:not(:last-child) {
      border-bottom: 1px solid rgba($cText, 0.3);
    }
  }

  a {
    font-size: 16px;
    line-height: 16px;
    padding: 5px 15px 5px 60px;
    min-height: 55px;
    position: relative;
    display: flex;
    align-items: center;
    color: $cText;
    text-decoration: none;
    transition: background $animFast;

    &.disabled,
    &.disabled:hover {
      pointer-events: none;
    }

    &:hover {
      background-color: lighten($cBgLight, 5%);
    }
  }

  .button-wrap {
    text-align: right;
    padding: 5px 15px 7px 60px;

    .button-small {
      margin: 0 0 0 10px;
      font-size: 16px;
      height: 23px;
    }

    .mana-charge-circle-before {
      padding-left: 5px;
    }
  }
  .completed {
    font-size: 16px;
    color: $cGreen;
    height: 23px;
    line-height: 23px;
    display: inline-block;
    position: relative;
    &:before {
      position: absolute;
      left: -18px;
      top: -1px;
    }
  }
  .mana {
    position: relative;
    padding: 0 4px 0 15px;
    margin: -3px 3px -3px 0;
    border-right: 1px solid lighten($cText, 20%);
  }
  .mana-circle-before {
    position: absolute;
    left: -7px;
    top: 2px;
  }

  .icon {
    position: absolute;
    width: 35px;
    height: 35px;
    border-radius: 3px;
    background-size: cover;
    top: 10px;
    left: 15px;
  }

  .text {
    padding-left: 40px;
  }
}
.messages {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  text-align: center;
  z-index: 99;

  ul {
    position: absolute;
    bottom: 40px;
    left: 0;
    right: 0;
    pointer-events: none;
  }

  li,
  .system-error {
    text-align: center;
    margin-bottom: 5px;
    width: 100%;
  }
  .system-error {
    position: absolute;
    bottom: -30px;
  }

  span {
    display: inline-block;
    padding: 3px 8px;
    background: #272d25b6;
    font-size: 16px;
    color: #fff;
    cursor: pointer;
    pointer-events: all;

    &:hover {
      background: #424b3fb6;
    }
  }
  .error {
    color: lighten($cError, 20%);
  }
  .success {
    color: lighten($cSuccess, 20%);
  }
}

.log-enter-active,
.log-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;
}
.log-enter,
.log-leave-active {
  opacity: 0;
  transform: translateY(90px);
}
.log-leave-active {
  transform: translateY(-90px);
}

.msg-enter-active,
.msg-leave-active {
  transition: opacity 0.5s ease, transform 0.5s ease;

  span {
    pointer-events: none;
    cursor: default;
  }
}
.msg-move {
  transition: transform 0.5s;
}
.msg-enter,
.msg-leave-active {
  opacity: 0;
  transform: translate(90px, 0);
}
.msg-leave-active {
  // position: absolute;
  transform: translate(-90px, 0);
}
</style>
