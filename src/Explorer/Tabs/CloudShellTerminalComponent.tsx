import React, { useEffect, useRef } from "react";
import { Terminal } from "xterm";
import "xterm/css/xterm.css";
import { TerminalKind } from "../../Contracts/ViewModels";
import { getAuthorizationHeader } from "../../Utils/AuthorizationUtils";
import { startCloudShellterminal } from "./CloudShellTab/UseTerminal";

export interface CloudShellTerminalProps {
    shellType: TerminalKind;
}

export const CloudShellTerminalComponent: React.FC<CloudShellTerminalProps> = ({
  shellType
}: CloudShellTerminalProps) => {
    const terminalRef = useRef(null); // Reference for terminal container
    const xtermRef = useRef(null);    // Reference for XTerm instance
    const socketRef = useRef(null);   // Reference for WebSocket

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
        socketRef.current = startCloudShellterminal(term, getCommands(shellType), authorizationHeader.token);
    
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

export const getCommands = (terminalKind: TerminalKind): string => {
  switch (terminalKind) {
    case TerminalKind.Postgres:
      return `curl -s https://ipinfo.io \n` +
      `curl -LO https://ftp.postgresql.org/pub/source/v15.2/postgresql-15.2.tar.bz2 \n` +
      `tar -xvjf postgresql-15.2.tar.bz2 \n` +
      `cd postgresql-15.2 \n` + 
      `mkdir ~/pgsql \n` +
      `curl -LO https://ftp.gnu.org/gnu/readline/readline-8.1.tar.gz \n` +
      `tar -xvzf readline-8.1.tar.gz \n` +
      `cd readline-8.1 \n` +
      `./configure --prefix=$HOME/pgsql \n`;
    case TerminalKind.Mongo || terminalKind === TerminalKind.VCoreMongo:
      return  `curl -s https://ipinfo.io \n` +
      `curl -LO https://downloads.mongodb.com/compass/mongosh-2.3.8-linux-x64.tgz \n` +
      `tar -xvzf mongosh-2.3.8-linux-x64.tgz \n` +
      `mkdir -p ~/mongosh && mv mongosh-2.3.8-linux-x64/* ~/mongosh/ \n` +
      `echo 'export PATH=$PATH:$HOME/mongosh/bin' >> ~/.bashrc \n` +
      `source ~/.bashrc \n` +
      `mongosh --version \n`;
    case TerminalKind.Cassandra:
      return `curl -s https://ipinfo.io \n` +
      `curl -OL http://apache.mirror.digitalpacific.com.au/cassandra/4.0.0/apache-cassandra-4.0.0-bin.tar.gz \n` +
      `tar -xvzf apache-cassandra-4.0.0-bin.tar.gz \n` +
      `cd apache-cassandra-4.0.0 \n` +
      `mkdir ~/cassandra \n` +
      `echo 'export CASSANDRA_HOME=$HOME/cassandra' >> ~/.bashrc \n` +
      `source ~/.bashrc \n`;
    default:
      throw new Error("Unsupported terminal kind");
  }
}