import StateHandler from './statehandler';

const defaultState = {
  messages: [],
  errorMessage: undefined,
};

const messageTypes = {
  skillLearned: {
    type: 'success',
    msg: ({ title }) => `You have learnt ${title}.`,
  },
  sparkSpell: {
    type: 'success',
    msg: ({ title, civs }) => `You cast ${title} for ${civs}.`,
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
  noRaceSelected: {
    type: 'error',
    msg: () => `No race selected.`,
  },
  noCivChanges: {
    type: 'error',
    msg: () => `Nothing to save.`,
  },
  modifyDisc: {
    type: 'success',
    msg: ({ title }) => `${title} has been modified.`,
  },
  removeDisc: {
    type: 'success',
    msg: ({ title }) => `${title} has been removed.`,
  },
};

class System extends StateHandler {
  constructor(subsctibeState) {
    super(subsctibeState);

    this.state = {};
    this.setState(defaultState);
    this.initIndexes('msg');
  }

  showMessage({ type, ...args }) {
    const newMessage = {
      ...messageTypes[type],
      id: this.useIndex('msg'),
    };
    const isErr = newMessage.type === 'error';

    newMessage.text = newMessage.msg(args);
    newMessage.duration = newMessage.duration || isErr ? 3 : 9;
    if (isErr && this.state.errorMessage) {
      this.clearMessage(this.state.errorMessage.id);
    } else if (!isErr && this.state.messages.length > 2) {
      this.clearMessage(this.state.messages[0].id);
    }
    newMessage.timer = setTimeout(
      () => this.clearMessage(newMessage.id),
      newMessage.duration * 1000
    );
    this.setState({
      [isErr ? 'errorMessage' : 'messages']: isErr
        ? newMessage
        : [...this.state.messages, newMessage],
    });
  }

  clearMessage(id) {
    const message =
      this.state.errorMessage?.id === id
        ? this.state.errorMessage
        : this.state.messages.find(msg => msg.id === id);

    if (!message) return;
    this.clearIndex('msg', id);
    clearTimeout(message.timer);
    if (message.type === 'error') {
      this.setState({ errorMessage: undefined });
    } else {
      this._removeStateObj('messages', message.id);
    }
  }
}

export default System;
