<template>
  <transition name="modal-fade" :duration="500">
    <div class="modal-wrap" @click.self="close">
      <div class="modal-backdrop"></div>
      <div class="modal" :class="classes" @keydown.esc="close">
        <header class="modal-header">
          <slot name="header">
            <h2>Modal</h2>
          </slot>
          <button type="button" class="close" @click="close">
            <span class="access">Close modal</span>✕
          </button>
        </header>

        <section class="modal-body">
          <slot name="body"></slot>
        </section>

        <footer class="modal-footer" v-if="$slots.footer">
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
    transition: opacity 300ms ease;
  }
  .side-panel {
    transition: transform 500ms ease;
  }
}

.modal-wrap {
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  overflow-x: hidden;
  overflow-y: auto;
  width: 100%;
  height: 100%;
}
.modal-backdrop {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  background: rgba(0, 0, 0, 0.5);
}

.modal {
  margin: 40px;
  background: #eee8c5;
  border-radius: 1px;
  box-shadow: 2px 2px 20px 1px;
  position: relative;
  width: 540px;
  z-index: 2;

  .modal-header,
  .modal-footer {
    padding: 15px;
    display: flex;
  }
  .modal-header {
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

  .modal-body {
    position: relative;
    padding: 20px 10px;
  }

  .close {
    position: absolute;
    right: 5px;
    top: 5px;
    z-index: 1;
    &:hover {
      background: #fff;
    }
  }
}

.side-panel {
  width: 850px;
  height: 100%;
  max-height: 100%;
  margin: 0 0 0 auto;
  border-radius: 1px 0 0 1px;

  .modal-header {
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

  .modal-body {
    height: 100%;
    overflow: auto;
  }
}
</style>
