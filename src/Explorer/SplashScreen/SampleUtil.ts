import { createCollection } from "Common/dataAccess/createCollection";
import Explorer from "Explorer/Explorer";
import { useDatabases } from "Explorer/useDatabases";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";

/**
 * Public for unit tests
 * @param databaseName
 * @param containerName
 * @param containerDatabases
 */
const hasContainer = (
  databaseName: string,
  containerName: string,
  containerDatabases: ViewModels.Database[],
): boolean => {
  const filteredDatabases = containerDatabases.filter((database) => database.id() === databaseName);
  return (
    filteredDatabases.length > 0 &&
    filteredDatabases[0].collections().filter((collection) => collection.id() === containerName).length > 0
  );
};

export const checkContainerExists = (databaseName: string, containerName: string) =>
  hasContainer(databaseName, containerName, useDatabases.getState().databases);

export const createContainer = async (
  databaseName: string,
  containerName: string,
  explorer: Explorer,
): Promise<ViewModels.Collection> => {
  const createRequest: DataModels.CreateCollectionParams = {
    createNewDatabase: false,
    collectionId: containerName,
    databaseId: databaseName,
    databaseLevelThroughput: false,
  };
  await createCollection(createRequest);
  await explorer.refreshAllDatabases();
  const database = useDatabases.getState().findDatabaseWithId(databaseName);
  if (!database) {
    return undefined;
  }
  await database.loadCollections();
  const newCollection = database.findCollectionWithId(containerName);
  return newCollection;
};

export const importData = async (collection: ViewModels.Collection): Promise<void> => {
  // TODO: keep same chunk as ContainerSampleGenerator
  const dataFileContent = await import(
    /* webpackChunkName: "queryCopilotSampleData" */ "../../../sampleData/queryCopilotSampleData.json"
  );
  await collection.bulkInsertDocuments(dataFileContent.data);
};
