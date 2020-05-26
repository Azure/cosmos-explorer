# Notebook end-to-end tests
This describes how to run the tests locally

## Stand up a local notebook container instance:
Instructions on how to build and run the container [here](https://microsoft.sharepoint.com/teams/DocDB/_layouts/OneNote.aspx?id=%2Fteams%2FDocDB%2FSiteAssets%2FDocDB%20Team%20Notebook&wd=target%28Tools%20_%20SDK%2FPortal%2FDevelopment.one%7CF800BE8E-1E31-48FE-90D7-EF698EF88112%2FHow%20to%20build%20notebook%20service%7C4BAA153B-422C-41E2-B997-F3FCE02CD743%2F%29)

## Run a local data explorer
Instructions are in [`DataExplorer/README.md`](https://msdata.visualstudio.com/CosmosDB/_git/cosmosdb-dataexplorer?path=%2FProduct%2FPortal%2FDataExplorer%2FREADME.md&_a=preview).

Make sure you can run Data Explorer locally from the web browser.

## Run cypress tests
1. Edit the URL for your DataExplorer in the `.spec.ts` file
2. Run the test:
```bash
cd DataExplorer/cypress
npm i
 npm t -- --spec 'integration/notebook/newNotebook.spec.ts'
```

To run in Debug mode:
```
npm run test:debug
```
This opens Cypress UI

## Troubleshooting
* The tests are recorded in the `videos` folder.
* Cypress does not support hover: workarounds [here](https://docs.cypress.io/api/commands/hover.html#Workarounds).


## References
* [Cypress API](https://docs.cypress.io/api/api/table-of-contents.html)
* [Cypress cookbook](https://docs.cypress.io/faq/questions/using-cypress-faq.html#How-do-I-get-an-element%E2%80%99s-text-contents)
* [Cypress best practices](https://docs.cypress.io/guides/references/best-practices.html#Selecting-Elements)