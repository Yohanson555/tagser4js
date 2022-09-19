import _ from "lodash";

import {
  INIT_MESSAGE,
  NOTIFY_MESSAGE,
  PROCESS_MESSAGE,
  CHAR_BACK_SLASH,
  CHAR_SLASH,
  CHAR_SPACE,
  CHAR_OPEN_BRACKET,
  CHAR_CLOSE_BRACKET,
  CHAR_QUOTE,
  CHAR_SINGLE_QUOTE,
  CHAR_EQUAL,
  CHAR_EOS,
  NOTIFY_TAG_NAME_RESULT,
  NOTIFY_ATTR_RESULT,
  NOTIFY_CLOSE_BRACKET_FOUND,
  NOTIFY_TAG_RESULT,
  NOTIFY_CLOSE_TAG_FOUND,
  NOTIFY_ATTR_NAME_RESULT,
  NOTIFY_ATTR_VALUE_RESULT,
  NOTIFY_CLOSE_TAG,
  ERROR_WRONG_TAG_CHARACTER,
  ERROR_TAG_MALFORMED,
  ERROR_WRONG_CHARACTER_GIVEN,
  ERROR_SOURCE_DOCUMENT_MALFORMED,
  ERROR_WRONG_CLOSE_TAG,
  ERROR_ATTR_VALUE_MALFORMED,
  ERROR_UNEXPECTED_EOS,
  ERROR_END_OF_TAG,
  TYPE_TAG,
  TYPE_TEXT,
} from "./const";

import {
  iMessage,
  NotifyMessage,
  ProcessMessage,
  InitMessage,
} from "./messages";

import {
  Tag,
  TagAttribute,
  TagserResult,
  TagserError,
  TagserContext,
} from "./sup";

import { getError, isAvailableCharacter } from "./utils";

export interface iState {
  canAcceptMessage(msg: iMessage): boolean;

  getName(): string;

  init(msg: InitMessage, context: TagserContext): TagserResult | null;
  process(msg: ProcessMessage, context: TagserContext): TagserResult | null;
  notify(msg: NotifyMessage, context: TagserContext): TagserResult | null;

  handleMessage(msg: iMessage, context: TagserContext): TagserResult | null;
}

/// ROOT STATE

class RootState implements iState {
  public tags: Tag[];

  private _openedTag: Tag | null;
  private _text: string;
  private _escape: boolean;
  private _opened: boolean;

  constructor(tag?: Tag) {
    this.tags = [];
    this._openedTag = tag || null;
    this._text = "";
    this._escape = false;
    this._opened = false;
  }

  getName(): string {
    return "RootState";
  }

  canAcceptMessage(msg: iMessage): boolean {
    if (msg instanceof ProcessMessage || msg instanceof NotifyMessage) {
      return true;
    }

    return false;
  }

  handleMessage(msg: iMessage, context: TagserContext): TagserResult | null {
    switch (msg.getName()) {
      case PROCESS_MESSAGE:
        return this.process(msg as ProcessMessage, context);

      case NOTIFY_MESSAGE:
        return this.notify(msg as NotifyMessage, context);

      default:
        return null;
    }
  }

