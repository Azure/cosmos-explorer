import { shallow } from "enzyme";
import { PassedPromptProps } from "./Prompt";
import { promptContent } from "./PromptContent";

describe("PromptContent", () => {
  it("renders for busy status", () => {
    const props: PassedPromptProps = {
      id: "id",
      contentRef: "contentRef",
      status: "busy",
    };
    const wrapper = shallow(promptContent(props));

    expect(wrapper).toMatchSnapshot();
  });

  it("renders when hovered", () => {
    const props: PassedPromptProps = {
      id: "id",
      contentRef: "contentRef",
      isHovered: true,
    };
    const wrapper = shallow(promptContent(props));

    expect(wrapper).toMatchSnapshot();
  });
});
