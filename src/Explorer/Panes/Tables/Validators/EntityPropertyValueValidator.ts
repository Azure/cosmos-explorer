/* eslint-disable @typescript-eslint/no-unused-vars */
import * as StorageExplorerConstants from "../../../Tables/Constants";
import * as Utilities from "../../../Tables/Utilities";
import * as EntityPropertyValidationCommon from "./EntityPropertyValidationCommon";

interface IValidationResult {
  isInvalid: boolean;
  help: string;
}

interface IValueValidator {
  validate: (value: string) => IValidationResult;
  parseValue: (value: string) => unknown;
}

/* Constants */
const noHelp = "";
const MaximumStringLength = 64 * 1024; // 64 KB
const MaximumRequiredStringLength = 1 * 1024; //  1 KB

class ValueValidator implements IValueValidator {
  public validate(_value: string): IValidationResult {
    // throw new Errors.NotImplementedFunctionError("ValueValidator.validate");
    return undefined;
  }

  public parseValue(value: string): unknown {
    return value; // default pass-thru implementation
  }
}

class KeyValidator implements ValueValidator {
  private static detailedHelp = "Enter a string ('/', '\\', '#', '?' and control characters not allowed)."; // Localize

  public validate(value: string): IValidationResult {
    if (
      value === undefined ||
      value.trim().length === 0 ||
      EntityPropertyValidationCommon.ValidationRegExp.PrimaryKey.test(value)
    ) {
      return { isInvalid: false, help: noHelp };
    } else {
      return { isInvalid: true, help: KeyValidator.detailedHelp };
    }
  }

  public parseValue(value: string): string {
    return value;
  }
}

class BooleanValueValidator extends ValueValidator {
  private detailedHelp = "Enter true or false."; // localize

  public validate(value: string): IValidationResult {
    let success = false;
    let help: string = noHelp;

    if (value) {
      success = EntityPropertyValidationCommon.ValidationRegExp.Boolean.test(value);
    }

    if (!success) {
      help = this.detailedHelp;
    }

    return { isInvalid: !success, help: help };
  }

  public parseValue(value: string): boolean {
    // OData seems to require lowercase boolean values, see http://www.odata.org/documentation/odata-version-2-0/overview/
    return value.toString().toLowerCase() === "true";
  }
}

class DateTimeValueValidator extends ValueValidator {
  private detailedHelp = "Enter a date and time."; // localize

  public validate(value: string): IValidationResult {
    let success = false;
    let help: string = noHelp;

    if (value) {
      // Try to parse the value to see if it is a valid date string
      const parsed: number = Date.parse(value);

      success = !isNaN(parsed);
    }

    if (!success) {
      help = this.detailedHelp;
    }

    return { isInvalid: !success, help: help };
  }

  public parseValue(value: string): Date {
    const millisecondTime = Date.parse(value);
    const parsed: Date = new Date(millisecondTime);

    return parsed;
  }
}

class DoubleValueValidator extends ValueValidator {
  private detailedHelp = "Enter a 64-bit floating point value."; // localize

  public validate(value: string): IValidationResult {
    let success = false;
    let help: string = noHelp;

    if (value) {
      success = EntityPropertyValidationCommon.ValidationRegExp.Float.test(value);
    }

    if (!success) {
      help = this.detailedHelp;
    }

    return { isInvalid: !success, help: help };
  }

  public parseValue(value: string): number {
    return parseFloat(value);
  }
}

class GuidValueValidator extends ValueValidator {
  private detailedHelp = "Enter a 16-byte (128-bit) GUID value."; // localize

  public validate(value: string): IValidationResult {
    let success = false;
    let help: string = noHelp;

    if (value) {
      success = EntityPropertyValidationCommon.ValidationRegExp.Guid.test(value);
    }

    if (!success) {
      help = this.detailedHelp;
    }

    return { isInvalid: !success, help: help };
  }
}

class IntegerValueValidator extends ValueValidator {
  private detailedInt32Help = "Enter a signed 32-bit integer."; // localize
  private detailedInt64Help = "Enter a signed 64-bit integer, in the range (-2^53 - 1, 2^53 - 1)."; // localize

  private isInt64: boolean;

  constructor(isInt64 = true) {
    super();

    this.isInt64 = isInt64;
  }

  public validate(value: string): IValidationResult {
    let success = false;
    let help: string = noHelp;

    if (value) {
      success = EntityPropertyValidationCommon.ValidationRegExp.Integer.test(value) && Utilities.isSafeInteger(value);
      if (success) {
        const intValue = parseInt(value, 10);

        success = !isNaN(intValue);
        if (success && !this.isInt64) {
          success =
            EntityPropertyValidationCommon.Int32.Min <= intValue &&
            intValue <= EntityPropertyValidationCommon.Int32.Max;
        }
      }
    }

    if (!success) {
      help = this.isInt64 ? this.detailedInt64Help : this.detailedInt32Help;
    }

    return { isInvalid: !success, help: help };
  }

