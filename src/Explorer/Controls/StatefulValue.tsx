/*
  Class used to track baseline and current values of a state object. If both the values differ,
  isDirty is set to true. The isDirty value is used to change css of the component and to govern logic
  around whether the current value should be persistently saved or not.
*/

export class StatefulValue<T> {
  public current: T;
  public baseline: T;
  public isValid: boolean;

  constructor(baselineValue?: T) {
    this.current = baselineValue;
    this.baseline = baselineValue;
    this.isValid = true;
  }

  public isDirty(): boolean {
    const currentStringValue = this.getStringValue(this.current);
    const baselineStringValue = this.getStringValue(this.baseline);

    return currentStringValue !== baselineStringValue;
  }

  private getStringValue = (value: T): string => {
    const type = typeof value;
    switch (type) {
      case "string":
      case "undefined":
      case "number":
      case "boolean":
        return value?.toString();

      default:
        return JSON.stringify(value);
    }
  };
}
