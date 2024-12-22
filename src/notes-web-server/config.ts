import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export interface DynamoDBConfig {
  region: string;
  tableName: string;
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
}

export const createDynamoDBClients = (config: DynamoDBConfig) => {
  const ddbClient = new DynamoDBClient({
    region: config.region,
    credentials: config.credentials,
  });
  const docClient = DynamoDBDocumentClient.from(ddbClient);
  return { ddbClient, docClient };
};
