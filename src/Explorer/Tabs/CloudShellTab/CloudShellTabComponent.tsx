import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import { FitAddon } from 'xterm-addon-fit';
import "xterm/css/xterm.css";
import { TerminalKind } from "../../../Contracts/ViewModels";
import { startCloudShellTerminal } from "./UseTerminal";

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
            cursorStyle: 'bar',
            fontFamily: 'Courier New, monospace',
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
            
             // Ensure the CSS is injected only once
            if (!document.getElementById("xterm-custom-style")) {
                const style = document.createElement("style");
                style.id = "xterm-custom-style"; // Unique ID to prevent duplicates
                style.innerHTML = `
                    .xterm-text-layer {
                        transform: translateX(10px); /* Adds left padding */
                    }
                `;
                document.head.appendChild(style);
            }
        }
        
        if (fitAddon) {
            fitAddon.fit();
        }

        // Adjust terminal size on window resize
        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);

        socketRef.current = startCloudShellTerminal(term, shellType);
    
        term.onData((data) => {
            if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
                socketRef.current.send(data);
            }
        });

        // Cleanup function to close WebSocket and dispose terminal
        return () => {
            if (!socketRef.current) return; // Prevent errors if WebSocket is not initialized
            if (socketRef.current) {
                socketRef.current.close(); // Close WebSocket connection
            }
            window.removeEventListener('resize', handleResize);
            term.dispose(); // Clean up XTerm instance

            const styleElement = document.getElementById("xterm-custom-style");
            if (styleElement) {
                styleElement.remove(); // Clean up CSS on unmount
            }
        };
        
    }, []);

    return <div ref={terminalRef} style={{ width: "100%", height: "500px"}} />;
};
