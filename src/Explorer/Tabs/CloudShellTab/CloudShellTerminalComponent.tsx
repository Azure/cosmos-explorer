import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from "xterm-addon-fit";
import "xterm/css/xterm.css";
import { DatabaseAccount } from "../../../Contracts/DataModels";
import { TerminalKind } from "../../../Contracts/ViewModels";
import { startCloudShellTerminal } from "./CloudShellTerminalCore";

export interface CloudShellTerminalComponentProps {
  databaseAccount: DatabaseAccount;
  tabId: string;
  username?: string;
  shellType?: TerminalKind;
}

export const CloudShellTerminalComponent: React.FC<CloudShellTerminalComponentProps> = (props) => {
  const terminalRef = useRef(null); // Reference for terminal container
  const xtermRef = useRef(null); // Reference for XTerm instance
  const socketRef = useRef(null); // Reference for WebSocket

  useEffect(() => {
    // Initialize XTerm instance
    const terminal = new Terminal({
      cursorBlink: true,
      cursorStyle: "bar",
      fontFamily: "monospace",
      fontSize: 11,
      theme: {
        background: "#1e1e1e",
        foreground: "#d4d4d4",
        cursor: "#ffcc00",
      },
      scrollback: 1000,
    });

    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    // Attach terminal to the DOM
    if (terminalRef.current) {
      terminal.open(terminalRef.current);
      xtermRef.current = terminal;
    }

    // Defer terminal sizing until after DOM rendering is complete
    setTimeout(() => {
      fitAddon.fit();
    }, 0);

    // Use ResizeObserver instead of window resize
    const resizeObserver = new ResizeObserver(() => {
      const container = terminalRef.current;
      if (container && container.offsetWidth > 0 && container.offsetHeight > 0) {
        try {
          fitAddon.fit();
        } catch (e) {
          console.warn("Fit failed on resize:", e);
        }
      }
    });
    resizeObserver.observe(terminalRef.current);

    socketRef.current = startCloudShellTerminal(terminal, props.shellType);

    // Cleanup function to close WebSocket and dispose terminal
    return () => {
      if (!socketRef.current) {
        return;
      }
      if (socketRef.current && socketRef.current.readyState && socketRef.current.readyState === WebSocket.OPEN) {
        socketRef.current.close(); // Close WebSocket connection
      }
      if (resizeObserver && terminalRef.current) {
        resizeObserver.unobserve(terminalRef.current);
      }
      terminal.dispose(); // Clean up XTerm instance
    };
  }, []);

  return <div ref={terminalRef} style={{ width: "100%", height: "500px" }} />;
};
