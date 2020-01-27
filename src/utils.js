const { CHAR_UNDERSCORE } = require('./const');

const isAvailableCharacter = (charCode) => {
  if (charCode == CHAR_UNDERSCORE ||
    (charCode >= 48 && charCode <= 57) ||
    (charCode >= 65 && charCode <= 90) ||
    (charCode >= 97 && charCode <= 122)) {
    return true;
  }

  return false;
}

module.exports = {
  isAvailableCharacter
};
