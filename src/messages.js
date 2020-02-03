class InitMessage {
  constructor({ value, charCode }) {
    this.value = value;
    this.charCode = charCode;
  }

  getName() {
    return 'init';
  };
}

class ProcessMessage {
  constructor(charCode) {
    this.charCode = charCode;
  }

  getName() {
    return 'process';
  }
}

class NotifyMessage {
  constructor({ charCode, type, value }) {
    this.charCode = charCode;
    this.type = type;
    this.value = value;
  }

  getName() {
    return 'notify';
  }
}

module.exports = {
  InitMessage,
  ProcessMessage,
  NotifyMessage
}