  process(msg: ProcessMessage, context: TagserContext): TagserResult | null {
    let charCode = msg.charCode;

    this._text = this._text || "";
    if (charCode == CHAR_EOS) {
      if (this._openedTag) {
        return new TagserResult({
          err: new TagserError(
            ERROR_END_OF_TAG,
            getError(ERROR_END_OF_TAG, {
              tag: this._openedTag.name(),
              line: this._openedTag.line(),
              symbol: this._openedTag.symbol(),
            })
          ),
        });
      }

      this._text = this._text.trim();

      if (this._text) {
        this.tags.push(
          new Tag("", TYPE_TEXT, this._text, context.line, context.symbol)
        );

        this._text = "";
      }
    } else if (this._opened === true) {
      this._opened = false;

      if (isAvailableCharacter(charCode)) {
        return new TagserResult({
          state: new TagState(),
          message: new InitMessage(undefined, charCode),
        });
      } else if (charCode == CHAR_SLASH) {
        if (this._openedTag) {
          return new TagserResult({
            state: new CloseTag(this._openedTag.name()),
            message: new InitMessage(undefined, charCode),
          });
        }

        return new TagserResult({
          err: new TagserError(
            ERROR_SOURCE_DOCUMENT_MALFORMED,
            getError(ERROR_SOURCE_DOCUMENT_MALFORMED)
          ),
        });
      } else {
        return new TagserResult({
          err: new TagserError(
            ERROR_TAG_MALFORMED,
            getError(ERROR_TAG_MALFORMED)
          ),
        });
      }
    } else if (this._escape == true) {
      this._text += String.fromCharCode(charCode);
    } else if (charCode == CHAR_BACK_SLASH) {
      this._escape = true;
    } else if (charCode == CHAR_OPEN_BRACKET) {
      this._opened = true;

      this._text = this._text.trim();

      if (this._text) {
        this.tags.push(
          new Tag("", TYPE_TEXT, this._text, context.line, context.symbol)
        );
        this._text = "";
      }
    } else {
      this._text += String.fromCharCode(charCode);
    }

    return null;
  }

  notify(msg: NotifyMessage, context: TagserContext): TagserResult | null {
    switch (msg.type) {
      case NOTIFY_TAG_RESULT:
        this.tags.push(msg.value);

        break;
      case NOTIFY_CLOSE_TAG_FOUND:
        return new TagserResult({
          pop: true,
          message: new NotifyMessage(msg.charCode, NOTIFY_CLOSE_TAG, this.tags),
        });
    }

    return null;
  }

  init(msg: InitMessage, context: TagserContext): TagserResult | null {
    throw new Error("Unsupported method");
  }
}

/// TAG STATE

class TagState implements iState {
  private _tag?: Tag;

  getName(): string {
    return "TagState";
  }

  canAcceptMessage(msg: iMessage): boolean {
    return true;
  }

  handleMessage(msg: iMessage, context: TagserContext): TagserResult | null {
    switch (msg.getName()) {
      case PROCESS_MESSAGE:
        return this.process(msg as ProcessMessage, context);

      case NOTIFY_MESSAGE:
        return this.notify(msg as NotifyMessage, context);

      default:
        return this.init(msg as InitMessage, context);
    }
  }

  init(msg: InitMessage, context: TagserContext): TagserResult | null {
    return new TagserResult({
      state: new TagNameState(),
      message: new ProcessMessage(msg.charCode),
    });
  }

  process(msg: ProcessMessage, context: TagserContext): TagserResult | null {
    let charCode = msg.charCode;

    if (charCode == CHAR_EOS) {
      return new TagserResult({
        err: new TagserError(
          ERROR_UNEXPECTED_EOS,
          getError(ERROR_UNEXPECTED_EOS)
        ),
      });
    } else if (isAvailableCharacter(charCode)) {
      return new TagserResult({
        state: new AttrState(),
        message: new InitMessage(undefined, charCode),
      });
    } else if (charCode == CHAR_SLASH) {
      return new TagserResult({
        state: new GetCloseBracket(),
      });
    } else if (charCode == CHAR_CLOSE_BRACKET) {
      return new TagserResult({
        state: new RootState(this._tag),
      });
    } else if (charCode == CHAR_SPACE) {
      return null;
    } else {
      return new TagserResult({
        err: new TagserError(
          ERROR_TAG_MALFORMED,
          getError(ERROR_TAG_MALFORMED)
        ),
      });
    }
  }

