import { useDatabases } from "Explorer/useDatabases";
import React, { useEffect, useState } from "react";
import CosmosDBIcon from "../../../images/Azure-Cosmos-DB.svg";
import CollectionIcon from "../../../images/tree-collection.svg";
import * as ViewModels from "../../Contracts/ViewModels";
import { TreeComponent, TreeNode } from "../Controls/TreeComponent/TreeComponent";

export const SampleDataTree: React.FC = (): JSX.Element => {
  const sampleDataResourceTokenCollection: ViewModels.CollectionBase = useDatabases(
    (state) => state.sampleDataResourceTokenCollection
  );

  const [root, setRoot] = useState<TreeNode | undefined>(undefined);

  useEffect(() => {
    if (sampleDataResourceTokenCollection) {
      const updatedSampleTree: TreeNode = {
        label: sampleDataResourceTokenCollection.databaseId,
        isExpanded: true,
        iconSrc: CosmosDBIcon,
        children: [
          {
            label: sampleDataResourceTokenCollection.id(),
            iconSrc: CollectionIcon,
            isExpanded: true,
            className: "collectionHeader",
            children: [
              {
                label: "Items",
              },
            ],
          },
        ],
      };
      setRoot(updatedSampleTree);
    }
  }, [sampleDataResourceTokenCollection]);

  return (
    <>
      {root === undefined ? (
        <TreeComponent
          className="sampleDataResourceTree"
          rootNode={{
            label: "Sample data not initialized.",
          }}
        />
      ) : (
        <TreeComponent className="sampleDataResourceTree" rootNode={root} />
      )}
    </>
  );
};
