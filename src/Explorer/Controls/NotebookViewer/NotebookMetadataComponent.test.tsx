import { shallow } from "enzyme";
import React from "react";
import { NotebookMetadataComponent, NotebookMetadataComponentProps } from "./NotebookMetadataComponent";

describe("NotebookMetadataComponent", () => {
  it("renders un-liked notebook", () => {
    const props: NotebookMetadataComponentProps = {
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
        views: 0
      },
      isFavorite: false,
      downloadButtonText: "Download",
      onTagClick: undefined,
      onDownloadClick: undefined,
      onFavoriteClick: undefined,
      onUnfavoriteClick: undefined
    };

    const wrapper = shallow(<NotebookMetadataComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  it("renders liked notebook", () => {
    const props: NotebookMetadataComponentProps = {
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
        views: 0
      },
      isFavorite: true,
      downloadButtonText: "Download",
      onTagClick: undefined,
      onDownloadClick: undefined,
      onFavoriteClick: undefined,
      onUnfavoriteClick: undefined
    };

    const wrapper = shallow(<NotebookMetadataComponent {...props} />);
    expect(wrapper).toMatchSnapshot();
  });

  // TODO Add test for metadata display
});
