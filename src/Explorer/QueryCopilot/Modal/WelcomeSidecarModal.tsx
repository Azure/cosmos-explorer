import { Image, Link, PrimaryButton, Stack, Text } from "@fluentui/react";
import { useQueryCopilotSidecar } from "hooks/useQueryCopilotSidecar";
import React from "react";
import Database from "../../../../images/CopilotDatabase.svg";
import Flash from "../../../../images/CopilotFlash.svg";
import CopilotSidecarWelcomeIllustration from "../../../../images/CopilotSidecarWelcomeIllustration.svg";
import Thumb from "../../../../images/CopilotThumb.svg";

export const WelcomeSidecarModal: React.FC = (): JSX.Element => {
  const { showWelcomeSidecar, setShowWelcomeSidecar } = useQueryCopilotSidecar();

  const hideModal = () => {
    setShowWelcomeSidecar(false);
    window.localStorage.setItem("setShowWelcomeSidecar", "false");
  };

  React.useEffect(() => {
    if (window.localStorage.getItem("setShowWelcomeSidecar") === "false") {
      setShowWelcomeSidecar(false);
    }
  });

  return showWelcomeSidecar ? (
    <Stack style={{ width: "288px", height: "520px", backgroundColor: "#FAFAFA", padding: "5px", overflowY: "auto" }}>
      <div style={{ overflowY: "auto", maxHeight: "100%", boxSizing: "border-box" }}>
        <Stack horizontalAlign="center" verticalAlign="center">
          <Image src={CopilotSidecarWelcomeIllustration} />
        </Stack>

        <Stack horizontalAlign="center">
          <Stack.Item align="center" style={{ marginBottom: "10px" }}>
            <Text className="title bold">Welcome to Copilot in CosmosDB</Text>
          </Stack.Item>
          <Stack.Item align="center" style={{ marginBottom: "15px" }}>
            <Stack horizontal>
              <Stack.Item align="start">
                <Image src={Flash} />
              </Stack.Item>
              <Stack.Item align="start">
                <Text style={{ fontWeight: 600 }}>
                  Let copilot do the work for you
                  <br />
                </Text>
              </Stack.Item>
            </Stack>
            <Text>
              Ask Copilot to generate a query by describing the query in your words.
              <br />
              <Link href="http://aka.ms/cdb-copilot-learn-more">Learn more</Link>
            </Text>
          </Stack.Item>
          <Stack.Item align="center" style={{ marginBottom: "15px" }}>
            <Stack horizontal>
              <Stack.Item align="start">
                <Image src={Thumb} />
              </Stack.Item>
              <Stack.Item align="start">
                <Text style={{ fontWeight: 600 }}>
                  Use your judgement
                  <br />
                </Text>
              </Stack.Item>
            </Stack>
            <Text>
              AI-generated content can have mistakes. Make sure it’s accurate and appropriate before using it.
              <br />
              <Link href="http://aka.ms/cdb-copilot-preview-terms">Read preview terms</Link>
            </Text>
          </Stack.Item>
          <Stack.Item align="center" style={{ marginBottom: "15px" }}>
            <Stack horizontal>
              <Stack.Item align="start">
                <Image src={Database} />
              </Stack.Item>
              <Stack.Item align="start">
                <Text style={{ fontWeight: 600 }}>
                  Copilot currently works only a sample database
                  <br />
                </Text>
              </Stack.Item>
            </Stack>
            <Text>
              Copilot is setup on a sample database we have configured for you at no cost
              <br />
              <Link href="http://aka.ms/cdb-copilot-learn-more">Learn more</Link>
            </Text>
          </Stack.Item>
        </Stack>

        <Stack>
          <Stack.Item align="center">
            <PrimaryButton style={{ width: "224px", height: "32px" }} onClick={hideModal}>
              Get Started
            </PrimaryButton>
          </Stack.Item>
        </Stack>
      </div>
    </Stack>
  ) : (
    <></>
  );
};
