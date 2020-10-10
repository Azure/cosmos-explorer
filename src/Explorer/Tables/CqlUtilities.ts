export function getQuotedCqlIdentifier(identifier: string): string {
  let result = identifier;
  if (!identifier) {
    return result;
  }

  if (identifier.includes('"')) {
    result = identifier.replace(/"/g, '""');
  }

  return `"${result}"`;
}
