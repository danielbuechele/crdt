import { ChangeEvent, useMemo, useState } from "react";

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

class OpBuffer {
  buffer: Array<{
    value: string;
    opId: OpID;
    deleted: boolean;
  }> = [];

  idForVisibleIndex(index: number): OpID | null {
    // possible omtimization not use filter
    if (this.buffer.length === 0) {
      return null;
    }
    let bufferIndex = 0;
    while (index > -1) {
      if (!this.buffer[bufferIndex].deleted) {
        index++;
      }
      bufferIndex++;
    }
    return this.buffer[bufferIndex].opId;
  }

  applyOp(op: Op) {
    const i = this.bufferIndexForVisibleIndex(index);
    if (op.action === "insert") {
      this.buffer.splice(i, 0, {
        value: op.value,
        opId: op.id,
        deleted: false,
      });
    } else if (op.action === "remove") {
      this.buffer[i].deleted = true;
    }
  }

  toString(): string {
    return this.buffer.filter(({ deleted }) => !deleted).join("");
  }
}

class OpID {
  clientId: string;
  counter: number;

  constructor(clientId: string, counter: number) {
    this.clientId = clientId;
    this.counter = counter;
  }

  toString(): string {
    return `${this.clientId}@${this.counter}`;
  }
}

class OpLog {
  buffer = new OpBuffer();

  log: Array<{
    isSynced: boolean;
    op: Op;
  }> = [];

  private clientId: string;
  private counter = 0;
  private oldValue = "";

  constructor(clientId: string) {
    this.clientId = clientId;
  }

  onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const { value } = e.target;

    let newEnd = value.length - 1;
    let oldEnd = this.oldValue.length - 1;
    let commonTailLength = 0;
    while (
      newEnd > -1 &&
      oldEnd > -1 &&
      newEnd >= e.target.selectionEnd &&
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

    console.log({
      commonHeadLength,
      commonTailLength,
    });

    // remove
    for (
      let i = commonHeadLength;
      i < this.oldValue.length - commonTailLength;
      i++
    ) {
      const removedId = this.buffer.idForVisibleIndex(commonHeadLength + i - 1);
      const op = {
        action: "remove" as const,
        removedId,
        opId: new OpID(this.clientId, this.counter++),
      };

      this.log.push({
        isSynced: false,
        op,
      });
    }

    // insert
    for (let i = commonHeadLength; i < value.length - commonTailLength; i++) {
      const opId = new OpID(this.clientId, this.counter++);
      const afterId = this.buffer.idForVisibleIndex(commonHeadLength + i - 1);
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

    return this.counter;
  };
}

export default function Client({ clientId }: { clientId: string }) {
  const opLog = useMemo(() => new OpLog(clientId), []);
  const [counter, setCounter] = useState(0);

  return (
    <div className="Client">
      <textarea onChange={(e) => setCounter(opLog.onChange(e))} />

      {counter}
      <table>
        <tbody>
          <tr>
            {opLog.buffer.buffer.map((b) => (
              <td key={b.opId.toString()}>
                deleted: {b.deleted ? "Y" : "N"}
                <br />
                {b.value}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <ol>
        {opLog.log.map(({ op }) => (
          <li>
            <pre>{JSON.stringify(op)}</pre>
          </li>
        ))}
      </ol>
    </div>
  );
}