  notify(msg: NotifyMessage, context: TagserContext): TagserResult | null {
    switch (msg.type) {
      case NOTIFY_TAG_NAME_RESULT:
        let tagName = msg.value != null ? msg.value.toString() : null;

        this._tag = new Tag(
          tagName,
          TYPE_TAG,
          "",
          context.line,
          context.symbol
        );

        return new TagserResult({
          message: new ProcessMessage(msg.charCode),
        });

      /*
        return TagserResult(
          err: TagserError(
            code: ERROR_EMPTY_TAG_NAME,
            text: getError(ERROR_EMPTY_TAG_NAME, null),
          ),
        );
        */

      case NOTIFY_ATTR_RESULT:
        this._tag?.addAttr(msg.value);

        return new TagserResult({
          message: new ProcessMessage(msg.charCode),
        });

      case NOTIFY_CLOSE_BRACKET_FOUND:
        return new TagserResult({
          pop: true,
          message: new NotifyMessage(
            msg.charCode,
            NOTIFY_TAG_RESULT,
            this._tag
          ),
        });

      case NOTIFY_CLOSE_TAG:
        if (msg.value && _.isArray(msg.value)) {
          _.forEach(msg.value, (c) => {
            this._tag?.addChild(c);
          });
        }

        return new TagserResult({
          pop: true,
          message: new NotifyMessage(
            msg.charCode,
            NOTIFY_TAG_RESULT,
            this._tag
          ),
        });

      default:
        return null;
    }
  }
}

/// TAG NAME STATE

class TagNameState implements iState {
  private _name: string = "";

  getName(): string {
    return "TagNameState";
  }

  canAcceptMessage(msg: iMessage): boolean {
    if (msg instanceof ProcessMessage) {
      return true;
    }

    return false;
  }

  handleMessage(msg: iMessage, context: TagserContext): TagserResult | null {
    switch (msg.getName()) {
      case PROCESS_MESSAGE:
        return this.process(msg as ProcessMessage, context);

      default:
        return null;
    }
  }

  process(msg: ProcessMessage, context: TagserContext) {
    let charCode = msg.charCode;

    if (charCode == CHAR_EOS) {
      return new TagserResult({
        err: new TagserError(
          ERROR_UNEXPECTED_EOS,
          getError(ERROR_UNEXPECTED_EOS)
        ),
      });
    } else if (isAvailableCharacter(charCode)) {
      this._name += String.fromCharCode(charCode);
    } else if (
      charCode == CHAR_CLOSE_BRACKET ||
      charCode == CHAR_SPACE ||
      charCode == CHAR_SLASH
    ) {
      return new TagserResult({
        pop: true,
        message: new NotifyMessage(
          charCode,
          NOTIFY_TAG_NAME_RESULT,
          this._name
        ),
      });
    } else {
      return new TagserResult({
        err: new TagserError(
          ERROR_WRONG_TAG_CHARACTER,
          getError(ERROR_WRONG_TAG_CHARACTER, {
            char: String.fromCharCode(charCode),
          })
        ),
      });
    }

    return null;
  }

  notify(msg: NotifyMessage, context: TagserContext): TagserResult | null {
    throw new Error("Unsupported method");
  }

  init(msg: InitMessage, context: TagserContext): TagserResult | null {
    throw new Error("Unsupported method");
  }
}

/// CLOSE TAG STATE

class CloseTag implements iState {
  private _tagName: string;

  constructor(tagName: string) {
    this._tagName = tagName;
  }

  getName(): string {
    return "CloseTag";
  }

  handleMessage(msg: iMessage, context: TagserContext): TagserResult | null {
    switch (msg.getName()) {
      case PROCESS_MESSAGE:
        return this.process(msg as ProcessMessage, context);

      case NOTIFY_MESSAGE:
        return this.notify(msg as NotifyMessage, context);

      default:
        return this.init(msg as InitMessage, context);
    }
  }

  canAcceptMessage(msg: iMessage): boolean {
    return true;
  }

  init(msg: InitMessage, context: TagserContext): TagserResult | null {
    return new TagserResult({
      state: new TagNameState(),
    });
  }

  process(msg: ProcessMessage, context: TagserContext): TagserResult | null {
    let charCode = msg.charCode;

    switch (charCode) {
      case CHAR_EOS:
        return new TagserResult({
          err: new TagserError(
            ERROR_UNEXPECTED_EOS,
            getError(ERROR_UNEXPECTED_EOS)
          ),
        });

      case CHAR_SPACE:
        return null;

      case CHAR_CLOSE_BRACKET:
        return new TagserResult({
          pop: true,
          message: new NotifyMessage(msg.charCode, NOTIFY_CLOSE_TAG_FOUND),
        });

      default:
        return null;
    }
  }

