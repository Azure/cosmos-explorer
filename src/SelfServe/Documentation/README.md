# Self Serve Model

The Self Serve Model allows you to write classes that auto generate UI components for your feature. The idea is to allow developers, who aren't very familiar with writing UI, to develop and own UI components for their features by just writing simpler TypeScript classes. 

What this means for the feature team 
- Can concentrate just on the logic behind showing, hiding and disabling UI components 
- Need not worry about specifics of the UI language
- Can own the REST API calls made as part of the feature, which may change in the future
- Quicker turn around time for feature bugs, which they own and have deeper knowledge of

What this means for the UI team
- Lesser feature development time, since they only own the framework and not the feature itself

Each team owns what they know best, a win-win!

## Getting Started

Clone the cosmos-explorer repo and run

- `npm install`
- `npm run build`

## Developing

### Watch mode

Run `npm start` to start the development server and automatically rebuild on changes

### Local Development

Update [SelfServeType](./enums/selfserveutils.selfservetype.html) to add your feature.

Add the feature flag `feature.dataExplorerSource=https://localhost:1234/selfServe.html?selfServeType%3D<SELF_SERVE_TYPE>` to open up the your feature's UI in the data explorer blade of the portal.

For example, if you want to open up the SelfServeExample UI, visit `https://ms.portal.azure.com/?feature.dataExplorerSource=https://localhost:1234/selfServe.html?selfServeType%3Dexample`

![](https://sdkctlstore.blob.core.windows.net/exe/selfserveDevelopment.PNG)


## Code Changes

### 1. Class file

#### Naming Convention
SELF_SERVE_CLASS_NAME.tsx

#### Example
[SelfServeExample.tsx](https://github.com/Azure/cosmos-explorer/blob/master/src/SelfServe/Example/SelfServeExample.tsx)

#### Description
This file will contain the actual code that is transalted into the UI component by the Self Serve framework.
* Each Self Serve class
  * Needs to extends the [SelfServeBase](./classes/selfservetypes.selfservebaseclass.html) class.
  * Needs to have the [@IsDisplayable()](./modules/decorators.html#isdisplayable) decorator to tell the compiler that UI needs to be generated from this class.
  * Needs to define an [onSave()](./classes/selfservetypes.selfservebaseclass.html#onsave) function, a callback for when the save button is clicked.
  * Needs to define an [initialize()](./classes/selfservetypes.selfservebaseclass.html#initialize) function, to set default values for the inputs.
  * Needs to define an [onRefresh()](./classes/selfservetypes.selfservebaseclass.html#onrefresh) function, a callback for when the refresh button is clicked.
  * Can have an optional [@RefreshOptions()](./modules/decorators.html#refreshoptions) decorator that determines how often the auto refresh of the UI component should take place.

* Each property of the Self Serve class
  * Having a [@Values()](./modules/decorators.html#values) decorator will be translated into an UI element.
  * Decorated with [@Values()](./modules/decorators.html#values) can have an optional [@PropertyInfo()](modules/decorators.html#propertyinfo) decorator that describes it's info bubble.
  * Can have an optional [@OnChange()](modules/decorators.html#onchange) decorator that dictates the effects of the change of the UI element tied to this property.

```ts
@IsDisplayable()
@RefreshOptions({ retryIntervalInMs: 2000 })
export default class NewFeature extends SelfServeBaseClass {

  public onRefresh = async (): Promise<RefreshResult> => {
      // refresh RP call and processing logic
  };

  public onSave = async (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>
  ): Promise<OnSaveResult> => {
      // onSave RP call and processing logic
  }

  public initialize = async (): Promise<Map<string, SmartUiInput>> => {
      // initialize RP call and processing logic
  }

  @Values(...)
  stringProperty: string;

  @OnChange(...)
  @PropertyInfo(...)
  @Values(...)
  numberProperty: number;
}
```

### 2. RP file

#### Naming Convention
SELF_SERVE_CLASS_NAME.rp.ts

#### Example
[SelfServeExample.rp.ts](https://github.com/Azure/cosmos-explorer/blob/master/src/SelfServe/Example/SelfServeExample.rp.ts)

#### Description
The RP file will host the REST calls needed for the save, initialize and refresh functions. This decouples the code that builds the UI and the code that makes REST calls. Inbuilt objects and methods are exposed to access the Azure Cosmos DB subscription id, resource group name and database account name that are needed to make the REST calls.

```ts
import { userContext } from "../../UserContext";
import { armRequestWithoutPolling } from "../../Utils/arm/request";
import { configContext } from "../../ConfigContext";

const apiVersion = "2020-06-01-preview";

export const makeRestCall = async (properties: any): Promise<void> => {
  const path = `/subscriptions/${userContext.subscriptionId}/resourceGroups/${userContext.resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${userContext.databaseAccount.name}/services/sqlx`
  const body = {
      data : properties
  }
  const armRequestResult = await armRequestWithoutPolling({
    host: configContext.ARM_ENDPOINT,
    path,
    method: "PUT",
    apiVersion,
    body,
  });
};

```

### 3. Localization file

#### Naming Convention
Localization/en/SELF_SERVE_CLASS_NAME.json

#### Example
[SelfServeExample.json](https://github.com/Azure/cosmos-explorer/blob/master/src/Localization/en/SelfServeExample.json)

#### Description
This file will contains keys and the corresponding strings (in english). These keys can then be used in your Self Serve Class.
The Portal team will be adding localization files in other languages for the feature.

```
Content of Localization/en/NewFeature.json
```
```json
{
    stringPropertyLabel: "string property",
    stringPropertyDescription: "this is a string property",
    numberPropertyLabel: "number property",
    numberPropertyDescription: "this is a number property",
}
```

### 4. Update SelfServeType

Once you have written your Self Serve Class, add a corresponding type to [SelfServeType](./enums/selfserveutils.selfservetype.html)

```ts
export enum SelfServeType {
  invalid = "invalid",
  example = "example",
  ...
  // Add the type for your new feature
  newFeature = "newFeature"
}
```

### 5. Update SelfServe.tsx (landing page)

Once The SelfServeType has been updated, update [SelfServe.tsx](https://github.com/Azure/cosmos-explorer/blob/master/src/SelfServe/SelfServe.tsx) for your feature. This is the entry point for the selfServe.html landing page, and decides which SelfServe Class needs to be rendered.

```ts
const getDescriptor = async (selfServeType: SelfServeType): Promise<SelfServeDescriptor> => {
  switch (selfServeType) {
    case SelfServeType.example: {
        ....
    }
    ...
    ...
    ...
    // Add this for your new feature
    case SelfServeType.newFeature: {
      const NewFeature = await import(/* webpackChunkName: "NewFeature" */ "./NewFeature/NewFeature");
      const newFeature = new NewFeature.default();
      await loadTranslations(newFeature.constructor.name);
      return newFeature.toSelfServeDescriptor();
    }
    ...
    ...
    default:
      return undefined;
  }
};

```

## Telemetry
You can add telemetry for your feature using the functions in [SelfServeTelemetryProcessor](./modules/selfservetelemetryprocessor.html)