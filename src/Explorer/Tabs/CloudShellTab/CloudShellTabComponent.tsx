import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
import "xterm/css/xterm.css";
import { TerminalKind } from "../../../Contracts/ViewModels";
import { startCloudShellterminal } from "./UseTerminal";

export interface CloudShellTerminalProps {
    shellType: TerminalKind;
}

export const CloudShellTerminalComponent: React.FC<CloudShellTerminalProps> = ({
  shellType
}: CloudShellTerminalProps) => {
    const terminalRef = useRef(null); // Reference for terminal container
    const xtermRef = useRef(null);    // Reference for XTerm instance
    const socketRef = useRef(null);   // Reference for WebSocket
    const fitAddon = new FitAddon();

    useEffect(() => {
         // Initialize XTerm instance
         const term = new Terminal({
            cursorBlink: true, 
            theme: { background: "#1d1f21", foreground: "#c5c8c6" }
        });

        term.loadAddon(fitAddon);

        // Attach terminal to the DOM
        if (terminalRef.current) {
            term.open(terminalRef.current);
            xtermRef.current = term;
        }
        fitAddon.fit();

        // Adjust terminal size on window resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        socketRef.current = startCloudShellterminal(term, shellType);
    
        term.onData((data) => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(data);
            }
        });

        // Cleanup function to close WebSocket and dispose terminal
        return () => {
            if (socketRef.current) {
                socketRef.current.close(); // Close WebSocket connection
            }
            window.removeEventListener('resize', handleResize);
            term.dispose(); // Clean up XTerm instance
        };
        
    }, []);

    return <div ref={terminalRef} style={{ width: "100%", height: "500px" }} />;
};
