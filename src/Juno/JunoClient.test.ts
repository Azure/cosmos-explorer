import { HttpHeaders, HttpStatusCodes } from "../Common/Constants";
import { DatabaseAccount } from "../Contracts/DataModels";
import { updateUserContext, userContext } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";
import { IPinnedRepo, IPublishNotebookRequest, JunoClient } from "./JunoClient";

const sampleSubscriptionId = "subscriptionId";

const sampleDatabaseAccount: DatabaseAccount = {
  id: "id",
  name: "name",
  location: "location",
  type: "type",
  kind: "kind",
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
    expect(callback).toBeCalledWith(samplePinnedRepos);
  });

  it("getPinnedRepos invokes pinned repos subscribers", async () => {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    const callback = jest.fn().mockImplementation(() => {});

    junoClient.subscribeToPinnedRepos(callback);
    const response = await junoClient.getPinnedRepos("scope");

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(callback).toBeCalledWith(samplePinnedRepos);
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

describe("Gallery", () => {
  const junoClient = new JunoClient();
  const originalSubscriptionId = userContext.subscriptionId;

  beforeAll(() => {
    updateUserContext({
      databaseAccount: {
        name: "name",
      } as DatabaseAccount,
      subscriptionId: sampleSubscriptionId,
    });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    updateUserContext({ subscriptionId: originalSubscriptionId });
  });

  it("getSampleNotebooks", async () => {
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.getSampleNotebooks();

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(`${JunoClient.getJunoEndpoint()}/api/notebooks/gallery/samples`, undefined);
  });

  it("getPublicNotebooks", async () => {
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.getPublicNotebooks();

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(`${JunoClient.getJunoEndpoint()}/api/notebooks/gallery/public`, undefined);
  });

  it("getNotebook", async () => {
    const id = "id";
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.getNotebookInfo(id);

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(`${JunoClient.getJunoEndpoint()}/api/notebooks/gallery/${id}`);
  });

  it("getNotebookContent", async () => {
    const id = "id";
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      text: () => undefined as undefined,
    });

    const response = await junoClient.getNotebookContent(id);

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(`${JunoClient.getJunoEndpoint()}/api/notebooks/gallery/${id}/content`);
  });

  it("increaseNotebookViews", async () => {
    const id = "id";
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });
    const response = await junoClient.increaseNotebookViews(id);

    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(`${JunoClient.getJunoEndpoint()}/api/notebooks/gallery/${id}/views`, {
      method: "PATCH",
    });
  });

  it("increaseNotebookDownloadCount", async () => {
    const id = "id";
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.increaseNotebookDownloadCount(id);

    const authorizationHeader = getAuthorizationHeader();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(
      `${JunoClient.getJunoEndpoint()}/api/notebooks/subscriptions/${sampleSubscriptionId}/databaseAccounts/${
        sampleDatabaseAccount.name
      }/gallery/${id}/downloads`,
      {
        method: "PATCH",
        headers: {
          [authorizationHeader.header]: authorizationHeader.token,
          [HttpHeaders.contentType]: "application/json",
        },
      },
    );
  });

  it("favoriteNotebook", async () => {
    const id = "id";
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.favoriteNotebook(id);

    const authorizationHeader = getAuthorizationHeader();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(
      `${JunoClient.getJunoEndpoint()}/api/notebooks/subscriptions/${sampleSubscriptionId}/databaseAccounts/${
        sampleDatabaseAccount.name
      }/gallery/${id}/favorite`,
      {
        method: "PATCH",
        headers: {
          [authorizationHeader.header]: authorizationHeader.token,
          [HttpHeaders.contentType]: "application/json",
        },
      },
    );
  });

  it("unfavoriteNotebook", async () => {
    const id = "id";
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.unfavoriteNotebook(id);

    const authorizationHeader = getAuthorizationHeader();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(
      `${JunoClient.getJunoEndpoint()}/api/notebooks/subscriptions/${sampleSubscriptionId}/databaseAccounts/${
        sampleDatabaseAccount.name
      }/gallery/${id}/unfavorite`,
      {
        method: "PATCH",
        headers: {
          [authorizationHeader.header]: authorizationHeader.token,
          [HttpHeaders.contentType]: "application/json",
        },
      },
    );
  });

  it("getFavoriteNotebooks", async () => {
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.getFavoriteNotebooks();

    const authorizationHeader = getAuthorizationHeader();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(
      `${JunoClient.getJunoEndpoint()}/api/notebooks/subscriptions/${sampleSubscriptionId}/databaseAccounts/${
        sampleDatabaseAccount.name
      }/gallery/favorites`,
      {
        headers: {
          [authorizationHeader.header]: authorizationHeader.token,
          [HttpHeaders.contentType]: "application/json",
        },
      },
    );
  });

  it("getPublishedNotebooks", async () => {
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.getPublishedNotebooks();

    const authorizationHeader = getAuthorizationHeader();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(
      `${JunoClient.getJunoEndpoint()}/api/notebooks/subscriptions/${sampleSubscriptionId}/databaseAccounts/${
        sampleDatabaseAccount.name
      }/gallery/published`,
      {
        headers: {
          [authorizationHeader.header]: authorizationHeader.token,
          [HttpHeaders.contentType]: "application/json",
        },
      },
    );
  });

  it("deleteNotebook", async () => {
    const id = "id";
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.deleteNotebook(id);

    const authorizationHeader = getAuthorizationHeader();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(
      `${JunoClient.getJunoEndpoint()}/api/notebooks/subscriptions/${sampleSubscriptionId}/databaseAccounts/${
        sampleDatabaseAccount.name
      }/gallery/${id}`,
      {
        method: "DELETE",
        headers: {
          [authorizationHeader.header]: authorizationHeader.token,
          [HttpHeaders.contentType]: "application/json",
        },
      },
    );
  });

  it("publishNotebook", async () => {
    const name = "name";
    const description = "description";
    const tags = ["tag"];
    const thumbnailUrl = "thumbnailUrl";
    const content = `{ "key": "value" }`;
    const addLinkToNotebookViewer = true;
    window.fetch = jest.fn().mockReturnValue({
      status: HttpStatusCodes.OK,
      json: () => undefined as undefined,
    });

    const response = await junoClient.publishNotebook(name, description, tags, thumbnailUrl, content);

    const authorizationHeader = getAuthorizationHeader();
    expect(response.status).toBe(HttpStatusCodes.OK);
    expect(window.fetch).toBeCalledWith(
      `${JunoClient.getJunoEndpoint()}/api/notebooks/subscriptions/${sampleSubscriptionId}/databaseAccounts/${
        sampleDatabaseAccount.name
      }/gallery`,
      {
        method: "PUT",
        headers: {
          [authorizationHeader.header]: authorizationHeader.token,
          [HttpHeaders.contentType]: "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          tags,
          thumbnailUrl,
          content: JSON.parse(content),
          addLinkToNotebookViewer,
        } as IPublishNotebookRequest),
      },
    );
  });
});
