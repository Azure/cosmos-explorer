import { IDisposable, ITerminalAddon, Terminal } from "@xterm/xterm";
import { AbstractShellHandler } from "../ShellTypes/AbstractShellHandler";
import { formatErrorMessage } from "./TerminalLogFormats";

interface IAttachOptions {
  bidirectional?: boolean;
  startMarker?: string;
  shellHandler?: AbstractShellHandler;
}

/**
 * Terminal addon that attaches a terminal to a WebSocket for bidirectional
 * communication with Azure CloudShell.
 *
 * Features:
 * - Manages bidirectional data flow between terminal and CloudShell WebSocket
 * - Processes special status messages within the data stream
 * - Controls terminal output display during shell initialization
 * - Supports shell-specific customizations via AbstractShellHandler
 *
 * @implements {ITerminalAddon}
 */
export class AttachAddon implements ITerminalAddon {
  private _socket: WebSocket;
  private _bidirectional: boolean;
  private _disposables: IDisposable[] = [];
  private _socketData: string;

  private _allowTerminalWrite: boolean = true;

  private _startMarker: string;
  private _shellHandler: AbstractShellHandler;

  constructor(socket: WebSocket, options?: IAttachOptions) {
    this._socket = socket;
    // always set binary type to arraybuffer, we do not handle blobs
    this._socket.binaryType = "arraybuffer";
    this._bidirectional = !(options && options.bidirectional === false);
    this._startMarker = options?.startMarker;
    this._shellHandler = options?.shellHandler;
    this._socketData = "";
    this._allowTerminalWrite = true;
  }

  /**
   * Activates the addon with the provided terminal
   *
   * Sets up event listeners for terminal input and WebSocket messages.
   * Links the terminal input to the WebSocket and vice versa.
   *
   * @param {Terminal} terminal - The XTerm terminal instance
   */
  public activate(terminal: Terminal): void {
    this.addMessageListener(terminal);
    if (this._bidirectional) {
      this._disposables.push(terminal.onData((data) => this._sendData(data)));
      this._disposables.push(terminal.onBinary((data) => this._sendBinary(data)));
    }

    this._disposables.push(addSocketListener(this._socket, "close", () => this._handleSocketClose(terminal)));
    this._disposables.push(addSocketListener(this._socket, "error", () => this._handleSocketClose(terminal)));
  }

  /**
   * Handles socket close events by terminating processes and showing a message
   */
  private _handleSocketClose(terminal: Terminal): void {
    if (terminal) {
      terminal.writeln(
        formatErrorMessage("Session ended. Please close this tab and initiate a new shell session if needed."),
      );

      // Send exit command to terminal
      if (this._bidirectional) {
        terminal.write(formatErrorMessage("exit\r\n"));
      }
    }

    // Clean up resources
    this.dispose();
  }

  /**
   * Adds a message listener to process data from the WebSocket
   *
   * Handles:
   * - Status message extraction (between ie_us and ie_ue markers)
   * - Partial message accumulation
   * - Shell initialization messages
   * - Suppression of unwanted shell output
   *
   * @param {Terminal} terminal - The XTerm terminal instance
   */
  public addMessageListener(terminal: Terminal): void {
    this._disposables.push(
      addSocketListener(this._socket, "message", (ev) => {
        let data: ArrayBuffer | string = ev.data;
        const startStatusJson = "ie_us";
        const endStatusJson = "ie_ue";

        if (typeof data === "object") {
          const enc = new TextDecoder("utf-8");
          data = enc.decode(ev.data as ArrayBuffer);
        }

        // for example of json object look in TerminalHelper in the socket.onMessage
        if (data.includes(startStatusJson) && data.includes(endStatusJson)) {
          // process as one line
          const statusData = data.split(startStatusJson)[1].split(endStatusJson)[0];
          data = data.replace(statusData, "");
          data = data.replace(startStatusJson, "");
          data = data.replace(endStatusJson, "");
        } else if (data.includes(startStatusJson)) {
          // check for start
          const partialStatusData = data.split(startStatusJson)[1];
          this._socketData += partialStatusData;
          data = data.replace(partialStatusData, "");
          data = data.replace(startStatusJson, "");
        } else if (data.includes(endStatusJson)) {
          // check for end and process the command
          const partialStatusData = data.split(endStatusJson)[0];
          this._socketData += partialStatusData;
          data = data.replace(partialStatusData, "");
          data = data.replace(endStatusJson, "");
          this._socketData = "";
        } else if (this._socketData.length > 0) {
          // check if the line is all data then just concatenate
          this._socketData += data;
          data = "";
        }

        if (this._allowTerminalWrite && data.includes(this._startMarker)) {
          this._allowTerminalWrite = false;
          terminal.write(`Preparing ${this._shellHandler.getShellName()} environment...\r\n`);
        }

        if (this._allowTerminalWrite) {
          const updatedData = this._shellHandler?.updateTerminalData(data) ?? data;
          const suppressedData = this._shellHandler?.getTerminalSuppressedData();

          const shouldNotWrite = suppressedData.filter(Boolean).some(item => updatedData.includes(item));

          if (!shouldNotWrite) {
            terminal.write(updatedData);
          }
        }

        if (data.includes(this._shellHandler.getConnectionCommand())) {
          this._allowTerminalWrite = true;
        }
      }),
    );
  }

  public dispose(): void {
    for (const d of this._disposables) {
      d.dispose();
    }
  }

  /**
   * Sends string data from the terminal to the WebSocket
   *
   * @param {string} data - The data to send
   */
  private _sendData(data: string): void {
    if (!this._checkOpenSocket()) {
      return;
    }
    this._socket.send(data);
  }

  /**
   * Sends binary data from the terminal to the WebSocket
   *
   * @param {string} data - The string data to convert to binary and send
   */
  private _sendBinary(data: string): void {
    if (!this._checkOpenSocket()) {
      return;
    }
    const buffer = new Uint8Array(data.length);
    for (let i = 0; i < data.length; ++i) {
      buffer[i] = data.charCodeAt(i) & 255;
    }
    this._socket.send(buffer);
  }

  private _checkOpenSocket(): boolean {
    switch (this._socket.readyState) {
      case WebSocket.OPEN:
        return true;
      case WebSocket.CONNECTING:
        throw new Error("Attach addon was loaded before socket was open");
      case WebSocket.CLOSING:
        return false;
      case WebSocket.CLOSED:
        throw new Error("Attach addon socket is closed");
      default:
        throw new Error("Unexpected socket state");
    }
  }
}

/**
 * Adds an event listener to a WebSocket and returns a disposable object
 * for cleanup
 *
 * @param {WebSocket} socket - The WebSocket instance
 * @param {K} type - The event type to listen for
 * @param {Function} handler - The event handler function
 * @returns {IDisposable} An object with a dispose method to remove the listener
 */
function addSocketListener<K extends keyof WebSocketEventMap>(
  socket: WebSocket,
  type: K,
  handler: (this: WebSocket, ev: WebSocketEventMap[K]) => void,
): IDisposable {
  socket.addEventListener(type, handler);
  return {
    dispose: () => {
      if (!handler) {
        // Already disposed
        return;
      }
      socket.removeEventListener(type, handler);
    },
  };
}
