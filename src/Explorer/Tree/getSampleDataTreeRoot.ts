import { useDatabases } from "Explorer/useDatabases";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import * as ViewModels from "../../Contracts/ViewModels";
import { TreeNode } from "../Controls/TreeComponent/TreeComponent";

export function getSampleDataTreeRoot(): TreeNode {
    const sampleDataResourceTokenCollection: ViewModels.CollectionBase = useDatabases((state) => state.sampleDataResourceTokenCollection);

    // TODO: fix the race condition that fails to render after updating sampleDataResourceTokenCollection
    if (!sampleDataResourceTokenCollection) {
        return {
            label: "Sample data not initialized."
        };
    }

    const containerId = sampleDataResourceTokenCollection.id();
    const databaseId = sampleDataResourceTokenCollection.databaseId;

    return {
        label: databaseId,
        isExpanded: true,
        iconSrc: CosmosDBIcon,
        children: [
            {
                label: containerId,
                iconSrc: CollectionIcon,
                isExpanded: true,
                className: "collectionHeader",
                children: [
                    {
                        label: "Items"
                    }
                ]
            }
        ]
    }
}
