import { Icon, Label, Slider, Stack, TextField } from "@fluentui/react";
import { ThroughputBucket } from "Contracts/DataModels";
import React, { FC, useEffect, useState } from "react";
import { isDirty } from "../../SettingsUtils";

const MAX_BUCKET_SIZES = 5;

const DEFAULT_BUCKETS = Array.from({ length: MAX_BUCKET_SIZES }, (_, i) => ({
  id: i + 1,
  maxThroughputPercentage: 100,
}));

interface ThroughputBucketsComponentProps {
  currentBuckets: ThroughputBucket[];
  throughputBucketsBaseline: ThroughputBucket[];
  onBucketsChange: (updatedBuckets: ThroughputBucket[]) => void;
  onSaveableChange: (isSaveable: boolean) => void;
  onDiscardableChange: (isDiscardable: boolean) => void;
}

export const ThroughputBucketsComponent: FC<ThroughputBucketsComponentProps> = ({
  currentBuckets,
  throughputBucketsBaseline,
  onBucketsChange,
  onSaveableChange,
  onDiscardableChange,
}) => {
  const getThroughputBuckets = (buckets: ThroughputBucket[]): ThroughputBucket[] => {
    return DEFAULT_BUCKETS.map(
      (defaultBucket) => buckets.find((bucket) => bucket.id === defaultBucket.id) || defaultBucket,
    );
  };

  const [throughputBuckets, setThroughputBuckets] = useState<ThroughputBucket[]>(getThroughputBuckets(currentBuckets));

  useEffect(() => {
    const isChanged = isDirty(currentBuckets, getThroughputBuckets(throughputBucketsBaseline));
    isChanged && setThroughputBuckets(getThroughputBuckets(currentBuckets));
  }, [currentBuckets]);

  useEffect(() => {
    const isChanged = isDirty(throughputBuckets, getThroughputBuckets(throughputBucketsBaseline));
    onSaveableChange(isChanged);
    onDiscardableChange(isChanged);
  }, [throughputBuckets]);

  const handleBucketChange = (id: number, newValue: number) => {
    const updatedBuckets = throughputBuckets.map((bucket) =>
      bucket.id === id ? { ...bucket, maxThroughputPercentage: newValue } : bucket,
    );
    setThroughputBuckets(updatedBuckets);
    const settingsChanged = isDirty(updatedBuckets, throughputBuckets);
    settingsChanged && onBucketsChange(updatedBuckets);
  };

  return (
    <Stack tokens={{ childrenGap: "m" }} styles={{ root: { width: "70%", maxWidth: 700 } }}>
      <Label>Throughput buckets</Label>
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
              label={`Bucket ${bucket.id}`}
              styles={{ root: { flex: 2, maxWidth: 400 } }}
            />
            <TextField
              value={bucket.maxThroughputPercentage.toString()}
              onChange={(event, newValue) => handleBucketChange(bucket.id, parseInt(newValue || "0", 10))}
              type="number"
              suffix="%"
              styles={{
                fieldGroup: { width: 80 },
              }}
            />
            {bucket.id === 1 && (
              <Stack horizontal tokens={{ childrenGap: 4 }} verticalAlign="center">
                <Icon iconName="TagSolid" />
                <span>Data Explorer Query Bucket</span>
              </Stack>
            )}
          </Stack>
        ))}
      </Stack>
    </Stack>
  );
};
