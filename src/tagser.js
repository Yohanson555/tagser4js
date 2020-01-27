const _ = require('lodash');
const RootState = require('./states');
const { ProcessMessage } = require('./messages');
const { CHAR_EOS } = require('./const');

class Tagser {
  constructor() {
    this._stack = [];
    this._line = 0; // template lining support
    this._symbol = 0;

    this.currentLine = () => this._line + 1;
  }

  parse(source) {
    this._stack = [];
    this._stack.push(new RootState(null));

    if (source && typeof source === 'string') {
      let lines = source.split('\n');

      for (var l = 0; l < lines.length; l++) {
        this._line = l;
        let line = lines[l];

        for (var i = 0; i < line.length; i++) {
          this._symbol = i;
          let charCode = line.charCodeAt(i);

          //console.log(`Pocessing char "${String.fromCharCode(charCode)}"; State - ${_.last(this._stack).getName()}`);

          this._process(new ProcessMessage(charCode));
        }
      }

      this._process(new ProcessMessage(CHAR_EOS));

      let state = _.last(this._stack);

      if (this._stack.length != 1 || !(state instanceof RootState)) {
        throw new Error('Source document malformed.');
      } else {
        return state.tags;
      }
    }

    return null;
  }

  _process(msg) {
    let state = _.last(this._stack)

    if (state != null && state.canAcceptMessage(msg)) {
      let res = state[msg.getName()](msg);

      if (res != null) {
        this._processResult(res);
      }
    } else {
      throw new Error(`State ${state.getName()} cant accept message of type ${msg.getName()}`);
    }
  }

  _processResult(r) {
    if (r.result) {
      this._res += r.result;
    }

    if (r.pop == true) {
      this._pop();
    }

    if (r.state) {
      this._stack.push(r.state);
    }

    if (r.message) {
      this._process(r.message);
    }

    if (r.err) {
      let e = `Error (${r.err.code}) on ${this._currentLine()}:${this._symbol} ${r.err.text}`;

      console.error(e);

      throw new Error(e);
    }
  }

  _pop() {
    this._stack.pop();
  }

  _currentLine() {
    return this._line + 1;
  }

}

module.exports = Tagser;