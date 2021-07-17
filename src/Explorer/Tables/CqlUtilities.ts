// Added return type optional undefined because passing undefined from test cases.
export function getQuotedCqlIdentifier(identifier: string | undefined): string | undefined {
  let result = identifier;
  if (!identifier) {
    return result;
  }

  if (identifier.includes('"')) {
    result = identifier.replace(/"/g, '""');
  }

  return `"${result}"`;
}
