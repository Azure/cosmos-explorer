import React from "react";
import { shallow } from "enzyme";
import {
  GalleryViewerContainerComponent,
  GalleryViewerContainerComponentProps,
  FullWidthTabs,
  FullWidthTabsProps,
  GalleryCardsComponent,
  GalleryCardsComponentProps,
  GalleryViewerComponent,
  GalleryViewerComponentProps
} from "./GalleryViewerComponent";

describe("GalleryCardsComponent", () => {
  it("renders", () => {
    // TODO Mock this
    const props: GalleryCardsComponentProps = {
      data: [],
      userMetadata: undefined,
      onNotebookMetadataChange: () => Promise.resolve(),
      onClick: () => Promise.resolve()
    };

    const wrapper = shallow(<GalleryCardsComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("FullWidthTabs", () => {
  it("renders", () => {
    const props: FullWidthTabsProps = {
      officialSamplesContent: [],
      likedNotebooksContent: [],
      userMetadata: undefined,
      onClick: () => Promise.resolve()
    };

    const wrapper = shallow(<FullWidthTabs {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("GalleryViewerContainerComponent", () => {
  it("renders", () => {
    const props: GalleryViewerContainerComponentProps = {
      container: undefined
    };

    const wrapper = shallow(<GalleryViewerContainerComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});

describe("GalleryCardComponent", () => {
  it("renders", () => {
    const props: GalleryViewerComponentProps = {
      container: undefined,
      officialSamplesData: [],
      likedNotebookData: undefined
    };

    const wrapper = shallow(<GalleryViewerComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
