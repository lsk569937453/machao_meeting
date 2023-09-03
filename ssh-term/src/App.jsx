import { useState } from "react";
import reactLogo from "./assets/react.svg";
import { invoke } from "@tauri-apps/api/tauri";
import "./App.css";
import {McTerminal}  from "./terminal.jsx";
import Xterminal  from "./terminal2.jsx";

// import { MyTerminal } from "./terminal2.jsx";
function App() {
  const [greetMsg, setGreetMsg] = useState("");
  const [name, setName] = useState("");

  async function greet() {
    // Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
    setGreetMsg(await invoke("greet", { name }));
  }

  return (
    
      <Xterminal/>
  );
}

export default App;