  notify(msg: NotifyMessage, context: TagserContext): TagserResult | null {
    switch (msg.type) {
      case NOTIFY_TAG_NAME_RESULT:
        let source = this._tagName;
        let result = msg.value;

        if (context.getOption("ignoreCase") === true) {
          source = source.toLowerCase();
          result = result.toLowerCase();
        }

        if (source !== result) {
          return new TagserResult({
            err: new TagserError(
              ERROR_WRONG_CLOSE_TAG,
              getError(ERROR_WRONG_CLOSE_TAG, { tag: msg.value })
            ),
          });
        }

        return new TagserResult({
          message: new ProcessMessage(msg.charCode),
        });

      default:
        return null;
    }
  }
}

/// ATTR STATE

class AttrState implements iState {
  private _name: string = "";
  private _value: any;

  getName() {
    return "AttrState";
  }

  handleMessage(msg: iMessage, context: TagserContext): TagserResult | null {
    switch (msg.getName()) {
      case PROCESS_MESSAGE:
        return this.process(msg as ProcessMessage, context);

      case NOTIFY_MESSAGE:
        return this.notify(msg as NotifyMessage, context);

      default:
        return this.init(msg as InitMessage, context);
    }
  }

  canAcceptMessage(msg: iMessage): boolean {
    return true;
  }

  init(msg: InitMessage, context: TagserContext): TagserResult | null {
    return new TagserResult({
      state: new AttrNameState(),
      message: new ProcessMessage(msg.charCode),
    });
  }

  process(msg: ProcessMessage, context: TagserContext): TagserResult | null {
    let charCode = msg.charCode;

    if (charCode == CHAR_EOS) {
      return new TagserResult({
        err: new TagserError(
          ERROR_UNEXPECTED_EOS,
          getError(ERROR_UNEXPECTED_EOS)
        ),
      });
    } else if (charCode == CHAR_EQUAL) {
      return new TagserResult({
        state: new AttrValueState(),
      });
    }

    return new TagserResult({
      pop: true,
      message: new NotifyMessage(
        charCode,
        NOTIFY_ATTR_RESULT,
        new TagAttribute(
          this._name,
          this._value == null || this._value == undefined ? "true" : this._value
        )
      ),
    });
  }

  notify(msg: NotifyMessage, context: TagserContext): TagserResult | null {
    let charCode = msg.charCode;

    switch (msg.type) {
      case NOTIFY_ATTR_NAME_RESULT:
        let res = new TagserResult({});

        this._name = msg.value;
        res.message = new ProcessMessage(charCode);

        return res;
      case NOTIFY_ATTR_VALUE_RESULT:
        this._value = msg.value;

        return null;

      default:
        return null;
    }
  }
}

/// ATTR NAME STATE

class AttrNameState implements iState {
  private _name: string = "";

  getName() {
    return "AttrNameState";
  }

  canAcceptMessage(msg: iMessage): boolean {
    if (msg instanceof ProcessMessage) {
      return true;
    }

    return false;
  }

  handleMessage(msg: iMessage, context: TagserContext): TagserResult | null {
    switch (msg.getName()) {
      case PROCESS_MESSAGE:
        return this.process(msg as ProcessMessage, context);

      default:
        return null;
    }
  }

  process(msg: ProcessMessage, context: TagserContext): TagserResult | null {
    let charCode = msg.charCode;

    if (charCode == CHAR_EOS) {
      return new TagserResult({
        err: new TagserError(
          ERROR_UNEXPECTED_EOS,
          getError(ERROR_UNEXPECTED_EOS)
        ),
      });
    } else if (isAvailableCharacter(charCode)) {
      this._name += String.fromCharCode(charCode);
    } else {
      return new TagserResult({
        pop: true,
        message: new NotifyMessage(
          charCode,
          NOTIFY_ATTR_NAME_RESULT,
          this._name
        ),
      });
    }

    return null;
  }

  notify(msg: NotifyMessage, context: TagserContext): TagserResult | null {
    throw new Error("Unsupported method");
  }

  init(msg: InitMessage, context: TagserContext): TagserResult | null {
    throw new Error("Unsupported method");
  }
}

/// ATTR VALUE STATE

class AttrValueState implements iState {
  private _value: string = "";
  private _quote?: number;
  private isFirstChar = true;

