import "./App.css";
import Client from "./Client";
import useClient from "./useClient";

function App() {
  const clientA = useClient("A");
  const clientB = useClient("B");

  return (
    <div className="App">
      <Client client={clientA.opLog} onChange={clientA.onChange} />
      <button
        className="syncButton"
        title="sync now"
        onClick={() => {
          clientA.opLog
            .getUnsyncedOps()
            .forEach((op) => clientB.opLog.buffer.applyOp(op));
          clientB.opLog
            .getUnsyncedOps()
            .forEach((op) => clientA.opLog.buffer.applyOp(op));
        }}
      >
        🔄
      </button>
      <Client client={clientB.opLog} onChange={clientB.onChange} />
    </div>
  );
}

export default App;
