import { JSONObject } from "@azure/cosmos";
import { BackendDefaults } from "Common/Constants";
import { createCollection } from "Common/dataAccess/createCollection";
import Explorer from "Explorer/Explorer";
import { useDatabases } from "Explorer/useDatabases";
import { DEFAULT_FABRIC_NATIVE_CONTAINER_THROUGHPUT, isFabricNative } from "Platform/Fabric/FabricUtil";
import { Action, ActionModifiers } from "Shared/Telemetry/TelemetryConstants";
import * as DataModels from "../../Contracts/DataModels";
import * as ViewModels from "../../Contracts/ViewModels";
import * as TelemetryProcessor from "../../Shared/Telemetry/TelemetryProcessor";

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

export enum SampleDataFile {
  COPILOT = "Copilot",
  FABRIC_SAMPLE_DATA = "FabricSampleData",
  FABRIC_SAMPLE_VECTOR_DATA = "FabricSampleVectorData",
}

const containerSettings: {
  [key in SampleDataFile]: {
    partitionKeyString: string;
    vectorEmbeddingPolicy?: DataModels.VectorEmbeddingPolicy;
    indexingPolicy?: DataModels.IndexingPolicy;
  };
} = {
  [SampleDataFile.COPILOT]: {
    partitionKeyString: "category",
  },
  [SampleDataFile.FABRIC_SAMPLE_DATA]: {
    partitionKeyString: "categoryName",
  },
  [SampleDataFile.FABRIC_SAMPLE_VECTOR_DATA]: {
    partitionKeyString: "categoryName",
    vectorEmbeddingPolicy: {
      vectorEmbeddings: [
        {
          path: "/vectors",
          dataType: "float32",
          distanceFunction: "cosine",
          dimensions: 1536,
        },
      ],
    },
    indexingPolicy: {
      automatic: true,
      indexingMode: "consistent",
      includedPaths: [
        {
          path: "/*",
        },
      ],
      excludedPaths: [
        {
          path: '/"_etag"/?',
        },
      ],
      fullTextIndexes: [],
      vectorIndexes: [
        {
          path: "/vectors",
          type: "quantizedFlat",
          quantizationByteSize: 64,
        },
      ],
    },
  },
};

export const createContainer = async (
  databaseName: string,
  containerName: string,
  explorer: Explorer,
  sampleDataFile: SampleDataFile,
): Promise<ViewModels.Collection> => {
  const createRequest: DataModels.CreateCollectionParams = {
    autoPilotMaxThroughput: isFabricNative() ? DEFAULT_FABRIC_NATIVE_CONTAINER_THROUGHPUT : undefined,
    createNewDatabase: false,
    collectionId: containerName,
    databaseId: databaseName,
    databaseLevelThroughput: false,
    partitionKey: {
      paths: [`/${containerSettings[sampleDataFile].partitionKeyString}`],
      kind: "Hash",
      version: BackendDefaults.partitionKeyVersion,
    },
    vectorEmbeddingPolicy: containerSettings[sampleDataFile].vectorEmbeddingPolicy,
    indexingPolicy: containerSettings[sampleDataFile].indexingPolicy,
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

export const importData = async (sampleDataFile: SampleDataFile, collection: ViewModels.Collection): Promise<void> => {
  let documents: JSONObject[] = undefined;
  switch (sampleDataFile) {
    case SampleDataFile.COPILOT:
      documents = (
        await import(/* webpackChunkName: "queryCopilotSampleData" */ "../../../sampleData/queryCopilotSampleData.json")
      ).data;
      break;
    case SampleDataFile.FABRIC_SAMPLE_DATA:
      documents = (await import(/* webpackChunkName: "fabricSampleData" */ "../../../sampleData/fabricSampleData.json"))
        .default;
      break;
    case SampleDataFile.FABRIC_SAMPLE_VECTOR_DATA:
      documents = (
        await import(
          /* webpackChunkName: "fabricSampleDataVectors" */ "../../../sampleData/fabricSampleDataVectors.json"
        )
      ).default;
      break;
    default:
      throw new Error(`Unknown sample data file: ${sampleDataFile}`);
  }
  if (!documents) {
    throw new Error(`Failed to load sample data file: ${sampleDataFile}`);
  }

  // Time it
  const start = performance.now();
  await collection.bulkInsertDocuments(documents);
  const end = performance.now();
  TelemetryProcessor.trace(Action.ImportSampleData, ActionModifiers.Success, {
    documentsCount: documents.length,
    durationMs: end - start,
    sampleDataFile,
  });
};
