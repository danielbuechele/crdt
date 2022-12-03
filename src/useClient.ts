import { useMemo, useState } from "react";
import OpLog from "./OpLog";

export default function useClient(clientId: string) {
  const [_, setCounter] = useState(0);

  const client = useMemo(() => {
    const opLog = new OpLog(clientId);
    opLog.onUpdate(() => setCounter((c) => c + 1));
    return {
      opLog,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) =>
        opLog.dispatchEvent(e.target.value, e.target.selectionEnd),
    };
  }, [setCounter]);

  return client;
}
