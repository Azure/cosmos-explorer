# Migrate Mongo(RU/vCore)/Postgres/Cassandra shell to CloudShell Design

## CloudShell Overview
Cloud Shell provides an integrated terminal experience directly within Cosmos Explorer, allowing users to interact with different database engines using their native command-line interfaces.

## Component Architecture

```mermaid
classDiagram
    
    class FeatureRegistration {
        <<Registers a new flag for switching shell to CloudShell>>
        +enableCloudShell: boolean
    }
    
    class ShellTypeHandlerFactory {
        <<Initialize corresponding handler based on the type of shell>>
        +getHandler(terminalKind: TerminalKind): ShellTypeHandler
        +getKey(): string
    }
    
    class AbstractShellHandler {
        <<interface>>
        +getShellName(): string
        +getSetUpCommands(): string[]
        +getConnectionCommand(): string
        +getEndpoint(): string
        +getTerminalSuppressedData(): string[]
        +getInitialCommands(): string
    }
    
    class CloudShellTerminalComponent {
        <<React Component to Render CloudShell>>
        -terminalKind: TerminalKind
        -shellHandler: AbstractShellHandler
        +render(): ReactElement
    }
    
    class CloudShellTerminalCore {
        <<Initialize CloudShell>>
        +startCloudShellTerminal()
    }
    
    class CloudShellClient {
        <Initialize CloudShell APIs>
        +getUserSettings(): Promise
        +putEphemeralUserSettings(): void
        +verifyCloudShellProviderRegistration: void
        +registerCloudShellProvider(): void
        +provisionConsole(): ProvisionConsoleResponse
        +connectTerminal(): ConnectTerminalResponse
        +authorizeSession(): Authorization
    }
    
    class CloudShellTerminalComponentAdapter {
        +getDatabaseAccount: DataModels.DatabaseAccount,
        +getTabId: string,
        +getUsername: string,
        +isAllPublicIPAddressesEnabled: ko.Observable<boolean>,
        +kind: ViewModels.TerminalKind,
    }
    
    class TerminalTab {
        -cloudShellTerminalComponentAdapter: CloudShellTerminalComponentAdapter
    }
    
    class ContextMenuButtonFactory {
        +getCloudShellButton(): ReactElement
        +isCloudShellEnabled(): boolean
    }
    
    UserContext --> FeatureRegistration : contains
    FeatureRegistration ..> ContextMenuButtonFactory : controls UI visibility
    FeatureRegistration ..> CloudShellTerminalComponentAdapter : enables tab creation
    FeatureRegistration ..> CloudShellClient : permits API calls
    
    TerminalTab --> CloudShellTerminalComponentAdapter : manages
    ContextMenuButtonFactory --> TerminalTab : creates
    TerminalTab --> CloudShellTerminalComponent : renders
    CloudShellTerminalComponent --> CloudShellTerminalCore : contains
    CloudShellTerminalComponent --> ShellTypeHandlerFactory : uses
    CloudShellTerminalCore --> CloudShellClient : communicates with
    CloudShellTerminalCore --> AbstractShellHandler : uses configuration from
    
    ShellTypeHandlerFactory --> AbstractShellHandler : creates
    
    class MongoShellHandler {
        -key: string
        +getShellName(): string
        +getSetUpCommands(): string[]
        +getConnectionCommand(): string
        +getEndpoint(): string
        +getTerminalSuppressedData(): string[]
        +getInitialCommands(): string
    
    class VCoreMongoShellHandler {
        +getShellName(): string
        +getSetUpCommands(): string[]
        +getConnectionCommand(): string
        +getEndpoint(): string
        +getTerminalSuppressedData(): string[]
        +getInitialCommands(): string
    }
    
    class CassandraShellHandler {
        -key: string
        +getShellName(): string
        +getSetUpCommands(): string[]
        +getConnectionCommand(): string
        +getEndpoint(): string
        +getTerminalSuppressedData(): string[]
        +getInitialCommands(): string
    }
    
    class PostgresShellHandler {
        +getShellName(): string
        +getSetUpCommands(): string[]
        +getConnectionCommand(): string
        +getEndpoint(): string
        +getTerminalSuppressedData(): string[]
        +getInitialCommands(): string
    }
    
    AbstractShellHandler <|.. MongoShellHandler
    AbstractShellHandler <|.. VCoreMongoShellHandler
    AbstractShellHandler <|.. CassandraShellHandler
    AbstractShellHandler <|.. PostgresShellHandler
```

## Changes

The CloudShell functionality is controlled by the feature flag `userContext.features.enableCloudShell`. When this flag is **enabled** (set to true), the following occurs in the application:

1. **UI Components Become Available:** There is "Open Mongo Shell" or similar button appears on data explorer or quick start window.

2. **Service Capabilities Are Activated:**
   - Backend API calls to CloudShell services are permitted
   - Terminal connection endpoints become accessible

3. **Database-Specific Features Are Unlocked:**
   - Terminal experiences tailored to each database type become available
   - Shell handlers are instantiated based on the database type

4. **Telemetry Collection Begins:**
   - When CloudShell Starts
   - User Consent to access  shell out of the region
   - When shell is connected
   - When there is an error during CloudShell initialization

