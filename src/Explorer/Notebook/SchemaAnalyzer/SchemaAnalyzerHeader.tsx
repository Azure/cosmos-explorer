import {
  DefaultButton,
  Icon,
  IRenderFunction,
  ITextFieldProps,
  PrimaryButton,
  Stack,
  TextField,
  TooltipHost,
} from "@fluentui/react";
import * as React from "react";

type SchemaAnalyzerHeaderProps = {
  isKernelIdle: boolean;
  isKernelBusy: boolean;
  onSampleSizeUpdated: (sampleSize: string) => void;
  onAnalyzeButtonClick: (filter: string, sampleSize: string) => void;
};

export const DefaultFilter = "";
export const DefaultSampleSize = "1000";
const FilterPlaceholder = "{ field: 'value' }";
const SampleSizePlaceholder = "1000";
const MinSampleSize = 1;
const MaxSampleSize = 5000;

export const SchemaAnalyzerHeader = ({
  isKernelIdle,
  isKernelBusy,
  onSampleSizeUpdated,
  onAnalyzeButtonClick,
}: SchemaAnalyzerHeaderProps): JSX.Element => {
  const [filter, setFilter] = React.useState<string>(DefaultFilter);
  const [sampleSize, setSampleSize] = React.useState<string>(DefaultSampleSize);

  return (
    <Stack horizontal tokens={{ childrenGap: 10 }}>
      <Stack.Item grow>
        <TextField
          value={filter}
          onChange={(event, newValue) => setFilter(newValue)}
          label="Filter"
          placeholder={FilterPlaceholder}
          disabled={!isKernelIdle}
        />
      </Stack.Item>
      <Stack.Item>
        <TextField
          value={sampleSize}
          onChange={(event, newValue) => {
            const num = Number(newValue);
            if (!newValue || (num >= MinSampleSize && num <= MaxSampleSize)) {
              setSampleSize(newValue);
              onSampleSizeUpdated(newValue);
            }
          }}
          label="Sample size"
          onRenderLabel={onSampleSizeWrapDefaultLabelRenderer}
          placeholder={SampleSizePlaceholder}
          disabled={!isKernelIdle}
        />
      </Stack.Item>
      <Stack.Item align="end">
        <PrimaryButton
          text={isKernelBusy ? "Analyzing..." : "Analyze"}
          onClick={() => {
            const sampleSizeToUse = sampleSize || DefaultSampleSize;
            setSampleSize(sampleSizeToUse);
            onAnalyzeButtonClick(filter, sampleSizeToUse);
          }}
          disabled={!isKernelIdle}
          styles={{ root: { width: 120 } }}
        />
      </Stack.Item>
      <Stack.Item align="end">
        <DefaultButton
          text="Reset"
          disabled={!isKernelIdle}
          onClick={() => {
            setFilter(DefaultFilter);
            setSampleSize(DefaultSampleSize);
          }}
        />
      </Stack.Item>
    </Stack>
  );
};

const onSampleSizeWrapDefaultLabelRenderer = (
  props: ITextFieldProps,
  defaultRender: IRenderFunction<ITextFieldProps>
): JSX.Element => {
  return (
    <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 4 }}>
      <span>{defaultRender(props)}</span>
      <TooltipHost content={`Number of documents to sample between ${MinSampleSize} and ${MaxSampleSize}`}>
        <Icon iconName="Info" ariaLabel="Info" />
      </TooltipHost>
    </Stack>
  );
};
