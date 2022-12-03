type Op =
  | {
      action: "insert";
      afterId: OpID;
      value: string;
      opId: OpID;
    }
  | {
      action: "delete";
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
    afterID: OpID;
    deleted: boolean;
  }> = [
    {
      value: "",
      opId: OpBuffer.START,
      deleted: false,
      afterID: OpBuffer.START,
    },
  ];

  idForVisibleIndex(index: number): OpID {
    return this.buffer.filter((o) => !o.deleted)[index].opId;
  }

  applyOp(op: Op) {
    let i = this.buffer.findIndex(
      (o) => o.opId === (op.action === "insert" ? op.afterId : op.removedId)
    );

    console.log(i, op);
    if (op.action === "insert") {
      // TODO skip further if needed
      while (
        i + 1 < this.buffer.length &&
        this.buffer[i].opId.equals(this.buffer[i + 1].afterID) &&
        this.buffer[i + 1].opId.clientId > op.opId.clientId
      ) {
        console.log("skipp", op.opId.toString());
        i++;
      }

      this.buffer.splice(i + 1, 0, {
        value: op.value,
        opId: op.opId,
        deleted: false,
        afterID: op.afterId,
      });
    } else if (op.action === "delete") {
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

  log: Array<Op> = [];

  clientId: string;
  private counter = 0;

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  dispatchEvent = (value: string, cursorPosition: number) => {
    let newEnd = value.length - 1;
    const oldValue = this.buffer.toString();
    let oldEnd = oldValue.length - 1;
    let commonTailLength = 0;
    while (
      newEnd > -1 &&
      oldEnd > -1 &&
      newEnd >= cursorPosition &&
      value[newEnd] === oldValue[oldEnd]
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
      oldStart < oldValue.length &&
      commonHeadLength < value.length - commonTailLength && // TODO
      value[newStart] === oldValue[oldStart]
    ) {
      commonHeadLength++;
      newStart++;
      oldStart++;
    }

    // remove
    for (
      let i = oldValue.length - commonTailLength;
      i > commonHeadLength;
      i--
    ) {
      const removedId = this.buffer.idForVisibleIndex(i);
      const op = {
        action: "delete" as const,
        removedId,
        opId: new OpID(this.clientId, this.counter++),
      };
      this.buffer.applyOp(op);
      this.log.push(op);
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
      this.log.push(op);
    }
  };

  onUpdate = (sub) => {
    this.buffer.subscriber = sub;
  };

  getUnsyncedOps = () => {
    const log = [...this.log];
    this.log = [];
    return log;
  };
}
