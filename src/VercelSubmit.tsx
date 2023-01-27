/* eslint-disable react/prop-types */
import { PrimaryButton, Stack } from "@fluentui/react";
import { handleError } from "Common/ErrorHandlingUtils";
import React, { useState } from "react";
import { userContext } from "UserContext";
import { listKeys, listReadOnlyKeys } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import {
  DatabaseAccountListKeysResult,
  DatabaseAccountListReadOnlyKeysResult
} from "Utils/arm/generatedClients/cosmos/types";
import ConnectImage from "../images/HdeConnectCosmosDB.svg";
import Plus1 from "../images/plus1.svg";
import VercelLogo from "../images/VercelLogo.svg";
import "../less/vercelSubmit.less";

export type VercelToken = {
  accessToken: string;
  userId: string;
  teamId: string;
};

export const VercelSubmit: React.FC<{ data: VercelToken }> = ({ data }): JSX.Element => {
  const [primaryMasterKey, setPrimaryMasterKey] = useState<string>("");
  const [secondaryMasterKey, setSecondaryMasterKey] = useState<string>("");
  const [primaryReadonlyMasterKey, setPrimaryReadonlyMasterKey] = useState<string>("");
  const [secondaryReadonlyMasterKey, setSecondaryReadonlyMasterKey] = useState<string>("");
  const uri: string = userContext.databaseAccount.properties?.documentEndpoint;
  const dbName: string = userContext.databaseAccount.name;
  const primaryConnectionStr = `AccountEndpoint=${uri};AccountKey=${primaryMasterKey}`;
  const secondaryConnectionStr = `AccountEndpoint=${uri};AccountKey=${secondaryMasterKey}`;
  const primaryReadonlyConnectionStr = `AccountEndpoint=${uri};AccountKey=${primaryReadonlyMasterKey}`;
  const secondaryReadonlyConnectionStr = `AccountEndpoint=${uri};AccountKey=${secondaryReadonlyMasterKey}`;

  // useEffect(() => {
  //   fetchKeys();
  // }, []);

  const fetchKeys = async (): Promise<void> => {
    try {
      let key;
      if (userContext.hasWriteAccess) {
        const listKeysResult: DatabaseAccountListKeysResult = await listKeys(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name
        );
        key = listKeysResult.primaryMasterKey;
        setPrimaryMasterKey(listKeysResult.primaryMasterKey);
      } else {
        const listReadonlyKeysResult: DatabaseAccountListReadOnlyKeysResult = await listReadOnlyKeys(
          userContext.subscriptionId,
          userContext.resourceGroup,
          userContext.databaseAccount.name
        );
        key = listReadonlyKeysResult.primaryReadonlyMasterKey;
        setPrimaryReadonlyMasterKey(listReadonlyKeysResult.primaryReadonlyMasterKey);
      }
      if (data.accessToken) {
        {
          /* If we have a teamId, all calls to the Vercel API should have it attached as a query parameter */
        }
        const res = await fetch(`https://api.vercel.com/v9/projects`, {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
          method: "get",
        });
        const json = await res.json();
        const envRes = await fetch(`https://api.vercel.com/v10/projects/${json.projects[0].id}/env`, {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
          method: "post",
          body: JSON.stringify({
            target: ["development","production"],
            type: "plain",
            key: "COSMOS_KEY",
            value: key,
          }),
        });
        const res1 = await fetch(`https://api.vercel.com/v10/projects/${json.projects[0].id}/env`, {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
          method: "post",
          body: JSON.stringify({
            target: ["development","production"],
            type: "plain",
            key: "COSMOS_ENDPOINT",
            value: uri,
          }),
        });
      }
    } catch (error) {
      handleError(error, "listKeys", "listKeys request has failed: ");
      throw error;
    }
  };



  const setConnectionString = async () : Promise<void> => {
    try {
      if (uri) {
        {
          /* If we have a teamId, all calls to the Vercel API should have it attached as a query parameter */
        }
        const result = await fetch(`https://api.vercel.com/v9/projects`, {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
          method: "get",
        });
        const json = await result.json();
        const res = await fetch(`https://api.vercel.com/v10/projects/${json.projects[0].id}/env`, {
          headers: {
            Authorization: `Bearer ${data.accessToken}`,
          },
          method: "post",
          body: JSON.stringify({
            target: ["development","production"],
            type: "plain",
            key: "COSMOS_CONNECTION_STRING",
            value: "AccountEndpoint=https://bug-buster.documents.azure.com:443/;AccountKey=ITbwuyWL5w3fSxg3UoZ8w8boJ5CwRXJE55swKyta8PJTRs4QOZ1imXYQIyARnsySLZZnlTlz27LLACDbuefYqw==",
          }),
        });
      }
    } catch (error) {
      handleError(error, "setEndpoint", "setEndpoint request has failed: ");
      throw error;
    }
  };

  const redirectToVercel = async () => {
    const params = new URLSearchParams(window.location.search)
    const redirectUrl = params.get('next');
    window.location.href = redirectUrl;
  };

  const combinedOperation = async () => {
    // await setEndPoint();
    await fetchKeys();
    await setConnectionString();
    await redirectToVercel();
  }
  return (
    <div id="connectExplorer" className="connectExplorerContainer" style={{ display: "flex" }}>
      <div className="connectExplorerFormContainer">
        <div className="connectExplorer">
          <div className="connectExplorerContent">
          <Stack horizontal style={{ alignItems: 'center', justifyContent: 'center'}} gap="30px">
            <img src={ConnectImage} alt="Azure Cosmos DB" style={{width: '100px', height: '100px'}}/>
            <img src={Plus1} alt="plus" style={{width: '20px', height: '20px'}}/>
            <img src={VercelLogo} alt="Vercel" style={{width: '80px', height: '80px'}}/>
          </Stack>
          </div>
          <p className="welcomeText"> Integrate {dbName} account with Vercel </p>
          
            <div id="connectWithAad">
            <PrimaryButton
              className="filterbtnstyle"
              text="Confirm"
              onClick={() =>
                combinedOperation()
              } />
            </div>
            <p className="confirmationText">A confirmation mail will be sent to you post successful Integration.</p>
          
        </div>
      </div>
    </div>
  )
};
