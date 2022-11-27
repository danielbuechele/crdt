import { useState } from "react";
import reactLogo from "./assets/react.svg";
import "./App.css";
import Client from "./Client";

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="App">
      <Client clientId="a" />
      <Client clientId="b" />
    </div>
  );
}

export default App;
