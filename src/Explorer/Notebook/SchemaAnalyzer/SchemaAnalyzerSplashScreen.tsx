import { FontIcon, PrimaryButton, Spinner, SpinnerSize, Stack, Text } from "@fluentui/react";
import * as React from "react";

type SchemaAnalyzerSplashScreenProps = {
  isKernelIdle: boolean;
  isKernelBusy: boolean;
  onAnalyzeButtonClick: () => void;
};

export const SchemaAnalyzerSplashScreen = ({
  isKernelIdle,
  isKernelBusy,
  onAnalyzeButtonClick,
}: SchemaAnalyzerSplashScreenProps): JSX.Element => {
  return (
    <Stack horizontalAlign="center" tokens={{ childrenGap: 20, padding: 20 }}>
      <Stack.Item>
        <FontIcon iconName="Chart" style={{ fontSize: 100, color: "#43B1E5", marginTop: 40 }} />
      </Stack.Item>
      <Stack.Item>
        <Text variant="xxLarge">Explore your schema</Text>
      </Stack.Item>
      <Stack.Item>
        <Text variant="large">
          Quickly visualize your schema to infer the frequency, types and ranges of fields in your data set.
        </Text>
      </Stack.Item>
      <Stack.Item>
        <PrimaryButton
          styles={{ root: { fontSize: 18, padding: 30 } }}
          text={isKernelBusy ? "Analyzing..." : "Analyze Schema"}
          onClick={() => onAnalyzeButtonClick()}
          disabled={!isKernelIdle}
        />
      </Stack.Item>
      <Stack.Item>{isKernelBusy && <Spinner size={SpinnerSize.large} />}</Stack.Item>
    </Stack>
  );
};
