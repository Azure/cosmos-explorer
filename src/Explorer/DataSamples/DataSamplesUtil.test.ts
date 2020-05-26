import { ExplorerStub, DatabaseStub, CollectionStub } from "../OpenActionsStubs";
import { DataSamplesUtil } from "./DataSamplesUtil";
import * as sinon from "sinon";
import { ContainerSampleGenerator } from "./ContainerSampleGenerator";
import * as ko from "knockout";

describe("DataSampleUtils", () => {
  const sampleCollectionId = "sampleCollectionId";
  const sampleDatabaseId = "sampleDatabaseId";

  it("should not create sample collection if collection already exists", async () => {
    const collection = new CollectionStub({ id: ko.observable(sampleCollectionId) });
    const database = new DatabaseStub({
      id: ko.observable(sampleDatabaseId),
      collections: ko.observableArray([collection])
    });
    const explorer = new ExplorerStub();
    explorer.nonSystemDatabases = ko.computed(() => [database]);
    explorer.showOkModalDialog = () => {};
    const dataSamplesUtil = new DataSamplesUtil(explorer);

    const fakeGenerator = sinon.createStubInstance<ContainerSampleGenerator>(ContainerSampleGenerator as any);
    fakeGenerator.getCollectionId.returns(sampleCollectionId);
    fakeGenerator.getDatabaseId.returns(sampleDatabaseId);
    fakeGenerator.createSampleContainerAsync.returns(Promise.resolve());

    sinon.stub(dataSamplesUtil, "createGeneratorAsync").returns(fakeGenerator);

    await dataSamplesUtil.createSampleContainerAsync();
    expect((fakeGenerator.createSampleContainerAsync as sinon.SinonStub).called).toBe(false);
  });
});
