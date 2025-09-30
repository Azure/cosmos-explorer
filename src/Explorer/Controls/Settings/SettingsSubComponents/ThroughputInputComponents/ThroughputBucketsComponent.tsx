import { Label, Slider, Stack, TextField, Toggle } from "@fluentui/react";
import { ThroughputBucket } from "Contracts/DataModels";
import React, { FC, useEffect, useState } from "react";
import { isDirty } from "../../SettingsUtils";

const MAX_BUCKET_SIZES = 5;

const DEFAULT_BUCKETS = Array.from({ length: MAX_BUCKET_SIZES }, (_, i) => ({
  id: i + 1,
  maxThroughputPercentage: 100,
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
  const getThroughputBuckets = (buckets: ThroughputBucket[]): ThroughputBucket[] => {
    if (!buckets || buckets.length === 0) {
      return DEFAULT_BUCKETS;
    }
    const maxBuckets = Math.max(DEFAULT_BUCKETS.length, buckets.length);
    const adjustedDefaultBuckets = Array.from({ length: maxBuckets }, (_, i) => ({
      id: i + 1,
      maxThroughputPercentage: 100,
    }));

    return adjustedDefaultBuckets.map(
      (defaultBucket) => buckets?.find((bucket) => bucket.id === defaultBucket.id) || defaultBucket,
    );
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
      bucket.id === id ? { ...bucket, maxThroughputPercentage: newValue } : bucket,
    );
    setThroughputBuckets(updatedBuckets);
    const settingsChanged = isDirty(updatedBuckets, throughputBuckets);
    settingsChanged && onBucketsChange(updatedBuckets);
  };

  const onToggle = (id: number, checked: boolean) => {
    handleBucketChange(id, checked ? 50 : 100);
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
              styles={{ root: { marginBottom: 0 }, text: { fontSize: 12 } }}
            ></Toggle>
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
