import crossroads from "crossroads";
import hasher from "hasher";

import * as Constants from "../Common/Constants";
import Explorer from "../Explorer/Explorer";
import { TabRouteHandler } from "./TabRouteHandler";

describe("TabRouteHandler", () => {
  let tabRouteHandler: TabRouteHandler;

  beforeAll(() => {
    (<any>window).dataExplorer = new Explorer({
      notificationsClient: null,
      isEmulator: false
    }); // create a mock to avoid null refs
  });

  beforeEach(() => {
    tabRouteHandler = new TabRouteHandler();
  });

  afterEach(() => {
    crossroads.removeAllRoutes();
  });

  describe("Route Handling", () => {
    let routedSpy: jasmine.Spy;

    beforeEach(() => {
      routedSpy = jasmine.createSpy("Routed spy");
      const onMatch = (request: string, data: { route: any; params: string[]; isFirst: boolean }) => {
        routedSpy(request, data);
      };
      tabRouteHandler.initRouteHandler(onMatch);
    });

    function validateRouteWithParams(route: string, routeParams: string[]): void {
      hasher.setHash(route);
      expect(routedSpy).toHaveBeenCalledWith(
        route,
        jasmine.objectContaining({ params: jasmine.arrayContaining(routeParams) })
      );
    }

    it("should include a route for documents tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/documents`, ["1", "2"]);
    });

    it("should include a route for entities tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/entities`, ["1", "2"]);
    });

    it("should include a route for graphs tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/graphs`, ["1", "2"]);
    });

    it("should include a route for mongo documents tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/mongoDocuments`, ["1", "2"]);
    });

    it("should include a route for mongo shell", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/mongoShell`, ["1", "2"]);
    });

    it("should include a route for query tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/query`, ["1", "2"]);
    });

    it("should include a route for database settings tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.databasesWithId("1")}/settings`, ["1"]);
    });

    it("should include a route for settings tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/settings`, ["1", "2"]);
    });

    it("should include a route for new stored procedure tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/sproc`, ["1", "2"]);
    });

    it("should include a route for stored procedure tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/sprocs/3`, ["1", "2", "3"]);
    });

    it("should include a route for new trigger tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/trigger`, ["1", "2"]);
    });

    it("should include a route for trigger tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/triggers/3`, [
        "1",
        "2",
        "3"
      ]);
    });

    it("should include a route for new UDF tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/udf`, ["1", "2"]);
    });

    it("should include a route for UDF tab", () => {
      validateRouteWithParams(`${Constants.HashRoutePrefixes.collectionsWithIds("1", "2")}/udfs/3`, ["1", "2", "3"]);
    });
  });
});
