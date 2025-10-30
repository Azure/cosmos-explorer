import React from "react";
import FeatureEnablerButton from "./components/FeatureEnablerButton";
import { FEATURE_CONFIGS } from "./constants/FeatureConfigs";

const OnlineCopyEnabled: React.FC = () => {
  return <FeatureEnablerButton {...FEATURE_CONFIGS.ONLINE_COPY} />;
};

export default OnlineCopyEnabled;
