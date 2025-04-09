import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
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
    const xtermRef = useRef(null);    // Reference for XTerm instance
    const socketRef = useRef(null);   // Reference for WebSocket
    const fitAddon = new FitAddon();

    useEffect(() => {
        // Initialize XTerm instance
        const term = new Terminal({
            cursorBlink: true,
            cursorStyle: 'bar',
            fontFamily: 'monospace',
            fontSize: 14,
            theme: {
                background: "#1e1e1e", 
                foreground: "#d4d4d4", 
                cursor: "#ffcc00"
            },
            scrollback: 1000
        });

        term.loadAddon(fitAddon);

        // Attach terminal to the DOM
        if (terminalRef.current) {
            term.open(terminalRef.current);
            xtermRef.current = term;
        }

        // Adjust terminal size on window resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        socketRef.current = startCloudShellTerminal(term, props.shellType);

        // Cleanup function to close WebSocket and dispose terminal
        return () => {
            if (!socketRef.current) return;
            if (socketRef.current && socketRef.current.readyState && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.close(); // Close WebSocket connection
            }
            window.removeEventListener('resize', handleResize);
            term.dispose(); // Clean up XTerm instance
        };
        
    }, []);

    return <div ref={terminalRef} style={{ width: "100%", height: "500px"}} />;
}