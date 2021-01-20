import { shallow } from "enzyme";
import React from "react";
import { GalleryCardComponent, GalleryCardComponentProps } from "./GalleryCardComponent";

describe("GalleryCardComponent", () => {
  it("renders", () => {
    const props: GalleryCardComponentProps = {
      data: {
        id: "id",
        name: "name",
        description: "description",
        author: "author",
        thumbnailUrl: "thumbnailUrl",
        created: "created",
        gitSha: "gitSha",
        tags: ["tag"],
        isSample: false,
        downloads: 0,
        favorites: 0,
        views: 0,
        newCellId: undefined,
        policyViolations: undefined,
        pendingScanJobIds: undefined,
      },
      isFavorite: false,
      showDownload: true,
      showDelete: true,
      onClick: undefined,
      onTagClick: undefined,
      onFavoriteClick: undefined,
      onUnfavoriteClick: undefined,
      onDownloadClick: undefined,
      onDeleteClick: undefined,
    };

    const wrapper = shallow(<GalleryCardComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });
});
