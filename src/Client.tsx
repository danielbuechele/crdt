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
      <h3>Unsynced Changes</h3>
      <table>
        <thead>
          <tr>
            <th>Action</th>
            <th>opID</th>
            <th>value</th>
            <th>refID</th>
          </tr>
        </thead>
        <tbody>
          {client.log
            .slice()
            .reverse()
            .map((op) => (
              <tr key={op.opId.toString()}>
                <td className={op.action}>{op.action}</td>
                <td>{op.opId.toString()}</td>
                <td>
                  <pre>{op.action === "insert" ? op.value : ""}</pre>
                </td>
                <td>
                  <div className="ref">
                    {op.action === "insert" ? "after" : "delete"}
                  </div>
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
