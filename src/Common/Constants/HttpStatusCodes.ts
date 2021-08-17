export const OK = 200;
export const Created = 201;
export const Accepted = 202;
export const NoContent = 204;
export const NotModified = 304;
export const Unauthorized = 401;
export const Forbidden = 403;
export const NotFound = 404;
export const TooManyRequests = 429;
export const Conflict = 409;

export const InternalServerError = 500;
export const BadGateway = 502;
export const ServiceUnavailable = 503;
export const GatewayTimeout = 504;

export const RetryableStatusCodes: number[] = [
  TooManyRequests,
  InternalServerError, // TODO: Handle all 500s on Portal backend and remove from retries list
  BadGateway,
  ServiceUnavailable,
  GatewayTimeout,
];
