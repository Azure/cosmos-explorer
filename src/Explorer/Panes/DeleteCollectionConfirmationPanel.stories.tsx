import React from "react";
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from "@storybook/react/types-6-0";

import {
  DeleteCollectionConfirmationPanel,
  DeleteCollectionConfirmationPanelProps,
} from "./DeleteCollectionConfirmationPanel";

export default {
  title: "Example/Button",
  component: DeleteCollectionConfirmationPanel,
  argTypes: {
    backgroundColor: { control: "color" },
  },
} as Meta;

const Template: Story<DeleteCollectionConfirmationPanelProps> = (args) => (
  <DeleteCollectionConfirmationPanel {...args} />
);

export const Primary = Template.bind({});
Primary.args = {
  explorer: {},
  label: "Delete Collection Pane",
};
