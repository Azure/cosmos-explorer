export const stringifyError = (error: unknown): string => {
  const plainObject: Record<string, unknown> = {};
  Object.getOwnPropertyNames(error as object).forEach((key) => {
    plainObject[key] = (error as Record<string, unknown>)[key];
  });
  return JSON.stringify(plainObject, null, "\r\n");
};
