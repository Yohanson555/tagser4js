const _ = require('lodash');
const {
  CHAR_BACK_SLASH,
  CHAR_SLASH,
  CHAR_ENTER,
  CHAR_SPACE,
  CHAR_OPEN_BRACKET,
  CHAR_CLOSE_BRACKET,
  CHAR_UNDERSCORE,
  CHAR_QUOTE,
  CHAR_SINGLE_QUOTE,
  CHAR_EQUAL,
  CHAR_EXCL_MARK,
  CHAR_EOS,
  NOTIFY_TAG_NAME_RESULT,
  NOTIFY_ATTR_RESULT,
  NOTIFY_CLOSE_BRACKET_FOUND,
  NOTIFY_TAG_RESULT,
  NOTIFY_SLASH_FOUND,
  NOTIFY_CLOSE_TAG_FOUND,
  NOTIFY_ATTR_NAME_RESULT,
  NOTIFY_ATTR_VALUE_RESULT,
  NOTIFY_CLOSE_TAG,
  ERROR_WRONG_TAG_CHARACTER,
  ERROR_EMPTY_TAG_NAME,
  ERROR_TAG_MALFORMED,
  ERROR_WRONG_CHARACTER_GIVEN,
  ERROR_SOURCE_DOCUMENT_MALFORMED,
  ERROR_WRONG_CLOSE_TAG,
  ERROR_ATTR_NAME_EMPTY,
  ERROR_ATTR_VALUE_EMPTY,
  ERROR_ATTR_VALUE_MALFORMED,
  getError } = require('./const');

const { NotifyMessage, ProcessMessage, InitMessage } = require('./messages');
const { Tag, TagAttribute, TagserResult, TagserError, TYPE_TAG, TYPE_TEXT } = require('./sup');
const { isAvailableCharacter } = require('./utils');

class TagserState {
  canAcceptMessage(msg) {
    let messageName = msg.getName();

    return typeof this[messageName] === 'function';
  }
}

/// ROOT STATE

class RootState extends TagserState {
  constructor(tagName) {
    super();
    this.tags = [];
    this._openedTag = tagName;
    this._text;
    this._escape;
    this._opened;
  }

  getName = () => 'RootState';

  process(msg) {
    let charCode = msg.charCode;

    this._text = this._text || '';

    if (this._opened == true) {
      this._opened = false;

      if (isAvailableCharacter(charCode)) {
        return new TagserResult({
          state: new TagState(),
          message: new InitMessage({ charCode }),
        });
      } else if (charCode == CHAR_SLASH) {
        if (this._openedTag) {
          return new TagserResult({
            state: new CloseTag(this._openedTag),
            message: new InitMessage({ charCode }),
          });
        }

        return new TagserResult({
          err: new TagserError({
            code: ERROR_SOURCE_DOCUMENT_MALFORMED,
            text: getError(ERROR_SOURCE_DOCUMENT_MALFORMED, null)
          })
        });
      } else {
        return new TagserResult({
          err: new TagserError({
            code: ERROR_TAG_MALFORMED,
            text: getError(ERROR_TAG_MALFORMED, null)
          })
        });
      }
    } else if (charCode == CHAR_EOS) {
      this._text = this._text.trim();

      if (this._text) {
        this.tags.push(new Tag('', TYPE_TEXT, this._text));
        this._text = '';
      }
    } else if (this._escape == true) {
      this._text += String.fromCharCode(charCode);
    } else if (charCode == CHAR_BACK_SLASH) {
      this._escape = true;
    } else if (charCode == CHAR_OPEN_BRACKET) {
      this._opened = true;

      this._text = this._text.trim();

      if (this._text) {
        this.tags.push(new Tag('', TYPE_TEXT, this._text));
        this._text = '';
      }
    } else {
      this._text += String.fromCharCode(charCode);
    }

    return null;
  }

  notify(msg) {
    switch (msg.type) {
      case NOTIFY_TAG_RESULT:
        this.tags.push(msg.value);

        break;
      case NOTIFY_CLOSE_TAG_FOUND:
        return new TagserResult({
          pop: true,
          message: new NotifyMessage({
            charCode: msg.charCode,
            value: this.tags,
            type: NOTIFY_CLOSE_TAG,
          }),
        });
      default:
        return null;
    }

    return null;
  }
}

