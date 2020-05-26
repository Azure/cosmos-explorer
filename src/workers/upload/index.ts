import "babel-polyfill";
import { DocumentClientParams, UploadDetailsRecord, UploadDetails } from "./definitions";
import { CosmosClient } from "../../Common/CosmosClient";

let numUploadsSuccessful = 0;
let numUploadsFailed = 0;
let numDocuments = 0;
let numFiles = 0;
let numFilesProcessed = 0;
let fileUploadDetails: { [key: string]: UploadDetailsRecord } = {};
let databaseId: string;
let containerId: string;

onerror = (event: ProgressEvent) => {
  postMessage(
    {
      numUploadsSuccessful: numUploadsSuccessful,
      numUploadsFailed: numUploadsFailed,
      uploadDetails: transformDetailsMap(fileUploadDetails),
      // TODO: Typescript complains about event.error below
      runtimeError: (event as any).error.message
    },
    undefined
  );
};

onmessage = (event: MessageEvent) => {
  const files: FileList = event.data.files;
  const clientParams: DocumentClientParams = event.data.documentClientParams;
  containerId = clientParams.containerId;
  databaseId = clientParams.databaseId;
  CosmosClient.masterKey(clientParams.masterKey);
  CosmosClient.endpoint(clientParams.endpoint);
  CosmosClient.accessToken(clientParams.accessToken);
  CosmosClient.databaseAccount(clientParams.databaseAccount);
  self.dataExplorerPlatform = clientParams.platform;
  console.log(event);
  if (!!files && files.length > 0) {
    numFiles = files.length;
    for (let i = 0; i < numFiles; i++) {
      fileUploadDetails[files[i].name] = {
        fileName: files[i].name,
        numSucceeded: 0,
        numFailed: 0,
        errors: []
      };
      uploadFile(files[i]);
    }
  } else {
    postMessage(
      {
        runtimeError: "No files specified"
      },
      undefined
    );
  }
};

function uploadFile(file: File): void {
  const reader = new FileReader();
  reader.onload = (evt: any): void => {
    numFilesProcessed++;
    const fileData: string = evt.target.result;
    createDocumentsFromFile(file.name, fileData);
  };

  reader.onerror = (evt: ProgressEvent): void => {
    numFilesProcessed++;
    // TODO: Typescript complains about event.error below
    recordUploadDetailErrorForFile(file.name, (evt as any).error.message);
    transmitResultIfUploadComplete();
  };

  reader.readAsText(file);
}

function createDocumentsFromFile(fileName: string, documentContent: string): void {
  try {
    const content = JSON.parse(documentContent);
    const triggerCreateDocument: (documentContent: any) => void = (documentContent: any) => {
      CosmosClient.client()
        .database(databaseId)
        .container(containerId)
        .items.create(documentContent)
        .then(savedDoc => {
          fileUploadDetails[fileName].numSucceeded++;
          numUploadsSuccessful++;
        })
        .catch(error => {
          console.log(error);
          recordUploadDetailErrorForFile(fileName, JSON.stringify(error));
          numUploadsFailed++;
        })
        .finally(() => {
          transmitResultIfUploadComplete();
        });
    };

    if (Array.isArray(content)) {
      numDocuments = numDocuments + content.length;
      for (let i = 0; i < content.length; i++) {
        triggerCreateDocument(content[i]);
      }
    } else {
      numDocuments = numDocuments + 1;
      triggerCreateDocument(content);
    }
  } catch (e) {
    recordUploadDetailErrorForFile(fileName, e.message);
    transmitResultIfUploadComplete();
  }
}

function transmitResultIfUploadComplete(): void {
  if (numFilesProcessed === numFiles && numUploadsFailed + numUploadsSuccessful === numDocuments) {
    postMessage(
      {
        numUploadsSuccessful: numUploadsSuccessful,
        numUploadsFailed: numUploadsFailed,
        uploadDetails: transformDetailsMap(fileUploadDetails)
      },
      undefined
    );
  }
}

function recordUploadDetailErrorForFile(fileName: string, error: any): void {
  fileUploadDetails[fileName].errors.push(error);
  fileUploadDetails[fileName].numFailed++;
}

function transformDetailsMap(map: any): UploadDetails {
  let transformedResult: UploadDetailsRecord[] = [];
  Object.keys(map).forEach((key: string) => {
    transformedResult.push(map[key]);
  });

  return { data: transformedResult };
}
