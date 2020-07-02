import ko from "knockout";
import { HttpStatusCodes } from "../Common/Constants";
import * as ViewModels from "../Contracts/ViewModels";
import { IPinnedRepo, JunoClient } from "./JunoClient";

const sampleDatabaseAccount: ViewModels.DatabaseAccount = {
  id: "id",
  name: "name",
  location: "location",
  type: "type",
  kind: "kind",
  tags: [],
  properties: {
    documentEndpoint: "documentEndpoint",
    gremlinEndpoint: "gremlinEndpoint",
    tableEndpoint: "tableEndpoint",
    cassandraEndpoint: "cassandraEndpoint",
  },
};

const samplePinnedRepos: IPinnedRepo[] = [
  {
    owner: "owner",
    name: "name",
    private: false,
    branches: [
      {
        name: "name",
      },
    ],
  },
];

describe("Pinned repos", () => {
  const junoClient = new JunoClient(ko.observable<ViewModels.DatabaseAccount>(sampleDatabaseAccount));

  beforeEach(() => {
    window.fetch = jest.fn().mockImplementation(() => {
      return {
        status: HttpStatusCodes.OK,
        text: () => JSON.stringify(samplePinnedRepos),
      };
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("updatePinnedRepos invokes pinned repos subscribers", async () => {
    const callback = jest.fn().mockImplementation((pinnedRepos: IPinnedRepo[]) => {});

    junoClient.subscribeToPinnedRepos(callback);
    const response = await junoClient.updatePinnedRepos(samplePinnedRepos);

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(callback).toBeCalledWith(samplePinnedRepos);
  });

  it("getPinnedRepos invokes pinned repos subscribers", async () => {
    const callback = jest.fn().mockImplementation((pinnedRepos: IPinnedRepo[]) => {});

    junoClient.subscribeToPinnedRepos(callback);
    const response = await junoClient.getPinnedRepos("scope");

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(callback).toBeCalledWith(samplePinnedRepos);
  });
});

describe("GitHub", () => {
  const junoClient = new JunoClient(ko.observable<ViewModels.DatabaseAccount>(sampleDatabaseAccount));

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("getGitHubToken", async () => {
    let fetchUrl: string;
    window.fetch = jest.fn().mockImplementation((url: string) => {
      fetchUrl = url;

      return {
        status: HttpStatusCodes.OK,
        text: () => JSON.stringify({ access_token: "token" }),
      };
    });

    const response = await junoClient.getGitHubToken("code");

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(response.data.access_token).toBeDefined();
    expect(window.fetch).toBeCalled();

    const fetchUrlParams = new URLSearchParams(new URL(fetchUrl).search);
    let fetchUrlParamsCount = 0;
    fetchUrlParams.forEach(() => fetchUrlParamsCount++);

    expect(fetchUrlParamsCount).toBe(2);
    expect(fetchUrlParams.get("code")).toBeDefined();
    expect(fetchUrlParams.get("client_id")).toBeDefined();
  });

  it("deleteAppauthorization", async () => {
    let fetchUrl: string;
    window.fetch = jest.fn().mockImplementation((url: string) => {
      fetchUrl = url;

      return {
        status: HttpStatusCodes.NoContent,
        text: () => undefined as string,
      };
    });

    const response = await junoClient.deleteAppAuthorization("token");

    expect(response.status).toBe(HttpStatusCodes.NoContent);
    expect(window.fetch).toBeCalled();

    const fetchUrlParams = new URLSearchParams(new URL(fetchUrl).search);
    let fetchUrlParamsCount = 0;
    fetchUrlParams.forEach(() => fetchUrlParamsCount++);

    expect(fetchUrlParamsCount).toBe(2);
    expect(fetchUrlParams.get("access_token")).toBeDefined();
    expect(fetchUrlParams.get("client_id")).toBeDefined();
  });
});
