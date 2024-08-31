import { Constants, isResourceValid, ResourceType } from "../../common";
import { getEmptyCosmosDiagnostics, withDiagnostics } from "../../utils/diagnostics";
import { OfferResponse } from "./OfferResponse";
/**
 * Use to read or replace an existing {@link Offer} by id.
 *
 * @see {@link Offers} to query or read all offers.
 */
export class Offer {
    /**
     * Returns a reference URL to the resource. Used for linking in Permissions.
     */
    get url() {
        return `/${Constants.Path.OffersPathSegment}/${this.id}`;
    }
    /**
     * @hidden
     * @param client - The parent {@link CosmosClient} for the Database Account.
     * @param id - The id of the given {@link Offer}.
     */
    constructor(client, id, clientContext) {
        this.client = client;
        this.id = id;
        this.clientContext = clientContext;
    }
    /**
     * Read the {@link OfferDefinition} for the given {@link Offer}.
     */
    async read(options) {
        return withDiagnostics(async (diagnosticNode) => {
            const response = await this.clientContext.read({
                path: this.url,
                resourceType: ResourceType.offer,
                resourceId: this.id,
                options,
                diagnosticNode,
            });
            return new OfferResponse(response.result, response.headers, response.code, getEmptyCosmosDiagnostics(), this);
        }, this.clientContext);
    }
    /**
     * Replace the given {@link Offer} with the specified {@link OfferDefinition}.
     * @param body - The specified {@link OfferDefinition}
     */
    async replace(body, options) {
        return withDiagnostics(async (diagnosticNode) => {
            const err = {};
            if (!isResourceValid(body, err)) {
                throw err;
            }
            const response = await this.clientContext.replace({
                body,
                path: this.url,
                resourceType: ResourceType.offer,
                resourceId: this.id,
                options,
                diagnosticNode,
            });
            return new OfferResponse(response.result, response.headers, response.code, getEmptyCosmosDiagnostics(), this);
        }, this.clientContext);
    }
}
//# sourceMappingURL=Offer.js.map