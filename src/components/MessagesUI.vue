<template>
  <div>
    <transition-group name="log" tag="div">
      <div class="log" :key="turn" v-if="showLog">
        <button type="button" class="close" @click="showLog = false">
          <span class="access">Close modal</span>✕
        </button>
        <h2 class="h3">Turn {{ turn }}</h2>
        <ul>
          <li v-for="item in logItems" :key="item.index">
            <a
              href="#"
              @click.prevent="$emit('openLink', item)"
              :class="{ disabled: !item.link }"
            >
              <span v-if="item.icon" :class="`icon icon-${item.icon}`"></span>
              {{ item.text }}
            </a>
          </li>
        </ul>
      </div>
    </transition-group>
    <div class="messages">
      <transition-group name="msg" tag="ul">
        <li v-for="msg in messages" :key="msg.id">
          <span
            :class="msg.type"
            @click.once="gameAction('clearMessage', msg.id)"
            >{{ msg.text }}</span
          >
        </li>
        <li v-if="errorMessage" :key="errorMessage.id" class="system-error">
          <span
            class="error"
            @click.once="gameAction('clearMessage', errorMessage.id)"
            >{{ errorMessage.text }}</span
          >
        </li>
      </transition-group>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MessagesUI',
  data() {
    return {
      showLog: true,
      logItems: [],
    };
  },
  created() {
    this.unwatchLog = this.$watch('log', newLog => {
      this.logItems = newLog[0].items;
      setTimeout(this.unwatchLog, 0);
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
  },
  watch: {
    turn(newTurn) {
      this.logItems = this.$store.getters.world.log[newTurn]?.items;
      this.showLog =
        this.logItems.length > 0 && !this.$store.getters.world.ending;
    },
  },
};
</script>

<style lang="scss">
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
    height: 55px;
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
  z-index: 9999;

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
