import { IIconProps } from '@fluentui/react';
import { ActionButton } from '@fluentui/react/lib/Button';
import { AuthType } from 'AuthType';
import { SupportPaneComponent } from 'Explorer/Controls/SupportPaneComponent/SupportPaneComponent';
import Explorer from 'Explorer/Explorer';
import { useSidePanel } from 'hooks/useSidePanel';
import * as React from 'react';
import { userContext } from 'UserContext';

export interface ChatButtonProps {
    container: Explorer;
}

const chatIcon: IIconProps = { iconName: 'ChatSolid' };




export const ChatButtonAction: React.FunctionComponent<ChatButtonProps> = props => {
    const { container } = props;
    if (userContext.authType === AuthType.AAD && userContext.features.enableChatbot) {
        return (
            <ActionButton className={"chatButton"} primary={true} iconProps={chatIcon} onClick={() => {
                useSidePanel
                    .getState()
                    .openSidePanel(
                        "Chat Assistant (Beta)",
                        <SupportPaneComponent
                            directLineToken={container.conversationToken()}
                            userToken={userContext.authorizationToken}
                            subId={userContext.subscriptionId}
                            rg={userContext.resourceGroup}
                            accName={userContext.databaseAccount.name}
                        />
                    );
            }}>
                <span> Help </span>
            </ActionButton>
        );
    }
};