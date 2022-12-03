type Op =
  | {
      action: "insert";
      afterId: OpID;
      value: string;
      opId: OpID;
    }
  | {
      action: "remove";
      removedId: OpID;
      opId: OpID;
    };

class OpID {
  clientId: string;
  counter: number;

  constructor(clientId: string, counter: number) {
    this.clientId = clientId;
    this.counter = counter;
  }

  toString(): string {
    if (this === OpBuffer.START) {
      return `start`;
    }
    return `${this.counter}@${this.clientId}`;
  }

  equals(id: OpID): boolean {
    return id.clientId === this.clientId && this.counter === id.counter;
  }
}

export class OpBuffer {
  static START = new OpID("", -1);
  subscriber: (() => void) | null = null;

  buffer: Array<{
    value: string;
    opId: OpID;
    deleted: boolean;
  }> = [
    {
      value: "",
      opId: OpBuffer.START,
      deleted: false,
    },
  ];

  idForVisibleIndex(index: number): OpID {
    return this.buffer.filter((o) => !o.deleted)[index].opId;
  }

  applyOp(op: Op) {
    const i = this.buffer.findIndex(
      (o) => o.opId === (op.action === "insert" ? op.afterId : op.removedId)
    );
    if (op.action === "insert") {
      // TODO skip further if needed
      this.buffer.splice(i + 1, 0, {
        value: op.value,
        opId: op.opId,
        deleted: false,
      });
    } else if (op.action === "remove") {
      this.buffer[i].deleted = true;
    }

    if (this.subscriber) {
      this.subscriber();
    }
  }

  toString(): string {
    return this.buffer
      .filter(({ deleted }) => !deleted)
      .map((d) => d.value)
      .join("");
  }
}

export default class OpLog {
  buffer = new OpBuffer();

  log: Array<{
    isSynced: boolean;
    op: Op;
  }> = [];

  clientId: string;
  private counter = 0;
  private oldValue = "";

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  dispatchEvent = (value: string, cursorPosition: number) => {
    let newEnd = value.length - 1;
    let oldEnd = this.oldValue.length - 1;
    let commonTailLength = 0;
    while (
      newEnd > -1 &&
      oldEnd > -1 &&
      newEnd >= cursorPosition &&
      value[newEnd] === this.oldValue[oldEnd]
    ) {
      commonTailLength++;
      newEnd--;
      oldEnd--;
    }

    let commonHeadLength = 0;
    let newStart = 0;
    let oldStart = 0;
    while (
      newStart < value.length &&
      oldStart < this.oldValue.length &&
      commonHeadLength < this.oldValue.length - commonTailLength && // TODO
      value[newStart] === this.oldValue[oldStart]
    ) {
      commonHeadLength++;
      newStart++;
      oldStart++;
    }

    // remove
    for (
      let i = commonHeadLength + 1;
      i <= this.oldValue.length - commonTailLength;
      i++
    ) {
      const removedId = this.buffer.idForVisibleIndex(i);
      const op = {
        action: "remove" as const,
        removedId,
        opId: new OpID(this.clientId, this.counter++),
      };
      this.buffer.applyOp(op);

      this.log.push({
        isSynced: false,
        op,
      });
    }

    // insert
    for (let i = commonHeadLength; i < value.length - commonTailLength; i++) {
      const opId = new OpID(this.clientId, this.counter++);
      const afterId = this.buffer.idForVisibleIndex(i);
      const op = {
        action: "insert" as const,
        afterId,
        value: value[i],
        opId,
      };

      this.buffer.applyOp(op);

      this.log.push({
        isSynced: false,
        op,
      });
    }

    // update old value
    this.oldValue = value;
  };

  onUpdate = (sub) => {
    this.buffer.subscriber = sub;
  };

  getUnsyncedOps = () =>
    this.log
      .filter(({ isSynced }) => !isSynced)
      .map((a) => {
        a.isSynced = true;
        return a.op;
      });
}
