import { allowedJunoOrigins, validateEndpoint } from "Utils/EndpointUtils";
import { HttpHeaders, HttpStatusCodes } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import * as DataModels from "../Contracts/DataModels";
import { userContext } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";

export interface IJunoResponse<T> {
  status: number;
  data: T;
}

export interface IGalleryItem {
  id: string;
  name: string;
  description: string;
  gitSha: string;
  tags: string[];
  author: string;
  thumbnailUrl: string;
  created: string;
  isSample: boolean;
  downloads: number;
  favorites: number;
  views: number;
  newCellId: string;
  policyViolations: string[];
  pendingScanJobIds: string[];
}

export class JunoClient {
  public async increaseNotebookViews(id: string): Promise<IJunoResponse<IGalleryItem>> {
    const response = await window.fetch(`${this.getNotebooksUrl()}/gallery/${id}/views`, {
      method: "PATCH",
    });

    let data: IGalleryItem;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data,
    };
  }

  public async requestSchema(
    schemaRequest: DataModels.ISchemaRequest,
  ): Promise<IJunoResponse<DataModels.ISchemaRequest>> {
    const response = await window.fetch(`${this.getAnalyticsUrl()}/schema/request`, {
      method: "POST",
      body: JSON.stringify(schemaRequest),
      headers: JunoClient.getHeaders(),
    });

    let data: DataModels.ISchemaRequest;
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data,
    };
  }

  public async getSchema(
    subscriptionId: string,
    resourceGroup: string,
    accountName: string,
    databaseName: string,
    containerName: string,
  ): Promise<IJunoResponse<DataModels.ISchema>> {
    const response = await window.fetch(
      `${this.getAnalyticsUrl()}/subscriptions/${subscriptionId}/resourceGroups/${resourceGroup}/databaseAccounts/${accountName}/schema/${databaseName}/${containerName}`,
      {
        method: "GET",
        headers: JunoClient.getHeaders(),
      },
    );

    let data: DataModels.ISchema;

    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data,
    };
  }

  private async getNotebooks(input: RequestInfo, init?: RequestInit): Promise<IJunoResponse<IGalleryItem[]>> {
    const response = await window.fetch(input, init);

    let data: IGalleryItem[];
    if (response.status === HttpStatusCodes.OK) {
      data = await response.json();
    }

    return {
      status: response.status,
      data,
    };
  }

  // public for tests
  public static getJunoEndpoint(): string {
    const junoEndpoint = userContext.features.junoEndpoint ?? configContext.JUNO_ENDPOINT;
    if (!validateEndpoint(junoEndpoint, allowedJunoOrigins)) {
      const error = `${junoEndpoint} not allowed as juno endpoint`;
      console.error(error);
      throw new Error(error);
    }

    return junoEndpoint;
  }

  private getNotebooksUrl(): string {
    return `${JunoClient.getJunoEndpoint()}/api/notebooks`;
  }

  private getAnalyticsUrl(): string {
    return `${JunoClient.getJunoEndpoint()}/api/analytics`;
  }

  private static getHeaders(): HeadersInit {
    const authorizationHeader = getAuthorizationHeader();
    return {
      [authorizationHeader.header]: authorizationHeader.token,
      [HttpHeaders.contentType]: "application/json",
    };
  }
}
