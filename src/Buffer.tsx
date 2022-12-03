import "./Buffer.css";
import { OpBuffer } from "./OpLog";

export default function Buffer({ buffer }: { buffer: OpBuffer }) {
  return (
    <div className="buffer">
      <ol>
        {buffer.buffer.map((b) => (
          <li key={b.opId.toString()} className={b.deleted ? "deleted" : ""}>
            <div className="meta">{b.opId.toString()}</div>
            <pre>{b.value}</pre>
            <div className="meta deletedLabel">
              {b.deleted ? "deleted" : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