  public parseValue(value: string): number {
    return parseInt(value, 10);
  }
}

// Allow all values for string type, unless the property is required, in which case an empty string is invalid.
class StringValidator extends ValueValidator {
  private detailedHelp = "Enter a value up to 64 KB in size."; // localize
  private isRequiredHelp = "Enter a value up to 1 KB in size."; // localize
  private emptyStringHelp = "Empty string."; // localize
  private isRequired: boolean;

  constructor(isRequired: boolean) {
    super();

    this.isRequired = isRequired;
  }

  public validate(value: string): IValidationResult {
    let help: string = this.isRequired ? this.isRequiredHelp : this.detailedHelp;
    if (value === undefined) {
      return { isInvalid: false, help: help };
    }
    // Ensure we validate the string projection of value.
    value = String(value);

    let success = true;

    if (success) {
      success = value.length <= (this.isRequired ? MaximumRequiredStringLength : MaximumStringLength);
    }

    if (success && this.isRequired) {
      help = value ? noHelp : this.emptyStringHelp;
    }

    return { isInvalid: !success, help: help };
  }

  public parseValue(value: string): string {
    return String(value); // Ensure value is converted to string.
  }
}

class NotSupportedValidator extends ValueValidator {
  private type: string;

  constructor(type: string) {
    super();

    this.type = type;
  }

  public validate(ignoredValue: string): IValidationResult {
    //throw new Errors.NotSupportedError(this.getMessage());
    return undefined;
  }

  public parseValue(ignoredValue: string): undefined {
    //throw new Errors.NotSupportedError(this.getMessage());
    return undefined;
  }

  private getMessage(): string {
    return "Properties of type " + this.type + " are not supported.";
  }
}

class PropertyValidatorFactory {
  public getValidator(type: string, isRequired: boolean) {
    let validator: IValueValidator;

    // TODO classify rest of Cassandra types/create validators for them
    switch (type) {
      case StorageExplorerConstants.TableType.Boolean:
      case StorageExplorerConstants.CassandraType.Boolean:
        validator = new BooleanValueValidator();
        break;
      case StorageExplorerConstants.TableType.DateTime:
        validator = new DateTimeValueValidator();
        break;
      case StorageExplorerConstants.TableType.Double:
      case StorageExplorerConstants.CassandraType.Decimal:
      case StorageExplorerConstants.CassandraType.Double:
      case StorageExplorerConstants.CassandraType.Float:
        validator = new DoubleValueValidator();
        break;
      case StorageExplorerConstants.TableType.Guid:
      case StorageExplorerConstants.CassandraType.Uuid:
        validator = new GuidValueValidator();
        break;
      case StorageExplorerConstants.TableType.Int32:
      case StorageExplorerConstants.CassandraType.Int:
      case StorageExplorerConstants.CassandraType.Smallint:
      case StorageExplorerConstants.CassandraType.Tinyint:
        validator = new IntegerValueValidator(/* isInt64 */ false);
        break;
      case StorageExplorerConstants.TableType.Int64:
      case StorageExplorerConstants.CassandraType.Bigint:
      case StorageExplorerConstants.CassandraType.Varint:
        validator = new IntegerValueValidator(/* isInt64 */ true);
        break;
      case StorageExplorerConstants.TableType.String:
      case StorageExplorerConstants.CassandraType.Text:
      case StorageExplorerConstants.CassandraType.Ascii:
      case StorageExplorerConstants.CassandraType.Varchar:
        validator = new StringValidator(isRequired);
        break;
      case "Key":
        validator = new KeyValidator();
        break;
      default:
        validator = new NotSupportedValidator(type);
        break;
    }

    return validator;
  }
}

interface ITypeValidatorMap {
  [type: string]: IValueValidator;
}

export default class EntityPropertyValueValidator {
  private validators: ITypeValidatorMap;
  private validatorFactory: PropertyValidatorFactory;
  private isRequired: boolean;

  constructor(isRequired: boolean) {
    this.validators = {};
    this.validatorFactory = new PropertyValidatorFactory();
    this.isRequired = isRequired;
  }

  public validate(value: string, type: string): IValidationResult {
    const validator: IValueValidator = this.getValidator(type);

    return validator ? validator.validate(value) : undefined; // Should not happen.
  }

  public parseValue(value: string, type: string): unknown {
    const validator: IValueValidator = this.getValidator(type);

    return validator ? validator.parseValue(value) : undefined; // Should not happen.
  }

  private getValidator(type: string): IValueValidator {
    let validator: IValueValidator = this.validators[type];

    if (!validator) {
      validator = this.validatorFactory.getValidator(type, this.isRequired);
      this.validators[type] = validator;
    }

    return validator;
  }
}
