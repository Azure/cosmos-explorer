---
page_type: sample
languages:
- java
products:
- azure
description: "Azure CosmosDB is a globally distributed multi-model database."
urlFragment: "azure-cosmos-java-getting-started"
---

# Developing a Java app using Azure Cosmos DB Java SDK

Azure Cosmos DB is a globally distributed multi-model database. One of the supported APIs is the SQL API, which provides a JSON document model with SQL querying and JavaScript procedural logic. The sample uses sync APIs. For async APIs sample, please refer to [example](https://github.com/Azure/azure-sdk-for-java/blob/feature/cosmos/v4/sdk/cosmos/azure-cosmos-examples/src/main/java/com/azure/cosmos/examples/BasicDemo.java).

## Getting Started

### Prerequisites

* Before you can run this sample, you must have the following prerequisites:

   * An active Azure account. If you don't have one, you can sign up for a [free account](https://azure.microsoft.com/free/). Alternatively, you can use the [Azure Cosmos DB Emulator](https://azure.microsoft.com/documentation/articles/documentdb-nosql-local-emulator) for this tutorial. As the emulator https certificate is self signed, you need to import its certificate to the java trusted certificate store as [explained here](https://docs.microsoft.com/azure/cosmos-db/local-emulator-export-ssl-certificates).

   * JDK 1.8+
   * Maven

### Quickstart

* First clone this repository using

```bash
git clone https://github.com/Azure-Samples/azure-cosmos-java-getting-started.git
```

* From a command prompt or shell, run the following command to compile and resolve dependencies.

```bash
cd azure-cosmos-java-getting-started
mvn clean package
```

* From a command prompt or shell, run the following command to run the application.

```bash
mvn exec:java -DACCOUNT_HOST=YOUR_COSMOS_DB_HOSTNAME -DACCOUNT_KEY=YOUR_COSMOS_DB_MASTER_KEY
```

## About the code

The code included in this sample is intended to get you quickly started with a Java application that connects to Azure Cosmos DB with the SQL API.

## More information

- [Azure Cosmos DB](https://docs.microsoft.com/azure/cosmos-db/introduction)
- [Azure Cosmos DB : SQL API](https://docs.microsoft.com/azure/cosmos-db/sql-api-introduction)
- [Java SDK Github for SQL API of Azure Cosmos DB](https://github.com/Azure/azure-sdk-for-java/tree/feature/cosmos/v4/sdk/cosmos)
- [Java SDK JavaDoc for SQL API of Azure Cosmos DB](TO BE UPDATED)

## Contributing

This project welcomes contributions and suggestions.  Most contributions require you to agree to a
Contributor License Agreement (CLA) declaring that you have the right to, and actually do, grant us
the rights to use your contribution. For details, visit https://cla.opensource.microsoft.com.

When you submit a pull request, a CLA bot will automatically determine whether you need to provide
a CLA and decorate the PR appropriately (e.g., status check, comment). Simply follow the instructions
provided by the bot. You will only need to do this once across all repos using our CLA.

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/).
For more information see the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or
contact [opencode@microsoft.com](mailto:opencode@microsoft.com) with any additional questions or comments.
