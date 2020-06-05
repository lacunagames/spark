<template>
  <div>
    <transition name="log">
      <div class="log" v-show="showLog">
        <button type="button" class="close" @click="showLog = false">
          <span class="access">Close modal</span>✕
        </button>
        <h2 class="h3">Turn {{ turn }}</h2>
        <ul>
          <li v-for="(item, index) in logItems" :key="index">
            <span v-if="item.icon" class="icon" :class="`icon-${item.icon}`"></span>
            <span class="text">{{ item.text }}</span>
          </li>
        </ul>
      </div>
    </transition>
    <div class="messages">
      <transition-group name="msg" tag="ul">
        <li v-for="msg in messages" :key="msg.id">
          <span :class="msg.type" @click.once="gameAction('clearMessage', msg.id)">{{ msg.text }}</span>
        </li>
        <li v-if="errorMessage" :key="errorMessage.id" class="system-error">
          <span
            class="error"
            @click.once="gameAction('clearMessage', errorMessage.id)"
          >{{ errorMessage.text }}</span>
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
    };
  },
  computed: {
    errorMessage() {
      return this.$store.getters.system.errorMessage;
    },
    messages() {
      return this.$store.getters.system.messages;
    },
    turn() {
      return this.$store.getters.world.turn;
    },
    logItems() {
      const log = this.$store.getters.world.log;
      return log[log.length - 1]?.items;
    },
  },
  watch: {
    turn() {
      this.showLog = this.logItems.length > 0;
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
  background-color: #eee8c5;
  border-radius: 3px;
  box-shadow: $shadow2;

  ul {
    margin: 0;
  }

  .close {
    position: absolute;
    top: 5px;
    right: 5px;
  }

  li {
    font-size: 16px;
    padding: 15px 0;
    position: relative;
  }

  .icon {
    position: absolute;
    width: 35px;
    height: 35px;
    border-radius: 3px;
    background-size: cover;
    top: 5px;
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
