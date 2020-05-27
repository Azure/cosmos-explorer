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
import * as DataModels from "../../../Contracts/DataModels";

describe("GalleryCardsComponent", () => {
  it("renders", () => {
    // TODO Mock this
    const props: GalleryCardsComponentProps = {
      data: [],
      userMetadata: undefined,
      onNotebookMetadataChange: (officialSamplesIndex: number, notebookMetadata: DataModels.NotebookMetadata) =>
        Promise.resolve(),
      onClick: (
        url: string,
        notebookMetadata: DataModels.NotebookMetadata,
        onNotebookMetadataChange: (newNotebookMetadata: DataModels.NotebookMetadata) => Promise<void>,
        isLikedNotebook: boolean
      ) => Promise.resolve()
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
      onClick: (
        url: string,
        notebookMetadata: DataModels.NotebookMetadata,
        onNotebookMetadataChange: (newNotebookMetadata: DataModels.NotebookMetadata) => Promise<void>,
        isLikedNotebook: boolean
      ) => Promise.resolve()
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
