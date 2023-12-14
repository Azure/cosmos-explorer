import { HttpStatusCodes } from "../Common/Constants";
import { useDialog } from "../Explorer/Controls/Dialog";
import { GalleryTab, SortBy } from "../Explorer/Controls/NotebookGallery/GalleryViewerComponent";
import Explorer from "../Explorer/Explorer";
import { useNotebook } from "../Explorer/Notebook/useNotebook";
import { IGalleryItem, JunoClient } from "../Juno/JunoClient";
import * as GalleryUtils from "./GalleryUtils";

const galleryItem: IGalleryItem = {
  id: "id",
  name: "name",
  description: "description",
  gitSha: "gitSha",
  tags: ["tag1"],
  author: "author",
  thumbnailUrl: "thumbnailUrl",
  created: "created",
  isSample: false,
  downloads: 0,
  favorites: 0,
  views: 0,
  newCellId: undefined,
  policyViolations: undefined,
  pendingScanJobIds: undefined,
};

describe("GalleryUtils", () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it("downloadItem shows dialog in data explorer", () => {
    const container = new Explorer();
    GalleryUtils.downloadItem(container, undefined, galleryItem, undefined);

    expect(useDialog.getState().visible).toBe(true);
    expect(useDialog.getState().dialogProps).toBeDefined();
    expect(useDialog.getState().dialogProps.title).toBe(`Download to ${useNotebook.getState().notebookFolderName}`);
  });

  it("favoriteItem favorites item", async () => {
    const container = {} as Explorer;
    const junoClient = new JunoClient();
    junoClient.favoriteNotebook = jest
      .fn()
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: galleryItem }));
    const onComplete = jest.fn().mockImplementation();

    await GalleryUtils.favoriteItem(container, junoClient, galleryItem, onComplete);

    expect(junoClient.favoriteNotebook).toHaveBeenCalledWith(galleryItem.id);
    expect(onComplete).toHaveBeenCalledWith(galleryItem);
  });

  it("unfavoriteItem unfavorites item", async () => {
    const container = {} as Explorer;
    const junoClient = new JunoClient();
    junoClient.unfavoriteNotebook = jest
      .fn()
      .mockReturnValue(Promise.resolve({ status: HttpStatusCodes.OK, data: galleryItem }));
    const onComplete = jest.fn().mockImplementation();

    await GalleryUtils.unfavoriteItem(container, junoClient, galleryItem, onComplete);

    expect(junoClient.unfavoriteNotebook).toHaveBeenCalledWith(galleryItem.id);
    expect(onComplete).toHaveBeenCalledWith(galleryItem);
  });

  it("deleteItem shows dialog in data explorer", () => {
    const container = {} as Explorer;
    GalleryUtils.deleteItem(container, undefined, galleryItem, undefined);

    expect(useDialog.getState().visible).toBe(true);
    expect(useDialog.getState().dialogProps).toBeDefined();
    expect(useDialog.getState().dialogProps.title).toBe("Remove published notebook");
  });

  it("getGalleryViewerProps gets gallery viewer props correctly", () => {
    const selectedTab: GalleryTab = GalleryTab.OfficialSamples;
    const sortBy: SortBy = SortBy.MostDownloaded;
    const searchText = "my-complicated%20search%20query!!!";

    const response = GalleryUtils.getGalleryViewerProps(
      `?${GalleryUtils.GalleryViewerParams.SelectedTab}=${GalleryTab[selectedTab]}&${GalleryUtils.GalleryViewerParams.SortBy}=${SortBy[sortBy]}&${GalleryUtils.GalleryViewerParams.SearchText}=${searchText}`,
    );

    expect(response).toEqual({
      selectedTab,
      sortBy,
      searchText: decodeURIComponent(searchText),
    } as GalleryUtils.GalleryViewerProps);
  });

  it("getNotebookViewerProps gets notebook viewer props correctly", () => {
    const notebookUrl = "https%3A%2F%2Fnotebook.url";
    const galleryItemId = "1234-abcd-efgh";
    const hideInputs = "true";

    const response = GalleryUtils.getNotebookViewerProps(
      `?${GalleryUtils.NotebookViewerParams.NotebookUrl}=${notebookUrl}&${GalleryUtils.NotebookViewerParams.GalleryItemId}=${galleryItemId}&${GalleryUtils.NotebookViewerParams.HideInputs}=${hideInputs}`,
    );

    expect(response).toEqual({
      notebookUrl: decodeURIComponent(notebookUrl),
      galleryItemId,
      hideInputs: true,
    } as GalleryUtils.NotebookViewerProps);
  });

  it("getTabTitle returns correct title for official samples", () => {
    expect(GalleryUtils.getTabTitle(GalleryTab.OfficialSamples)).toBe("Official samples");
  });
});
