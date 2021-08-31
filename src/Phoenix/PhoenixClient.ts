import { HttpHeaders } from "../Common/Constants";
import { configContext } from "../ConfigContext";
import { userContext } from "../UserContext";
import { getAuthorizationHeader } from "../Utils/AuthorizationUtils";

export interface IPhoenixResponse<T> {
    status: number;
    data: T;
}
export interface IPhoenixConnectionInfoResult {
    /* Specifies auth token used for connecting to container. */
    readonly notebookServerToken?: string;
    /* Specifies the endpoint of container server. */
    readonly forwardingId?: string;
}
export interface IProvosionData {
    cosmosEndpoint: string;
    resourceId: string;
    dbAccountName: string;
    aadToken: string;
    resourceGroup: string;
    subscriptionId: string;
}
export class PhoenixClient {
    /* Retrieves the connection info of the Container */
    public async containerConnectionInfo(
        provisionData: IProvosionData
    ): Promise<IPhoenixResponse<IPhoenixConnectionInfoResult>> {
        const response = await window.fetch(`${this.getPhoenixContainerPoolingEndPoint()}/provision`, {
            method: "POST",
            headers: PhoenixClient.getHeaders(),
            body: JSON.stringify(provisionData),
        });
        return {
            status: response.status,
            data: await response.json(),
        };
    }

    public static getPhoenixEndpoint(): string {
        const junoEndpoint = userContext.features.junoEndpoint ?? configContext.JUNO_ENDPOINT;
        if (configContext.allowedJunoOrigins.indexOf(new URL(junoEndpoint).origin) === -1) {
            const error = `${junoEndpoint} not allowed as juno endpoint`;
            console.error(error);
            throw new Error(error);
        }

        return junoEndpoint;
    }

    public getPhoenixContainerPoolingEndPoint(): string {
        return `${PhoenixClient.getPhoenixEndpoint()}/api/containerpooling`;
    }
    private static getHeaders(): HeadersInit {
        const authorizationHeader = getAuthorizationHeader();
        return {
            [authorizationHeader.header]: authorizationHeader.token,
            [HttpHeaders.contentType]: "application/json",
        };
    }
}
