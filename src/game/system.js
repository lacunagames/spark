import StateHandler from './statehandler';

const defaultState = {
  messages: [],
  errorMessage: undefined,
};

const messageTypes = {
  skillLearned: {
    type: 'success',
    msg: ({ title }) => `You have learnt ${title}.`,
    duration: 10,
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
    newMessage.duration = newMessage.duration || 3;
    if (isErr && this.state.errorMessage)
      this.clearMessage(this.state.errorMessage.id);
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
