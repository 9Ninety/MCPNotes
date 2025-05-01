#!/usr/bin/env bun
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Command } from "commander";
import { DynamoDBConfig } from "./notes-mcp-server/config.js";
import { createNotesServer } from "./notes-mcp-server/server.js";
import { getVersion } from "./utils/version.js";

const program = new Command();

program
  .version(await getVersion())
  .description(
    "MCP Notes Server - A note-taking service using Model Context Protocol"
  )
  .option(
    "-d, --dynamodb <connection_string>",
    "DynamoDB connection string (e.g., dynamodb://<access_key>:<secret_key>@<region>/<table>)",
    "dynamodb://us-east-1/mcp-notes"
  );

program.parse(process.argv);

const options = program.opts();
const dynamoDbConnectionString = options.dynamodb;

// Parse connection string with auth credentials
const connectionRegex =
  /^dynamodb:\/\/(?:([^:]+):([^@]+)@)?([a-z0-9-]+)\/([a-zA-Z0-9_-]+)$/;
const match = dynamoDbConnectionString.match(connectionRegex);

if (!match) {
  console.error(
    "Invalid DynamoDB connection string format. Expected format: dynamodb://<access_key>:<secret_key>@<region>/<table>"
  );
  process.exit(1);
}

const [_, accessKey, secretKey, region, tableName] = match;

// Use environment variables if credentials not provided in connection string
const credentials = {
  accessKeyId: accessKey || process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: secretKey || process.env.AWS_SECRET_ACCESS_KEY,
};

if (!credentials.accessKeyId || !credentials.secretAccessKey) {
  console.error(
    "AWS credentials must be provided either in connection string or via environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)"
  );
  process.exit(1);
}

if (!region || !tableName) {
  console.error(
    "Region and Table name are required in the DynamoDB connection string."
  );
  process.exit(1);
}

async function main() {
  const transport = new StdioServerTransport();
  const config: DynamoDBConfig = {
    region,
    tableName,
    credentials,
  };
  const { server, cleanup } = await createNotesServer(config);

  await server.connect(transport);
  console.log("MCP Notes server is running on stdin...");

  process.on("SIGINT", async () => {
    console.log("Shutting down MCP Notes server...");
    await cleanup();
    await server.close();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
