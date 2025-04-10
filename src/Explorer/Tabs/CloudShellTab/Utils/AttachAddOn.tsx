
import { AbstractShellHandler } from 'Explorer/Tabs/CloudShellTab/ShellTypes/AbstractShellHandler';
import { IDisposable, ITerminalAddon, Terminal } from 'xterm';

interface IAttachOptions {
    bidirectional?: boolean;
    startMarker?: string;
    shellHandler?: AbstractShellHandler;
}

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
        this._socket.binaryType = 'arraybuffer';
        this._bidirectional = !(options && options.bidirectional === false);
        this._startMarker = options?.startMarker;
        this._shellHandler = options?.shellHandler;
        this._socketData = '';
        this._allowTerminalWrite = true;
    }

    public activate(terminal: Terminal): void {
        this.addMessageListener(terminal);
        if (this._bidirectional) {
            this._disposables.push(terminal.onData(data => this._sendData(data)));
            this._disposables.push(terminal.onBinary(data => this._sendBinary(data)));
        }

        this._disposables.push(addSocketListener(this._socket, 'close', () => this.dispose()));
        this._disposables.push(addSocketListener(this._socket, 'error', () => this.dispose()));
    }

    public addMessageListener(terminal: Terminal): void {
        this._disposables.push(
            addSocketListener(this._socket, 'message', ev => {
                let data: ArrayBuffer | string = ev.data;
                const startStatusJson = 'ie_us';
                const endStatusJson = 'ie_ue';

                if (typeof data === 'object') {
                    const enc = new TextDecoder("utf-8");
                    data = enc.decode(ev.data as any);
                }

                // for example of json object look in TerminalHelper in the socket.onMessage
                if (data.includes(startStatusJson) && data.includes(endStatusJson)) {
                    // process as one line
                    const statusData = data.split(startStatusJson)[1].split(endStatusJson)[0];
                    data = data.replace(statusData, '');
                    data = data.replace(startStatusJson, '');
                    data = data.replace(endStatusJson, '');
                } else if (data.includes(startStatusJson)) {
                    // check for start
                    const partialStatusData = data.split(startStatusJson)[1];
                    this._socketData += partialStatusData;
                    data = data.replace(partialStatusData, '');
                    data = data.replace(startStatusJson, '');
                } else if (data.includes(endStatusJson)) {
                    // check for end and process the command
                    const partialStatusData = data.split(endStatusJson)[0];
                    this._socketData += partialStatusData;
                    data = data.replace(partialStatusData, '');
                    data = data.replace(endStatusJson, '');
                    this._socketData = '';
                } else if (this._socketData.length > 0) {
                    // check if the line is all data then just concatenate
                    this._socketData += data;
                    data = '';
                }

                if (data.includes(this._startMarker)) {
                    this._allowTerminalWrite = false;
                    terminal.write(`Preparing ${this._shellHandler.getShellName()} environment...\r\n`);
                }

                if (this._allowTerminalWrite) {
                    const suppressedData = this._shellHandler?.getTerminalSuppressedData();
                    const hasSuppressedData = suppressedData && suppressedData.length > 0;
                    
                    if (!hasSuppressedData || !data.includes(suppressedData)) {
                        terminal.write(data);
                    }
                }

                if (data.includes(this._shellHandler.getConnectionCommand())) {
                    this._allowTerminalWrite = true;
                }
            })
        );

    }

    public dispose(): void {
        for (const d of this._disposables) {
            d.dispose();
        }
    }

    private _sendData(data: string): void {
        if (!this._checkOpenSocket()) {
            return;
        }
        this._socket.send(data);
    }

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
                throw new Error('Attach addon was loaded before socket was open');
            case WebSocket.CLOSING:
                return false;
            case WebSocket.CLOSED:
                throw new Error('Attach addon socket is closed');
            default:
                throw new Error('Unexpected socket state');
        }
    }
}

function addSocketListener<K extends keyof WebSocketEventMap>(socket: WebSocket, type: K, handler: (this: WebSocket, ev: WebSocketEventMap[K]) => any): IDisposable {
    socket.addEventListener(type, handler);
    return {
        dispose: () => {
            if (!handler) {
                // Already disposed
                return;
            }
            socket.removeEventListener(type, handler);
        }
    };
}

export function removeSocketListener<K extends keyof WebSocketEventMap>(socket: WebSocket, type: K, handler: (this: WebSocket, ev: WebSocketEventMap[K]) => any): IDisposable {
    socket.removeEventListener(type, handler);
    return {
        dispose: () => {
            if (!handler) {
                // Already disposed
                return;
            }
            socket.removeEventListener(type, handler);
        }
    };
}