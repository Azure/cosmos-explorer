const urlParams = new URLSearchParams(window.location.search);

export enum OpenedFrom {
  Portal = "portal",
}

export enum RequestedAuthType {
  Entra = "entra",
  ConnectionString = "connectionstring",
}

export const urlContext = {
  openFrom: urlParams.get("openFrom") as OpenedFrom,
  authType: urlParams.get("authType") as RequestedAuthType,
  subscription: urlParams.get("subscription"),
  account: urlParams.get("account"),
};
