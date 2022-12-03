import Buffer from "./Buffer";
import "./Client.css";
import OpLog from "./OpLog";

export default function Client({
  client,
  onChange,
}: {
  client: OpLog;
  onChange: React.ChangeEventHandler<HTMLTextAreaElement>;
}) {
  return (
    <div className="Client">
      <h2>Client {client.clientId}</h2>
      <textarea onChange={onChange} value={client.buffer.toString()} />
      <Buffer buffer={client.buffer} />
      <h3>Operation Log</h3>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th colSpan={2}>opID</th>
          </tr>
        </thead>
        <tbody>
          {client.log
            .slice()
            .reverse()
            .map(({ op, isSynced }) => (
              <tr key={op.opId.toString()}>
                <td>
                  {isSynced ? "synchronised" : "not synchronised"}
                  &nbsp;{op.action}
                </td>
                <td>{op.opId.toString()}</td>
                <td>{op.action === "insert" ? op.value : ""}</td>
                <td>
                  {op.action === "insert" ? "afterID" : "removedID"}
                  &nbsp;
                  {op.action === "insert"
                    ? op.afterId?.toString()
                    : op.removedId.toString()}
                </td>
              </tr>
            ))}
        </tbody>
      </table>
    </div>
  );
}
