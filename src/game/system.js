import StateHandler from './statehandler';

const defaultState = {
  messages: [],
  errorMessage: undefined,
  muteMessages: true,
  isSparkTurn: false,
  floaters: [],
  clickPos: { x: 100, y: 100 },
};

const messageTypes = {
  default: {
    type: 'success',
    msg: ({ text }) => text,
  },
  skillLearned: {
    type: 'success',
    msg: ({ title }) => `You have learnt ${title}.`,
  },
  skillAlreadyLearnt: {
    type: 'error',
    msg: ({ title }) => `${title} is already learnt.`,
  },
  skillDisabled: {
    type: 'error',
    msg: ({ title }) => `${title} is not yet available.`,
  },
  notEnoughSkillPoints: {
    type: 'error',
    msg: () => `Not enough skill points.`,
  },
  notEnoughMana: {
    type: 'error',
    msg: () => `Not enough mana.`,
  },
  notEnoughManaCharge: {
    type: 'error',
    msg: () => `Not enough mana charges.`,
  },
  notEnoughInfluence: {
    type: 'error',
    msg: () => `Not enough influence.`,
  },
  noRaceSelected: {
    type: 'error',
    msg: () => `No race selected.`,
  },
  noCivChanges: {
    type: 'error',
    msg: () => `Nothing to save.`,
  },
};

class System extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
    this.initIndexes('msg', 'floater');
    this.floaterQueue = [];
    this.floaterTimer;
    this.floating = false;
  }

  showMessage({ type, ...args }) {
    if (this.state.muteMessages) {
      return;
    }
    const newMessage = {
      ...(messageTypes[type] || messageTypes.default),
      index: this.useIndex('msg'),
    };
    const isErr = newMessage.type === 'error';

    newMessage.text = newMessage.msg(args);
    newMessage.duration = newMessage.duration || isErr ? 3 : 6;
    if (isErr && this.state.errorMessage) {
      this.clearMessage(this.state.errorMessage.index);
    } else if (!isErr && this.state.messages.length > 2) {
      this.clearMessage(this.state.messages[0].index);
    }
    newMessage.timer = setTimeout(
      () => this.clearMessage(newMessage.index),
      newMessage.duration * 1000
    );
    this.setState({
      [isErr ? 'errorMessage' : 'messages']: isErr
        ? newMessage
        : [...this.state.messages, newMessage],
    });
  }

  clearMessage(index) {
    const message =
      this.state.errorMessage?.index === index
        ? this.state.errorMessage
        : this.state.messages.find(msg => msg.index === index);

    if (!message) return;
    this.clearIndex('msg', index);
    clearTimeout(message.timer);
    if (message.type === 'error') {
      this.setState({ errorMessage: undefined });
    } else {
      this._removeStateObj('messages', message.index);
    }
  }

  setClickPos(x, y) {
    this.setState({ clickPos: { x, y } });
  }

  showFloater(type, value, civId) {
    const isPercent = ['influence'].includes(type);
    const floatNext = () => {
      this.floating = this.floaterQueue.length > 0;

      if (!this.floating) {
        clearInterval(this.floaterTimer);
        return;
      }
      const index = this.useIndex('floater');
      this.setState({
        floaters: [
          ...this.state.floaters,
          {
            index,
            ...this.floaterQueue[0],
            timer: setTimeout(() => {
              this.clearIndex('floater', index);
              this._removeStateObj('floaters', index);
            }, 2000),
          },
        ],
      });
      this.floaterQueue.shift();
    };
    setTimeout(() => {
      this.floaterQueue.push({
        type,
        value: `+${value}${isPercent ? '%' : ''} ${type}`,
        civId,
        ...this.state.clickPos,
      });
      if (!this.floating) {
        floatNext();
        this.floaterTimer = setInterval(floatNext, 450);
      }
    }, 0);
  }
}

export default System;
