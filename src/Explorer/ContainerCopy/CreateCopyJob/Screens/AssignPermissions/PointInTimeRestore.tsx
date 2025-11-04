import React from "react";
import FeatureEnablerButton from "./components/FeatureEnablerButton";
import { FEATURE_CONFIGS } from "./constants/FeatureConfigs";

const PointInTimeRestore: React.FC = () => {
  return <FeatureEnablerButton {...FEATURE_CONFIGS.POINT_IN_TIME_RESTORE} />;
};

export default PointInTimeRestore;