The feature can be enabled by putting `feature.enableCloudShell=true` in url.
When disabled, all CloudShell functionality is hidden and inaccessible, ensuring a consistent user experience regardless of the feature's state. These shell would be talking to tools federation.

## Supported Shell Types

| Terminal Kind | Handler Class | Description |
|---------------|--------------|-------------|
| Mongo | MongoShellHandler | Handles MongoDB RU shell connections |
| VCoreMongo | VCoreMongoShellHandler | Handles for VCore MongoDB shell connections |
| Cassandra | CassandraShellHandler | Handles Cassandra shell connections |
| Postgres | PostgresShellHandler | Handles PostgreSQL shell connections |

## Implementation Details

The CloudShell implementation uses the Factory pattern to create appropriate shell handlers based on the database type. Each handler implements the common interface but provides specialized behavior for connecting to different database engines.

### Key Components

1. **ShellTypeHandlerFactory**: Creates the appropriate handler based on terminal kind
   - Retrieves authentication keys from Azure Resource Manager
   - Instantiates specialized handlers with configuration

2. **ShellTypeHandler Interface i.e. AbstractShellHandler**: Defines the contract for all shell handlers
   - `getConnectionCommand()`: Returns shell command to connect to database
   - `getSetUpCommands()`: Returns list of scripts required to set up the environment
   - `getEndpoint()`: Returns database connection end point
   - `getTerminalSuppressedData()`: Returns a string which needs to be suppressed

3. **Specialized Handlers**: Implement specific connection logic for each database type
   - Handle authentication differences
   - Provide appropriate shell arguments
   - Format connection strings correctly

4. **CloudShellTerminalComponent**: React component that renders the terminal interface
   - Receives the terminal type as a property
   - Uses ShellTypeHandlerFactory to get the appropriate handler
   - Renders the CloudShellTerminalCore with the handler's configuration
   - Manages component lifecycle and state

5. **CloudShellTerminalCore**: Core terminal implementation
   - Handles low-level terminal operations
   - Uses the configuration from ShellTypeHandler to initialize the terminal
   - Manages input/output streams between the user interface and the shell process
   - Handles terminal events (resize, data, etc.)
   - Implements terminal UI and styling

6. **CloudShellClient**: Client for interacting with CloudShell backend services
   - Initializes the terminal session with backend services
   - Manages communication between the terminal UI and the backend shell process
   - Handles authentication and security for the terminal session

7. **ContextMenuButtonFactory**: Creates CloudShell UI entry points
   - Checks if CloudShell is enabled via `userContext.features.enableCloudShell`
   - Generates appropriate terminal buttons based on database type
   - Handles conditional rendering of CloudShell options

8. **TerminalTab**: Container component for terminal experiences
   - Renders appropriate terminal type based on the selected database
   - Manages terminal tab state and lifecycle
   - Provides the integration point between the terminal and the rest of the Cosmos Explorer UI

## Telemetry Collection

CloudShell components utilize `TelemetryProcessor.trace` to collect usage data and diagnostics information that help improve the service and troubleshoot issues.

### Telemetry Events
   - When CloudShell Starts
   - User Consent to access  shell out of the region
   - When shell is connected
   - When there is an error during CloudShell initialization

| Action Name | Description | Collected Data |
|------------|------------|----------------|
| CloudShellTerminalSession/Start | Triggered when user starts a CloudShell session | Shell Type, dataExplorerArea as <i>CloudShell</i>|
| CloudShellUserConsent/(Success/Failure) | Records user consent to get cloudshell in other region |  |
| CloudShellTerminalSession/Success | Records if Terminal creation is successful | Shell Type, Shell Region |
| CloudShellTerminalSession/Failure | Records of terminal creation is failed | Shell Type, Shell region (if available), error message  |

### Real-time Use Cases

1. **Performance Monitoring**:
   - Track shell initialization times across different regions and database types

2. **Error Detection and Resolution**:
   - Detect increased error rates in real-time
   - Identify patterns in failures
   - Correlate errors with specific client configurations

3. **Feature Adoption Analysis**:
   - Measure adoption rates of different terminal types

4. **User Experience Optimization**:
   - Analyze session duration to understand engagement
   - Identify abandoned sessions and potential pain points
   - Measure the impact of new features on usage patterns
   - Track command completion rates and error recovery

## Limitations and Regional Availability

### Network Isolation

Network isolation (such as private endpoints, service endpoints, and VNet integration) is not currently supported for CloudShell connections. All connections to database instances through CloudShell require the database to be accessible through public endpoints.

Key limitations:
- Cannot connect to databases with public network access disabled
- No support for private link resources
- No integration with Azure Virtual Networks
- IP-based firewall rules must include CloudShell service IPs

### Data Residency

Data residency requirements may not be fully satisfied when using CloudShell due to limited regional availability. 

**Note:** For up-to-date supported regions, refer to the region configuration in:
`src/Explorer/CloudShell/Configuration/RegionConfig.ts`

### Implications for Compliance

Organizations with strict data residency or network isolation requirements should be aware of these limitations:

1. Data may transit through regions different from the database region
2. Terminal session data is processed in CloudShell regions, not necessarily the database region
3. Commands and queries are executed through CloudShell services, not directly against the database
4. Connection strings contain database endpoints and are processed by CloudShell services

These limitations are important considerations for workloads with specific compliance or regulatory requirements.
