import { shallow } from "enzyme";
import React from "react";
import { GalleryViewerComponent, GalleryViewerComponentProps, GalleryTab, SortBy } from "./GalleryViewerComponent";

describe("GalleryViewerComponent", () => {
  it("renders", () => {
    const props: GalleryViewerComponentProps = {
      junoClient: undefined,
      selectedTab: GalleryTab.OfficialSamples,
      sortBy: SortBy.MostViewed,
      searchText: undefined,
      onSelectedTabChange: undefined,
      onSortByChange: undefined,
      onSearchTextChange: undefined
    };

    const wrapper = shallow(<GalleryViewerComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
