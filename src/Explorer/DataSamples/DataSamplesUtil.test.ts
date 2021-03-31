import * as ko from "knockout";
import * as sinon from "sinon";
import { Collection, Database } from "../../Contracts/ViewModels";
import Explorer from "../Explorer";
import { ContainerSampleGenerator } from "./ContainerSampleGenerator";
import { DataSamplesUtil } from "./DataSamplesUtil";

describe("DataSampleUtils", () => {
  const sampleCollectionId = "sampleCollectionId";
  const sampleDatabaseId = "sampleDatabaseId";

  it("should not create sample collection if collection already exists", async () => {
    const collection = { id: ko.observable(sampleCollectionId) } as Collection;
    const database = {
      id: ko.observable(sampleDatabaseId),
      collections: ko.observableArray<Collection>([collection]),
    } as Database;
    const explorer = {} as Explorer;
    explorer.databases = ko.observableArray<Database>([database]);
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
