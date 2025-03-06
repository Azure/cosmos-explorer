import { Stack } from "@fluentui/react";
import { FullTextIndex, FullTextPolicy } from "Contracts/DataModels";
import { CollapsibleSectionComponent } from "Explorer/Controls/CollapsiblePanel/CollapsibleSectionComponent";
import { FullTextPoliciesComponent } from "Explorer/Controls/FullTextSeach/FullTextPoliciesComponent";
import { scrollToSection } from "Explorer/Panes/AddCollectionPanel/AddCollectionPanelUtility";
import React from "react";

export interface AddMVFullTextSearchComponentProps {
  fullTextPolicy: FullTextPolicy;
  setFullTextPolicy: React.Dispatch<React.SetStateAction<FullTextPolicy>>;
  setFullTextIndexes: React.Dispatch<React.SetStateAction<FullTextIndex[]>>;
  setFullTextPolicyValidated: React.Dispatch<React.SetStateAction<boolean>>;
}
export const AddMVFullTextSearchComponent = (props: AddMVFullTextSearchComponentProps): JSX.Element => {
  const { fullTextPolicy, setFullTextPolicy, setFullTextIndexes, setFullTextPolicyValidated } = props;

  return (
    <Stack>
      <CollapsibleSectionComponent
        title="Container Full Text Search Policy"
        isExpandedByDefault={false}
        onExpand={() => {
          scrollToSection("collapsibleFullTextPolicySectionContent");
        }}
      >
        <Stack id="collapsibleFullTextPolicySectionContent" styles={{ root: { position: "relative" } }}>
          <Stack styles={{ root: { paddingLeft: 40 } }}>
            <FullTextPoliciesComponent
              fullTextPolicy={fullTextPolicy}
              onFullTextPathChange={(
                fullTextPolicy: FullTextPolicy,
                fullTextIndexes: FullTextIndex[],
                fullTextPolicyValidated: boolean,
              ) => {
                setFullTextPolicy(fullTextPolicy);
                setFullTextIndexes(fullTextIndexes);
                setFullTextPolicyValidated(fullTextPolicyValidated);
              }}
            />
          </Stack>
        </Stack>
      </CollapsibleSectionComponent>
    </Stack>
  );
};
