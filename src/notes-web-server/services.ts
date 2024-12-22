import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  DynamoDBDocumentClient,
} from "@aws-sdk/lib-dynamodb";
import { Note } from "./schemas.js";
import { createDynamoDBClients, DynamoDBConfig } from "./config.js";

let docClient: DynamoDBDocumentClient;
let tableName: string;

export const initializeDatabase = (config: DynamoDBConfig) => {
  const clients = createDynamoDBClients(config);
  docClient = clients.docClient;
  tableName = config.tableName;
};

export const getAllNotes = async (): Promise<Note[]> => {
  const command = new ScanCommand({ TableName: tableName });
  const response = await docClient.send(command);
  return (response.Items as Note[]) || [];
};

export const getNoteById = async (id: string): Promise<Note | null> => {
  const command = new GetCommand({ TableName: tableName, Key: { id } });
  const response = await docClient.send(command);
  return (response.Item as Note) || null;
};

export const createOrUpdateNote = async (note: Note): Promise<void> => {
  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: note,
    })
  );
};

export const deleteNote = async (id: string): Promise<void> => {
  await docClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { id },
    })
  );
};
