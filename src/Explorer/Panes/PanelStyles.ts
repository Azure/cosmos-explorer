import { ITextFieldStyles } from "@fluentui/react";

interface TextFieldStylesProps {
  fontSize: number | string;
  width: number | string;
}

export const getTextFieldStyles = (params?: TextFieldStylesProps): Partial<ITextFieldStyles> => ({
  field: {
    fontSize: params?.fontSize || 12,
    selectors: {
      "::placeholder": {
        fontSize: params?.fontSize || 12,
      },
    },
  },
  root: {
    width: params?.width || 300,
  },
});
