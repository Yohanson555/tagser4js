const TYPE_TAG = 'tag';
const TYPE_TEXT = 'text';

class Tag {
  constructor({
    name, type, body, line, symbol
  }) {
    this._name = name;
    this._type = type;
    this._body = body;
    this._line = line;
    this._symbol = symbol;
    this._attributes = {};
    this._childs = [];
  }

  addAttr(attr) {
    if (this._attributes == null) this._attributes = {};

    if (attr != null) {
      this._attributes[attr.name] = attr;
    }
  }

  addChild(child) {
    if (this._childs == null) this._childs = [];

    this._childs.push(child);
  }

  attrValue(name) {
    if (this._attributes[name]) {
      return this._attributes[name].value;
    }

    return null;
  }

  name() {
    return this._name;
  }

  type() {
    return this._type;
  }

  body() {
    return this._body;
  }

  line() {
    return this._line;
  }

  symbol() {
    return this._symbol - this._name.length - 1;
  }

  childs() {
    return this._childs || [];
  }

  attributes() {
    return this._attributes || {};
  }
}

class TagAttribute {
  constructor({ name, value }) {
    this.name = name;
    this.value = value;
  }
}

class TagserResult {
  constructor({ state, message, pop, err, result }) {
    this.state = state;
    this.pop = pop;
    this.err = err;
    this.result = result;
    this.message = message;
  }
}

class TagserError {
  constructor({ code, text }) {
    this.code = code;
    this.text = text;
  };
}

class TagserContext {
  constructor(options) {
    this.options = options;
    this.line = 0;
    this.symbol = 0;
  }

  getOption(name) {
    if (name && this.options[name]) {
      return this.options[name];
    }

    return null;
  }
}

module.exports = {
  Tag,
  TagserError,
  TagserResult,
  TagAttribute,
  TagserContext,

  TYPE_TAG,
  TYPE_TEXT
};