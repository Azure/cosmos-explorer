import { FontWeights } from "@uifabric/styling";
import { IIconStyles, ITextStyles } from "office-ui-fabric-react";

export const siteTextStyles: ITextStyles = {
  root: {
    color: "#025F52",
    fontWeight: FontWeights.semibold
  }
};

export const descriptionTextStyles: ITextStyles = {
  root: {
    color: "#333333",
    fontWeight: FontWeights.semibold
  }
};

export const subtleHelpfulTextStyles: ITextStyles = {
  root: {
    color: "#ccc",
    fontWeight: FontWeights.regular
  }
};

export const iconButtonStyles: IIconStyles = {
  root: {
    marginLeft: "10px",
    color: "#0078D4",
    backgroundColor: "#FFF",
    fontSize: 16,
    fontWeight: FontWeights.regular,
    display: "inline-block",
    selectors: {
      ":hover .ms-Button-icon": {
        color: "#ccc"
      }
    }
  }
};

export const iconStyles: IIconStyles = {
  root: {
    marginLeft: "10px",
    color: "#0078D4",
    backgroundColor: "#FFF",
    fontSize: 16,
    fontWeight: FontWeights.regular,
    display: "inline-block"
  }
};

export const mainHelpfulTextStyles: ITextStyles = {
  root: {
    color: "#000",
    fontWeight: FontWeights.regular
  }
};

export const subtleIconStyles: IIconStyles = {
  root: {
    color: "#ddd",
    fontSize: 12,
    fontWeight: FontWeights.regular
  }
};

export const helpfulTextStyles: ITextStyles = {
  root: {
    color: "#333333",
    fontWeight: FontWeights.regular
  }
};
