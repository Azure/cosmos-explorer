---
languages:
- csharp
products:
- azure
- azure-cosmos-db
- dotnet
page_type: sample
description: "This sample shows you how to use the Azure Cosmos DB service to store and access data from a .NET console application."
---

# Developing a .NET console app using Azure Cosmos DB
This sample shows you how to use the Azure Cosmos DB service to store and access data from a .NET console application.

For a complete end-to-end walkthrough of creating this application, please refer to the [full tutorial on the Azure Cosmos DB documentation page](https://aka.ms/CosmosDotnetGetStarted).

## Running this sample

1. Before you can run this sample, you must have the following prerequisites:
	- An active Azure Cosmos DB account - If you don't have an account, refer to the [Create a database account](https://docs.microsoft.com/azure/cosmos-db/create-sql-api-dotnet#create-a-database-account) article.
	- Visual Studio 2015 (or higher).

1. Clone this repository using Git for Windows (http://www.git-scm.com/), or download the zip file.

1. From Visual Studio, open the **GetStarted.sln** file from the root directory.

1. In Visual Studio Build menu, select **Build Solution** (or Press F6). 

1. Retrieve the URI and PRIMARY KEY (or SECONDARY KEY) values from the Keys blade of your Azure Cosmos DB account in the Azure portal. For more information on obtaining endpoint & keys for your Azure Cosmos DB account refer to [View, copy, and regenerate access keys and passwords](https://docs.microsoft.com/en-us/azure/cosmos-db/manage-account#keys)

If you don't have an account, see [Create a database account](https://docs.microsoft.com/azure/cosmos-db/create-sql-api-dotnet#create-a-database-account) to set one up.

1. In the **App.config** file, located in the src directory, find **EndPointUri** and **PrimaryKey** and replace the placeholder values with the values obtained for your account.

    <add key="EndPointUri" value="~your Azure Cosmos DB endpoint here~" />
    <add key="PrimaryKey" value="~your auth key here~" />

1. You can now run and debug the application locally by pressing **F5** in Visual Studio.

## About the code
The code included in this sample is intended to get you quickly started with a .NET console application that connects to Azure Cosmos DB.

## More information

- [Azure Cosmos DB Documentation](https://docs.microsoft.com/azure/cosmos-db/index)
- [Azure Cosmos DB .NET SDK for SQL API](https://docs.microsoft.com/azure/cosmos-db/sql-api-sdk-dotnet)
- [Azure Cosmos DB .NET SDK Reference Documentation](https://docs.microsoft.com/dotnet/api/overview/azure/cosmosdb?view=azure-dotnet)
