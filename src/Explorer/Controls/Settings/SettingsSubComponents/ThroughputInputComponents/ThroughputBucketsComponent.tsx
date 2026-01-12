import {
  Dropdown,
  Icon,
  IDropdownOption,
  Label,
  Link,
  Slider,
  Stack,
  Text,
  TextField,
  Toggle,
  TooltipHost,
} from "@fluentui/react";
import { ThroughputBucket } from "Contracts/DataModels";
import React, { FC, useEffect, useState } from "react";
import { isDirty } from "../../SettingsUtils";

const MAX_BUCKET_SIZES = 5;

const DEFAULT_BUCKETS = Array.from({ length: MAX_BUCKET_SIZES }, (_, i) => ({
  id: i + 1,
  maxThroughputPercentage: 100,
  isDefaultBucket: false,
}));

export interface ThroughputBucketsComponentProps {
  currentBuckets: ThroughputBucket[];
  throughputBucketsBaseline: ThroughputBucket[];
  onBucketsChange: (updatedBuckets: ThroughputBucket[]) => void;
  onSaveableChange: (isSaveable: boolean) => void;
}

export const ThroughputBucketsComponent: FC<ThroughputBucketsComponentProps> = ({
  currentBuckets,
  throughputBucketsBaseline,
  onBucketsChange,
  onSaveableChange,
}) => {
  const NoDefaultThroughputSelectedKey: number = -1;
  const getThroughputBuckets = (buckets: ThroughputBucket[]): ThroughputBucket[] => {
    if (!buckets || buckets.length === 0) {
      return DEFAULT_BUCKETS;
    }
    const maxBuckets = Math.max(DEFAULT_BUCKETS.length, buckets.length);
    const adjustedDefaultBuckets: ThroughputBucket[] = Array.from(
      { length: maxBuckets },
      (_, i) =>
        ({
          id: i + 1,
          maxThroughputPercentage: 100,
          isDefaultBucket: false,
        }) as ThroughputBucket,
    );

    return adjustedDefaultBuckets.map((defaultBucket: ThroughputBucket) => {
      const incoming: ThroughputBucket = buckets?.find((bucket) => bucket.id === defaultBucket.id);

      return {
        ...defaultBucket,
        ...incoming,
        ...(incoming?.isDefaultBucket && { isDefaultBucket: true }),
      };
    });
  };

  const getThroughputBucketOptions = (): IDropdownOption[] => {
    const noDefaultThroughputBucketSelected: IDropdownOption[] = [
      { key: NoDefaultThroughputSelectedKey, text: "No Default Throughput Bucket Selected" },
    ];

    const throughputBucketOptions: IDropdownOption[] = throughputBuckets
      .filter((bucket) => bucket.maxThroughputPercentage !== 100)
      .map((bucket) => ({
        key: bucket.id,
        text: `Bucket ${bucket.id} - ${bucket.maxThroughputPercentage}%`,
      }));

    return [...noDefaultThroughputBucketSelected, ...throughputBucketOptions];
  };

  const [throughputBuckets, setThroughputBuckets] = useState<ThroughputBucket[]>(getThroughputBuckets(currentBuckets));

  useEffect(() => {
    setThroughputBuckets(getThroughputBuckets(currentBuckets));
    onSaveableChange(false);
  }, [currentBuckets]);

  useEffect(() => {
    const isChanged = isDirty(throughputBuckets, getThroughputBuckets(throughputBucketsBaseline));
    onSaveableChange(isChanged);
  }, [throughputBuckets]);

  const handleBucketChange = (id: number, newValue: number) => {
    const updatedBuckets = throughputBuckets.map((bucket) =>
      bucket.id === id
        ? {
            ...bucket,
            maxThroughputPercentage: newValue,
            isDefaultBucket: newValue === 100 ? false : bucket.isDefaultBucket,
          }
        : bucket,
    );
    setThroughputBuckets(updatedBuckets);
    const settingsChanged = isDirty(updatedBuckets, throughputBuckets);
    settingsChanged && onBucketsChange(updatedBuckets);
  };

  const onToggle = (id: number, checked: boolean) => {
    handleBucketChange(id, checked ? 50 : 100);
  };

  const onDefaultBucketToggle = (id: number, checked: boolean): void => {
    const updatedBuckets: ThroughputBucket[] = throughputBuckets.map((bucket) =>
      bucket.id === id ? { ...bucket, isDefaultBucket: checked } : { ...bucket, isDefaultBucket: false },
    );
    setThroughputBuckets(updatedBuckets);
    const settingsChanged = isDirty(updatedBuckets, throughputBuckets);
    settingsChanged && onBucketsChange(updatedBuckets);
  };

  const onRenderDefaultThroughputBucketLabel = (): JSX.Element => {
    const tooltipContent = (): JSX.Element => (
      <Text>
        The default throughput bucket is used for operations that do not specify a particular bucket.{" "}
        <Link href="https://aka.ms/cosmsodb-bucketing" target="_blank">
          Learn more.
        </Link>
      </Text>
    );

    return (
      <Stack horizontal verticalAlign="center">
        <Label>Default Throughput Bucket</Label>
        <TooltipHost content={tooltipContent()}>
          <Icon iconName="Info" styles={{ root: { marginLeft: 4, marginTop: 5 } }} />
        </TooltipHost>
      </Stack>
    );
  };

  return (
    <Stack tokens={{ childrenGap: "m" }} styles={{ root: { width: "70%", maxWidth: 700 } }}>
      <Label styles={{ root: { color: "var(--colorNeutralForeground1)" } }}>Throughput Buckets</Label>
      <Stack>
        {throughputBuckets?.map((bucket) => (
          <Stack key={bucket.id} horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
            <Slider
              min={1}
              max={100}
              step={1}
              value={bucket.maxThroughputPercentage}
              onChange={(newValue) => handleBucketChange(bucket.id, newValue)}
              showValue={false}
              label={`Bucket ${bucket.id}${bucket.id === 1 ? " (Data Explorer Query Bucket)" : ""}`}
              styles={{
                root: { flex: 2, maxWidth: 400 },
                titleLabel: {
                  color:
                    bucket.maxThroughputPercentage === 100
                      ? "var(--colorNeutralForeground4)"
                      : "var(--colorNeutralForeground1)",
                },
              }}
              disabled={bucket.maxThroughputPercentage === 100}
            />
            <TextField
              value={bucket.maxThroughputPercentage.toString()}
              onChange={(event, newValue) => handleBucketChange(bucket.id, parseInt(newValue || "0", 10))}
              type="number"
              suffix="%"
              styles={{
                fieldGroup: { width: 80 },
              }}
              disabled={bucket.maxThroughputPercentage === 100}
            />
            <Toggle
              onText="Active"
              offText="Inactive"
              checked={bucket.maxThroughputPercentage !== 100}
              onChange={(event, checked) => onToggle(bucket.id, checked)}
              styles={{
                root: { marginBottom: 0 },
                text: { fontSize: 12, color: "var(--colorNeutralForeground1)" },
              }}
            ></Toggle>
            {/* <Toggle 
              onText="Default"
              offText="Not Default"
              checked={bucket.isDefaultBucket || false}
              onChange={(_, checked) => onDefaultBucketToggle(bucket.id, checked)}
              disabled={bucket.maxThroughputPercentage === 100}
              styles={{
                root: { marginBottom: 0 },
                text: { fontSize: 12, color: "var(--colorNeutralForeground1)" },
              }}
            /> */}
          </Stack>
        ))}
      </Stack>
      <Dropdown
        placeholder="Select a default throughput bucket"
        label="Default Throughput Bucket"
        options={getThroughputBucketOptions()}
        selectedKey={
          throughputBuckets?.find((throughputbucket: ThroughputBucket) => throughputbucket.isDefaultBucket)?.id ||
          NoDefaultThroughputSelectedKey
        }
        onChange={(_, option) => onDefaultBucketToggle(option.key as number, true)}
        styles={{ root: { width: "50%" } }}
        onRenderLabel={onRenderDefaultThroughputBucketLabel}
      />
    </Stack>
  );
};
