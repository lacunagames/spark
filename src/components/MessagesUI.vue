<template>
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
</template>

<script>
export default {
  name: 'MessagesUI',
  computed: {
    errorMessage() {
      return this.$store.getters.system.errorMessage;
    },
    messages() {
      return this.$store.getters.system.messages;
    },
  },
};
</script>

<style lang="scss">
.messages {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  text-align: center;

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
