import "babel-polyfill";
import { DocumentClientParams, UploadDetailsRecord, UploadDetails } from "./definitions";
import { client } from "../../Common/CosmosClient";
import { configContext, updateConfigContext } from "../../ConfigContext";
import { updateUserContext } from "../../UserContext";
import { getErrorMessage } from "../../Common/ErrorHandlingUtils";

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
  updateUserContext({
    masterKey: clientParams.masterKey,
    endpoint: clientParams.endpoint,
    accessToken: clientParams.accessToken,
    databaseAccount: clientParams.databaseAccount
  });
  updateConfigContext({
    platform: clientParams.platform
  });
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
      client()
        .database(databaseId)
        .container(containerId)
        .items.create(documentContent)
        .then(savedDoc => {
          fileUploadDetails[fileName].numSucceeded++;
          numUploadsSuccessful++;
        })
        .catch(error => {
          console.error(error);
          recordUploadDetailErrorForFile(fileName, getErrorMessage(error));
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
    console.log(e);
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
