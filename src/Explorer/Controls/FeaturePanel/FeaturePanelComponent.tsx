import {
  Checkbox,
  DefaultButton,
  Dropdown,
  IDropdownOption,
  IDropdownStyles,
  ITextFieldStyles,
  Stack,
  TextField,
} from "@fluentui/react";
import * as React from "react";
import "./FeaturePanelComponent.less";

export const FeaturePanelComponent: React.FunctionComponent = () => {
  // Initial conditions
  const originalParams = new URLSearchParams(window.location.search);
  const urlParams = new Map(); // Params with lowercase keys
  originalParams.forEach((value: string, key: string) => urlParams.set(key.toLocaleLowerCase(), value));

  const baseUrlOptions = [
    { key: "https://localhost:1234/explorer.html", text: "localhost:1234" },
    { key: "https://cosmos.azure.com/explorer.html", text: "cosmos.azure.com" },
    { key: "https://portal.azure.com", text: "portal" },
  ];

  const platformOptions = [
    { key: "Hosted", text: "Hosted" },
    { key: "Portal", text: "Portal" },
    { key: "Emulator", text: "Emulator" },
    { key: "", text: "None" },
  ];

  // React hooks to keep state
  const [baseUrl, setBaseUrl] = React.useState<IDropdownOption>(
    baseUrlOptions.find((o) => o.key === window.location.origin + window.location.pathname) || baseUrlOptions[0],
  );
  const [platform, setPlatform] = React.useState<IDropdownOption>(
    urlParams.has("platform")
      ? platformOptions.find((o) => o.key === urlParams.get("platform")) || platformOptions[0]
      : platformOptions[0],
  );

  const booleanFeatures: {
    key: string;
    label: string;
    value: string;
    disabled?: () => boolean;
    reactState?: [boolean, React.Dispatch<React.SetStateAction<boolean>>];
    onChange?: (_?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean) => void;
  }[] = [
    { key: "feature.enablechangefeedpolicy", label: "Enable change feed policy", value: "true" },
    { key: "feature.dataexplorerexecutesproc", label: "Execute stored procedure", value: "true" },
    { key: "feature.hosteddataexplorerenabled", label: "Hosted Data Explorer (deprecated?)", value: "true" },
    { key: "feature.enablettl", label: "Enable TTL", value: "true" },
    { key: "feature.selfServeType", label: "Self serve feature", value: "sample" },
    { key: "feature.canexceedmaximumvalue", label: "Can exceed max value", value: "true" },
    {
      key: "feature.enablefixedcollectionwithsharedthroughput",
      label: "Enable fixed collection with shared throughput",
      value: "true",
    },
    { key: "feature.ttl90days", label: "TTL 90 days", value: "true" },
    { key: "feature.enablenotebooks", label: "Enable notebooks", value: "true" },
    {
      key: "feature.customportal",
      label: "Force Production portal (portal only)",
      value: "false",
      disabled: (): boolean => baseUrl.key !== "https://portal.azure.com",
    },
    { key: "feature.enablespark", label: "Enable Synapse", value: "true" },
    { key: "feature.enableautopilotv2", label: "Enable Auto-pilot V2", value: "true" },
  ];

  const stringFeatures: {
    key: string;
    label: string;
    placeholder: string;
    disabled?: () => boolean;
    reactState?: [string, React.Dispatch<React.SetStateAction<string>>];
    onChange?: (_: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => void;
  }[] = [
    { key: "feature.notebookserverurl", label: "Notebook server URL", placeholder: "https://notebookserver" },
    { key: "feature.notebookservertoken", label: "Notebook server token", placeholder: "" },
    { key: "feature.notebookbasepath", label: "Notebook base path", placeholder: "" },
    { key: "key", label: "Auth key", placeholder: "" },
    {
      key: "dataExplorerSource",
      label: "Data Explorer Source (portal only)",
      placeholder: "https://localhost:1234/explorer.html",
      disabled: (): boolean => baseUrl.key !== "https://portal.azure.com",
    },
    { key: "feature.livyendpoint", label: "Livy endpoint", placeholder: "" },
  ];

  booleanFeatures.forEach(
    (f) => (f.reactState = React.useState<boolean>(urlParams.has(f.key) ? urlParams.get(f.key) === "true" : false)),
  );
  stringFeatures.forEach(
    (f) => (f.reactState = React.useState<string>(urlParams.has(f.key) ? urlParams.get(f.key) : undefined)),
  );

  const buildUrl = (): string => {
    const fragments = (platform.key === "" ? [] : [`platform=${platform.key}`])
      .concat(booleanFeatures.map((f) => (f.reactState[0] ? `${f.key}=${f.value}` : "")))
      .concat(stringFeatures.map((f) => (f.reactState[0] ? `${f.key}=${encodeURIComponent(f.reactState[0])}` : "")))
      .filter((v) => v && v.length > 0);

    const paramString = fragments.length < 1 ? "" : `?${fragments.join("&")}`;
    return `${baseUrl.key}${paramString}`;
  };

  const onChangeBaseUrl = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    setBaseUrl(option);
  };

  const onChangePlatform = (event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption): void => {
    setPlatform(option);
  };

  booleanFeatures.forEach(
    (f) =>
      (f.onChange = (ev?: React.FormEvent<HTMLElement | HTMLInputElement>, checked?: boolean): void => {
        f.reactState[1](checked);
      }),
  );

  stringFeatures.forEach(
    (f) =>
      (f.onChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string): void => {
        f.reactState[1](newValue);
      }),
  );

  const onNotebookShortcut = (): void => {
    booleanFeatures.find((f) => f.key === "feature.enablenotebooks").reactState[1](true);
    stringFeatures
      .find((f) => f.key === "feature.notebookserverurl")
      .reactState[1]("https://localhost:10001/12345/notebook/");
    stringFeatures.find((f) => f.key === "feature.notebookservertoken").reactState[1]("token");
    stringFeatures.find((f) => f.key === "feature.notebookbasepath").reactState[1]("./notebooks");
    setPlatform(platformOptions.find((o) => o.key === "Hosted"));
  };

  const onPortalLocalDEShortcut = (): void => {
    setBaseUrl(baseUrlOptions.find((o) => o.key === "https://portal.azure.com"));
    setPlatform(platformOptions.find((o) => o.key === "Portal"));
    stringFeatures.find((f) => f.key === "dataExplorerSource").reactState[1]("https://localhost:1234/explorer.html");
  };

  const onReset = (): void => {
    booleanFeatures.forEach((f) => f.reactState[1](false));
    stringFeatures.forEach((f) => f.reactState[1](""));
  };

  const stackTokens = { childrenGap: 10 };
  const dropdownStyles: Partial<IDropdownStyles> = { dropdown: { width: 200 } };
  const textFieldStyles: Partial<ITextFieldStyles> = { fieldGroup: { width: 300 } };

  // Show in 2 columns to keep it compact
  let halfSize = Math.ceil(booleanFeatures.length / 2);
  const leftBooleanFeatures = booleanFeatures.slice(0, halfSize);
  const rightBooleanFeatures = booleanFeatures.slice(halfSize, booleanFeatures.length);

  halfSize = Math.ceil(stringFeatures.length / 2);
  const leftStringFeatures = stringFeatures.slice(0, halfSize);
  const rightStringFeatures = stringFeatures.slice(halfSize, stringFeatures.length);

  const anchorOptions = {
    href: buildUrl(),
    target: "_blank",
    rel: "noopener",
  };

  return (
    <div className="featurePanelComponentContainer">
      <div className="urlContainer">
        <a {...anchorOptions}>{buildUrl()}</a>
      </div>
      <Stack className="options" tokens={stackTokens}>
        <Stack horizontal horizontalAlign="space-between" tokens={stackTokens}>
          <DefaultButton onClick={onNotebookShortcut}>Notebooks on localhost</DefaultButton>
          <DefaultButton onClick={onPortalLocalDEShortcut}>Portal points to local DE</DefaultButton>
          <DefaultButton onClick={onReset}>Reset</DefaultButton>
        </Stack>
        <Stack horizontal horizontalAlign="start" tokens={stackTokens}>
          <Dropdown
            selectedKey={baseUrl.key}
            options={baseUrlOptions}
            onChange={onChangeBaseUrl}
            label="Base Url"
            styles={dropdownStyles}
          />
          <Dropdown
            label="Platform"
            selectedKey={platform.key}
            onChange={onChangePlatform}
            options={platformOptions}
            styles={dropdownStyles}
          />
        </Stack>
        <Stack horizontal>
          <Stack className="checkboxRow" horizontalAlign="space-between">
            {leftBooleanFeatures.map((f) => (
              <Checkbox
                key={f.key}
                label={f.label}
                checked={f.reactState[0]}
                onChange={f.onChange}
                disabled={f.disabled && f.disabled()}
              />
            ))}
          </Stack>
          <Stack className="checkboxRow" horizontalAlign="space-between">
            {rightBooleanFeatures.map((f) => (
              <Checkbox
                key={f.key}
                label={f.label}
                checked={f.reactState[0]}
                onChange={f.onChange}
                disabled={f.disabled && f.disabled()}
              />
            ))}
          </Stack>
        </Stack>
        <Stack horizontal tokens={stackTokens}>
          <Stack horizontalAlign="space-between">
            {leftStringFeatures.map((f) => (
              <TextField
                key={f.key}
                value={f.reactState[0]}
                label={f.label}
                onChange={f.onChange}
                styles={textFieldStyles}
                placeholder={f.placeholder}
                disabled={f.disabled && f.disabled()}
              />
            ))}
          </Stack>
          <Stack horizontalAlign="space-between">
            {rightStringFeatures.map((f) => (
              <TextField
                key={f.key}
                value={f.reactState[0]}
                label={f.label}
                onChange={f.onChange}
                styles={textFieldStyles}
                placeholder={f.placeholder}
                disabled={f.disabled && f.disabled()}
              />
            ))}
          </Stack>
        </Stack>
      </Stack>
    </div>
  );
};
