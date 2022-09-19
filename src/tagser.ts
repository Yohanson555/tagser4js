import _ from "lodash";
import RootState, { iState } from "./states";
import { iMessage, ProcessMessage } from "./messages";
import { CHAR_EOS, TYPE_TAG, TYPE_TEXT } from "./const";
import { Tag, TagserContext, TagserResult } from "./sup";

class Tagser {
  private _stack: iState[] = [];
  private _line = 0; // template lining support
  private _symbol = 0;
  private options: { [key: string]: any } = {
    ignoreCase: false,
  };

  constructor(options: { [key: string]: any }) {
    this._stack = [];

    if (options) {
      this.options = { ...this.options, ...options };
    }
  }

  parse(source: string) {
    this._stack = [];
    this._stack.push(new RootState());

    let context = new TagserContext(this.options);

    if (source && typeof source === "string") {
      let lines = source.split("\n");

      for (var l = 0; l < lines.length; l++) {
        this._line = l + 1;
        let line = lines[l];

        for (var i = 0; i < line.length; i++) {
          this._symbol = i + 1;
          let charCode = line.charCodeAt(i);

          //console.log(`Pocessing char "${String.fromCharCode(charCode)}"; State - ${_.last(this._stack).getName()}`);

          context.line = this._line;
          context.symbol = this._symbol;

          this._process(new ProcessMessage(charCode), context);
        }
      }

      this._process(new ProcessMessage(CHAR_EOS), context);

      let state = _.last(this._stack);

      if (this._stack.length != 1 || !(state instanceof RootState)) {
        throw new Error("Source document malformed.");
      } else {
        return state.tags;
      }
    }

    return null;
  }

  _process(msg: iMessage, context: TagserContext) {
    let state = _.last(this._stack);

    if (state != null) {
      if (state.canAcceptMessage(msg)) {
        let res = state.handleMessage(msg, context);

        if (res != null) {
          this._processResult(res, context);
        }
      } else {
        throw new Error(
          `State ${state.getName()} can't accept message of type ${msg.getName()}`
        );
      }
    } else {
      throw new Error();
    }
  }

  _processResult(r: TagserResult, context: TagserContext) {
    // if (r.result) {
    //   this._res += r.result;
    // }

    if (r.pop == true) {
      this._pop();
    }

    if (r.state) {
      this._stack.push(r.state);
    }

    if (r.message) {
      this._process(r.message, context);
    }

    if (r.err) {
      let e = `Error (${r.err.code}) on ${this._line}:${this._symbol} ${r.err.text}`;

      //console.error(e);

      throw new Error(e);
    }
  }

  _pop() {
    this._stack.pop();
  }

  _currentLine() {
    return this._line + 1;
  }

  setOption(name: string, value: any) {
    this.options[name] = value;
  }

  html(tags: Tag[]) {
    let res = "";

    if (_.size(tags) > 0) {
      _.forEach(tags, (tag) => {
        if (tag.type() === TYPE_TAG) {
          res += `<${tag.name()}`;

          // attrs

          let attrs = tag.attributes();

          if (attrs && _.size(attrs) > 0) {
            res += _.map(attrs, (attr) => ` ${attr.name}="${attr.value}"`).join(
              ""
            );
          }

          res += ">";

          // childs

          let childs = tag.childs();

          if (childs && _.size(childs) > 0) {
            res += this.html(childs);
          }

          //end

          res += `</${tag.name()}>`;
        } else {
          res += tag.body();
        }
      });
    }

    return res;
  }
}

export default Tagser;
