import { clear, collectionWasOpened, getItems, Type } from "Explorer/MostRecentActivity/MostRecentActivity";
import { observable } from "knockout";

describe("MostRecentActivity", () => {
  const accountName = "some account";

  beforeEach(() => clear(accountName));

  it("Has no items at first", () => {
    expect(getItems(accountName)).toStrictEqual([]);
  });

  it("Can record collections being opened", () => {
    const collectionId = "some collection";
    const databaseId = "some database";
    const collection = {
      id: observable(collectionId),
      databaseId,
    };

    collectionWasOpened(accountName, collection);

    const activity = getItems(accountName);
    expect(activity).toEqual([
      expect.objectContaining({
        collectionId,
        databaseId,
      }),
    ]);
  });

  it("Does not store duplicate entries", () => {
    const collectionId = "some collection";
    const databaseId = "some database";
    const collection = {
      id: observable(collectionId),
      databaseId,
    };

    collectionWasOpened(accountName, collection);
    collectionWasOpened(accountName, collection);

    const activity = getItems(accountName);
    expect(activity).toEqual([
      expect.objectContaining({
        type: Type.OpenCollection,
        collectionId,
        databaseId,
      }),
    ]);
  });
});
