import * as DataModels from "../../../Contracts/DataModels";
import * as ko from "knockout";
import * as ViewModels from "../../../Contracts/ViewModels";
import { KeyCodes } from "../../../Common/Constants";
import { WaitsForTemplateViewModel } from "../../WaitsForTemplateViewModel";
import ThroughputInputComponentTemplate from "./ThroughputInputComponent.html";

/**
 * Throughput Input:
 *
 * Creates a set of controls to input, sanitize and increase/decrease throughput
 *
 * How to use in your markup:
 * <throughput-input params="{ value: anObservableToHoldTheValue, minimum: anObservableWithMinimum, maximum: anObservableWithMaximum }">
 * </throughput-input>
 *
 */

/**
 * Parameters for this component
 */
export interface ThroughputInputParams {
  /**
   * Callback triggered when the template is bound to the component (for testing purposes)
   */
  onTemplateReady?: () => void;

  /**
   * Observable to bind the Throughput value to
   */
  value: ViewModels.Editable<number>;

  /**
   * Text to use as id for testing
   */
  testId: string;

  /**
   * Text to use as aria-label
   */
  ariaLabel?: ko.Observable<string>;

  /**
   * Minimum value in the range
   */
  minimum: ko.Observable<number>;

  /**
   * Maximum value in the range
   */
  maximum: ko.Observable<number>;

  /**
   * Step value for increase/decrease
   */
  step?: number;

  /**
   * Observable to bind the Throughput enabled status
   */
  isEnabled?: ko.Observable<boolean>;

  /**
   * Should show pricing controls
   */
  costsVisible: ko.Observable<boolean>;

  /**
   * RU price
   */
  requestUnitsUsageCost: ko.Subscribable<string>; // Our code assigns to ko.Computed, but unit test assigns to ko.Observable

  /**
   * State of the spending acknowledge checkbox
   */
  spendAckChecked?: ko.Observable<boolean>;

  /**
   * id of the spending acknowledge checkbox
   */
  spendAckId?: ko.Observable<string>;

  /**
   * spending acknowledge text
   */
  spendAckText?: ko.Observable<string>;

  /**
   * Show spending acknowledge controls
   */
  spendAckVisible?: ko.Observable<boolean>;

  /**
   * Display * to the left of the label
   */
  showAsMandatory: boolean;

  /**
   * If true, it will display a text to prompt users to use unlimited collections to go beyond max for fixed
   */
  isFixed: boolean;

  /**
   * Label of the provisioned throughut control
   */
  label: ko.Observable<string>;

  /**
   * Text of the info bubble for provisioned throughut control
   */
  infoBubbleText?: ko.Observable<string>;

  /**
   * Computed value that decides if value can exceed maximum allowable value
   */
  canExceedMaximumValue?: ko.Computed<boolean>;

  /**
   * CSS classes to apply on input element
   */
  cssClass?: string;

  isAutoPilotSelected: ko.Observable<boolean>;
  throughputAutoPilotRadioId: string;
  throughputProvisionedRadioId: string;
  throughputModeRadioName: string;
  autoPilotTiersList: ko.ObservableArray<ViewModels.DropdownOption<DataModels.AutopilotTier>>;
  selectedAutoPilotTier: ko.Observable<DataModels.AutopilotTier>;
  autoPilotUsageCost: ko.Computed<string>;
  showAutoPilot?: ko.Observable<boolean>;
}

export class ThroughputInputViewModel extends WaitsForTemplateViewModel {
  public ariaLabel: ko.Observable<string>;
  public canExceedMaximumValue: ko.Computed<boolean>;
  public step: number;
  public testId: string;
  public value: ViewModels.Editable<number>;
  public minimum: ko.Observable<number>;
  public maximum: ko.Observable<number>;
  public isEnabled: ko.Observable<boolean>;
  public cssClass: string;
  public decreaseButtonAriaLabel: string;
  public increaseButtonAriaLabel: string;
  public costsVisible: ko.Observable<boolean>;
  public requestUnitsUsageCost: ko.Subscribable<string>;
  public spendAckChecked: ko.Observable<boolean>;
  public spendAckId: ko.Observable<string>;
  public spendAckText: ko.Observable<string>;
  public spendAckVisible: ko.Observable<boolean>;
  public showAsMandatory: boolean;
  public infoBubbleText: string | ko.Observable<string>;
  public label: ko.Observable<string>;
  public isFixed: boolean;
  public showAutoPilot: ko.Observable<boolean>;
  public isAutoPilotSelected: ko.Observable<boolean>;
  public throughputAutoPilotRadioId: string;
  public throughputProvisionedRadioId: string;
  public throughputModeRadioName: string;
  public autoPilotTiersList: ko.ObservableArray<ViewModels.DropdownOption<DataModels.AutopilotTier>>;
  public selectedAutoPilotTier: ko.Observable<DataModels.AutopilotTier>;
  public autoPilotUsageCost: ko.Computed<string>;

