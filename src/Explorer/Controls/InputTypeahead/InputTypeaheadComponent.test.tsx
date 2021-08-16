import { shallow } from "enzyme";
import React from "react";
import { InputTypeaheadComponent, InputTypeaheadComponentProps } from "./InputTypeaheadComponent";

describe("inputTypeahead", () => {
  it("renders <input />", () => {
    const props: InputTypeaheadComponentProps = {
      choices: [
        { caption: "item1", value: "value1" },
        { caption: "item2", value: "value2" },
      ],
      placeholder: "placeholder",
      useTextarea: false,
    };

    const wrapper = shallow(<InputTypeaheadComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders <textarea />", () => {
    const props: InputTypeaheadComponentProps = {
      choices: [
        { caption: "item1", value: "value1" },
        { caption: "item2", value: "value2" },
      ],
      placeholder: "placeholder",
      useTextarea: true,
    };

    const wrapper = shallow(<InputTypeaheadComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
