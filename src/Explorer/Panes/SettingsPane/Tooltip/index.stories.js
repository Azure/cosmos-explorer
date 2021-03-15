import React from "react";
import { Tooltip } from ".";

export default {
  title: "Tooltip",
  component: Tooltip,
};

const Template = (args) => <Tooltip {...args} />;

export const Default = Template.bind({});

Default.args = {
  children:
    "Choose Custom to specify a fixed amount of query results to show, or choose Unlimited to show as many query results per page.",
};
