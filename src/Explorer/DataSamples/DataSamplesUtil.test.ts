import { DataSamplesUtil } from "./DataSamplesUtil";
import * as sinon from "sinon";
import { ContainerSampleGenerator } from "./ContainerSampleGenerator";
import * as ko from "knockout";
import Explorer from "../Explorer";
import { Database, Collection } from "../../Contracts/ViewModels";

describe("DataSampleUtils", () => {
  const sampleCollectionId = "sampleCollectionId";
  const sampleDatabaseId = "sampleDatabaseId";

  it("should not create sample collection if collection already exists", async () => {
    const collection = { id: ko.observable(sampleCollectionId) } as Collection;
    const database = {
      id: ko.observable(sampleDatabaseId),
      collections: ko.observableArray<Collection>([collection])
    } as Database;
    const explorer = {} as Explorer;
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
