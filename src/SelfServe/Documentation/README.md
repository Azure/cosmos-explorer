# Self Serve Model

The Self Serve Model allows you to write classes that auto generate UI components for your feature. The idea is to allow developers from other feature teams, who may not be familiar with writing UI, to develop and own UX components. This is accomplished by just writing simpler TypeScript classes for their features. 

What this means for the feature team 
- Can concentrate just on the logic behind showing, hiding and disabling UI components 
- Need not worry about specifics of the UI language or UX requirements (Accessibility, Localization, Themes, etc.)
- Can own the REST API calls made as part of the feature, which can change in the future
- Quicker turn around time for development and bug fixes since they have deeper knowledge of the feature

What this means for the UI team
- No need to ramp up on the intricacies of every feature which requires UI changes
- Own only the framework and not every feature, giving more bandwidth to prioritize inhouse features as well

## Getting Started

Clone the cosmos-explorer repo and run

- `npm install`
- `npm run build`

## Code Changes

Code changes need to be made only in the following files
- Strings JSON file
- Types File
- RP file
- Class file
- SelfServeType in [SelfServeUtils.tsx](https://github.com/Azure/cosmos-explorer/blob/master/src/SelfServe/SelfServeUtils.tsx)
- [SelfServe.tsx](https://github.com/Azure/cosmos-explorer/blob/master/src/SelfServe/SelfServe.tsx)

### 1. JSON file for UI strings

#### Naming Convention
`Localization/en/<FEATURE_NAME>.json`\
Please place your files only under "Localization/en" folder. If not, the UI strings will not be picked up by the framework.

#### Example
[SelfServeExample.json](https://github.com/Azure/cosmos-explorer/blob/master/src/Localization/en/SelfServeExample.json)

#### Description
This is a JSON file where the values are the strings that needs to be displayed in the UI. These strings are referenced using their corresponding unique keys.

For example, If your class file defines properties as follows
```ts
  @Values({
    labelTKey: "stringPropertylabel"
  })
  stringProperty: string;

  @Values({
    labelTKey: "booleanPropertyLabel",
    trueLabelTKey: "trueLabel",
    falseLabelTKey: "falseLabel",
  })
  booleanProperty: boolean;
```

Then the content of `Localization/en/FeatureName.json` should be 

```json
{
    stringPropertyLabel: "string property",
    booleanPropertyLabel: "boolean property",
    trueLabel: "Enable",
    falseLabel: "Disable"
}
```
You can learn more on how to define the class file [here](./selfserve.html#4-class-file).

### 2. Types file

#### Naming Convention
`<FEATURE_NAME>.types.ts`

#### Example
[SelfServeExample.types.ts](https://github.com/Azure/cosmos-explorer/blob/master/src/SelfServe/Example/SelfServeExample.types.ts)

#### Description
This file contains the definitions of all the types and interfaces to be used in your Class file and RP file.

For example, if you want to save the `stringProperty` and `booleanProperty` of your SelfServe class, then you can define an interface in your `FeatureName.types.ts` file like this.

```ts
export PropertiesToSave {
  stringProperty: string,
  booleanProperty: boolean
}
```

### 3. RP file

#### Naming Convention
`<FEATURE_NAME>.rp.ts`

#### Example
[SelfServeExample.rp.ts](https://github.com/Azure/cosmos-explorer/blob/master/src/SelfServe/Example/SelfServeExample.rp.ts)

#### Description
The RP file will host the REST calls needed for the initialize, save and refresh functions. This decouples the code that builds the UI and the code that makes REST calls.

The `userContext` object exposes the following Azure Cosmos DB databaseAccount information
* `userContext.subscriptionId` - The subscription id
* `userContext.resourceGroup` - The resource group name 
* `userContext.databaseAccount.name` - The database account name

`armRequestWithoutPolling` function can be used to make the ARM api call.

Your `FeatureName.rp.ts` file can look like the following.

```ts
import { userContext } from "../../UserContext";
import { armRequestWithoutPolling } from "../../Utils/arm/request";
import { configContext } from "../../ConfigContext";

const apiVersion = "2020-06-01-preview";

export const saveData = async (properties: PropertiesToSave): Promise<void> => {
  const path = `/subscriptions/${userContext.subscriptionId}/resourceGroups/${userContext.resourceGroup}/providers/Microsoft.DocumentDB/databaseAccounts/${userContext.databaseAccount.name}/<REST_OF_THE_PATH>`
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

### 4. Class file

#### Naming Convention
`<FEATURE_NAME>.tsx`

#### Example
[SelfServeExample.tsx](https://github.com/Azure/cosmos-explorer/blob/master/src/SelfServe/Example/SelfServeExample.tsx)

#### Description
This file will contain the actual code that is translated into the UI component by the Self Serve framework.
* Each Self Serve class
  * Needs to extends the [SelfServeBase](../classes/selfserve_selfservetypes.selfservebaseclass.html) class.
  * Needs to have the [@IsDisplayable()](./selfserve_decorators.html#isdisplayable) decorator to tell the compiler that UI needs to be generated from this class.
  * Needs to define an [initialize()](../classes/selfserve_selfservetypes.selfservebaseclass.html#initialize) function, to set default values for the inputs.
  * Needs to define an [onSave()](../classes/selfserve_selfservetypes.selfservebaseclass.html#onsave) function, a callback for when the save button is clicked.
  * Needs to define an [onRefresh()](../classes/selfserve_selfservetypes.selfservebaseclass.html#onrefresh) function, a callback for when the refresh button is clicked.
  * Can have an optional [@RefreshOptions()](./selfserve_decorators.html#refreshoptions) decorator that determines how often the auto refresh of the UI component should take place.

* Each property of the Self Serve class that needs to be translated to a UI element
  * Needs to have a [@Values()](./selfserve_decorators.html#values) decorator.
  * Can have an optional [@PropertyInfo()](./selfserve_decorators.html#propertyinfo) decorator that describes it's info bubble.
  * Can have an optional [@OnChange()](./selfserve_decorators.html#onchange) decorator that dictates the effects of the change of the UI element tied to this property.

Your `FeatureName.tsx` file will look like the following.
```ts
@IsDisplayable()
@RefreshOptions({ retryIntervalInMs: 2000 })
export default class FeatureName extends SelfServeBaseClass {

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
  booleanProperty: boolean;
}
```

### 5. Update SelfServeType

Once you have written your Self Serve Class, add a corresponding type to [SelfServeType](../enums/selfserve_selfserveutils.selfservetype.html)

```ts
export enum SelfServeType {
  invalid = "invalid",
  example = "example",
  ...
  // Add the type for your new feature
  featureName = "featurename"
}
```

### 6. Update SelfServe.tsx (landing page)

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
    case SelfServeType.featureName: {
      // The 'webpackChunkName' is used during debugging, to identify if the correct class has been loaded
      const FeatureName = await import(/* webpackChunkName: "FeatureName" */ "./FeatureName/FeatureName");
      const featureName = new FeatureName.default();
      await loadTranslations(featureName.constructor.name);
      return featureName.toSelfServeDescriptor();
    }
    ...
    ...
    default:
      return undefined;
  }
};

```

## Telemetry
You can add telemetry for your feature using the functions in [SelfServeTelemetryProcessor](./selfserve_selfservetelemetryprocessor.html)

For example, in your SelfServe class, you can call the trace method on every onSave call.

```ts
import { saveData } from "./FeatureName.rp"
import { PropertiesToSave } from "./FeatureName.types"

@IsDisplayable()
export default class FeatureName extends SelfServeBaseClass {

  .
  .
  .

  public onSave = async (
    currentValues: Map<string, SmartUiInput>,
    baselineValues: ReadonlyMap<string, SmartUiInput>
  ): Promise<OnSaveResult> => {

    stringPropertyValue = currentValues.get("stringProperty")
    booleanPropertyValue = currentValues.get("booleanProperty")
    
    const propertiesToSave : PropertiesToSave = { 
      stringProperty: stringPropertyValue,
      booleanProperty: booleanPropertyValue
    }
    const telemetryData = { ...propertiesToSave, selfServeClassName: FeatureName.name }
    const onSaveTimeStamp = selfServeTraceStart(telemetryData)

    saveData(propertiesToSave)

    selfServeTraceSuccess(telemetryData, onSaveTimeStamp)

    // return required values
  }

  .
  .
  .

  @Values(...)
  stringProperty: string;

  @Values(...)
  booleanProperty: boolean;
}
```

## Developing

### Watch mode

Run `npm start` to start the development server and automatically rebuild on changes

### Local Development

Update [SelfServeType](../enums/selfserve_selfserveutils.selfservetype.html) to add your feature.

Add the feature flag `feature.showSelfServeExample=true&feature.selfServeSource=https://localhost:1234/selfServe.html?selfServeType%3D<SELF_SERVE_TYPE>` to open up the your feature's UI in the `Self Serve Example` blade of the portal.

For example, if you want to open up the the UI of a class with the type `sqlx`, then visit `https://ms.portal.azure.com/?feature.showSelfServeExample=true&feature.selfServeSource=https://localhost:1234/selfServe.html?selfServeType%3Dsqlx`

![](https://sdkctlstore.blob.core.windows.net/exe/selfserveDev.PNG)
