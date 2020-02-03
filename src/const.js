const _ = require('lodash');

const CHAR_BACK_SLASH = 92; // \
const CHAR_SLASH = 47; // /
const CHAR_ENTER = 10; // '\n'
const CHAR_SPACE = 32; // ' '
const CHAR_OPEN_BRACKET = 60; // <
const CHAR_CLOSE_BRACKET = 62; // >
const CHAR_UNDERSCORE = 95; // _
const CHAR_QUOTE = 34; // "
const CHAR_SINGLE_QUOTE = 39; // '
const CHAR_EQUAL = 61; // =
const CHAR_EXCL_MARK = 33; // !
const CHAR_EOS = -1; // end of source

const NOTIFY_TAG_NAME_RESULT = 1;
const NOTIFY_ATTR_RESULT = 2;
const NOTIFY_CLOSE_BRACKET_FOUND = 3;
const NOTIFY_TAG_RESULT = 4;
const NOTIFY_SLASH_FOUND = 5;
const NOTIFY_CLOSE_TAG_FOUND = 6;
const NOTIFY_ATTR_NAME_RESULT = 7;
const NOTIFY_ATTR_VALUE_RESULT = 8;
const NOTIFY_CLOSE_TAG = 9;

const ERROR_WRONG_TAG_CHARACTER = 1;
const ERROR_EMPTY_TAG_NAME = 2;
const ERROR_TAG_MALFORMED = 3;
const ERROR_WRONG_CHARACTER_GIVEN = 4;
const ERROR_SOURCE_DOCUMENT_MALFORMED = 5;
const ERROR_WRONG_CLOSE_TAG = 6;
const ERROR_ATTR_NAME_EMPTY = 7;
const ERROR_ATTR_VALUE_EMPTY = 8;
const ERROR_ATTR_VALUE_MALFORMED = 9;
const ERROR_UNEXPECTED_EOS = 10;
const ERROR_END_OF_TAG = 11;

const messages = {
  1: "Wrong tag name character: {{char}}",
  2: "Empty tag name",
  3: "Tag malformed",
  4: "Wrong character given: \"{{char}}\". \"{{await}}\" awaits",
  5: "Source document malformed",
  6: "Wrong close tag: {{tag}}",
  7: "Attribute malformed: empty name",
  8: "Attribute malformed: empty value",
  9: "Attribute value malfromed: the attribute value should be a string",
  10: "Unexpected end of source",
  11: "Unexpected end of tag \"{{tag}}\" ({{line}}:{{symbol}})",
};


const getError = (code, values) => {
  var message = messages[code];

  if (message) {
    if (values) {
      _.forEach(values, (v, k) => {
        message = message.replace(`{{${k}}}`, v);
      });
    }
  }

  return message || '';
};

module.exports = {
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
  ERROR_UNEXPECTED_EOS,
  ERROR_END_OF_TAG,

  getError
};

