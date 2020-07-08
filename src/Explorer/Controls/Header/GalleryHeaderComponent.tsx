import * as React from "react";
import { Stack, Text, Separator, FontIcon, CommandButton, FontWeights } from "office-ui-fabric-react";

export class GalleryHeaderComponent extends React.Component {
  private static readonly headerText = "Microsoft Azure";
  private static readonly cosmosdbText = "Cosmos DB";
  private static readonly galleryText = "Gallery";
  private static readonly loginText = "Log in";
  private static readonly loginOnClick = () => (window.location.href = new URL("./", window.location.href).href);
  private static readonly textStyle: React.CSSProperties = {
    color: "white"
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
          <Text
            style={GalleryHeaderComponent.textStyle}
            variant="mediumPlus"
            styles={{ root: { fontWeight: FontWeights.semibold } }}
          >
            {GalleryHeaderComponent.headerText}
          </Text>
        </Stack.Item>
        <Stack.Item>
          <Separator vertical />
        </Stack.Item>
        <Stack.Item>
          <Text style={GalleryHeaderComponent.textStyle}>{GalleryHeaderComponent.cosmosdbText}</Text>
        </Stack.Item>
        <Stack.Item>
          <FontIcon style={GalleryHeaderComponent.textStyle} iconName="ChevronRight" />
        </Stack.Item>
        <Stack.Item>
          <Text style={GalleryHeaderComponent.textStyle}>{GalleryHeaderComponent.galleryText}</Text>
        </Stack.Item>
        <Stack.Item grow>
          <></>
        </Stack.Item>
        <Stack.Item>
          <CommandButton
            style={GalleryHeaderComponent.textStyle}
            text={GalleryHeaderComponent.loginText}
            ariaLabel={GalleryHeaderComponent.loginText}
            onClick={GalleryHeaderComponent.loginOnClick}
          />
        </Stack.Item>
      </Stack>
    );
  }
}
