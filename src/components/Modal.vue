<template>
  <transition name="modal-fade" :duration="500">
    <div class="modal-wrap">
      <div class="modal-backdrop" @click.self="close"></div>
      <div class="modal" :class="classes" @keydown.esc="close">
        <header>
          <slot name="header">
            <h2>Modal</h2>
          </slot>
          <button type="button" class="close" @click="close">
            <span class="access">Close modal</span>✕
          </button>
        </header>

        <section class="body">
          <slot name="body"></slot>
        </section>

        <footer v-if="$slots.footer">
          <slot name="footer"></slot>
        </footer>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    classes: String,
  },
  data() {
    return {
      keyListener: undefined,
    };
  },
  mounted() {
    window.addEventListener('keyup', this.escListener);
  },
  destroyed() {
    window.removeEventListener('keyup', this.escListener);
  },
  methods: {
    close() {
      this.$emit('close');
    },
    escListener(e) {
      if (e.key === 'Escape') {
        this.close();
      }
    },
  },
};
</script>

<style lang="scss">
.modal-fade-enter,
.modal-fade-leave-active {
  .modal-backdrop,
  .modal {
    opacity: 0;
  }
  .side-panel {
    opacity: 1;
    transform: translateX(850px);
  }
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  .modal-backdrop,
  .modal {
    transition: opacity 500ms ease;
  }
  .side-panel {
    transition: transform 500ms ease;
  }
}

.modal-wrap {
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1;
  display: grid;
  align-items: center;
}

.modal-backdrop {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.3);
}

.modal {
  position: absolute;
  margin: 20px auto;
  background: #eee8c5;
  border-radius: 1px;
  box-shadow: 2px 2px 20px 1px;
  overflow-x: auto;
  position: relative;
  width: 500px;
  z-index: 2;

  header,
  footer {
    padding: 15px;
    display: flex;
  }
  header {
    border-bottom: 1px solid #c8c29b;
    color: #4aae9b;
    justify-content: space-between;
    padding-right: 70px;

    h1,
    h2,
    h3,
    .h1,
    .h2,
    .h3 {
      padding-top: 0;
      margin-bottom: 0;
    }
  }

  footer {
    border-top: 1px solid #c8c29b;
    justify-content: flex-end;
  }

  .body {
    position: relative;
    padding: 20px 10px;
  }

  .close {
    position: absolute;
    right: 5px;
    top: 5px;
    z-index: 1;
  }
}

.side-panel {
  width: 850px;
  height: 100%;
  margin: 0 0 0 auto;
  border-radius: 1px 0 0 1px;

  header {
    position: absolute;
    padding-top: 25px;
    width: 100%;
    z-index: 3;
    border-bottom: none;
    justify-content: flex-start;
    pointer-events: none;

    .close {
      right: 20px;
    }

    * {
      pointer-events: all;
    }
  }

  .body {
    height: 100%;
    overflow: auto;
  }
}
</style>
