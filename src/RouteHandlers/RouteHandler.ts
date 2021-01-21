import { MessageTypes } from "../Contracts/ExplorerContracts";
import { sendMessage } from "../Common/MessageHandler";
import { TabRouteHandler } from "./TabRouteHandler";

export class RouteHandler {
  private static _instance: RouteHandler;
  private _tabRouteHandler: TabRouteHandler;

  private constructor() {
    this._tabRouteHandler = new TabRouteHandler();
  }

  public static getInstance(): RouteHandler {
    if (!RouteHandler._instance) {
      RouteHandler._instance = new RouteHandler();
    }

    return RouteHandler._instance;
  }

  public initHandler(): void {
    this._tabRouteHandler.initRouteHandler();
  }

  public parseHash(hash: string): void {
    this._tabRouteHandler.parseHash(hash);
  }

  public updateRouteHashLocation(hash: string): void {
    sendMessage({
      type: MessageTypes.UpdateLocationHash,
      locationHash: hash
    });
  }
}
