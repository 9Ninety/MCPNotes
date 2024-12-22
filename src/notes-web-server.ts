#!/usr/bin/env node
import express, { json, urlencoded } from "express";
import { Command } from "commander";
import * as dotenv from "dotenv";
import { DynamoDBConfig } from "./notes-mcp-server/config.js";
import routes from "./notes-web-server/routes.js";
import { initializeDatabase } from "./notes-web-server/services.js";

dotenv.config();

const program = new Command();

program
  .version("0.1.0")
  .description("Notes Web Server - A web-based note-taking service")
  .option(
    "-d, --dynamodb <connection_string>",
    "DynamoDB connection string (e.g., dynamodb://<access_key>:<secret_key>@<region>/<table>)",
    "dynamodb://us-east-1/mcp-notes"
  );

program.parse(process.argv);

const options = program.opts();
const dynamoDbConnectionString = options.dynamodb;

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

const config: DynamoDBConfig = {
  region,
  tableName,
  credentials,
};

initializeDatabase(config);

const app = express();

app.use(urlencoded({ extended: true }));
app.use(json());

app.use("/", routes);

const PORT = process.env.PORT ?? 3100;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}/`);
});

process.on("SIGINT", () => {
  console.log("Shutting down Notes Web server...");
  process.exit(0);
});
