import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
} from "@aws-sdk/lib-dynamodb";
import { Note } from "./schemas.js";
import { Resource } from "./types.js";

export const handleListNotes = async (
  docClient: DynamoDBDocumentClient,
  tableName: string,
  ALL_RESOURCES: Resource[],
  tags?: string[]
) => {
  const scanParams: any = { TableName: tableName };

  if (tags && tags.length > 0) {
    scanParams.FilterExpression = "tags IN (:tags)";
    scanParams.ExpressionAttributeValues = {
      ":tags": tags,
    };
  }

  const command = new ScanCommand(scanParams);
  const response = await docClient.send(command);
  const notes = (response.Items as Note[]) || [];

  const simplifiedNotes = notes.map((note) => ({
    id: note.id,
    title: note.title,
    summary: note.summary,
    tags: note.tags,
  }));

  ALL_RESOURCES.length = 0;
  notes.forEach((note) => {
    ALL_RESOURCES.push({
      uri: `notes://notes/${note.id}`,
      name: note.title,
      mimeType: "application/json",
      text: JSON.stringify(note),
    });
  });

  return {
    content: [
      { type: "text", text: `Found ${notes.length} notes.` },
      { type: "text", text: JSON.stringify(simplifiedNotes) },
    ],
  };
};

export const handleGetNote = async (
  docClient: DynamoDBDocumentClient,
  tableName: string,
  id: string
) => {
  const command = new GetCommand({ TableName: tableName, Key: { id } });
  const response = await docClient.send(command);
  const note = response.Item as Note;

  return note
    ? {
        content: [
          { type: "text", text: `Note found with ID '${id}':` },
          { type: "text", text: JSON.stringify(note) },
        ],
      }
    : {
        content: [{ type: "text", text: `Note with ID '${id}' not found.` }],
      };
};

export const handleWriteNote = async (
  docClient: DynamoDBDocumentClient,
  tableName: string,
  note: Note,
  ALL_RESOURCES: Resource[]
) => {
  const command = new PutCommand({ TableName: tableName, Item: note });
  await docClient.send(command);

  const resourceIndex = ALL_RESOURCES.findIndex(
    (res) => res.uri === `notes://notes/${note.id}`
  );
  const newResource = {
    uri: `notes://notes/${note.id}`,
    name: note.title,
    mimeType: "application/json",
    text: JSON.stringify(note),
  };

  if (resourceIndex !== -1) {
    ALL_RESOURCES[resourceIndex] = newResource;
  } else {
    ALL_RESOURCES.push(newResource);
  }

  return {
    content: [
      {
        type: "text",
        text: `Note with ID '${note.id}' has been written/updated.`,
      },
    ],
  };
};

export const handleDeleteNote = async (
  docClient: DynamoDBDocumentClient,
  tableName: string,
  id: string,
  ALL_RESOURCES: Resource[]
) => {
  const command = new DeleteCommand({ TableName: tableName, Key: { id } });
  await docClient.send(command);

  const index = ALL_RESOURCES.findIndex(
    (res) => res.uri === `notes://notes/${id}`
  );
  if (index !== -1) {
    ALL_RESOURCES.splice(index, 1);
  }

  return {
    content: [{ type: "text", text: `Note with ID '${id}' has been deleted.` }],
  };
};