  public constructor(options: ThroughputInputParams) {
    super();
    super.onTemplateReady((isTemplateReady: boolean) => {
      if (isTemplateReady && options.onTemplateReady) {
        options.onTemplateReady();
      }
    });

    const params: ThroughputInputParams = options;
    this.testId = params.testId || "ThroughputValue";
    this.ariaLabel = ko.observable((params.ariaLabel && params.ariaLabel()) || "");
    this.canExceedMaximumValue = params.canExceedMaximumValue || ko.computed(() => false);
    this.step = params.step || ThroughputInputViewModel._defaultStep;
    this.isEnabled = params.isEnabled || ko.observable(true);
    this.cssClass = params.cssClass || "textfontclr collid";
    this.minimum = params.minimum;
    this.maximum = params.maximum;
    this.value = params.value;
    this.decreaseButtonAriaLabel = "Decrease throughput by " + this.step.toString();
    this.increaseButtonAriaLabel = "Increase throughput by " + this.step.toString();
    this.costsVisible = options.costsVisible;
    this.requestUnitsUsageCost = options.requestUnitsUsageCost;
    this.spendAckChecked = options.spendAckChecked || ko.observable<boolean>(false);
    this.spendAckId = options.spendAckId || ko.observable<string>();
    this.spendAckText = options.spendAckText || ko.observable<string>();
    this.spendAckVisible = options.spendAckVisible || ko.observable<boolean>(false);
    this.showAsMandatory = !!options.showAsMandatory;
    this.isFixed = !!options.isFixed;
    this.infoBubbleText = options.infoBubbleText || ko.observable<string>();
    this.label = options.label || ko.observable<string>();
    this.showAutoPilot = options.showAutoPilot !== undefined ? options.showAutoPilot : ko.observable<boolean>(true);
    this.isAutoPilotSelected = options.isAutoPilotSelected || ko.observable<boolean>(false);
    this.throughputAutoPilotRadioId = options.throughputAutoPilotRadioId;
    this.throughputProvisionedRadioId = options.throughputProvisionedRadioId;
    this.throughputModeRadioName = options.throughputModeRadioName;
    this.autoPilotTiersList = options.autoPilotTiersList;
    this.selectedAutoPilotTier = options.selectedAutoPilotTier;
    this.autoPilotUsageCost = options.autoPilotUsageCost;
  }

  public decreaseThroughput() {
    let offerThroughput: number = this._getSanitizedValue();

    if (offerThroughput > this.minimum()) {
      offerThroughput -= this.step;
      if (offerThroughput < this.minimum()) {
        offerThroughput = this.minimum();
      }

      this.value(offerThroughput);
    }
  }

  public increaseThroughput() {
    let offerThroughput: number = this._getSanitizedValue();

    if (offerThroughput < this.maximum() || this.canExceedMaximumValue()) {
      offerThroughput += this.step;
      if (offerThroughput > this.maximum() && !this.canExceedMaximumValue()) {
        offerThroughput = this.maximum();
      }

      this.value(offerThroughput);
    }
  }

  public onIncreaseKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.increaseThroughput();
      event.stopPropagation();
      return false;
    }

    return true;
  };

  public onDecreaseKeyDown = (source: any, event: KeyboardEvent): boolean => {
    if (event.keyCode === KeyCodes.Enter || event.keyCode === KeyCodes.Space) {
      this.decreaseThroughput();
      event.stopPropagation();
      return false;
    }

    return true;
  };

  private _getSanitizedValue(): number {
    const throughput = this.value();
    return isNaN(throughput) ? 0 : Number(throughput);
  }

  private static _defaultStep: number = 100;
}

export const ThroughputInputComponent = {
  viewModel: ThroughputInputViewModel,
  template: ThroughputInputComponentTemplate
};
