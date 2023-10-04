export const utf8ToB64 = (utf8Str: string): string => {
  return btoa(
    encodeURIComponent(utf8Str).replace(/%([0-9A-F]{2})/g, (_, args) => {
      return String.fromCharCode(parseInt(args, 16));
    }),
  );
};
