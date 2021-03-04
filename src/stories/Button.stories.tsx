import React from "react";
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from "@storybook/react/types-6-0";
import {
  DeleteCollectionConfirmationPanel,
  DeleteCollectionConfirmationPanelProps,
} from "../Explorer/Panes/DeleteCollectionConfirmationPanel";

export default {
  title: "Panel/DeleteCollection",
  component: DeleteCollectionConfirmationPanel,
} as Meta;

const Template: Story<DeleteCollectionConfirmationPanelProps> = (args) => (
  <DeleteCollectionConfirmationPanel {...args} />
);

export const Default = Template.bind({});
Default.args = {
  explorer: {
    isCollection: true,
    isLastCollection: () => false,
  },
  label: "Delete Collection Pane",
};

export const LastCollection = Template.bind({});
LastCollection.args = {
  explorer: {
    isCollection: true,
    isLastCollection: () => true,
    isSelectedDatabaseShared: () => false,
  },
  label: "Delete Collection Pane",
};
