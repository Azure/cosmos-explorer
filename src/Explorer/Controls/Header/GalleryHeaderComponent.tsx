import { CommandButton, FontIcon, FontWeights, ITextProps, Separator, Stack, Text } from "@fluentui/react";
import * as React from "react";

export class GalleryHeaderComponent extends React.Component {
  private static readonly azureText = "Microsoft Azure";
  private static readonly cosmosdbText = "Cosmos DB";
  private static readonly galleryText = "Gallery";
  private static readonly loginText = "Sign In";
  private static readonly openPortal = () => window.open("https://portal.azure.com", "_blank");
  private static readonly openDataExplorer = () => (window.location.href = new URL("./", window.location.href).href);
  private static readonly headerItemStyle: React.CSSProperties = {
    color: "white",
  };
  private static readonly mainHeaderTextProps: ITextProps = {
    style: GalleryHeaderComponent.headerItemStyle,
    variant: "mediumPlus",
    styles: {
      root: {
        fontWeight: FontWeights.semibold,
      },
    },
  };
  private static readonly headerItemTextProps: ITextProps = { style: GalleryHeaderComponent.headerItemStyle };

  private renderHeaderItem = (text: string, onClick: () => void, textProps: ITextProps): JSX.Element => {
    return (
      <CommandButton onClick={onClick} ariaLabel={text}>
        <Text {...textProps}>{text}</Text>
      </CommandButton>
    );
  };

  public render(): JSX.Element {
    return (
      <Stack
        tokens={{ childrenGap: 10 }}
        horizontal
        styles={{ root: { background: "#0078d4", paddingLeft: 20, paddingRight: 20 } }}
        verticalAlign="center"
      >
        <Stack.Item>
          {this.renderHeaderItem(
            GalleryHeaderComponent.azureText,
            GalleryHeaderComponent.openPortal,
            GalleryHeaderComponent.mainHeaderTextProps
          )}
        </Stack.Item>
        <Stack.Item>
          <Separator vertical />
        </Stack.Item>
        <Stack.Item>
          {this.renderHeaderItem(
            GalleryHeaderComponent.cosmosdbText,
            GalleryHeaderComponent.openDataExplorer,
            GalleryHeaderComponent.headerItemTextProps
          )}
        </Stack.Item>
        <Stack.Item>
          <FontIcon style={GalleryHeaderComponent.headerItemStyle} iconName="ChevronRight" />
        </Stack.Item>
        <Stack.Item>
          {this.renderHeaderItem(
            GalleryHeaderComponent.galleryText,
            () => "",
            GalleryHeaderComponent.headerItemTextProps
          )}
        </Stack.Item>
        <Stack.Item grow>
          <></>
        </Stack.Item>
        <Stack.Item>
          {this.renderHeaderItem(
            GalleryHeaderComponent.loginText,
            GalleryHeaderComponent.openDataExplorer,
            GalleryHeaderComponent.headerItemTextProps
          )}
        </Stack.Item>
      </Stack>
    );
  }
}
