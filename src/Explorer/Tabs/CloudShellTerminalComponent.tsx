import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import { startCloudShellterminal } from "./CloudShellTab/UseTerminal";


export const CloudShellTerminalComponent: React.FC = () => {
    const terminalRef = useRef(null); // Reference for terminal container
    const xtermRef = useRef(null);    // Reference for XTerm instance
    const socketRef = useRef(null);   // Reference for WebSocket
    const intervalsToClearRef = useRef<NodeJS.Timer[]>([]);

    useEffect(() => {
         // Initialize XTerm instance
         const term = new Terminal({
            cursorBlink: true, 
            fontSize: 14,
            theme: { background: "#1d1f21", foreground: "#c5c8c6" },
        });

        // Attach terminal to the DOM
        if (terminalRef.current) {
            term.open(terminalRef.current);
            xtermRef.current = term;
        }

        const authorizationHeader = getAuthorizationHeader()
        socketRef.current = startCloudShellterminal(term, intervalsToClearRef, authorizationHeader.token);
    
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
            term.dispose(); // Clean up XTerm instance
        };
        
    }, []);

    return <div ref={terminalRef} style={{ width: "100%", height: "500px" }} />;
};
