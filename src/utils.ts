import _ from "lodash";
import { MESSAGES, CHAR_UNDERSCORE } from "./const";

export const isAvailableCharacter = (charCode: number): boolean => {
  if (
    charCode == CHAR_UNDERSCORE ||
    (charCode >= 48 && charCode <= 57) ||
    (charCode >= 65 && charCode <= 90) ||
    (charCode >= 97 && charCode <= 122)
  ) {
    return true;
  }

  return false;
};

export const getError = (code: number, values?: { [key: string]: any }) => {
  let message = MESSAGES[code];

  if (message) {
    if (values) {
      _.forEach(values, (v: any, k: string) => {
        message = message.replace(`{{${k}}}`, v.toString());
      });
    }
  }

  return message || "";
};
