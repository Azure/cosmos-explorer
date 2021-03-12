import React from "react";
import { SettingsPaneR } from ".";

//👇 This default export determines where your story goes in the story list
export default {
  title: "SettingsPaneR",
  component: SettingsPaneR,
};

//👇 We create a “template” of how args map to rendering
const Template = (args) => <SettingsPaneR {...args} />;

export const FirstStory = Template.bind({});

FirstStory.args = {
  /*👇 The args you need here will depend on your component */
};
