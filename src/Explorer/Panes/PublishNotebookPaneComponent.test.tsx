import { shallow } from "enzyme";
import React from "react";
import { PublishNotebookPaneComponent, PublishNotebookPaneProps } from "./PublishNotebookPaneComponent";

describe("PublishNotebookPaneComponent", () => {
  it("renders", () => {
    const props: PublishNotebookPaneProps = {
      notebookName: "SampleNotebook.ipynb",
      notebookDescription: "sample description",
      notebookTags: "tag1, tag2",
      notebookAuthor: "CosmosDB",
      notebookCreatedDate: "2020-07-17T00:00:00Z",
      notebookObject: undefined,
      notebookParentDomElement: undefined,
      onChangeDescription: undefined,
      onChangeTags: undefined,
      onChangeImageSrc: undefined,
      onError: undefined,
      clearFormError: undefined
    };

    const wrapper = shallow(<PublishNotebookPaneComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