  getName() {
    return "AttrValueState";
  }

  canAcceptMessage(msg: iMessage): boolean {
    if (msg instanceof ProcessMessage) {
      return true;
    }

    return false;
  }

  handleMessage(msg: iMessage, context: TagserContext): TagserResult | null {
    switch (msg.getName()) {
      case PROCESS_MESSAGE:
        return this.process(msg as ProcessMessage, context);

      default:
        return null;
    }
  }

  process(msg: ProcessMessage, context: TagserContext): TagserResult | null {
    let charCode = msg.charCode;

    if (charCode == CHAR_EOS) {
      return new TagserResult({
        err: new TagserError(
          ERROR_UNEXPECTED_EOS,
          getError(ERROR_UNEXPECTED_EOS)
        ),
      });
    } else if (this.isFirstChar) {
      this.isFirstChar = false;

      if (charCode == CHAR_QUOTE || charCode == CHAR_SINGLE_QUOTE) {
        this._quote = charCode;
      } else {
        return new TagserResult({
          err: new TagserError(
            ERROR_ATTR_VALUE_MALFORMED,
            getError(ERROR_ATTR_VALUE_MALFORMED, {})
          ),
        });
      }
    } else {
      if (charCode == this._quote) {
        return new TagserResult({
          pop: true,
          message: new NotifyMessage(
            charCode,
            NOTIFY_ATTR_VALUE_RESULT,
            this._value
          ),
        });
      } else {
        this._value += String.fromCharCode(charCode);
      }
    }

    return null;
  }

  notify(msg: NotifyMessage, context: TagserContext): TagserResult | null {
    throw new Error("Unsupported method");
  }

  init(msg: InitMessage, context: TagserContext): TagserResult | null {
    throw new Error("Unsupported method");
  }
}

/// GET CLOSE BRACKET STATE

class GetCloseBracket implements iState {
  getName() {
    return "GetCloseBracket";
  }

  canAcceptMessage(msg: iMessage): boolean {
    if (msg instanceof ProcessMessage) {
      return true;
    }

    return false;
  }

  handleMessage(msg: iMessage, context: TagserContext): TagserResult | null {
    switch (msg.getName()) {
      case PROCESS_MESSAGE:
        return this.process(msg as ProcessMessage, context);

      default:
        return null;
    }
  }

  process(msg: ProcessMessage, context: TagserContext): TagserResult | null {
    let charCode = msg.charCode;

    switch (charCode) {
      case CHAR_EOS:
        return new TagserResult({
          err: new TagserError(
            ERROR_UNEXPECTED_EOS,
            getError(ERROR_UNEXPECTED_EOS)
          ),
        });

      case CHAR_CLOSE_BRACKET:
        return new TagserResult({
          pop: true,
          message: new NotifyMessage(charCode, NOTIFY_CLOSE_BRACKET_FOUND),
        });

      default:
        return new TagserResult({
          err: new TagserError(
            ERROR_WRONG_CHARACTER_GIVEN,
            getError(ERROR_WRONG_CHARACTER_GIVEN, {
              char: String.fromCharCode(charCode),
              await: ">",
            })
          ),
        });
    }
  }

  init(msg: InitMessage, context: TagserContext): TagserResult | null {
    throw new Error("unsupported method");
  }

  notify(msg: NotifyMessage, context: TagserContext): TagserResult | null {
    throw new Error("unsupported method");
  }
}

/// GET SLASH STATE
/*
class GetSlash extends iState {
  GetCloseBracket() {
    methods = {
      'process': (msg) => process(msg),
    };
  }

  TagserResult process(ProcessMessage msg) {
    switch (msg.charCode) {
      case CHAR_SLASH:
        return TagserResult(
            pop: true,
            message: NotifyMessage(
              charCode: msg.charCode,
              type: NOTIFY_SLASH_FOUND,
            ));
      default:
        return TagserResult(
            err: TagserError(
                code: ERROR_WRONG_CHARACTER_GIVEN,
                text: getError(ERROR_WRONG_CHARACTER_GIVEN, {
                  'char': String.fromCharCode(msg.charCode),
                  'await': '/'
                })));
    }
  }
}
*/

export default RootState;
