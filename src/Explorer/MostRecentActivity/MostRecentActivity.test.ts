import { observable } from "knockout";
import { mostRecentActivity } from "./MostRecentActivity";

describe("MostRecentActivity", () => {
  const accountId = "some account";

  beforeEach(() => mostRecentActivity.clear(accountId));

  it("Has no items at first", () => {
    expect(mostRecentActivity.getItems(accountId)).toStrictEqual([]);
  });

  it("Can record collections being opened", () => {
    const collectionId = "some collection";
    const databaseId = "some database";
    const collection = {
      id: observable(collectionId),
      databaseId,
    };

    mostRecentActivity.collectionWasOpened(accountId, collection);

    const activity = mostRecentActivity.getItems(accountId);
    expect(activity).toEqual([
      expect.objectContaining({
        data: {
          collectionId,
          databaseId,
        },
      }),
    ]);
  });

  it("Can record notebooks being opened", () => {
    const name = "some notebook";
    const path = "some path";
    const notebook = { name, path };

    mostRecentActivity.notebookWasItemOpened(accountId, notebook);

    const activity = mostRecentActivity.getItems(accountId);
    expect(activity).toEqual([expect.objectContaining({ data: notebook })]);
  });

  it("Filters out duplicates", () => {
    const name = "some notebook";
    const path = "some path";
    const notebook = { name, path };
    const sameNotebook = { name, path };

    mostRecentActivity.notebookWasItemOpened(accountId, notebook);
    mostRecentActivity.notebookWasItemOpened(accountId, sameNotebook);

    const activity = mostRecentActivity.getItems(accountId);
    expect(activity.length).toEqual(1);
    expect(activity).toEqual([expect.objectContaining({ data: notebook })]);
  });

  it("Allows for multiple accounts", () => {
    const name = "some notebook";
    const path = "some path";
    const notebook = { name, path };

    const anotherNotebook = { name: "Another " + name, path };
    const anotherAccountId = "Another " + accountId;

    mostRecentActivity.notebookWasItemOpened(accountId, notebook);
    mostRecentActivity.notebookWasItemOpened(anotherAccountId, anotherNotebook);

    expect(mostRecentActivity.getItems(accountId)).toEqual([expect.objectContaining({ data: notebook })]);
    expect(mostRecentActivity.getItems(anotherAccountId)).toEqual([expect.objectContaining({ data: anotherNotebook })]);
  });

  it("Can store multiple distinct elements, in FIFO order", () => {
    const name = "some notebook";
    const path = "some path";
    const first = { name, path };
    const second = { name: "Another " + name, path };
    const third = { name, path: "Another " + path };

    mostRecentActivity.notebookWasItemOpened(accountId, first);
    mostRecentActivity.notebookWasItemOpened(accountId, second);
    mostRecentActivity.notebookWasItemOpened(accountId, third);

    const activity = mostRecentActivity.getItems(accountId);
    expect(activity).toEqual([third, second, first].map((data) => expect.objectContaining({ data })));
  });
});
