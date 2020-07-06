export class StringUtility {
  public static toNumber(num: string | null): number {
    return Number(num);
  }

  public static toBoolean(valueStr: string | null): boolean {
    return valueStr === "true";
  }
}
