# Self Serve Model

The Self Serve Model allows you to write classes that auto generate UI components for your feature. The idea is to allow developers, who aren't very familiar with writing UI, to develop and own UI components for their features by just writing simpler TypeScript classes. 

What this means for the feature team 
- Can concentrate just on the logic behind showing, hiding and disabling UI components 
- Need not worry about specifics of the UI language
- Can own the REST API calls made as part of the feature, which may change in the future
- Quicker turn around time for feature bugs, which they own and have deeper knowledge of

What this means for the UI team:
- Lesser feature development time, since they only own the framework and not the feature itself

Each team owns what they know best, a win-win!

![](https://sdkctlstore.blob.core.windows.net/exe/dataexplorer.gif)

## Getting Started

- `npm install`
- `npm run build`

## Developing

### Watch mode

Run `npm start` to start the development server and automatically rebuild on changes

### Hosted Development (https://cosmos.azure.com)

//If example, visit. else ...
- Visit: `feature.dataExplorerSource=https://localhost:1234/selfServe.html?selfServeType%3Dexample`
//Add gif for selfserve example

## Files
- Localization
- SqlX
- Sqlx.rp.ts
- SelfServeExample modification

## Structure of Class file
- links
