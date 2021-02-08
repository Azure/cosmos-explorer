export type SqlxServiceResource = {
    id: string,
    name: string,
    type: string,
    properties: SqlxServiceProps
    locations: SqlxServiceLocations
  }
export type SqlxServiceProps = {
    serviceType: string,
    creationTime: string,
    status: string,
    instanceSize: string,
    instanceCount: number,
    sqlxEndPoint: string
}

export type SqlxServiceLocations = {
    location: string,
    status: string,
    sqlxEndpoint: string
}
  
export type UpdateDedicatedGatewayRequestParameters = {
    properties: UpdateDedicatedGatewayRequestProperties
}
  
export type UpdateDedicatedGatewayRequestProperties = {
    instanceSize: string,
    instanceCount: number,
    serviceType: string
}
