import * as React from "react";
import { AccordionComponent } from "../Controls/Accordion/AccordionComponent";
import Explorer from "../Explorer";
import { DatabasesResourceTree } from "./DatabasesResourceTree";
import { NotebooksResourceTree } from "./NotebooksResourceTree";

interface ResourceTreeProps {
  container: Explorer;
}

export const ResourceTree: React.FC<ResourceTreeProps> = ({ container }: ResourceTreeProps): JSX.Element => {
  return (
    <AccordionComponent>
      <DatabasesResourceTree container={container} />
      <NotebooksResourceTree container={container} />
    </AccordionComponent>
  );
};
