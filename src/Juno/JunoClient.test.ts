import { HttpStatusCodes } from "../Common/Constants";
import { IPinnedRepo, JunoClient } from "./JunoClient";

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
  const junoClient = new JunoClient();

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
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const callback = jest.fn().mockImplementation(() => {});

    junoClient.subscribeToPinnedRepos(callback);
    const response = await junoClient.updatePinnedRepos(samplePinnedRepos);

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(callback).toHaveBeenCalledWith(samplePinnedRepos);
  });

  it("getPinnedRepos invokes pinned repos subscribers", async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const callback = jest.fn().mockImplementation(() => {});

    junoClient.subscribeToPinnedRepos(callback);
    const response = await junoClient.getPinnedRepos("scope");

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(callback).toHaveBeenCalledWith(samplePinnedRepos);
  });
});

describe("GitHub", () => {
  const junoClient = new JunoClient();

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
    expect(window.fetch).toHaveBeenCalled();

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
    expect(window.fetch).toHaveBeenCalled();

    const fetchUrlParams = new URLSearchParams(new URL(fetchUrl).search);
    let fetchUrlParamsCount = 0;
    fetchUrlParams.forEach(() => fetchUrlParamsCount++);

    expect(fetchUrlParamsCount).toBe(2);
    expect(fetchUrlParams.get("access_token")).toBeDefined();
    expect(fetchUrlParams.get("client_id")).toBeDefined();
  });
});
