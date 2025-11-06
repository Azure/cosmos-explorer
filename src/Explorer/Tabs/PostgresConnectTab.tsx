import {
  Checkbox,
  Dropdown,
  Icon,
  IconButton,
  IDropdownOption,
  ITextFieldStyles,
  Label,
  Link,
  Stack,
  Text,
  TextField,
  TooltipHost,
} from "@fluentui/react";
import React from "react";
import { userContext } from "UserContext";

export const PostgresConnectTab: React.FC = (): JSX.Element => {
  const { adminLogin, databaseName, nodes, enablePublicIpAccess } = userContext.postgresConnectionStrParams;
  const [usePgBouncerPort, setUsePgBouncerPort] = React.useState<boolean>(false);
  const [selectedNode, setSelectedNode] = React.useState<string>(nodes?.[0]?.value);
  const portNumber = usePgBouncerPort ? "6432" : "5432";
  const dbName = databaseName ? databaseName : "citus";

  const onCopyBtnClicked = (selector: string): void => {
    const textfield: HTMLInputElement = document.querySelector(selector);
    textfield.select();
    document.execCommand("copy");
  };

  const textfieldStyles: Partial<ITextFieldStyles> = {
    root: { width: "100%" },
    field: { backgroundColor: "rgb(230, 230, 230)" },
    fieldGroup: { borderColor: "rgb(138, 136, 134)" },
    subComponentStyles: { label: { fontWeight: 400 } },
    description: { fontWeight: 400 },
  };

  const nodesDropdownOptions: IDropdownOption[] = nodes.map((node) => ({
    key: node.value,
    text: node.text,
  }));

  const postgresSQLConnectionURL = `postgres://${adminLogin}:{your_password}@${selectedNode}:${portNumber}/${dbName}?sslmode=require`;
  const psql = `psql "host=${selectedNode} port=${portNumber} dbname=${dbName} user=${adminLogin} password={your_password} sslmode=require"`;
  const jdbc = `jdbc:postgresql://${selectedNode}:${portNumber}/${dbName}?user=${adminLogin}&password={your_password}&sslmode=require`;
  const libpq = `host=${selectedNode} port=${portNumber} dbname=${dbName} user=${adminLogin} password={your_password} sslmode=require`;
  const adoDotNet = `Server=${selectedNode};Database=${dbName};Port=${portNumber};User Id=${adminLogin};Password={your_password};Ssl Mode=Require;`;

  return (
    <div style={{ width: "100%", padding: 16 }}>
      <Stack horizontal verticalAlign="center" style={{ marginBottom: 8 }}>
        <Label style={{ marginRight: 8 }}>Public IP addresses on worker nodes:</Label>
        <TooltipHost
          content="
You can enable or disable public IP addresses on the worker nodes on 'Networking' page of your server group."
        >
          <Icon style={{ margin: "5px 8px 0 0", cursor: "default" }} iconName="Info" />
        </TooltipHost>

        <TextField value={enablePublicIpAccess ? "On" : "Off"} readOnly disabled />
      </Stack>
      <Stack horizontal style={{ marginBottom: 8 }}>
        <Label style={{ marginRight: 85 }}>Show connection strings for</Label>
        <Dropdown
          options={nodesDropdownOptions}
          selectedKey={selectedNode}
          onChange={(_, option) => {
            const selectedNode = option.key as string;
            setSelectedNode(selectedNode);
            if (!selectedNode.startsWith("c.")) {
              setUsePgBouncerPort(false);
            }
          }}
          style={{ width: 200 }}
        />
      </Stack>
      <Stack horizontal style={{ marginBottom: 8 }}>
        <Label style={{ marginRight: 44 }}>PgBouncer connection strings</Label>
        <Checkbox
          boxSide="end"
          checked={usePgBouncerPort}
          onChange={(_, checked: boolean) => setUsePgBouncerPort(checked)}
          disabled={!selectedNode?.startsWith("c.")}
        />
      </Stack>
      <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
        <TextField
          label="PostgreSQL connection URL"
          id="postgresSQLConnectionURL"
          readOnly
          value={postgresSQLConnectionURL}
          styles={textfieldStyles}
        />
        <IconButton iconProps={{ iconName: "Copy" }} onClick={() => onCopyBtnClicked("#postgresSQLConnectionURL")} />
      </Stack>

      <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
        <TextField label="psql" id="psql" readOnly value={psql} styles={textfieldStyles} />
        <IconButton iconProps={{ iconName: "Copy" }} onClick={() => onCopyBtnClicked("#psql")} />
      </Stack>

      <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
        <TextField label="JDBC" id="JDBC" readOnly value={jdbc} styles={textfieldStyles} />
        <IconButton iconProps={{ iconName: "Copy" }} onClick={() => onCopyBtnClicked("#JDBC")} />
      </Stack>

      <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
        <TextField
          label="Node.js, Python, Ruby, PHP, C++ (libpq)"
          id="libpq"
          readOnly
          value={libpq}
          styles={textfieldStyles}
        />
        <IconButton iconProps={{ iconName: "Copy" }} onClick={() => onCopyBtnClicked("#libpq")} />
      </Stack>
      <Stack horizontal verticalAlign="end" style={{ marginBottom: 8 }}>
        <TextField label="ADO.NET" id="adoDotNet" readOnly value={adoDotNet} styles={textfieldStyles} />
        <IconButton iconProps={{ iconName: "Copy" }} onClick={() => onCopyBtnClicked("#adoDotNet")} />
      </Stack>

      <Label>Secure connections</Label>
      <Text style={{ marginBottom: 8 }}>
        Only secure connections are supported. For production use cases, we recommend using the &apos;verify-full&apos;
        mode to enforce TLS certificate verification. You will need to download the Hyperscale (Citus) certificate, and
        provide it when connecting to the database.{" "}
        <Link href="https://go.microsoft.com/fwlink/?linkid=2155061" target="_blank">
          Learn more
        </Link>
      </Text>

      <Label>Connect with pgAdmin</Label>
      <Text>
        Refer to our{" "}
        <Link
          href="https://learn.microsoft.com/en-us/azure/postgresql/hyperscale/howto-connect?tabs=pgadmin"
          target="_blank"
        >
          guide
        </Link>{" "}
        to help you connect via pgAdmin.
      </Text>
    </div>
  );
};
