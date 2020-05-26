import * as React from "react";
import { Dropdown, IDropdownOption, IDropdownProps } from "office-ui-fabric-react/lib/Dropdown";
import { Slider, ISliderProps } from "office-ui-fabric-react/lib/Slider";
import { Stack, IStackItemStyles, IStackStyles } from "office-ui-fabric-react/lib/Stack";
import { TextField, ITextFieldProps } from "office-ui-fabric-react/lib/TextField";
import { Spark } from "../../../Common/Constants";
import { SparkCluster } from "../../../Contracts/DataModels";

export interface ClusterSettingsComponentProps {
  cluster: SparkCluster;
  onClusterSettingsChanged: (cluster: SparkCluster) => void;
}

export class ClusterSettingsComponent extends React.Component<ClusterSettingsComponentProps, {}> {
  constructor(props: ClusterSettingsComponentProps) {
    super(props);
  }

  public render(): JSX.Element {
    return (
      <>
        {this.getMasterSizeDropdown()}
        {this.getWorkerSizeDropdown()}
        {this.getWorkerCountSliderInput()}
      </>
    );
  }

  private getMasterSizeDropdown(): JSX.Element {
    const driverSize: string =
      this.props.cluster && this.props.cluster.properties && this.props.cluster.properties.driverSize;
    const masterSizeOptions: IDropdownOption[] = Spark.SKUs.keys().map(sku => ({
      key: sku,
      text: Spark.SKUs.get(sku)
    }));
    const masterSizeDropdownProps: IDropdownProps = {
      label: "Master Size",
      options: masterSizeOptions,
      defaultSelectedKey: driverSize,
      onChange: this._onDriverSizeChange,
      styles: {
        root: "clusterSettingsDropdown"
      }
    };
    return <Dropdown {...masterSizeDropdownProps} />;
  }

  private getWorkerSizeDropdown(): JSX.Element {
    const workerSize: string =
      this.props.cluster && this.props.cluster.properties && this.props.cluster.properties.workerSize;
    const workerSizeOptions: IDropdownOption[] = Spark.SKUs.keys().map(sku => ({
      key: sku,
      text: Spark.SKUs.get(sku)
    }));
    const workerSizeDropdownProps: IDropdownProps = {
      label: "Worker Size",
      options: workerSizeOptions,
      defaultSelectedKey: workerSize,
      onChange: this._onWorkerSizeChange,
      styles: {
        label: "labelWithRedAsterisk",
        root: "clusterSettingsDropdown"
      }
    };
    return <Dropdown {...workerSizeDropdownProps} />;
  }

  private getWorkerCountSliderInput(): JSX.Element {
    const workerCount: number =
      (this.props.cluster &&
        this.props.cluster.properties &&
        this.props.cluster.properties.workerInstanceCount !== undefined &&
        this.props.cluster.properties.workerInstanceCount) ||
      0;
    const stackStyle: IStackStyles = {
      root: {
        paddingTop: 5
      }
    };
    const sliderItemStyle: IStackItemStyles = {
      root: {
        width: "100%",
        paddingRight: 20
      }
    };

    const workerCountSliderProps: ISliderProps = {
      min: 0,
      max: Spark.MaxWorkerCount,
      step: 1,
      value: workerCount,
      showValue: false,
      onChange: this._onWorkerCountChange,
      styles: {
        root: {
          width: "100%",
          paddingRight: 20
        }
      }
    };
    const workerCountTextFieldProps: ITextFieldProps = {
      value: workerCount.toString(),
      styles: {
        fieldGroup: {
          width: 45,
          height: 25
        },
        field: {
          textAlign: "center"
        }
      },
      onChange: this._onWorkerCountTextFieldChange
    };

    return (
      <Stack styles={stackStyle}>
        <span className="labelWithRedAsterisk">Worker Nodes</span>
        <Stack horizontal verticalAlign="center">
          <Slider {...workerCountSliderProps} />
          <TextField {...workerCountTextFieldProps} />
        </Stack>
      </Stack>
    );
  }

  private _onDriverSizeChange = (_event: React.FormEvent, selectedOption: IDropdownOption) => {
    const newValue: string = selectedOption.key as string;
    const cluster = this.props.cluster;
    if (cluster) {
      cluster.properties.driverSize = newValue;
      this.props.onClusterSettingsChanged(cluster);
    }
  };

  private _onWorkerSizeChange = (_event: React.FormEvent, selectedOption: IDropdownOption) => {
    const newValue: string = selectedOption.key as string;
    const cluster = this.props.cluster;
    if (cluster) {
      cluster.properties.workerSize = newValue;
      this.props.onClusterSettingsChanged(cluster);
    }
  };

  private _onWorkerCountChange = (count: number) => {
    count = Math.min(count, Spark.MaxWorkerCount);
    const cluster = this.props.cluster;
    if (cluster) {
      cluster.properties.workerInstanceCount = count;
      this.props.onClusterSettingsChanged(cluster);
    }
  };

  private _onWorkerCountTextFieldChange = (_event: React.FormEvent, newValue: string) => {
    const count = parseInt(newValue);
    if (!isNaN(count)) {
      this._onWorkerCountChange(count);
    }
  };
}
