/// <reference types="node" />
import { writeFileSync } from "fs";
import fetch from "node-fetch";

/* 
Open API TypeScript Client Generator 

This is a quickly made bespoke Open API client generator. 
It is not designed to handle the full OpenAPI spec.
Many other more general purpose generators exist, but their output is very verbose and overly complex for our use case.
But it does work well enough to generate a fully typed tree-shakeable client for the Cosmos resource provider.
Results of this file should be checked into the repo.
*/

// Array of strings to use for eventual output
const output: string[] = [""];

const schemaURL =
  "https://raw.githubusercontent.com/Azure/azure-rest-api-specs/master/specification/cosmos-db/resource-manager/Microsoft.DocumentDB/preview/2020-06-01-preview/cosmos-db.json";

// Buckets for grouping operations based on their name
const namespaces: { [key: string]: string[] } = {};

// Mapping for OpenAPI types to TypeScript types
const propertyMap: { [key: string]: string } = {
  integer: "number"
};

// Converts a Open API reference: "#/definitions/Foo" to a type name: Foo
function refToType(path: string | undefined) {
  // References must be in the same file. Bail to `unknown` types for remote references
  if (path && path.startsWith("#")) {
    return path.split("/").pop();
  }
  return "unknown";
}

// Converts "Something_Foo" ->  "somethingFoo"
function camelize(str: string) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, function(word: string, index: number) {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, "");
}

// Converts a body paramter to the equivalent typescript function parameter type
function bodyParam(parameter: { schema: { $ref: string } }) {
  if (!parameter) {
    return "";
  }
  return `,body: ${refToType(parameter.schema.$ref)}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parametersFromPath(path: string) {
  // TODO: Remove any. String.matchAll is a real thing.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matches = (path as any).matchAll(/{(\w+)}/g);
  return Array.from(matches)
    .map((match: string[]) => `${match[1]}: string`)
    .join(",\n");
}

type Operation = { responses: { [key: string]: { schema: { $ref: string } } } };

// Converts OpenAPI response definition to TypeScript return type. Uses unions if possible. Bails to unknown
function responseType(operation: Operation) {
  if (operation.responses) {
    return Object.keys(operation.responses)
      .map((responseCode: string) => {
        if (!operation.responses[responseCode].schema) {
          return "void";
        }
        return refToType(operation.responses[responseCode].schema.$ref);
      })
      .join(" | ");
  }
  return "unknown";
}

async function main() {
  const response = await fetch(schemaURL);
  const schema = await response.json();

  // STEP 1: Convert all definitions to TypeScript types and interfaces
  for (const definition in schema.definitions) {
    const properties = schema.definitions[definition].properties;
    if (properties) {
      if (schema.definitions[definition].allOf) {
        const baseTypes = schema.definitions[definition].allOf
          .map((allof: { $ref: string }) => refToType(allof.$ref))
          .join(" & ");
        output.push(`type ${definition} = ${baseTypes} & {`);
      } else {
        output.push(`interface ${definition} {`);
      }
      for (const prop in schema.definitions[definition].properties) {
        const property = schema.definitions[definition].properties[prop];
        if (property) {
          if (property.$ref) {
            const type = refToType(property.$ref);
            output.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${type}
            `);
          } else if (property.type === "array") {
            const type = refToType(property.items.$ref);
            output.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${type}[]
            `);
          } else if (property.type === "object") {
            const type = refToType(property.$ref);
            output.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${type}
            `);
          } else {
            output.push(`
            /* ${property.description} */
            ${property.readOnly ? "readonly " : ""}${prop}: ${
              propertyMap[property.type] ? propertyMap[property.type] : property.type
            }`);
          }
        }
      }
      output.push(`}`);
      output.push("\n\n");
    } else {
      const def = schema.definitions[definition];
      if (def.enum) {
        output.push(`
        /* ${def.description} */
        type ${definition} = ${def.enum.map((v: string) => `"${v}"`).join(" | ")}`);
        output.push("\n");
      } else if (def.type === "string") {
        output.push(`
        /* ${def.description} */
        type ${definition} = string
          `);
      } else if (def.type === "array") {
        const type = refToType(def.items.$ref);
        output.push(`
        /* ${def.description} */
        type ${definition} = ${type}[]
        `);
      } else if (def.type === "object" && def.additionalProperties) {
        output.push(`
        /* ${def.description} */
        type ${definition} = { [key: string]: ${def.additionalProperties.type}}
        `);
      } else if (def.type === "object" && def.allOf) {
        const type = refToType(def.allOf[0].$ref);
        output.push(`
        /* ${def.description} */
        type ${definition} = ${type}
        `);
      } else {
        console.log("UNHANDLED MODEL:", def, schema.definitions[def]);
      }
    }
  }

  // STEP 2: Convert all paths and operations to simple fetch functions.
  // Functions are grouped into objects based on resource types
  for (const path in schema.paths) {
    for (const method in schema.paths[path]) {
      const operation = schema.paths[path][method];
      const bodyParameter = operation.parameters.find(
        (parameter: { in: string; required: boolean }) => parameter.in === "body" && parameter.required === true
      );
      const [namespace, operationName] = operation.operationId.split("_");
      if (namespaces[namespace] === undefined) {
        namespaces[namespace] = [];
      }
      namespaces[namespace].push(`
        /* ${operation.description} */
        async ${camelize(operationName)} (
          ${parametersFromPath(path)}
          ${bodyParam(bodyParameter)}
        ) : Promise<${responseType(operation)}> {
          return window.fetch(\`https://management.azure.com${path.replace(/{/g, "${")}\`, { method: "${method}", ${
        bodyParameter ? "body: JSON.stringify(body)" : ""
      } }).then((response) => response.json())
        }
      `);
    }
  }

  // Write all grouped fetch functions to objects
  for (const namespace in namespaces) {
    output.push(`export const ${namespace} = {`);
    output.push(namespaces[namespace].join(",\n"));
    output.push(`}\n`);
  }

  writeFileSync("./client.ts", output.join(""));
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
