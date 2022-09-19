import { iMessage } from "./messages";
import { iState } from "./states";

export class Tag {
  private _name: string;
  private _type: string;
  private _body: string;
  private _line: number;
  private _symbol: number;
  private _attributes: { [key: string]: TagAttribute };
  private _childs: Tag[];

  constructor(
    name: string,
    type: string,
    body: string,
    line: number,
    symbol: number
  ) {
    this._name = name;
    this._type = type;
    this._body = body;
    this._line = line;
    this._symbol = symbol;
    this._attributes = {};
    this._childs = [];
  }

  addAttr(attr: TagAttribute) {
    if (this._attributes == null) this._attributes = {};

    if (attr != null) {
      this._attributes[attr.name] = attr;
    }
  }

  addChild(child: Tag) {
    if (this._childs == null) {
      this._childs = [];
    }

    this._childs.push(child);
  }

  attrValue(name: string) {
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

export class TagAttribute {
  constructor(readonly name: string, readonly value: any) {}
}

export class TagserResult {
  public state?: iState;
  public message?: iMessage;
  public pop?: boolean;
  public err?: TagserError;
  //public result?: TagserResult;

  constructor(props: {
    state?: iState;
    message?: iMessage;
    pop?: boolean;
    err?: TagserError;
    //result?: TagserResult;
  }) {
    this.state = props.state;
    this.message = props.message;
    this.pop = props.pop;
    this.err = props.err;
    //this.result = props.result;
  }
}

export class TagserError {
  constructor(readonly code: number, readonly text: string) {}
}

export class TagserContext {
  public options: { [key: string]: any };
  public line: number;
  public symbol: number;

  constructor(options: { [key: string]: any }) {
    this.options = options;
    this.line = 0;
    this.symbol = 0;
  }

  getOption(name: string) {
    if (name && name in this.options) {
      return this.options[name];
    }

    return null;
  }
}
