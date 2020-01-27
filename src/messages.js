class InitMessage {
  constructor({value, charCode}) {
    this.value = value;
    this.charCode = charCode;
  }

  getName = () => 'init';
}

class ProcessMessage {
  constructor(charCode) {
    this.charCode = charCode;
  }

  getName = () => 'process';
}

class NotifyMessage {
  constructor({charCode, type, value}) {
    this.charCode = charCode;
    this.type = type;
    this.value = value;
  }
  
  getName = () => 'notify';
}

module.exports = {
  InitMessage,
  ProcessMessage,
  NotifyMessage
}