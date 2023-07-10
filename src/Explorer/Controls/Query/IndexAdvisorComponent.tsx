import {
  Checkbox,
  CheckboxVisibility,
  DetailsHeader,
  DetailsList,
  IDetailsHeaderProps,
  IDetailsListCheckboxProps,
  IRenderFunction,
  Stack,
  Text
} from "@fluentui/react";
import React from "react";

interface IndexAdvisorComponentProps { };

export const IndexAdvisorComponent: React.FC = (): JSX.Element => {

  const onRenderCheckbox = (props: IDetailsListCheckboxProps, _defaultRender?: IRenderFunction<IDetailsListCheckboxProps>) => {
    return <Checkbox {...props} />;
  };

  const onRenderDetailsHeader = (props: IDetailsHeaderProps, _defaultRender?: IRenderFunction<IDetailsHeaderProps>) => {
    return <DetailsHeader {...props} ariaLabelForSelectAllCheckbox="Select all" />;
  };

  return (
    <Stack>
      <Text>
        Here is an analysis on the indexes utilized for executing this query.
        Based on the analysis, Cosmos DB recommends adding the selected index(es) to your indexing policy to
        optimize your query performance.
      </Text>
      <Text>Indexes analysis</Text>
      <DetailsList
        items={[]}
        groups={[]}
        columns={[]}
        onRenderCheckbox={onRenderCheckbox}
        checkboxVisibility={CheckboxVisibility.always}
        onRenderDetailsHeader={onRenderDetailsHeader}
        groupProps={{
          showEmptyGroups: true,
        }}/>
    </Stack>
  );
};