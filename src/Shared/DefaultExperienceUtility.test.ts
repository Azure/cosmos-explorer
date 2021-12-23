import * as DataModels from "../Contracts/DataModels";
import { userContext } from "../UserContext";
import * as DefaultExperienceUtility from "./DefaultExperienceUtility";

describe("Default Experience Utility", () => {
  describe("getDefaultExperienceFromApiKind()", () => {
    const runScenario = (apiKind: number, expectedExperience: typeof userContext.apiType): void => {
      const resolvedExperience = DefaultExperienceUtility.getDefaultExperienceFromApiKind(apiKind);
      expect(resolvedExperience).toEqual(expectedExperience);
    };

    describe("On SQL", () => {
      it("should return SQL", () => runScenario(DataModels.ApiKind.SQL, "SQL"));
    });

    describe("On MongoDB", () => {
      it("should return MongoDB", () => runScenario(DataModels.ApiKind.MongoDB, "Mongo"));
    });

    describe("On Table", () => {
      it("should return Table", () => runScenario(DataModels.ApiKind.Table, "Tables"));
    });

    describe("On Cassandra", () => {
      it("should return Cassandra", () => runScenario(DataModels.ApiKind.Cassandra, "Cassandra"));
    });

    describe("On Graph", () => {
      it("should return Graph", () => runScenario(DataModels.ApiKind.Graph, "Gremlin"));
    });

    describe("On unknown", () => {
      it("should return Default", () => runScenario(-1, "SQL"));
    });
  });

  describe("getApiKindFromDefaultExperience()", () => {
    const runScenario = (defaultExperience: typeof userContext.apiType | null, expectedApiKind: number): void => {
      const resolvedApiKind = DefaultExperienceUtility.getApiKindFromDefaultExperience(defaultExperience);
      expect(resolvedApiKind).toEqual(expectedApiKind);
    };

    describe("On SQL", () => {
      it("should return SQL", () => runScenario("SQL", DataModels.ApiKind.SQL));
    });

    describe("On MongoDB", () => {
      it("should return MongoDB", () => runScenario("Mongo", DataModels.ApiKind.MongoDB));
    });

    describe("On Table", () => {
      it("should return Table", () => runScenario("Tables", DataModels.ApiKind.Table));
    });

    describe("On Cassandra", () => {
      it("should return Cassandra", () => runScenario("Cassandra", DataModels.ApiKind.Cassandra));
    });

    describe("On Graph", () => {
      it("should return Graph", () => runScenario("Gremlin", DataModels.ApiKind.Graph));
    });

    describe("On undefined", () => {
      it("should return SQL", () => runScenario(undefined, DataModels.ApiKind.SQL));
    });
  });
});
