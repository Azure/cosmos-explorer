import { IconButton, Image, Link, Modal, PrimaryButton, Stack, StackItem, Text } from "@fluentui/react";
import { useBoolean } from "@fluentui/react-hooks";
import React from "react";
import Database from "../../../../images/CopilotDatabase.svg";
import Flash from "../../../../images/CopilotFlash.svg";
import Thumb from "../../../../images/CopilotThumb.svg";
import CoplilotWelcomeIllustration from "../../../../images/CopliotWelcomeIllustration.svg";
import "./WelcomeModal.css";

export const WelcomeModal = ({ visible }: { visible: boolean }): JSX.Element => {
  const [isModalVisible, { setFalse: hideModal }] = useBoolean(visible);

  React.useEffect(() => {
    if (visible) {
      window.localStorage.setItem("hideWelcomeModal", "true");
    }
  });

  return (
    <>
      <Modal isOpen={isModalVisible} onDismiss={hideModal} isBlocking={false}>
        <Stack className="modalContentPadding">
          <Stack horizontal>
            <Stack horizontal grow={4} horizontalAlign="end">
              <Stack.Item>
                <Image src={CoplilotWelcomeIllustration} />
              </Stack.Item>
            </Stack>
            <Stack horizontal grow={1} horizontalAlign="end" verticalAlign="start" className="exitPadding">
              <Stack.Item className="previewMargin">
                <Text className="preview">Preview</Text>
              </Stack.Item>
              <Stack.Item>
                <IconButton
                  onClick={hideModal}
                  iconProps={{ iconName: "Cancel" }}
                  title="Exit"
                  ariaLabel="Exit"
                  className="exitIcon"
                />
              </Stack.Item>
            </Stack>
          </Stack>
          <Stack horizontalAlign="center">
            <Stack.Item align="center">
              <Text className="title bold">Welcome to Copilot in CosmosDB</Text>
            </Stack.Item>
            <Stack.Item align="center" className="text">
              <Stack horizontal>
                <StackItem align="start" className="imageTextPadding">
                  <Image src={Flash} />
                </StackItem>
                <StackItem align="start">
                  <Text className="bold">
                    Let copilot do the work for you
                    <br />
                  </Text>
                </StackItem>
              </Stack>
              <Text>
                Ask Copilot to generate a query by describing the query in your words.
                <br />
                <Link href="http://aka.ms/cdb-copilot-learn-more">Learn more</Link>
              </Text>
            </Stack.Item>
            <Stack.Item align="center" className="text">
              <Stack horizontal>
                <StackItem align="start" className="imageTextPadding">
                  <Image src={Thumb} />
                </StackItem>
                <StackItem align="start">
                  <Text className="bold">
                    Use your judgement
                    <br />
                  </Text>
                </StackItem>
              </Stack>
              <Text>
                AI-generated content can have mistakes. Make sure it’s accurate and appropriate before using it.
                <br />
                <Link href="http://aka.ms/cdb-copilot-preview-terms">Read preview terms</Link>
              </Text>
            </Stack.Item>
            <Stack.Item align="center" className="text">
              <Stack horizontal>
                <StackItem align="start" className="imageTextPadding">
                  <Image src={Database} />
                </StackItem>
                <StackItem align="start">
                  <Text className="bold">
                    Copilot currently works only a sample database
                    <br />
                  </Text>
                </StackItem>
              </Stack>
              <Text>
                Copilot is setup on a sample database we have configured for you at no cost
                <br />
                <Link href="http://aka.ms/cdb-copilot-learn-more">Learn more</Link>
              </Text>
            </Stack.Item>
          </Stack>
          <Stack className="buttonPadding">
            <Stack.Item align="center">
              <PrimaryButton onClick={hideModal} className="tryButton">
                Try Copilot
              </PrimaryButton>
            </Stack.Item>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
};
