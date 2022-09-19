import { INIT_MESSAGE, NOTIFY_MESSAGE, PROCESS_MESSAGE } from "./const";

export interface iMessage {
  charCode: number;

  getName(): string;
}

export class InitMessage implements iMessage {
  constructor(readonly value: any, readonly charCode: number) {}

  getName() {
    return INIT_MESSAGE;
  }
}

export class ProcessMessage implements iMessage {
  constructor(readonly charCode: number) {}

  getName() {
    return PROCESS_MESSAGE;
  }
}

export class NotifyMessage implements iMessage {
  constructor(
    readonly charCode: number,
    readonly type: number,
    readonly value?: any
  ) {}

  getName() {
    return NOTIFY_MESSAGE;
  }
}
