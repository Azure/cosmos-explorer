import { IButtonStyles, ICommandBarStyles, ISeparatorStyles, IStackTokens } from "@fluentui/react";
import { StyleConstants } from "../Common/StyleConstants";

export const commandBarItemStyles: IButtonStyles = { root: { paddingLeft: 20 } };

export const commandBarStyles: ICommandBarStyles = { root: { paddingLeft: 0 } };

export const containerStackTokens: IStackTokens = { childrenGap: 5, padding: 10 };

export const separatorStyles: Partial<ISeparatorStyles> = {
  root: {
    selectors: {
      "::before": {
        background: StyleConstants.BaseMedium,
      },
    },
    padding: 0,
    height: 1,
  },
};
