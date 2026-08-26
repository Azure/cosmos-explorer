import { configContext, updateConfigContext } from "../../../ConfigContext";
import * as DataModels from "../../../Contracts/DataModels";
import {
  buildEndpointsRegex,
  dnsZoneAlternation,
  parseConnectionString,
  selectEndpointZone,
} from "./ConnectionStringParser";

describe("ConnectionStringParser", () => {
  const mockAccountName = "Test";
  const mockMasterKey = "some-key";

  // Keyed by ApiKind so adding an API to the enum fails to compile here rather than silently going
  // untested.
  const connectionStringsByApiKind: Record<DataModels.ApiKind, string> = {
    [DataModels.ApiKind
      .SQL]: `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockMasterKey};`,
    [DataModels.ApiKind
      .MongoDB]: `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.documents.azure.com:10255`,
    [DataModels.ApiKind
      .MongoDBCompute]: `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.mongo.cosmos.azure.com:10255`,
    [DataModels.ApiKind
      .Cassandra]: `AccountEndpoint=${mockAccountName}.cassandra.cosmosdb.azure.com;AccountKey=${mockMasterKey};`,
    [DataModels.ApiKind
      .Table]: `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockMasterKey};TableEndpoint=https://${mockAccountName}.table.cosmosdb.azure.com:443/;`,
    [DataModels.ApiKind
      .Graph]: `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockMasterKey};ApiKind=Gremlin;`,
  };

  it("should parse a connection string for every api kind", () => {
    Object.entries(connectionStringsByApiKind).forEach(([apiKind, connectionString]) => {
      const metadata = parseConnectionString(connectionString);

      expect(metadata.accountName).toBe(mockAccountName);
      expect(metadata.apiKind).toBe(Number(apiKind));
    });
  });

  // The parameterized tests below iterate the zone lists, so removing a zone would silently shrink the
  // suite rather than fail it. Pin the expected contents so that stays visible in review.
  it("should support the expected dns zones", () => {
    expect(configContext.SQL_DNS_ZONES).toEqual([
      "documents.azure.com",
      "sql.cosmosdb.azure.com",
      "sql.cosmos.azure.com",
      "sqlx.cosmosdb.azure.com",
      "sqlx.cosmos.azure.com",
      "documents-staging.windows-ppe.net",
      "sql.cosmosdb.windows-ppe.net",
      "sql.cosmos.windows-ppe.net",
      "sqlx.cosmos.windows-ppe.net",
    ]);
    expect(configContext.MONGO_DNS_ZONES).toEqual(["documents.azure.com", "documents-staging.windows-ppe.net"]);
    expect(configContext.MONGO_COMPUTE_DNS_ZONES).toEqual(["mongo.cosmos.azure.com", "mongo.cosmos.windows-ppe.net"]);
    expect(configContext.CASSANDRA_DNS_ZONES).toEqual([
      "cassandra.cosmosdb.azure.com",
      "cassandra.cosmos.azure.com",
      "cassandra.cosmosdb.windows-ppe.net",
      "cassandra.cosmos.windows-ppe.net",
    ]);
    expect(configContext.TABLE_DNS_ZONES).toEqual([
      "table.cosmosdb.azure.com",
      "table.cosmos.azure.com",
      "table.cosmosdb.windows-ppe.net",
      "table.cosmos.windows-ppe.net",
    ]);
  });

  it("should parse a valid sql account connection string", () => {
    const metadata = parseConnectionString(
      `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockMasterKey};`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.SQL);
    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents.azure.com:443/`);
    expect(metadata.apiEndpoint).toBeUndefined();
  });

  it("should keep the document endpoint given by the connection string", () => {
    // The endpoint is taken from the connection string rather than rebuilt from the account name, so a
    // string that omits the port keeps it omitted.
    const metadata = parseConnectionString(
      `AccountEndpoint=https://${mockAccountName}.documents.azure.com/;AccountKey=${mockMasterKey};`,
    );

    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents.azure.com/`);
  });

  it.each(configContext.SQL_DNS_ZONES)(
    "should parse a sql account connection string using the %s zone",
    (dnsZone: string) => {
      const metadata = parseConnectionString(
        `AccountEndpoint=https://${mockAccountName}.${dnsZone}:443/;AccountKey=${mockMasterKey};`,
      );

      expect(metadata.accountName).toBe(mockAccountName);
      expect(metadata.apiKind).toBe(DataModels.ApiKind.SQL);
      expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.${dnsZone}:443/`);
      expect(metadata.apiEndpoint).toBeUndefined();
    },
  );

  it("should parse a valid mongo account connection string", () => {
    const metadata = parseConnectionString(
      `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.documents.azure.com:10255`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.MongoDB);
  });

  it.each(configContext.MONGO_DNS_ZONES)(
    "should parse a mongo account connection string using the %s zone",
    (dnsZone: string) => {
      const metadata = parseConnectionString(
        `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.${dnsZone}:10255`,
      );

      expect(metadata.accountName).toBe(mockAccountName);
      expect(metadata.apiKind).toBe(DataModels.ApiKind.MongoDB);
    },
  );

  it.each(configContext.MONGO_COMPUTE_DNS_ZONES)(
    "should parse a compute mongo account connection string using the %s zone",
    (dnsZone: string) => {
      const metadata = parseConnectionString(
        `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.${dnsZone}:10255`,
      );

      expect(metadata.accountName).toBe(mockAccountName);
      expect(metadata.apiKind).toBe(DataModels.ApiKind.MongoDBCompute);
    },
  );

  it("should parse a valid cassandra account connection string", () => {
    const metadata = parseConnectionString(
      `AccountEndpoint=${mockAccountName}.cassandra.cosmosdb.azure.com;AccountKey=${mockMasterKey};`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Cassandra);
  });

  it.each(
    ["AccountEndpoint", "HostName"].flatMap((key) =>
      configContext.CASSANDRA_DNS_ZONES.map((dnsZone) => [key, dnsZone]),
    ),
  )("should parse a cassandra account connection string using %s and the %s zone", (key: string, dnsZone: string) => {
    const metadata = parseConnectionString(`${key}=${mockAccountName}.${dnsZone};AccountKey=${mockMasterKey};`);

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Cassandra);
  });

  it.each(configContext.TABLE_DNS_ZONES)(
    "should parse a table account connection string using the %s zone",
    (dnsZone: string) => {
      const metadata = parseConnectionString(
        `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockMasterKey};TableEndpoint=https://${mockAccountName}.${dnsZone}:443/;`,
      );

      expect(metadata.accountName).toBe(mockAccountName);
      expect(metadata.apiKind).toBe(DataModels.ApiKind.Table);
      expect(metadata.apiEndpoint).toBeUndefined();
    },
  );

  it("should construct the document endpoint for a table account from the account name", () => {
    const metadata = parseConnectionString(
      `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockMasterKey};TableEndpoint=https://${mockAccountName}.table.cosmosdb.azure.com:443/;`,
    );

    // Table connection strings only carry the table endpoint, so the document endpoint that data plane
    // operations go through is built from the account name.
    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents.azure.com:443/`);
  });

  it.each(["table.cosmosdb.windows-ppe.net", "table.cosmos.windows-ppe.net"])(
    "should construct a PPE document endpoint for a table account in the %s zone",
    (dnsZone: string) => {
      const metadata = parseConnectionString(
        `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockMasterKey};TableEndpoint=https://${mockAccountName}.${dnsZone}:443/;`,
      );

      // The constructed endpoint has to match the kind of zone the table endpoint we matched came from.
      expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents-staging.windows-ppe.net:443/`);
    },
  );

  it("should parse a valid graph account connection string", () => {
    const metadata = parseConnectionString(
      `AccountEndpoint=https://${mockAccountName}.documents.azure.com:443/;AccountKey=${mockMasterKey};ApiKind=Gremlin;`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Graph);
    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents.azure.com:443/`);
    expect(metadata.apiEndpoint).toBe(`${mockAccountName}.gremlin.cosmos.azure.com:443`);
  });

  it("should construct a PPE gremlin endpoint for a PPE graph account", () => {
    const metadata = parseConnectionString(
      `AccountEndpoint=https://${mockAccountName}.documents-staging.windows-ppe.net:443/;AccountKey=${mockMasterKey};ApiKind=Gremlin;`,
    );

    expect(metadata.accountName).toBe(mockAccountName);
    expect(metadata.apiKind).toBe(DataModels.ApiKind.Graph);
    expect(metadata.documentEndpoint).toBe(`https://${mockAccountName}.documents-staging.windows-ppe.net:443/`);
    // The constructed endpoint has to match the kind of zone the document endpoint we matched came from.
    expect(metadata.apiEndpoint).toBe(`${mockAccountName}.gremlin.cosmos.windows-ppe.net:443`);
  });

  it("should reject a connection string when no DNS zone matches the account", () => {
    const originalZones = configContext.DOCUMENT_ENDPOINT_ZONES;
    updateConfigContext({ DOCUMENT_ENDPOINT_ZONES: ["documents.azure.com"] });

    try {
      const metadata = parseConnectionString(
        `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockMasterKey};TableEndpoint=https://${mockAccountName}.table.cosmos.windows-ppe.net:443/;`,
      );

      // The account key travels to the constructed document endpoint, so a config carrying no PPE zone
      // has to fail on a PPE account rather than fall back to a zone the account does not own.
      expect(metadata).toBe(undefined);
    } finally {
      updateConfigContext({ DOCUMENT_ENDPOINT_ZONES: originalZones });
    }
  });

  it.each([
    `AccountEndpoint=https://${mockAccountName}.documents.azure.com.attacker.example:443/;AccountKey=${mockMasterKey};`,
    `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.documents.azure.com.attacker.example:10255`,
    `mongodb://${mockAccountName}:${mockMasterKey}@${mockAccountName}.mongo.cosmos.azure.com.attacker.example:10255`,
    `AccountEndpoint=${mockAccountName}.cassandra.cosmosdb.azure.com.attacker.example;AccountKey=${mockMasterKey};`,
    `DefaultEndpointsProtocol=https;AccountName=${mockAccountName};AccountKey=${mockMasterKey};TableEndpoint=https://${mockAccountName}.table.cosmosdb.azure.com.attacker.example:443/;`,
  ])("should not accept a host that only begins with a known zone: %s", (connectionString: string) => {
    // The zone list is what keeps the account key from being sent somewhere arbitrary, so a host that
    // appends to an allowed zone must not pass as that zone.
    expect(parseConnectionString(connectionString)).toBe(undefined);
  });

  it("should fail to parse an invalid connection string", () => {
    const metadata = parseConnectionString("some-rogue-connection-string");

    expect(metadata).toBe(undefined);
  });

  it("should fail to parse an empty connection string", () => {
    const metadata = parseConnectionString("");

    expect(metadata).toBe(undefined);
  });

  describe("dnsZoneAlternation", () => {
    it("should escape the dots in a zone", () => {
      expect(dnsZoneAlternation(["documents.azure.com"])).toBe("(documents\\.azure\\.com)(?=[:/\\s]|$)");
    });

    it("should join multiple zones into a single alternation", () => {
      expect(dnsZoneAlternation(["a.example", "b.test"])).toBe("(a\\.example|b\\.test)(?=[:/\\s]|$)");
    });

    it("should not let the dots match arbitrary characters", () => {
      // An unescaped dot would make the zone list match hosts that only resemble a real zone.
      const regex = RegExp(dnsZoneAlternation(["documents.azure.com"]));

      expect(regex.test("documents.azure.com")).toBe(true);
      expect(regex.test("documentsXazure.com")).toBe(false);
    });

    it("should capture the zone that matched", () => {
      const regex = RegExp(dnsZoneAlternation(["a.example", "b.test"]));

      expect("account.b.test".match(regex)[1]).toBe("b.test");
    });

    it("should require the zone to run to the end of the host", () => {
      const regex = RegExp(dnsZoneAlternation(["documents.azure.com"]));

      expect(regex.test("account.documents.azure.com")).toBe(true);
      expect(regex.test("account.documents.azure.com:443/")).toBe(true);
      expect(regex.test("account.documents.azure.com/")).toBe(true);
      // Without this the zone list stops being an allowlist, since anything can be appended to a zone.
      expect(regex.test("account.documents.azure.com.attacker.example")).toBe(false);
    });
  });

  describe("buildEndpointsRegex", () => {
    it("should build a pattern for every api matched by dns zone", () => {
      expect(Object.keys(buildEndpointsRegex())).toEqual(["sql", "mongo", "mongoCompute", "cassandra", "table"]);
    });

    it("should build a cassandra pattern for each supported key", () => {
      const { cassandra } = buildEndpointsRegex();

      expect(cassandra).toHaveLength(2);
      expect(cassandra[0]).toContain("AccountEndpoint=");
      expect(cassandra[1]).toContain("HostName=");
    });

    it("should build each pattern from its own zone list", () => {
      // The patterns are near identical, so a zone list wired to the wrong api would be easy to miss in
      // review and would let an account of one api be parsed as another.
      const { sql, mongo, mongoCompute, cassandra, table } = buildEndpointsRegex();

      expect(sql).toContain(dnsZoneAlternation(configContext.SQL_DNS_ZONES));
      expect(mongo).toContain(dnsZoneAlternation(configContext.MONGO_DNS_ZONES));
      expect(mongoCompute).toContain(dnsZoneAlternation(configContext.MONGO_COMPUTE_DNS_ZONES));
      cassandra.forEach((pattern) => expect(pattern).toContain(dnsZoneAlternation(configContext.CASSANDRA_DNS_ZONES)));
      expect(table).toContain(dnsZoneAlternation(configContext.TABLE_DNS_ZONES));
    });
  });

  describe("selectEndpointZone", () => {
    const nonPpeZone = "documents.azure.com";
    const ppeZone = "documents-staging.windows-ppe.net";

    it("should pick the ppe zone for a ppe account", () => {
      expect(selectEndpointZone([nonPpeZone, ppeZone], true)).toBe(ppeZone);
    });

    it("should pick the non ppe zone for a non ppe account", () => {
      expect(selectEndpointZone([nonPpeZone, ppeZone], false)).toBe(nonPpeZone);
    });

    it("should not depend on the order of the zones", () => {
      expect(selectEndpointZone([ppeZone, nonPpeZone], true)).toBe(ppeZone);
      expect(selectEndpointZone([ppeZone, nonPpeZone], false)).toBe(nonPpeZone);
    });

    it("should return undefined when no zone matches the kind of account", () => {
      // Sovereign configs carry no ppe zone, and a ppe only config carries no non ppe zone.
      expect(selectEndpointZone([nonPpeZone], true)).toBeUndefined();
      expect(selectEndpointZone([ppeZone], false)).toBeUndefined();
    });

    it("should return undefined for an empty zone list", () => {
      expect(selectEndpointZone([], false)).toBeUndefined();
    });
  });
});
