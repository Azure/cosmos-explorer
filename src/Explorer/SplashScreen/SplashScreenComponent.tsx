/**
 * Accordion top class
 */

import * as React from "react";
import * as Constants from "../../Common/Constants";
import { Link } from "office-ui-fabric-react/lib/Link";

export interface SplashScreenItem {
  iconSrc: string;
  title: string;
  info?: string;
  description: string;
  onClick: () => void;
}
export interface SplashScreenComponentProps {
  mainItems: SplashScreenItem[];
  commonTaskItems: SplashScreenItem[];
  recentItems: SplashScreenItem[];
  tipsItems: SplashScreenItem[];
  onClearRecent: () => void;
}

export class SplashScreenComponent extends React.Component<SplashScreenComponentProps> {
  private static readonly seeMoreItemTitle: string = "See more Cosmos DB documentation";
  private static readonly seeMoreItemUrl: string = "https://aka.ms/cosmosdbdocument";

  public render(): JSX.Element {
    return (
      <div className="splashScreenContainer">
        <div className="splashScreen">
          <div className="title">Welcome to Cosmos DB</div>
          <div className="subtitle">Globally distributed, multi-model database service for any scale</div>
          <div className="mainButtonsContainer">
            {this.props.mainItems.map((item: SplashScreenItem) => (
              <div
                className="mainButton focusable"
                key={`${item.title}`}
                onClick={item.onClick}
                onKeyPress={(event: React.KeyboardEvent) => this.onSplashScreenItemKeyPress(event, item.onClick)}
                tabIndex={0}
                role="button"
              >
                <img src={item.iconSrc} alt={item.title} />
                <div className="legendContainer">
                  <div className="legend">{item.title}</div>
                  <div className="description">{item.description}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="moreStuffContainer">
            <div className="moreStuffColumn commonTasks">
              <div className="title">Common Tasks</div>
              <ul>
                {this.props.commonTaskItems.map((item: SplashScreenItem) => (
                  <li
                    className="focusable"
                    key={`${item.title}${item.description}`}
                    onClick={item.onClick}
                    onKeyPress={(event: React.KeyboardEvent) => this.onSplashScreenItemKeyPress(event, item.onClick)}
                    tabIndex={0}
                    role="button"
                  >
                    <img src={item.iconSrc} alt={item.title} />
                    <span className="oneLineContent" title={item.info}>
                      {item.title}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="moreStuffColumn">
              <div className="title">Recents</div>
              <ul>
                {this.props.recentItems.map((item: SplashScreenItem, index: number) => (
                  <li key={`${item.title}${item.description}${index}`}>
                    <img src={item.iconSrc} alt={item.title} />
                    <span className="twoLineContent">
                      <Link onClick={item.onClick} title={item.info}>
                        {item.title}
                      </Link>
                      <div className="description">{item.description}</div>
                    </span>
                  </li>
                ))}
              </ul>
              {this.props.recentItems.length > 0 && (
                <Link onClick={() => this.props.onClearRecent()}>Clear Recents</Link>
              )}
            </div>
            <div className="moreStuffColumn tipsContainer">
              <div className="title">Tips</div>
              <ul>
                {this.props.tipsItems.map((item: SplashScreenItem) => (
                  <li
                    className="tipContainer focusable"
                    key={`${item.title}${item.description}`}
                    onClick={item.onClick}
                    onKeyPress={(event: React.KeyboardEvent) => this.onSplashScreenItemKeyPress(event, item.onClick)}
                    tabIndex={0}
                    role="link"
                  >
                    <div className="title" title={item.info}>
                      {item.title}
                    </div>
                    <div className="description">{item.description}</div>
                  </li>
                ))}
                <li>
                  <a role="link" href={SplashScreenComponent.seeMoreItemUrl} target="_blank" tabIndex={0}>
                    {SplashScreenComponent.seeMoreItemTitle}
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }

  private onSplashScreenItemKeyPress(event: React.KeyboardEvent, callback: () => void) {
    if (event.charCode === Constants.KeyCodes.Space || event.charCode === Constants.KeyCodes.Enter) {
      callback();
      event.stopPropagation();
    }
  }
}
