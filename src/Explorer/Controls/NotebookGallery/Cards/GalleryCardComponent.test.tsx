import React from "react";
import { shallow } from "enzyme";
import { GalleryCardComponent, GalleryCardComponentProps } from "./GalleryCardComponent";

describe("GalleryCardComponent", () => {
  it("renders", () => {
    const props: GalleryCardComponentProps = {
      name: "mycard",
      url: "url",
      notebookMetadata: undefined,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      onClick: () => {}
    };

    const wrapper = shallow(<GalleryCardComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
