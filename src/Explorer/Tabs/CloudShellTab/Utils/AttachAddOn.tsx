import { IDisposable, ITerminalAddon, Terminal } from "xterm";
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
    let messageBuffer = "";
    let bufferTimeout: NodeJS.Timeout | null = null;
    const BUFFER_TIMEOUT = 50; // ms - short timeout for prompt detection

    const processBuffer = () => {
      if (messageBuffer.length > 0) {
        this.handleCompleteTerminalData(terminal, messageBuffer);
        messageBuffer = "";
      }
      bufferTimeout = null;
    };

    this._disposables.push(
      addSocketListener(this._socket, "message", (ev) => {
        let data: ArrayBuffer | string = ev.data;
        const startStatusJson = "ie_us";
        const endStatusJson = "ie_ue";

        if (typeof data === "object") {
          const enc = new TextDecoder("utf-8");
          data = enc.decode(ev.data as ArrayBuffer);
        }

        // Handle status messages
        let processedStatusData = data;

        // Process status messages with delimiters
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const startIndex = processedStatusData.indexOf(startStatusJson);
          if (startIndex === -1) {
            break;
          }

          const afterStart = processedStatusData.substring(startIndex + startStatusJson.length);
          const endIndex = afterStart.indexOf(endStatusJson);

          if (endIndex === -1) {
            // Incomplete status message
            this._socketData += processedStatusData.substring(startIndex);
            processedStatusData = processedStatusData.substring(0, startIndex);
            break;
          }

          // Remove processed status message
          processedStatusData =
            processedStatusData.substring(0, startIndex) + afterStart.substring(endIndex + endStatusJson.length);
        }

        // Add to message buffer
        messageBuffer += processedStatusData;

        // Clear existing timeout
        if (bufferTimeout) {
          clearTimeout(bufferTimeout);
          bufferTimeout = null;
        }

        // Check if this looks like a complete message/command
        const isComplete = this.isMessageComplete(messageBuffer, processedStatusData);

        if (isComplete) {
          // Message marked as complete, processing immediately
          processBuffer();
        } else {
          // Set timeout to process buffer after delay
          bufferTimeout = setTimeout(processBuffer, BUFFER_TIMEOUT);
        }
      }),
    );

    // Clean up timeout on dispose
    this._disposables.push({
      dispose: () => {
        if (bufferTimeout) {
          clearTimeout(bufferTimeout);
        }
      },
    });
  }

  private isMessageComplete(fullBuffer: string, currentChunk: string): boolean {
    // Immediate completion indicators
    const immediateCompletionPatterns = [
      /\n$/, // Ends with newline
      /\r$/, // Ends with carriage return
      /\r\n$/, // Ends with CRLF
      /; \} \|\| true;$/, // Your command pattern
      /disown -a && exit$/, // Exit commands
      /printf.*?\\033\[0m\\n"$/, // Your printf pattern
    ];

    // Check current chunk for immediate completion
    for (const pattern of immediateCompletionPatterns) {
      if (pattern.test(currentChunk)) {
        return true;
      }
    }

    // ANSI sequence detection - these might be complete prompts
    const ansiPromptPatterns = [
      /\[\d+G\[0J.*>\s*\[\d+G$/, // Your specific pattern: [1G[0J...> [26G
      /\[\d+;\d+H/, // Cursor position sequences
      /\]\s*\[\d+G$/, // Ends with cursor positioning
      />\s*\[\d+G$/, // Prompt followed by cursor position
    ];

    // Check if buffer ends with what looks like a complete prompt
    for (const pattern of ansiPromptPatterns) {
      if (pattern.test(fullBuffer)) {
        return true;
      }
    }

    // Check for MongoDB shell prompts specifically
    const mongoPromptPatterns = [
      /globaldb \[primary\] \w+>\s*\[\d+G$/, // MongoDB replica set prompt
      />\s*\[\d+G$/, // General prompt with cursor positioning
      /\w+>\s*$/, // Simple shell prompt
    ];

    for (const pattern of mongoPromptPatterns) {
      if (pattern.test(fullBuffer)) {
        return true;
      }
    }

    return false;
  }

  private handleCompleteTerminalData(terminal: Terminal, data: string): void {
    if (this._allowTerminalWrite && data.includes(this._startMarker)) {
      this._allowTerminalWrite = false;
      terminal.write(`Preparing ${this._shellHandler.getShellName()} environment...\r\n`);
    }

    if (this._allowTerminalWrite) {
      const updatedData =
        typeof this._shellHandler?.updateTerminalData === "function"
          ? this._shellHandler.updateTerminalData(data)
          : data;

      const suppressedData = this._shellHandler?.getTerminalSuppressedData();
      const shouldNotWrite = suppressedData.filter(Boolean).some((item) => updatedData.includes(item));

      if (!shouldNotWrite) {
        terminal.write(updatedData);
      }
    }

    if (data.includes(this._shellHandler.getConnectionCommand())) {
      this._allowTerminalWrite = true;
    }
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
