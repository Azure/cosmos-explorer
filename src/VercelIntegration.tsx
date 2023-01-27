import { PrimaryButton } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import { AuthType } from "AuthType";
import { configContext } from "ConfigContext";
import { DatabaseAccount } from "Contracts/DataModels";
import { useAADAuth } from "hooks/useAADAuth";
import { useTokenMetadata } from "hooks/usePortalAccessToken";
import { AAD, HostedExplorerChildFrame } from "HostedExplorerChildFrame";
import { AccountSwitcher } from "Platform/Hosted/Components/AccountSwitcher";
import { ConnectExplorer } from "Platform/Hosted/Components/ConnectExplorer";
import { DirectoryPickerPanel } from "Platform/Hosted/Components/DirectoryPickerPanel";
import { extractMasterKeyfromConnectionString } from "Platform/Hosted/HostedUtils";
import * as React from "react";
import { render } from "react-dom";
import { updateUserContext, userContext } from "UserContext";
import { listKeys } from "Utils/arm/generatedClients/cosmos/databaseAccounts";
import { DatabaseAccountListKeysResult } from "Utils/arm/generatedClients/cosmos/types";
import { getMsalInstance } from "Utils/AuthorizationUtils";
import { VercelSubmit, VercelToken } from "VercelSubmit";
import ConnectImage from "../images/HdeConnectCosmosDB.svg";
import "../less/vercelSubmit.less";
const Vercel: React.FunctionComponent = () => {
  const params = new URLSearchParams(window.location.search);
  const [encryptedToken, setEncryptedToken] = React.useState<string>(params && params.get("key"));
  const encryptedTokenMetadata = useTokenMetadata(encryptedToken);

  const [isFinished, setIsFinished] = React.useState(false);
  const [isOpen, { setTrue: openPanel, setFalse: dismissPanel }] = useBoolean(false);
  const { isLoggedIn, armToken, graphToken, account, tenantId, logout, login, switchTenant } = useAADAuth();
  const [databaseAccount, setDatabaseAccount] = React.useState<DatabaseAccount>();
  const [authType, setAuthType] = React.useState<AuthType>(encryptedToken ? AuthType.EncryptedToken : undefined);
  const [connectionString, setConnectionString] = React.useState<string>();
  //   const ref = React.useRef<HTMLIFrameElement>();

  const [data, setData] = React.useState<VercelToken>();
  React.useEffect(() => {
    const fetchAccessToken = async (code: string) => {
      const res = await fetch(`/vercel/api/get-access-token?${code}`);
      const json = await res.json();
      const accessCode = {
        accessToken: json.access_token,
        userId: json.user_id,
        teamId: json.team_id,
      };
      setData(accessCode);
    };
    const params = new URLSearchParams(window.location.search).toString();
    fetchAccessToken(params);
  }, []);

  React.useEffect(() => {
    // If ref.current is undefined no iframe has been rendered
    // console.log(`ref.current: ${ref.current}`);
    // In hosted mode, we can set global properties directly on the child iframe.
    // This is not possible in the portal where the iframes have different origins
    const t = async () => {
      const frameWindow = (window as unknown) as HostedExplorerChildFrame;
      // AAD authenticated uses ALWAYS using AAD authType
      if (isLoggedIn) {
        frameWindow.hostedConfig = {
          authType: AuthType.AAD,
          databaseAccount,
          authorizationToken: armToken,
        };
      } else if (authType === AuthType.EncryptedToken) {
        frameWindow.hostedConfig = {
          authType: AuthType.EncryptedToken,
          encryptedToken,
          encryptedTokenMetadata,
        };
      } else if (authType === AuthType.ConnectionString) {
        frameWindow.hostedConfig = {
          authType: AuthType.ConnectionString,
          encryptedToken,
          encryptedTokenMetadata,
          masterKey: extractMasterKeyfromConnectionString(connectionString),
        };
      } else if (authType === AuthType.ResourceToken) {
        frameWindow.hostedConfig = {
          authType: AuthType.ResourceToken,
          resourceToken: connectionString,
        };
      }
      const config = frameWindow.hostedConfig as AAD;
      updateUserContext({
        authType: AuthType.AAD,
        authorizationToken: `Bearer ${config.authorizationToken}`,
      });
      const account = config.databaseAccount;
      const accountResourceId = account.id;
      const subscriptionId = accountResourceId && accountResourceId.split("subscriptions/")[1].split("/")[0];
      const resourceGroup = accountResourceId && accountResourceId.split("resourceGroups/")[1].split("/")[0];
      let aadToken;
      let keys: DatabaseAccountListKeysResult = {};
      if (account.properties?.documentEndpoint) {
        const hrefEndpoint = new URL(account.properties.documentEndpoint).href.replace(/\/$/, "/.default");
        const msalInstance = getMsalInstance();
        const cachedAccount = msalInstance.getAllAccounts()?.[0];
        msalInstance.setActiveAccount(cachedAccount);
        const cachedTenantId = localStorage.getItem("cachedTenantId");
        const aadTokenResponse = await msalInstance.acquireTokenSilent({
          forceRefresh: true,
          scopes: [hrefEndpoint],
          authority: `${configContext.AAD_ENDPOINT}${cachedTenantId}`,
        });
        aadToken = aadTokenResponse.accessToken;
      }
      try {
        if (!account.properties.disableLocalAuth) {
          keys = await listKeys(subscriptionId, resourceGroup, account.name);
        }
      } catch (e) {
        if (userContext.features.enableAadDataPlane) {
          console.warn(e);
        } else {
          throw new Error(`List keys failed: ${e.message}`);
        }
      }
      updateUserContext({
        subscriptionId,
        resourceGroup,
        aadToken,
        databaseAccount: config.databaseAccount,
        masterKey: keys.primaryMasterKey,
      });
    };
    t();
  });

  //   const showExplorer =
  //     (config && isLoggedIn && databaseAccount) ||
  //     (encryptedTokenMetadata && encryptedTokenMetadata) ||
  //     (authType === AuthType.ResourceToken && connectionString);
  //   console.log(`isLoggedIn: ${isLoggedIn}, ${JSON.stringify(encryptedTokenMetadata)}`);

  const setUpEnvironmentVariables = () => {
    setIsFinished(true);
  };

  return isFinished ? (
    <VercelSubmit data={data}/>
  ) : (
    <div id="connectExplorer" className="connectExplorerContainer" style={{ display: "flex" }}>
    <div className="connectExplorerFormContainer">
      <div className="connectExplorer">
        
        {isLoggedIn && (
          
        <span className="accountSwitchComponentContainer">
          <p className="connectExplorerContent">
          <img src={ConnectImage} alt="Azure Cosmos DB" />
        </p>
          <p className="welcomeText">Select a Cosmos DB account to Connect with your Vercel Project</p>
          <br/>
          <AccountSwitcher armToken={armToken} setDatabaseAccount={setDatabaseAccount} />
          <br/>
        </span>
      )}
      {!isLoggedIn && !encryptedTokenMetadata && (
        <ConnectExplorer {...{ login, setEncryptedToken, setAuthType, connectionString, setConnectionString }} />
      )}
      {isLoggedIn && <DirectoryPickerPanel {...{ isOpen, dismissPanel, armToken, tenantId, switchTenant }} />}
      {  
       isLoggedIn && <div id="connectWithAad">
        <br/>
          <PrimaryButton
          className="filterbtnstyle"
          onClick={() =>
            setUpEnvironmentVariables()
          }
          text="Submit"
        />
          </div>
      } 
      </div>
    </div>
  </div>
  );
};

render(<Vercel />, document.getElementById("App"));