/// TAG STATE

class TagState extends TagserState {
  constructor() {
    super();
    this._tag = null;
  }

  getName = () => 'TagState';

  init(msg) {
    return new TagserResult({
      state: new TagNameState(),
      message: new ProcessMessage(msg.charCode),
    });
  }

  process(msg) {
    let charCode = msg.charCode;

    if (isAvailableCharacter(charCode)) {
      return new TagserResult({
        state: new AttrState(),
        message: new InitMessage({ charCode }),
      });
    } else if (charCode == CHAR_SLASH) {
      return new TagserResult({
        state: new GetCloseBracket(),
      });
    } else if (charCode == CHAR_CLOSE_BRACKET) {
      return new TagserResult({
        state: new RootState(this._tag.name()),
      });
    } else if (charCode == CHAR_SPACE) {
      return null;
    } else {
      return new TagserResult({
        err: new TagserError({
          code: ERROR_TAG_MALFORMED,
          text: getError(ERROR_TAG_MALFORMED, null)
        }),
      });
    }
  }

  notify(msg) {
    switch (msg.type) {
      case NOTIFY_TAG_NAME_RESULT:
        let tagName = msg.value != null ? msg.value.toString() : null;

        this._tag = new Tag(tagName, TYPE_TAG);
        return new TagserResult({
          message: new ProcessMessage(
            msg.charCode,
          ),
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
        this._tag.addAttr(msg.value);
        return new TagserResult({
          message: new ProcessMessage(msg.charCode),
        });

      case NOTIFY_CLOSE_BRACKET_FOUND:
        return new TagserResult({
          pop: true,
          message: new NotifyMessage({
            type: NOTIFY_TAG_RESULT,
            value: this._tag,
          }),
        });

      case NOTIFY_CLOSE_TAG:
        if (msg.value && _.isArray(msg.value)) {
          _.forEach(msg.value, (c) => {
            this._tag.addChild(c);
          });
        }

        return new TagserResult({
          pop: true,
          message: new NotifyMessage({
            type: NOTIFY_TAG_RESULT,
            value: this._tag,
          }),
        });
      default:
        return null;
    }
  }
}

/// TAG NAME STATE

class TagNameState extends TagserState {
  constructor() {
    super();
    this._name = '';
  }

  getName = () => 'TagNameState';

  process(msg) {
    let charCode = msg.charCode;

    if (isAvailableCharacter(charCode)) {
      this._name += String.fromCharCode(charCode);
    } else if (charCode == CHAR_CLOSE_BRACKET ||
      charCode == CHAR_SPACE ||
      charCode == CHAR_SLASH) {
      return new TagserResult({
        pop: true,
        message: new NotifyMessage({
          value: this._name,
          charCode: charCode,
          type: NOTIFY_TAG_NAME_RESULT,
        }),
      });
    } else {
      return new TagserResult({
        err: new TagserError({
          code: ERROR_WRONG_TAG_CHARACTER,
          text: getError(
            ERROR_WRONG_TAG_CHARACTER,
            { 'char': String.fromCharCode(charCode) },
          ),
        }),
      });
    }

    return null;
  }
}

/// CLOSE TAG STATE

class CloseTag extends TagserState {
  constructor(tagName) {
    super();
    this._tagName = tagName;
  }

  getName = () => 'CloseTag';

  init(msg) {
    return new TagserResult({
      state: new TagNameState(),
    });
  }

  process(msg) {
    let charCode = msg.charCode;

    switch (charCode) {
      case CHAR_SPACE:
        return null;
      case CHAR_CLOSE_BRACKET:
        return new TagserResult({
          pop: true,
          message: new NotifyMessage({
            type: NOTIFY_CLOSE_TAG_FOUND,
          }),
        });
      default:
        return null;
    }
  }

  notify(msg) {
    switch (msg.type) {
      case NOTIFY_TAG_NAME_RESULT:
        if (msg.value !== this._tagName) {

          return new TagserResult({
            err: new TagserError({
              code: ERROR_WRONG_CLOSE_TAG,
              text: getError(ERROR_WRONG_CLOSE_TAG, { 'tag': msg.value }),
            }),
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

class AttrState extends TagserState {
  constructor() {
    super();

    this._name;
    this._value;
  }

  getName = () => 'AttrState';

  init(msg) {
    return new TagserResult({
      state: new AttrNameState(),
      message: new ProcessMessage(msg.charCode)
    });
  }

  process(msg) {
    if (msg.charCode == CHAR_EQUAL) {
      return new TagserResult({
        state: new AttrValueState(),
      });
    }
    return new TagserResult({
      pop: true,
      message: new NotifyMessage({
        charCode: msg.charCode,
        type: NOTIFY_ATTR_RESULT,
        value: new TagAttribute({
          name: this._name,
          value: this._value || 'true',
        })
      })
    });
  }

  notify(msg) {
    switch (msg.type) {
      case NOTIFY_ATTR_NAME_RESULT:
        let res = new TagserResult({});

        this._name = msg.value;
        res.message = new ProcessMessage(msg.charCode);

        return res;
      case NOTIFY_ATTR_VALUE_RESULT:
        if (msg.value && typeof msg.value === 'string') {
          this._value = msg.value;
        } else {
          return new TagserResult({
            err: new TagserError({
              code: ERROR_ATTR_VALUE_EMPTY,
              text: getError(ERROR_ATTR_VALUE_EMPTY, {}),
            })
          });
        }

        return null;
      default:
        return null;
    }
  }
}

/// ATTR NAME STATE

class AttrNameState extends TagserState {
  constructor() {
    super();
    this._name = '';
  }

  getName = () => 'AttrNameState';

  process(msg) {
    if (isAvailableCharacter(msg.charCode)) {
      this._name += String.fromCharCode(msg.charCode);
    } else {
      return new TagserResult({
        pop: true,
        message: new NotifyMessage({
          type: NOTIFY_ATTR_NAME_RESULT,
          charCode: msg.charCode,
          value: this._name,
        }),
      });
    }

    return null;
  }
}

/// ATTR VALUE STATE

class AttrValueState extends TagserState {
  constructor() {
    super();

    this._value = '';
    this._quote;
    this.isFirstChar = true;
  }

  getName = () => 'AttrValueState';

  process(msg) {
    if (this.isFirstChar) {
      this.isFirstChar = false;

      if (msg.charCode == CHAR_QUOTE || msg.charCode == CHAR_SINGLE_QUOTE) {
        this._quote = msg.charCode;
      } else {
        return new TagserResult({
          err: new TagserError({
            code: ERROR_ATTR_VALUE_MALFORMED,
            text: getError(ERROR_ATTR_VALUE_MALFORMED, {}),
          }),
        });
      }
    } else {
      if (msg.charCode == this._quote) {
        return new TagserResult({
          pop: true,
          message: new NotifyMessage({
            type: NOTIFY_ATTR_VALUE_RESULT,
            value: this._value,
            charCode: msg.charCode
          }),
        });
      } else {
        this._value += String.fromCharCode(msg.charCode);
      }
    }

    return null;
  }
}

/// GET CLOSE BRACKET STATE

class GetCloseBracket extends TagserState {
  getName = () => 'GetCloseBracket';

  process(msg) {
    switch (msg.charCode) {
      case CHAR_CLOSE_BRACKET:
        return new TagserResult({
          pop: true,
          message: new NotifyMessage({
            charCode: msg.charCode,
            type: NOTIFY_CLOSE_BRACKET_FOUND,
          })
        });
      default:
        return new TagserResult({
          err: new TagserError({
            code: ERROR_WRONG_CHARACTER_GIVEN,
            text: getError(ERROR_WRONG_CHARACTER_GIVEN, {
              'char': String.fromCharCode(msg.charCode),
              'await': '>'
            })
          })
        });
    }
  }
}

/// GET SLASH STATE
/*
class GetSlash extends TagserState {
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

module.exports = RootState;