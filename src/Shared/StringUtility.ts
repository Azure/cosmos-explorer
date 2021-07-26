export function toNumber(num: string | null): number {
  return Number(num);
}

export function toBoolean(valueStr: string | null): boolean {
  return valueStr === "true";
}
