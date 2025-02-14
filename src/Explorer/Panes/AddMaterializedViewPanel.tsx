import { Dropdown, Stack } from "@fluentui/react";
import Explorer from "Explorer/Explorer";
import { useDatabases } from "Explorer/useDatabases";
import React from "react";

export interface AddMaterializedViewPanelProps {
  explorer: Explorer;
}
export const AddMaterializedViewPanel = (addMaterializedViewPanelProps: AddMaterializedViewPanelProps): JSX.Element => {
  console.log(useDatabases.getState().databases);
  console.log(
    useDatabases.getState().databases.forEach((db) => {
      console.log(db);
      console.log(db.collections());
    }),
  );

  return (
    <form className="panelFormWrapper" id="panelMaterializedView">
      <div className="panelMainContent">
        <Stack>
          <Dropdown
            label="Source container id"
            placeholder="Choose existing container"
            options={[]}
            required
            styles={{ title: { height: 27, lineHeight: 27 }, dropdownItem: { fontSize: 12 } }}
            style={{ width: 300, fontSize: 12 }}
          />
        </Stack>
      </div>
    </form>
  );
};
