export const CHAR_BACK_SLASH = 92; // \
export const CHAR_SLASH = 47; // /
export const CHAR_ENTER = 10; // '\n'
export const CHAR_SPACE = 32; // ' '
export const CHAR_OPEN_BRACKET = 60; // <
export const CHAR_CLOSE_BRACKET = 62; // >
export const CHAR_UNDERSCORE = 95; // _
export const CHAR_QUOTE = 34; // "
export const CHAR_SINGLE_QUOTE = 39; // '
export const CHAR_EQUAL = 61; // =
export const CHAR_EXCL_MARK = 33; // !
export const CHAR_EOS = -1; // end of source

export const NOTIFY_TAG_NAME_RESULT = 1;
export const NOTIFY_ATTR_RESULT = 2;
export const NOTIFY_CLOSE_BRACKET_FOUND = 3;
export const NOTIFY_TAG_RESULT = 4;
export const NOTIFY_SLASH_FOUND = 5;
export const NOTIFY_CLOSE_TAG_FOUND = 6;
export const NOTIFY_ATTR_NAME_RESULT = 7;
export const NOTIFY_ATTR_VALUE_RESULT = 8;
export const NOTIFY_CLOSE_TAG = 9;

export const ERROR_WRONG_TAG_CHARACTER = 1;
export const ERROR_EMPTY_TAG_NAME = 2;
export const ERROR_TAG_MALFORMED = 3;
export const ERROR_WRONG_CHARACTER_GIVEN = 4;
export const ERROR_SOURCE_DOCUMENT_MALFORMED = 5;
export const ERROR_WRONG_CLOSE_TAG = 6;
export const ERROR_ATTR_NAME_EMPTY = 7;
export const ERROR_ATTR_VALUE_EMPTY = 8;
export const ERROR_ATTR_VALUE_MALFORMED = 9;
export const ERROR_UNEXPECTED_EOS = 10;
export const ERROR_END_OF_TAG = 11;

export const MESSAGES: { [key: number]: string } = {
  1: "Wrong tag name character: {{char}}",
  2: "Empty tag name",
  3: "Tag malformed",
  4: 'Wrong character given: "{{char}}". "{{await}}" awaits',
  5: "Source document malformed",
  6: "Wrong close tag: {{tag}}",
  7: "Attribute malformed: empty name",
  8: "Attribute malformed: empty value",
  9: "Attribute value malfromed: the attribute value should be a string",
  10: "Unexpected end of source",
  11: 'Unexpected end of tag "{{tag}}" ({{line}}:{{symbol}})',
};

export const TYPE_TAG = "tag";
export const TYPE_TEXT = "text";

// messages
export const INIT_MESSAGE = "init";
export const PROCESS_MESSAGE = "process";
export const NOTIFY_MESSAGE = "notify";
