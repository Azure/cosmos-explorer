export class StringUtility {
  public static toNumber(num: string): number {
    return Number(num);
  }

  public static toBoolean(valueStr: string): boolean {
    return valueStr === "true";
  }
}
